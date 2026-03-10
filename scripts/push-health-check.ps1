param(
  [string]$ProjectRef = 'lpaysuasdjgajiftyush',
  [switch]$RunAutomationProbe
)

$ErrorActionPreference = 'Stop'

function Get-ServiceRoleKey {
  param([string]$Ref)

  $apiKeys = supabase projects api-keys --project-ref $Ref -o json | ConvertFrom-Json
  $serviceRole = ($apiKeys | Where-Object { $_.id -eq 'service_role' -or $_.name -eq 'service_role' } | Select-Object -First 1).api_key

  if (-not $serviceRole) {
    throw 'No se pudo obtener la service_role key desde Supabase CLI.'
  }

  return $serviceRole
}

function New-RestHeaders {
  param([string]$ServiceRole)

  return @{
    'apikey' = $ServiceRole
    'Authorization' = "Bearer $ServiceRole"
    'Content-Type' = 'application/json'
    'Prefer' = 'return=representation'
  }
}

$baseUrl = "https://$ProjectRef.supabase.co"
$serviceRole = Get-ServiceRoleKey -Ref $ProjectRef
$restHeaders = New-RestHeaders -ServiceRole $serviceRole

$config = Invoke-RestMethod -Method Get -Uri "$baseUrl/rest/v1/push_dispatch_config?id=eq.1&select=id,function_url,webhook_secret,is_enabled,updated_at" -Headers $restHeaders
if (-not $config -or $config.Count -eq 0) {
  throw 'No existe push_dispatch_config id=1.'
}

$cfg = $config[0]
if (-not $cfg.is_enabled) {
  throw 'push_dispatch_config esta deshabilitado (is_enabled=false).'
}

if (-not $cfg.webhook_secret) {
  throw 'push_dispatch_config no tiene webhook_secret.'
}

$activeSub = Invoke-RestMethod -Method Get -Uri "$baseUrl/rest/v1/push_subscriptions?select=user_id&is_active=eq.true&limit=1" -Headers $restHeaders
if (-not $activeSub -or $activeSub.Count -eq 0) {
  throw 'No hay push_subscriptions activas para probar.'
}

$targetUser = $activeSub[0].user_id
$pushHeaders = @{
  'Content-Type' = 'application/json'
  'x-push-secret' = $cfg.webhook_secret
}

$timestamp = (Get-Date).ToUniversalTime().ToString('yyyy-MM-dd HH:mm:ss UTC')
$pushBody = @{
  user_id = $targetUser
  message = "Health-check deploy ($timestamp)"
  title = 'MyList Push Health Check'
  url = '/peliculas'
  tag = 'mylist-health-check'
} | ConvertTo-Json -Compress

$sendResp = Invoke-RestMethod -Method Post -Uri "$baseUrl/functions/v1/send-push" -Headers $pushHeaders -Body $pushBody

$automationProbe = $null
if ($RunAutomationProbe.IsPresent) {
  $memberRows = Invoke-RestMethod -Method Get -Uri "$baseUrl/rest/v1/list_members?select=list_id&user_id=eq.$targetUser&limit=1" -Headers $restHeaders
  if ($memberRows -and $memberRows.Count -gt 0) {
    $auditPayload = @{
      table_name = 'lists'
      record_id = $memberRows[0].list_id
      action = 'UPDATE'
      user_id = [guid]::NewGuid().ToString()
    } | ConvertTo-Json -Compress

    $auditInsert = Invoke-RestMethod -Method Post -Uri "$baseUrl/rest/v1/audit_logs" -Headers $restHeaders -Body $auditPayload
    $automationProbe = [PSCustomObject]@{
      audit_log_id = $auditInsert[0].id
      table_name = $auditInsert[0].table_name
      action = $auditInsert[0].action
      created_at = $auditInsert[0].created_at
    }
  }
}

[PSCustomObject]@{
  ok = $true
  project_ref = $ProjectRef
  config_enabled = [bool]$cfg.is_enabled
  config_updated_at = $cfg.updated_at
  target_user = $targetUser
  function_sent = $sendResp.sent
  function_failed = $sendResp.failed
  function_total = $sendResp.total
  webhook_secret_preview = ($cfg.webhook_secret.Substring(0,6) + '...' + $cfg.webhook_secret.Substring($cfg.webhook_secret.Length - 4))
  automation_probe = $automationProbe
} | ConvertTo-Json -Depth 6
