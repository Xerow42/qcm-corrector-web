import os

from api_qcm.app import app


if __name__ == "__main__":
    import uvicorn

    # Default port matches the API contract in docs/API_CONTRAT_WEB.md and
    # docs/API_QCM.md (both document port 8000). The original script had
    # hardcoded port 5000 here, which contradicted its own docs; fixed to
    # default to 8000, overridable with the PORT environment variable.
    port = int(os.environ.get("PORT", "8000"))
    uvicorn.run(app, host="0.0.0.0", port=port)
