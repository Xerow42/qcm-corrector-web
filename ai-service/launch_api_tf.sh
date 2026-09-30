#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$SCRIPT_DIR"

if ! command -v python >/dev/null 2>&1; then
  echo "python introuvable dans l'environnement courant." >&2
  echo "Entre d'abord dans ton workspace TensorFlow avec start-tf, puis relance ce script." >&2
  exit 1
fi

echo "[1/3] Verification de l'environnement Python"
python --version

echo "[2/3] Installation des dependances API"
python -m pip install --upgrade pip
python -m pip install -r api_requirements.txt

echo "[3/3] Demarrage de l'API sur http://0.0.0.0:8000"
exec python run_api.py
