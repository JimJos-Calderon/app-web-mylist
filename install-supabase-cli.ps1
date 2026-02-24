$url = "https://github.com/supabase/cli/releases/download/v2.75.0/supabase_windows_amd64.tar.gz"
$tarPath = "$env:TEMP\supabase.tar.gz"
$extractPath = "$env:TEMP\supabase-extract"

Write-Host "Descargando Supabase CLI v2.75.0..."
Invoke-WebRequest -Uri $url -OutFile $tarPath

Write-Host "Extrayendo..."
New-Item -ItemType Directory -Path $extractPath -Force | Out-Null
tar -xzf $tarPath -C $extractPath

Write-Host "Copiando ejecutable a System32..."
Copy-Item "$extractPath\supabase.exe" "C:\Windows\System32\supabase.exe" -Force

Write-Host ""
Write-Host "Verificando instalacion..."
& "C:\Windows\System32\supabase.exe" --version

Write-Host "Listo!"

supabase secrets set DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1475867794271764497/yxIDZ5dNFhfcSb6JuxPEL4X1EB-QA1a5_d2QSDlOWtfCbdLI56BXFuYhgZkjJJD1Y-ri