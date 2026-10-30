#!/usr/bin/env bash
# ==============================================================================
# prueba-humo.test.sh: Pruebas automatizadas para prueba-humo.sh.
# Simula respuestas HTTP de curl en escenarios exitosos y fallidos
# para garantizar el cumplimiento de los criterios del Issue #30.
# ==============================================================================

set -uo pipefail
export LC_ALL=C.UTF-8

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
script="$raiz/prueba-humo.sh"

temp_dir="$(mktemp -d 2>/dev/null || mktemp -d -t 'prueba-humo-test')"
trap 'rm -rf "$temp_dir"' EXIT

mkdir -p "$temp_dir/bin"
mock_curl="$temp_dir/bin/curl"

# Script de control para el mock de curl
cat << 'EOF' > "$mock_curl"
#!/usr/bin/env bash
# Mock de curl para pruebas unitarias de prueba-humo.sh

scenario="${MOCK_SCENARIO:-success}"
last_arg="${@: -1}"

# Si se pide únicamente el código HTTP (-o /dev/null y -w '%{http_code}')
if [[ "$*" == *"-o /dev/null"* ]]; then
  case "$scenario" in
    success)
      if [[ "$last_arg" == *"/api/Auth/login"* ]]; then
        printf '405'
      else
        printf '200'
      fi
      ;;
    route_fail)
      if [[ "$last_arg" == *"/forgot-password"* ]]; then
        printf '404'
      elif [[ "$last_arg" == *"/api/Auth/login"* ]]; then
        printf '405'
      else
        printf '200'
      fi
      ;;
    auth_fail)
      if [[ "$last_arg" == *"/api/Auth/login"* ]]; then
        printf '200' # Debería ser 405; 200 simula fallo
      else
        printf '200'
      fi
      ;;
    static_fail)
      if [[ "$last_arg" == *"main-"* ]]; then
        printf '404'
      elif [[ "$last_arg" == *"/api/Auth/login"* ]]; then
        printf '405'
      else
        printf '200'
      fi
      ;;
    *)
      printf '200'
      ;;
  esac
  exit 0
fi

# Si se descarga el HTML del index para extraer main-*.js
if [[ "$scenario" == "missing_main_js" ]]; then
  printf '<!doctype html><html><head><title>Test</title></head><body>Sin scripts</body></html>'
else
  printf '<!doctype html><html><head><title>Test</title></head><body><script src="main-TEST1234.js" type="module"></script></body></html>'
fi
exit 0
EOF

chmod +x "$mock_curl"

export PATH="$temp_dir/bin:$PATH"
export SMOKE_TEST_RETRIES="1"
export SMOKE_TEST_RETRY_DELAY="0"

fallos=0

# ------------------------------------------------------------------------------
# Caso 1: Escenario exitoso completo
# ------------------------------------------------------------------------------
export MOCK_SCENARIO="success"
export GITHUB_STEP_SUMMARY="$temp_dir/summary_success.md"

salida=$(bash "$script" "http://test.local" 2>&1)
codigo=$?

if [ "$codigo" -ne 0 ]; then
  echo "FALLA: Escenario exitoso terminó con código $codigo (esperado 0)"
  fallos=$((fallos + 1))
else
  echo "OK: Escenario exitoso completó con código 0"
fi

if [[ "$salida" != *"[OK] GET / -> HTTP 200"* ]] || \
   [[ "$salida" != *"[OK] GET /login -> HTTP 200"* ]] || \
   [[ "$salida" != *"[OK] GET /apiAmmiOnline/api/Auth/login -> HTTP 405"* ]] || \
   [[ "$salida" != *"[OK] GET main-TEST1234.js -> HTTP 200"* ]]; then
  echo "FALLA: Escenario exitoso no reportó todas las rutas requeridas como [OK]"
  fallos=$((fallos + 1))
else
  echo "OK: Escenario exitoso reportó todas las rutas correctamente"
fi

if [ -f "$GITHUB_STEP_SUMMARY" ]; then
  if grep -q "EXITOSO" "$GITHUB_STEP_SUMMARY"; then
    echo "OK: Step summary documentó resultado EXITOSO"
  else
    echo "FALLA: Step summary no contiene EXITOSO"
    fallos=$((fallos + 1))
  fi
else
  echo "FALLA: No se generó GITHUB_STEP_SUMMARY en escenario exitoso"
  fallos=$((fallos + 1))
fi

# ------------------------------------------------------------------------------
# Caso 2: Ruta pública falla (404 en /forgot-password)
# ------------------------------------------------------------------------------
export MOCK_SCENARIO="route_fail"
export GITHUB_STEP_SUMMARY="$temp_dir/summary_fail.md"

salida=$(bash "$script" "http://test.local" 2>&1 || true)

if [[ "$salida" != *"[FALLO] GET /forgot-password -> HTTP 404 (esperado: 200)"* ]]; then
  echo "FALLA: No se reportó fallo en /forgot-password"
  fallos=$((fallos + 1))
else
  echo "OK: Reportó fallo exacto en /forgot-password"
fi

if [ -f "$GITHUB_STEP_SUMMARY" ]; then
  if grep -q "FALLIDO" "$GITHUB_STEP_SUMMARY" && grep -q "/forgot-password" "$GITHUB_STEP_SUMMARY"; then
    echo "OK: Step summary documentó la ruta fallida /forgot-password"
  else
    echo "FALLA: Step summary no contiene detalle de ruta fallida"
    fallos=$((fallos + 1))
  fi
fi

# ------------------------------------------------------------------------------
# Caso 3: Auth/login no devuelve 405 (devuelve 200 inesperado)
# ------------------------------------------------------------------------------
export MOCK_SCENARIO="auth_fail"
salida=$(bash "$script" "http://test.local" 2>&1 || true)

if [[ "$salida" != *"[FALLO] GET /apiAmmiOnline/api/Auth/login -> HTTP 200 (esperado: 405)"* ]]; then
  echo "FALLA: No se detectó fallo cuando Auth/login devuelve 200 en GET"
  fallos=$((fallos + 1))
else
  echo "OK: Detectó fallo en Auth/login al recibir código distinto de 405"
fi

# ------------------------------------------------------------------------------
# Caso 4: Recurso estático main-*.js no existe en el HTML
# ------------------------------------------------------------------------------
export MOCK_SCENARIO="missing_main_js"
salida=$(bash "$script" "http://test.local" 2>&1 || true)

if [[ "$salida" != *"[FALLO] GET main-*.js -> HTTP 000"* ]]; then
  echo "FALLA: No se detectó la ausencia del script main-*.js"
  fallos=$((fallos + 1))
else
  echo "OK: Detectó ausencia de main-*.js en HTML del index"
fi

# ------------------------------------------------------------------------------
# Caso 5: Recurso estático main-*.js devuelve 404
# ------------------------------------------------------------------------------
export MOCK_SCENARIO="static_fail"
salida=$(bash "$script" "http://test.local" 2>&1 || true)

if [[ "$salida" != *"[FALLO] GET main-TEST1234.js -> HTTP 404"* ]]; then
  echo "FALLA: No se detectó fallo HTTP 404 en main-*.js"
  fallos=$((fallos + 1))
else
  echo "OK: Detectó fallo HTTP 404 en main-*.js"
fi

# ------------------------------------------------------------------------------
# Caso 6: Privacidad de logs - comprobar que ningún cuerpo HTML o cabecera sensible se imprima
# ------------------------------------------------------------------------------
export MOCK_SCENARIO="success"
salida=$(bash "$script" "http://test.local" 2>&1)
if [[ "$salida" == *"<!doctype html>"* ]] || [[ "$salida" == *"Sin scripts"* ]] || [[ "$salida" == *"<body>"* ]]; then
  echo "FALLA: Se detectó fuga de cuerpo HTML en la salida estándar"
  fallos=$((fallos + 1))
else
  echo "OK: No se filtran cuerpos HTML en logs (privacidad de Actions respetada)"
fi

echo ""
if [ "$fallos" -gt 0 ]; then
  echo "❌ $fallos prueba(s) de prueba-humo fallaron."
  exit 1
fi

echo "✅ Todas las pruebas de prueba-humo.test.sh pasaron exitosamente."
exit 0
