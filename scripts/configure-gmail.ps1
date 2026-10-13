param([string]$Email)
$ErrorActionPreference = 'Stop'
if (-not $Email) { $Email = Read-Host 'Tu dirección de Gmail' }
if ($Email -notmatch '^[^\s@]+@gmail\.com$') { throw 'Ingresa una dirección válida de Gmail.' }
Write-Host 'Usa una contraseña de aplicación de Google, no la contraseña habitual de tu cuenta.'
$securePassword = Read-Host 'Contraseña de aplicación (entrada oculta)' -AsSecureString
$pointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($securePassword)
try {
    $appPassword = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($pointer) -replace '\s', ''
    if ($appPassword -notmatch '^[A-Za-z]{16}$') { throw 'La contraseña de aplicación debe contener 16 letras, sin contar espacios.' }
    $projectDirectory = Split-Path -Parent $PSScriptRoot
    $envPath = Join-Path $projectDirectory '.env'
    $lines = if (Test-Path -LiteralPath $envPath) { [IO.File]::ReadAllLines($envPath) } else { @() }
    $keep = @($lines | Where-Object { $_ -notmatch '^(MAIL_MODE|SMTP_HOST|SMTP_PORT|SMTP_USER|SMTP_PASSWORD|MAIL_FROM)=' })
    $updated = $keep + @('MAIL_MODE=smtp', 'SMTP_HOST=smtp.gmail.com', 'SMTP_PORT=465', "SMTP_USER=$Email", "MAIL_FROM=$Email", "SMTP_PASSWORD=$appPassword")
    [IO.File]::WriteAllLines($envPath, [string[]]$updated, [Text.UTF8Encoding]::new($false))
    Write-Host 'Configuración guardada en .env, excluido de Git. Reinicia el servidor para aplicarla.'
} finally {
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($pointer)
    $appPassword = $null
    $updated = $null
    $securePassword.Dispose()
}

