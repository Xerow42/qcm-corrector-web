from __future__ import annotations

from contextlib import asynccontextmanager

from fastapi import FastAPI, File, UploadFile
from fastapi.responses import JSONResponse

from api_qcm.service import (
    InvalidImageError,
    ResourceInitializationError,
    ServiceError,
    UnreadableSheetError,
    analyze_sheet_bytes,
    initialize_resources,
)


@asynccontextmanager
async def lifespan(_: FastAPI):
    initialize_resources()
    yield


app = FastAPI(
    title="QCM Scan API",
    version="1.1.0",
    description="Recoit une photo scannee QCM et renvoie le dictionnaire du script.",
    lifespan=lifespan,
)


def error_payload(code: str, message: str) -> dict[str, dict[str, str]]:
    return {"error": {"code": code, "message": message}}


@app.get("/health")
def healthcheck() -> dict[str, str]:
    return {"status": "ok"}


@app.post("/analyze")
async def analyze_qcm(
    file: UploadFile = File(...),
) -> JSONResponse:
    try:
        content = await file.read()
        result = analyze_sheet_bytes(content)
        return JSONResponse(status_code=200, content=result)
    except InvalidImageError as exc:
        return JSONResponse(
            status_code=400,
            content=error_payload(exc.code, exc.message),
        )
    except UnreadableSheetError as exc:
        return JSONResponse(
            status_code=422,
            content=error_payload(exc.code, exc.message),
        )
    except ResourceInitializationError as exc:
        return JSONResponse(
            status_code=500,
            content=error_payload(exc.code, exc.message),
        )
    except ServiceError as exc:
        return JSONResponse(
            status_code=500,
            content=error_payload(exc.code, exc.message),
        )
    except Exception as exc:
        return JSONResponse(
            status_code=500,
            content=error_payload(
                "internal_server_error",
                f"Erreur interne pendant l'analyse: {exc}",
            ),
        )
