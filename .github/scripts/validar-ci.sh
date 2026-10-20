#!/usr/bin/env bash
# Agrega los resultados de CI. Falla cerrado ante resultados desconocidos.
set -uo pipefail

if [ "$#" -ne 5 ]; then
  echo "Uso: $0 <evento> <politica> <secretos> <backend> <frontend>" >&2
  exit 2
fi

evento="$1"
politica="$2"
secretos="$3"
backend="$4"
frontend="$5"

case "$evento:$politica" in
  pull_request:success | push:skipped | schedule:skipped | workflow_dispatch:skipped)
    ;;
  *)
    echo "La política de ramas terminó en '$politica' para '$evento'." >&2
    exit 1
    ;;
esac

for nombre in secretos backend frontend; do
  resultado="${!nombre}"
  if [ "$resultado" != success ]; then
    echo "El job '$nombre' terminó en '$resultado'." >&2
    exit 1
  fi
done

echo "CI correcto para '$evento'."
