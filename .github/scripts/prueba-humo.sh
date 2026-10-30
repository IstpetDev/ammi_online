#!/usr/bin/env bash
# ==============================================================================
# prueba-humo.sh: Comprobación de salud tras despliegue en el dominio público.
#
# Criterios de aceptación (Issue #30):
# 1. Consulta el dominio público: página principal 200, rutas públicas 200,
#    Auth/login 405 por GET y un recurso estático (main-*.js) 200.
# 2. Si falla, el script sale con código 1 y el resumen indica qué ruta falló.
# 3. Privacidad estricta: NO imprime cuerpos de respuesta ni datos del servidor
#    (los logs de Actions son públicos).
#
# Uso:
#   bash .github/scripts/prueba-humo.sh [url-base]
#
# Variables opcionales de entorno:
#   SMOKE_TEST_URL          - URL base alternativa (por defecto https://ammionline.ammi.edu.ec)
#   AUTH_LOGIN_PATH         - Ruta de Auth/login (por defecto /apiAmmiOnline/api/Auth/login)
#   SMOKE_TEST_RETRIES      - Intentos máximos por ruta ante fallo transitorio (por defecto: 3)
#   SMOKE_TEST_RETRY_DELAY  - Segundos entre reintentos (por defecto: 5)
#   GITHUB_STEP_SUMMARY     - Ruta del archivo de resumen de GitHub Actions (si existe)
# ==============================================================================

set -uo pipefail
export LC_ALL=C.UTF-8

url_base="${1:-${SMOKE_TEST_URL:-https://ammionline.ammi.edu.ec}}"
# Eliminar barra diagonal final para uniformidad
url_base="${url_base%/}"

ruta_auth="${AUTH_LOGIN_PATH:-/apiAmmiOnline/api/Auth/login}"
retries="${SMOKE_TEST_RETRIES:-3}"
retry_delay="${SMOKE_TEST_RETRY_DELAY:-5}"

echo "=============================================================================="
echo "💨 Iniciando prueba de humo en dominio público"
echo "Dominio base: $url_base"
echo "Reintentos máximos: $retries (intervalo: ${retry_delay}s)"
echo "=============================================================================="

total_fallos=0

# Listas paralelas para almacenar resultados y generar el resumen
rutas_nombres=()
metodos_usados=()
codigos_esperados=()
codigos_obtenidos=()
estados_finales=()
mensajes_error=()

# ------------------------------------------------------------------------------
# Función: consultar_http
# Consulta una URL descartando el cuerpo de respuesta (-o /dev/null) para evitar
# cualquier fuga de datos en los logs públicos de GitHub Actions.
# ------------------------------------------------------------------------------
consultar_http() {
  local metodo="$1"
  local url="$2"
  local esperado="$3"

  local obtenido="000"
  local intento=1

  while [ "$intento" -le "$retries" ]; do
    # Usamos -s (silencioso), -L (seguir redirecciones), -o /dev/null (descartar cuerpo)
    # y -w '%{http_code}' para extraer únicamente el código de estado HTTP.
    obtenido=$(curl -s -L -o /dev/null -w '%{http_code}' -X "$metodo" \
      --connect-timeout 10 --max-time 30 "$url" 2>/dev/null || echo "000")

    if [ "$obtenido" = "$esperado" ]; then
      break
    fi

    if [ "$intento" -lt "$retries" ]; then
      echo "  [Reintento $intento/$retries] Esperado $esperado, recibido $obtenido. Reintentando en ${retry_delay}s..."
      sleep "$retry_delay"
    fi
    intento=$((intento + 1))
  done

  echo "$obtenido"
}

# ------------------------------------------------------------------------------
# Función: registrar_resultado
# ------------------------------------------------------------------------------
registrar_resultado() {
  local nombre="$1"
  local metodo="$2"
  local esperado="$3"
  local obtenido="$4"
  local extra_error="${5:-}"

  rutas_nombres+=("$nombre")
  metodos_usados+=("$metodo")
  codigos_esperados+=("$esperado")
  codigos_obtenidos+=("$obtenido")

  if [ "$obtenido" = "$esperado" ]; then
    estados_finales+=("OK")
    mensajes_error+=("")
    echo "[OK] $metodo $nombre -> HTTP $obtenido (esperado: $esperado)"
  else
    estados_finales+=("FALLO")
    total_fallos=$((total_fallos + 1))
    local msg="Esperado $esperado, obtenido $obtenido"
    if [ -n "$extra_error" ]; then
      msg="$extra_error ($msg)"
    fi
    mensajes_error+=("$msg")
    echo "[FALLO] $metodo $nombre -> HTTP $obtenido (esperado: $esperado)${extra_error:+ - $extra_error}"
  fi
}

# 1. Página principal (GET / -> 200)
echo ""
echo "--- 1. Comprobando página principal ---"
code=$(consultar_http "GET" "$url_base/" "200")
registrar_resultado "/" "GET" "200" "$code"

# 2. Rutas públicas de Angular SPA (GET -> 200)
echo ""
echo "--- 2. Comprobando rutas públicas SPA ---"
rutas_publicas=(
  "/login"
  "/acelerado-virtual"
  "/formal-virtual"
  "/forgot-password"
  "/reset-password"
  "/verify-email-token"
)

for ruta in "${rutas_publicas[@]}"; do
  code=$(consultar_http "GET" "$url_base$ruta" "200")
  registrar_resultado "$ruta" "GET" "200" "$code"
done

# 3. Endpoint Auth/login por GET (debe devolver 405 Method Not Allowed)
echo ""
echo "--- 3. Comprobando endpoint de API Auth/login (GET -> 405) ---"
code=$(consultar_http "GET" "$url_base$ruta_auth" "405")
registrar_resultado "$ruta_auth" "GET" "405" "$code"

# 4. Recurso estático (main-*.js -> 200)
echo ""
echo "--- 4. Comprobando recurso estático compilado (main-*.js) ---"

# Se descarga el HTML de la página principal sin imprimirlo a los logs para extraer el nombre de main-*.js
html_index=$(curl -s -L --connect-timeout 10 --max-time 30 "$url_base/" 2>/dev/null || true)
if [ -z "$html_index" ]; then
  html_index=$(curl -s -L --connect-timeout 10 --max-time 30 "$url_base/appAmmiOnline/" 2>/dev/null || true)
fi

main_js_archivo=$(printf '%s' "$html_index" | grep -oE 'main-[A-Za-z0-9_.-]+\.js' | head -n 1 || true)
unset html_index # Liberar inmediatamente de memoria

if [ -n "$main_js_archivo" ]; then
  # Probar en la raíz o bajo /appAmmiOnline/
  url_recurso="$url_base/$main_js_archivo"
  code=$(consultar_http "GET" "$url_recurso" "200")
  if [ "$code" != "200" ]; then
    url_recurso="$url_base/appAmmiOnline/$main_js_archivo"
    code=$(consultar_http "GET" "$url_recurso" "200")
  fi
  registrar_resultado "$main_js_archivo" "GET" "200" "$code"
else
  registrar_resultado "main-*.js" "GET" "200" "000" "No se encontro etiqueta de script main-*.js en el index"
fi

echo ""
echo "=============================================================================="
if [ "$total_fallos" -eq 0 ]; then
  echo "✅ Todas las comprobaciones de la prueba de humo fueron EXITOSAS."
else
  echo "❌ Se detectaron $total_fallos fallo(s) durante la prueba de humo."
fi
echo "=============================================================================="

# ------------------------------------------------------------------------------
# Generación del GitHub Step Summary ($GITHUB_STEP_SUMMARY)
# ------------------------------------------------------------------------------
if [ -n "${GITHUB_STEP_SUMMARY:-}" ] && [ -d "$(dirname "$GITHUB_STEP_SUMMARY")" ]; then
  {
    echo "## 💨 Resumen de Prueba de Humo tras Despliegue"
    echo ""
    echo "- **Dominio:** \`$url_base\`"
    if [ "$total_fallos" -eq 0 ]; then
      echo "- **Estado:** ✅ **EXITOSO** (Todas las rutas respondieron según lo esperado)"
    else
      echo "- **Estado:** ❌ **FALLIDO** ($total_fallos ruta(s) con respuesta inesperada)"
    fi
    echo ""
    echo "| Ruta / Recurso | Método | Esperado | Obtenido | Estado |"
    echo "| :--- | :---: | :---: | :---: | :---: |"
    for i in "${!rutas_nombres[@]}"; do
      icono="✅ OK"
      if [ "${estados_finales[$i]}" != "OK" ]; then
        icono="❌ FALLO"
      fi
      echo "| \`${rutas_nombres[$i]}\` | ${metodos_usados[$i]} | ${codigos_esperados[$i]} | ${codigos_obtenidos[$i]} | $icono |"
    done
    echo ""
    if [ "$total_fallos" -gt 0 ]; then
      echo "> [!CAUTION]"
      echo "> **Rutas que fallaron en la prueba de humo:**"
      for i in "${!rutas_nombres[@]}"; do
        if [ "${estados_finales[$i]}" != "OK" ]; then
          echo "> - \`${metodos_usados[$i]} ${rutas_nombres[$i]}\`: esperado \`${codigos_esperados[$i]}\`, obtenido \`${codigos_obtenidos[$i]}\` (${mensajes_error[$i]})"
        fi
      done
      echo ""
    fi
  } >> "$GITHUB_STEP_SUMMARY"
fi

if [ "$total_fallos" -gt 0 ]; then
  exit 1
fi

exit 0
