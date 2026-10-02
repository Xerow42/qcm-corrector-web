from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routes import router as scan_router

app = FastAPI(title="QCM Scanner API", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(scan_router)

@app.get("/")
def root() -> dict:
    return {
        "service": "qcm-scanner",
        "status": "running",
        "docs": "/docs",
        "db_health": "/api/health/db",
        "web": "http://localhost:3000",
        "sample_image_expected_at": str(Path("backend/data/samples/qcm_format_example.jpg")),
    }
