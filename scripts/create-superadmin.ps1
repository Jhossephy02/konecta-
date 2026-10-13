param([string]$Email, [string]$Name, [string]$NodePath = 'node')
$ErrorActionPreference = 'Stop'
if (-not $Email) { $Email = Read-Host 'Correo del superadmin real' }
if (-not $Name) { $Name = Read-Host 'Nombre del superadmin' }
$first = Read-Host 'Contraseña privada (mínimo 16 caracteres)' -AsSecureString
$second = Read-Host 'Repite la contraseña' -AsSecureString
$firstPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($first)
$secondPointer = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($second)
$keys = @('CONECTA_SUPERADMIN_EMAIL', 'CONECTA_SUPERADMIN_NAME', 'CONECTA_SUPERADMIN_PASSWORD')
$previous = @{}
foreach ($key in $keys) { $previous[$key] = [Environment]::GetEnvironmentVariable($key, 'Process') }
try {
    $plain = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($firstPointer)
    $confirmation = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($secondPointer)
    if ($plain.Length -lt 16 -or $plain -cne $confirmation) { throw 'La contraseña debe tener 16 caracteres como mínimo y coincidir en ambos campos.' }
    $env:CONECTA_SUPERADMIN_EMAIL = $Email
    $env:CONECTA_SUPERADMIN_NAME = $Name
    $env:CONECTA_SUPERADMIN_PASSWORD = $plain
    Push-Location (Split-Path -Parent $PSScriptRoot)
    try {
        & $NodePath --env-file-if-exists=.env server/provision.mjs
        if ($LASTEXITCODE -ne 0) { throw 'No se creó la cuenta. Revisa el mensaje anterior.' }
    } finally { Pop-Location }
} finally {
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key, $previous[$key], 'Process') }
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($firstPointer)
    [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($secondPointer)
    $plain = $null
    $confirmation = $null
}
