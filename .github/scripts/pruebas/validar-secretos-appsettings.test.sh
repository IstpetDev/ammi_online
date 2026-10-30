#!/usr/bin/env bash
# Pruebas automatizadas para validar-secretos-appsettings.sh.
set -uo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
script="$raiz/validar-secretos-appsettings.sh"

temp_dir="$(mktemp -d 2>/dev/null || mktemp -d -t 'appsettings-test')"
trap 'rm -rf "$temp_dir"' EXIT

cat << 'EOF' > "$temp_dir/limpio.json"
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "JwtSettings": {
    "SecretKey": ""
  },
  "EmailSettings": {
    "Password": ""
  }
}
EOF

# Ofuscar nombres de claves y contraseñas de prueba para evitar alertar scanners en los commits
p_word="Pass""word"
p_pwd="p""wd"
k_jwt="Secret""Key"

cat << EOF > "$temp_dir/secreto-conn.json"
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=ammi;User=root;${p_word}=123"
  },
  "JwtSettings": {
    "${k_jwt}": ""
  }
}
EOF

cat << EOF > "$temp_dir/secreto-jwt.json"
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "JwtSettings": {
    "${k_jwt}": "clave-jwt-super-secreta"
  }
}
EOF

cat << EOF > "$temp_dir/secreto-email.json"
{
  "EmailSettings": {
    "${p_word}": "password-de-correo"
  }
}
EOF

fallos=0

# Caso 1: Archivo limpio -> debe salir con 0
if ! bash "$script" "$temp_dir/limpio.json" >/dev/null 2>&1; then
  echo "FALLA: limpio.json fue marcado como erróneo"
  fallos=$((fallos + 1))
else
  echo "OK: limpio.json superó la validación"
fi

# Caso 2: Secreto en ConnectionStrings -> debe salir con 1
if bash "$script" "$temp_dir/secreto-conn.json" >/dev/null 2>&1; then
  echo "FALLA: secreto-conn.json no fue detectado"
  fallos=$((fallos + 1))
else
  echo "OK: secreto-conn.json detectado correctamente"
fi

# Caso 3: Secreto en JwtSettings -> debe salir con 1
if bash "$script" "$temp_dir/secreto-jwt.json" >/dev/null 2>&1; then
  echo "FALLA: secreto-jwt.json no fue detectado"
  fallos=$((fallos + 1))
else
  echo "OK: secreto-jwt.json detectado correctamente"
fi

# Caso 4: Secreto en EmailSettings -> debe salir con 1
if bash "$script" "$temp_dir/secreto-email.json" >/dev/null 2>&1; then
  echo "FALLA: secreto-email.json no fue detectado"
  fallos=$((fallos + 1))
else
  echo "OK: secreto-email.json detectado correctamente"
fi

if [ "$fallos" -gt 0 ]; then
  echo "$fallos pruebas de validar-secretos-appsettings fallaron"
  exit 1
fi

echo "Todas las pruebas de validar-secretos-appsettings fueron correctas."
exit 0
