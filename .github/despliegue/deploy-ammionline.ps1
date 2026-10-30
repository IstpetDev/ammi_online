# Despliegue de AmmiOnline en el servidor IIS.
# Se ejecuta como el usuario svc-deploy (sin privilegios de administrador), por SSH.
# Uso:   powershell -NoProfile -ExecutionPolicy Bypass -File C:\despliegue\deploy-ammionline.ps1 -Zip C:\despliegue\release.zip
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
$NoTocarCarpetas = @('OLD', 'Uploads', 'logs')

function Copiar {
    param([string]$Origen, [string]$Destino, [bool]$Espejo)
    $modo = if ($Espejo) { '/MIR' } else { '/E' }   # /E no borra nada en el destino
    # Hasta 3 vueltas: un archivo puede seguir bloqueado unos segundos tras apagar la API.
    for ($i = 1; $i -le 3; $i++) {
        $salida = robocopy $Origen $Destino $modo /XF @NoTocarArchivos /XD @NoTocarCarpetas /R:3 /W:5 /NJH /NJS /NP /NDL
        if ($LASTEXITCODE -lt 8) { return }
        Write-Output "robocopy codigo $LASTEXITCODE (intento $i de 3) en ${Destino}. Lineas con error:"
        $salida | Where-Object { $_ -match 'ERROR|Error|Acceso|denegado|process cannot|proceso no' } | Select-Object -First 8 | ForEach-Object { Write-Output "   $_" }
        Start-Sleep -Seconds 10
    }
    throw "robocopy fallo tras 3 intentos: $Origen -> $Destino"
}

function Detalle-Http {
    # El log de Actions es publico en este repositorio: al log solo van identificadores del error
    # (codigo HTTP.subcodigo, codigo hexadecimal y modulo). El texto completo se guarda en un
    # archivo local (C:\respaldos-despliegue: SYSTEM, administradores y svc-deploy; sin acceso para otros usuarios).
    param($Respuesta, [string]$Etiqueta)
    try {
        $lector = New-Object System.IO.StreamReader($Respuesta.GetResponseStream())
        $texto = $lector.ReadToEnd()
        $texto = $texto -replace '(?s)<style.*?</style>', '' -replace '<[^>]+>', ' ' -replace '&nbsp;', ' ' -replace '\s+', ' '
        Add-Content -Path (Join-Path $Respaldo 'ultimo-error-iis.txt') -Value "[$(Get-Date -Format s)] $Etiqueta`n$texto`n" -Encoding ascii -ErrorAction SilentlyContinue
        $ids = @()
        $ids += [regex]::Matches($texto, '\b[1-5]\d\d\.\d{1,3}\b') | ForEach-Object { $_.Value }
        $ids += [regex]::Matches($texto, '0x[0-9A-Fa-f]{8}') | ForEach-Object { $_.Value }
        $ids += [regex]::Matches($texto, 'AspNetCoreModuleV2|RewriteModule|StaticFileModule|ManagedPipelineHandler') | ForEach-Object { $_.Value }
        return (($ids | Select-Object -Unique) -join ' ')
    } catch { return '' }
}

function Estado-Http {
    param([string]$Url, [string]$Etiqueta)
    try {
        return [int](Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 30).StatusCode
    } catch [System.Net.WebException] {
        if ($_.Exception.Response) {
            $codigo = [int]$_.Exception.Response.StatusCode
            # Write-Host y no Write-Output: la salida de una funcion es su valor de retorno.
            if ($codigo -ge 500) { Write-Host "IIS ($Etiqueta $codigo), identificadores: $(Detalle-Http $_.Exception.Response $Etiqueta). Detalle completo en $Respaldo\ultimo-error-iis.txt" }
            return $codigo
        }
        return 0
    }
}

function Comprobar-Salud {
    # Una API recien reciclada puede tardar en arrancar: hasta 6 intentos, 5 s entre ellos.
    $app = 0; $api = 0
    for ($i = 1; $i -le 6; $i++) {
        Start-Sleep -Seconds 5
        $app = Estado-Http $UrlApp 'app'
        # Una API que arranca responde (200, 401, 404...). Si falla al iniciar, IIS devuelve 500.x o 503.
        $api = Estado-Http $UrlApi 'api'
        Write-Output "Salud (intento $i): app=$app api=$api"
        if ($app -eq 200 -and $api -ge 100 -and $api -lt 500) { return }
    }
    throw "Salud incorrecta: app=$app api=$api"
}

function Esperar-Api-Liberada {
    # Tras app_offline.htm, IIS tarda en soltar los archivos. Se espera a poder abrir la DLL en exclusiva.
    $dll = Join-Path $Api 'AMMI_Online_API.API.dll'
    if (-not (Test-Path $dll)) { return }
    for ($i = 1; $i -le 30; $i++) {
        try {
            $f = [System.IO.File]::Open($dll, 'Open', 'ReadWrite', 'None')
            $f.Close()
            return
        } catch { Start-Sleep -Seconds 2 }
    }
    Write-Output 'Aviso: la DLL de la API sigue bloqueada tras 60 s; se intenta copiar igualmente.'
}

function Restaurar {
    param([string]$Carpeta)
    Copiar (Join-Path $Carpeta 'api') $Api $false
    Copiar (Join-Path $Carpeta 'app') $App $true
}

function Con-Api-Fuera-De-Linea {
    param([scriptblock]$Accion)
    $marca = Join-Path $Api 'app_offline.htm'
    Set-Content -Path $marca -Value '<html><body>Actualizando, vuelva en unos minutos.</body></html>' -Encoding ascii
    try {
        Esperar-Api-Liberada
        & $Accion
    } finally {
        Remove-Item $marca -Force -ErrorAction SilentlyContinue
        if (Test-Path $marca) { Write-Output "ATENCION: no se pudo borrar $marca; la API seguira en 503 hasta borrarlo." }
    }
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
$exito = $false
try {
    Expand-Archive -Path $Zip -DestinationPath $prep -Force
    if (-not (Test-Path (Join-Path $prep 'api\AMMI_Online_API.API.dll'))) { throw 'El paquete no trae la API' }
    if (-not (Test-Path (Join-Path $prep 'app\index.html')))             { throw 'El paquete no trae la app' }

    # 1. Respaldo del estado actual (codigo, sin Uploads ni logs ni OLD).
    $copia = Join-Path $Respaldo $id
    Copiar $Api (Join-Path $copia 'api') $false
    Copiar $App (Join-Path $copia 'app') $false
    Write-Output "Respaldo: $copia"

    # 2. Despliegue; si algo falla, se restaura el respaldo.
    try {
        Con-Api-Fuera-De-Linea { Copiar (Join-Path $prep 'api') $Api $false }
        Copiar (Join-Path $prep 'app') $App $true
        Comprobar-Salud
        $exito = $true
    } catch {
        Write-Output "FALLO: $($_.Exception.Message). Restaurando $id"
        Con-Api-Fuera-De-Linea { Restaurar $copia }
        try { Comprobar-Salud; Write-Output "Restaurado correctamente: el sitio esta como antes del intento." }
        catch { Write-Output "ATENCION tras restaurar: $($_.Exception.Message). Un administrador debe reciclar el pool (Restart-WebAppPool DefaultAppPool)." }
    }
} finally {
    # Se limpia siempre: paquete preparado y zip (el respaldo se conserva).
    Remove-Item $prep -Recurse -Force -ErrorAction SilentlyContinue
    Remove-Item $Zip -Force -ErrorAction SilentlyContinue
}

if (-not $exito) { exit 1 }

# 3. Respaldos antiguos.
Get-ChildItem $Respaldo -Directory | Sort-Object Name -Descending | Select-Object -Skip $Conservar |
    Remove-Item -Recurse -Force -ErrorAction SilentlyContinue

# 4. Retencion de logs: depurar archivos con mas de 30 dias de antiguedad.
$carpetaLogs = Join-Path $Api 'logs'
if (Test-Path $carpetaLogs) {
    Get-ChildItem -Path $carpetaLogs -File -Recurse |
        Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
        Remove-Item -Force -ErrorAction SilentlyContinue
}

Write-Output "Despliegue correcto: $id"
