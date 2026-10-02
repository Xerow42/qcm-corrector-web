from __future__ import annotations

import os
from pathlib import Path
from typing import Any

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
_ENV_LOADED = False


def load_local_env(force: bool = False) -> None:
    global _ENV_LOADED
    if _ENV_LOADED and not force:
        return
    if ENV_PATH.exists():
        for raw_line in ENV_PATH.read_text(encoding="utf-8-sig").splitlines():
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            key = key.strip().lstrip("\ufeff")
            value = value.strip().strip('"').strip("'")
            if key and (force or not os.environ.get(key)):
                os.environ[key] = value
    _ENV_LOADED = True


def get_database_url() -> str:
    load_local_env()
    database_url = os.environ.get("DATABASE_URL", "").strip()
    if not database_url:
        raise RuntimeError(
            "DATABASE_URL introuvable. Creez backend/.env avec "
            "DATABASE_URL=postgresql://postgres:motdepasse@localhost:5432/qcm_corrector"
        )
    return database_url


def _psycopg_modules():
    try:
        import psycopg  # type: ignore
        from psycopg.rows import dict_row  # type: ignore
    except ModuleNotFoundError as exc:
        raise RuntimeError(
            "Driver PostgreSQL Python manquant. Installez les dependances du backend avec: "
            "pip install -r backend/requirements.txt"
        ) from exc
    return psycopg, dict_row


def connect():
    psycopg, dict_row = _psycopg_modules()
    return psycopg.connect(get_database_url(), row_factory=dict_row)


def ping_database() -> dict[str, Any]:
    with connect() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT current_database() AS database_name, current_user AS user_name, now() AS server_time")
            row = cur.fetchone() or {}
    return {
        "status": "ok",
        "database": row.get("database_name"),
        "user": row.get("user_name"),
        "server_time": row.get("server_time").isoformat() if row.get("server_time") else None,
    }
