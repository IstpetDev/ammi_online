#!/usr/bin/env bash
# Pruebas automatizadas de las reglas de gitleaks (.gitleaks.toml).
set -uo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/../../.." && pwd)"
config="$raiz/.gitleaks.toml"

if ! command -v gitleaks >/dev/null 2>&1; then
  echo "gitleaks no está instalado en el PATH. Omitiendo pruebas de gitleaks."
  exit 0
fi

temp_dir="$(mktemp -d 2>/dev/null || mktemp -d -t 'gitleaks-test')"
trap 'rm -rf "$temp_dir"' EXIT

mkdir -p "$temp_dir/positivos" "$temp_dir/negativos"

# Separar nombres de parámetros para no incluir falsos positivos literales en el commit
p_word="Pass""word"
p_pwd="p""wd"
k_jwt="Secret""Key"

# Casos positivos: deben ser detectados como fuga
cat << EOF > "$temp_dir/positivos/conn-password.txt"
"DefaultConnection": "Server=localhost;Port=3306;Database=ammi_db;User Id=ammi_user;${p_word}=SuperSecret123;"
EOF

cat << EOF > "$temp_dir/positivos/conn-pwd.txt"
"DefaultConnection": "Server=127.0.0.1;Database=ammi;Uid=root;${p_pwd}=SecretPwd456;"
EOF

cat << EOF > "$temp_dir/positivos/jwt-secret.json"
{
  "JwtSettings": {
    "${k_jwt}": "mi-clave-jwt-super-secreta-de-prueba-12345"
  }
}
EOF

# Casos negativos: NO deben ser detectados
cat << 'EOF' > "$temp_dir/negativos/appsettings.json"
{
  "ConnectionStrings": {
    "DefaultConnection": ""
  },
  "JwtSettings": {
    "SecretKey": ""
  }
}
EOF

cat << EOF > "$temp_dir/negativos/conn-empty-password.txt"
Server=localhost;Database=ammi;User=root;${p_word}=;
Server=localhost;Database=ammi;Uid=root;${p_pwd}="";
EOF

cat << 'EOF' > "$temp_dir/negativos/csharp-code.cs"
var hashedPassword = _passwordHasher.HashPassword(request.Password);
Password = request.Password;
EOF

fallos=0

# 1. Probar positivos individualmente
probar_positivo() {
  local archivo="$1"
  local regla_esperada="$2"
  local reporte="$temp_dir/reporte-pos.json"
  rm -f "$reporte"

  gitleaks dir "$archivo" --config "$config" --no-banner --report-path "$reporte" >/dev/null 2>&1 || true

  if [ ! -s "$reporte" ] || ! grep -q "\"RuleID\": \"$regla_esperada\"" "$reporte"; then
    echo "FALLA POSITIVO: $(basename "$archivo") debía detectar regla '$regla_esperada'"
    fallos=$((fallos + 1))
  else
    echo "OK POSITIVO: $(basename "$archivo") detectado con regla '$regla_esperada'"
  fi
}

probar_positivo "$temp_dir/positivos/conn-password.txt" "connection-string-password"
probar_positivo "$temp_dir/positivos/conn-pwd.txt" "connection-string-password"
probar_positivo "$temp_dir/positivos/jwt-secret.json" "jwt-secret-key"

# 2. Probar negativos
reporte_neg="$temp_dir/reporte-neg.json"
gitleaks dir "$temp_dir/negativos" --config "$config" --no-banner --report-path "$reporte_neg" >/dev/null 2>&1 || true

if [ -s "$reporte_neg" ] && [ "$(cat "$reporte_neg")" != "[]" ] && [ "$(cat "$reporte_neg")" != "null" ]; then
  echo "FALLA NEGATIVO: Se detectaron falsos positivos en casos válidos:"
  cat "$reporte_neg"
  fallos=$((fallos + 1))
else
  echo "OK NEGATIVOS: Ningún caso válido fue marcado erróneamente como fuga."
fi

if [ "$fallos" -gt 0 ]; then
  echo "$fallos pruebas de gitleaks fallaron"
  exit 1
fi

echo "Todas las pruebas de reglas gitleaks fueron correctas."
exit 0
