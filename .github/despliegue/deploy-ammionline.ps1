# Despliegue de AmmiOnline en el servidor IIS.
# Se ejecuta como el usuario svc-deploy (sin privilegios de administrador), por SSH.
# Uso:   powershell -NoProfile -ExecutionPolicy Bypass -File C:\despliegue\deploy-ammionline.ps1 -Zip C:\despliegue\release-<id>.zip
# Revertir: ... -Rollback <nombre-de-carpeta-en-C:\respaldos-despliegue>
# Solo ASCII a proposito: Windows PowerShell 5.1 lee mal los scripts en UTF-8 sin BOM.
param(
    [string]$Zip,
    [string]$Rollback
)
$ErrorActionPreference = 'Stop'

$Raiz     = 'C:\inetpub\wwwroot'
$Api      = Join-Path $Raiz 'apiAmmiOnline'
$App      = Join-Path $Raiz 'appAmmiOnline'
$Trabajo  = 'C:\despliegue'
$Respaldo = 'C:\respaldos-despliegue'
$Conservar = 5
$UrlApp   = 'http://localhost/appAmmiOnline/'
$UrlApi   = 'http://localhost/apiAmmiOnline/'

# Nunca se tocan: configuracion del servidor, datos subidos, logs y publicaciones antiguas.
$NoTocarArchivos = @('appsettings*.json', 'web.config', 'app_offline.htm')
# La app (estatica) si recibe su web.config desde el repositorio: lleva la reescritura de rutas de Angular.
$NoTocarArchivosApp = @('app_offline.htm')
$NoTocarCarpetas = @('OLD', 'Uploads', 'logs')

function Copiar {
    param([string]$Origen, [string]$Destino, [bool]$Espejo, [string[]]$ExcluirArchivos = $NoTocarArchivos)
    $modo = if ($Espejo) { '/MIR' } else { '/E' }   # /E no borra nada en el destino
    robocopy $Origen $Destino $modo /XF @ExcluirArchivos /XD @NoTocarCarpetas /R:2 /W:2 /NFL /NDL /NJH /NJS /NP | Out-Null
    if ($LASTEXITCODE -ge 8) { throw "robocopy fallo ($LASTEXITCODE): $Origen -> $Destino" }
}

function Estado-Http {
    param([string]$Url)
    try {
        return [int](Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30).StatusCode
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) { return [int]$_.Exception.Response.StatusCode }
        return 0
    }
}

function Comprobar-Salud {
    Start-Sleep -Seconds 5
    $app = Estado-Http $UrlApp
    # Una API que arranca responde (200, 401, 404...). Si falla al iniciar, IIS devuelve 500.x o 502.x.
    $api = Estado-Http $UrlApi
    Write-Output "Salud: app=$app api=$api"
    if ($app -ne 200) { throw "La app responde $app (se esperaba 200)" }
    if ($api -lt 100 -or $api -ge 500) { throw "La API responde $api" }
}

function Restaurar {
    param([string]$Carpeta)
    Copiar (Join-Path $Carpeta 'api') $Api $false
    Copiar (Join-Path $Carpeta 'app') $App $true $NoTocarArchivosApp
}

function Con-Api-Fuera-De-Linea {
    param([scriptblock]$Accion)
    $marca = Join-Path $Api 'app_offline.htm'
    Set-Content -Path $marca -Value '<html><body>Actualizando, vuelva en unos minutos.</body></html>' -Encoding ascii
    Start-Sleep -Seconds 3
    try { & $Accion } finally { Remove-Item $marca -Force -ErrorAction SilentlyContinue }
}

if ($Rollback) {
    $carpeta = Join-Path $Respaldo $Rollback
    if (-not (Test-Path (Join-Path $carpeta 'api'))) { throw "No existe el respaldo $carpeta" }
    Con-Api-Fuera-De-Linea { Restaurar $carpeta }
    Comprobar-Salud
    Write-Output "Revertido a $Rollback"
    exit 0
}

if (-not $Zip -or -not (Test-Path $Zip)) { throw 'Falta -Zip o el archivo no existe' }

$id = (Get-Date).ToString('yyyyMMdd-HHmmss')
$prep = Join-Path $Trabajo "preparado-$id"
Expand-Archive -Path $Zip -DestinationPath $prep -Force
if (-not (Test-Path (Join-Path $prep 'api\AMMI_Online_API.API.dll'))) { throw 'El paquete no trae la API' }
if (-not (Test-Path (Join-Path $prep 'app\index.html')))             { throw 'El paquete no trae la app' }

# 1. Respaldo del estado actual (codigo, sin Uploads ni logs ni OLD).
$copia = Join-Path $Respaldo $id
Copiar $Api (Join-Path $copia 'api') $false
Copiar $App (Join-Path $copia 'app') $false $NoTocarArchivosApp
Write-Output "Respaldo: $copia"

# 2. Despliegue; si algo falla, se restaura el respaldo.
try {
    Con-Api-Fuera-De-Linea { Copiar (Join-Path $prep 'api') $Api $false }
    Copiar (Join-Path $prep 'app') $App $true $NoTocarArchivosApp
    Comprobar-Salud
} catch {
    Write-Output "FALLO: $($_.Exception.Message). Restaurando $id"
    Con-Api-Fuera-De-Linea { Restaurar $copia }
    try { Comprobar-Salud } catch { Write-Output "Tras restaurar: $($_.Exception.Message)" }
    exit 1
}

# 3. Limpieza: paquete preparado, zip y respaldos antiguos.
Remove-Item $prep -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $Zip -Force -ErrorAction SilentlyContinue
Get-ChildItem $Respaldo -Directory | Sort-Object Name -Descending | Select-Object -Skip $Conservar |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue
Write-Output "Despliegue correcto: $id"
