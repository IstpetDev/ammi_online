#!/usr/bin/env bash
set -uo pipefail

raiz="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
script="$raiz/validar-ci.sh"
fallos=0

casos=(
  '0|pull_request|success|success|success|success|success'
  '1|pull_request|skipped|success|success|success|success'
  '1|pull_request|failure|success|success|success|success'
  '1|pull_request|success|failure|success|success|success'
  '1|pull_request|success|success|failure|success|success'
  '1|pull_request|success|success|success|cancelled|success'
  '1|pull_request|success|success|success|success|failure'
  '0|push|skipped|success|success|success|success'
  '0|schedule|skipped|success|success|success|success'
  '0|workflow_dispatch|skipped|success|success|success|success'
  '1|push|skipped|success|skipped|success|success'
  '1|workflow_dispatch|success|success|success|success|success'
)

for caso in "${casos[@]}"; do
  IFS='|' read -r esperado evento politica secretos backend frontend validadores <<<"$caso"
  bash "$script" "$evento" "$politica" "$secretos" "$backend" "$frontend" "$validadores" >/dev/null 2>&1
  obtenido=$?
  if [ "$obtenido" -ne "$esperado" ]; then
    echo "FALLA: $caso (salida $obtenido)"
    fallos=$((fallos + 1))
  fi
done

if [ "$fallos" -gt 0 ]; then
  echo "$fallos casos fallaron"
  exit 1
fi
echo "${#casos[@]} casos de ci-ok correctos"
