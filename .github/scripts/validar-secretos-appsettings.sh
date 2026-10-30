#!/usr/bin/env bash
# Valida que ningún archivo appsettings*.json versionado en el repositorio
# contenga secretos reales (ConnectionStrings, JwtSettings:SecretKey o credenciales de correo).
set -uo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
cd "$raiz"

archivos=()
if [ "$#" -gt 0 ]; then
  archivos=("$@")
else
  while IFS= read -r f; do
    [ -n "$f" ] && archivos+=("$f")
  done < <(git ls-files "*appsettings*.json" 2>/dev/null || find . -name "appsettings*.json" -not -path "*/node_modules/*" -not -path "*/bin/*" -not -path "*/obj/*")
fi

if [ "${#archivos[@]}" -eq 0 ]; then
  echo "No se encontraron archivos appsettings*.json para validar."
  exit 0
fi

python_cmd=""
if command -v python3 >/dev/null 2>&1; then
  python_cmd="python3"
elif command -v python >/dev/null 2>&1; then
  python_cmd="python"
elif command -v node >/dev/null 2>&1; then
  python_cmd="node"
else
  echo "Se requiere python o node para validar JSON." >&2
  exit 1
fi

fallos=0

for archivo in "${archivos[@]}"; do
  [ -f "$archivo" ] || continue

  if [ "$python_cmd" = "node" ]; then
    salida=$(node -e '
      const fs = require("fs");
      const path = process.argv[1];
      try {
        const data = JSON.parse(fs.readFileSync(path, "utf8"));
        const errores = [];
        if (data.ConnectionStrings) {
          for (const [k, v] of Object.entries(data.ConnectionStrings)) {
            if (typeof v === "string" && v.trim() !== "") {
              errores.push(`ConnectionStrings:${k}`);
            }
          }
        }
        if (data.JwtSettings && typeof data.JwtSettings.SecretKey === "string" && data.JwtSettings.SecretKey.trim() !== "") {
          errores.push("JwtSettings:SecretKey");
        }
        if (data.EmailSettings && typeof data.EmailSettings.Password === "string" && data.EmailSettings.Password.trim() !== "") {
          errores.push("EmailSettings:Password");
        }
        if (errores.length > 0) {
          console.log(errores.join(","));
          process.exit(1);
        }
      } catch (e) {
        console.error("Error al parsear JSON: " + e.message);
        process.exit(2);
      }
    ' "$archivo" 2>&1)
    codigo=$?
  else
    salida=$("$python_cmd" -c '
import json, sys

path = sys.argv[1]
try:
    with open(path, "r", encoding="utf-8-sig") as f:
        data = json.load(f)
    errores = []
    conn = data.get("ConnectionStrings") or {}
    if isinstance(conn, dict):
        for k, v in conn.items():
            if isinstance(v, str) and v.strip():
                errores.append(f"ConnectionStrings:{k}")
    jwt = data.get("JwtSettings") or {}
    if isinstance(jwt, dict):
        sk = jwt.get("SecretKey")
        if isinstance(sk, str) and sk.strip():
            errores.append("JwtSettings:SecretKey")
    email = data.get("EmailSettings") or {}
    if isinstance(email, dict):
        pwd = email.get("Password")
        if isinstance(pwd, str) and pwd.strip():
            errores.append("EmailSettings:Password")
    if errores:
        print(",".join(errores))
        sys.exit(1)
except Exception as e:
    sys.stderr.write(f"Error procesando {path}: {e}\n")
    sys.exit(2)
' "$archivo" 2>&1)
    codigo=$?
  fi

  if [ "$codigo" -eq 1 ]; then
    echo "ERROR DE SEGURIDAD: El archivo '$archivo' contiene valores no vacíos en campos sensibles: $salida" >&2
    fallos=$((fallos + 1))
  elif [ "$codigo" -ne 0 ]; then
    echo "ERROR: Falló la validación del archivo '$archivo': $salida" >&2
    fallos=$((fallos + 1))
  else
    echo "OK: '$archivo' no contiene credenciales expuestas."
  fi
done

if [ "$fallos" -gt 0 ]; then
  echo "$fallos archivo(s) appsettings contienen credenciales expuestas o errores. El paso de CI falla." >&2
  exit 1
fi

echo "Validación de appsettings completada con éxito: sin secretos en archivos versionados."
exit 0
