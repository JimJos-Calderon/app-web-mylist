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

# No incluyas secretos ni URLs de webhooks en scripts versionados.
# Configura secretos con: supabase secrets set --env-file .env.secrets (archivo local, sin commitear)