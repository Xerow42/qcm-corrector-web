# QCM Corrector — Main backend

FastAPI backend for QCM Corrector: accounts, classes and students, QCM creation and publication, sessions and results, PDF generation (subject sheet, answer key, statements), and result e-mails. It is the service the [web app](../src) talks to, and it is itself a client of the [AI grading service](../ai-service) for scanned-sheet analysis.

> Built primarily by other members of the QCM Corrector team. I worked on the e-mail and PDF-generation services.

## Project status — read this before relying on it

This delivery is **not complete and has not been run end to end** in the environment used to prepare this repository (no network access there to install dependencies or run PostgreSQL). Specifically:

- **Two required modules are missing.** `api/routes.py` and `classification/pixel_threshold.py` import `preprocessing.opencv_pipeline` and `segmentation.grid_extractor` — neither exists anywhere in what was provided. The backend **cannot start** without them. If you have them locally, add `backend/preprocessing/` and `backend/segmentation/` with the missing files.
- **A model file is missing.** `api/routes.py` expects a local model at `models/model.h5` for the `classification/cnn_classifier.py` path; it was not included. Note the backend separately calls the external AI service via `IA_API_BASE_URL`/`IA_ANALYZE_PATH` (see `.env.example`) — judging from the code, that external call looks like the primary grading path, with the local model as an alternative/fallback that isn't currently usable.
- **A PDF template may be missing.** Code paths reference `data/templates/`, which was not included; this may affect some PDF-generation routes.
- **Syntax-checked, not run.** Every `.py` file here compiles (`python -m py_compile`), and `configs/template_60q.json` / `data/answer_key.json` are valid JSON — that is the extent of what could be verified without installing `requirements.txt` (no network access in the preparation environment).

## Security — read this before deploying or publishing further

- **No real credentials are in this repository.** `.env.example` has placeholder values only; the original `.env` this was prepared from contained a real database password and a real SMTP password for an institutional mailbox — **neither was copied here**. If those credentials are still in use anywhere, rotate them (change the PostgreSQL password; generate a new SMTP password or app password for the mailbox) before treating them as safe, since they existed in a file that left your machine.
- **Passwords are not hashed.** `login_user()` in `api/routes.py` compares the submitted password directly against the stored `password_hash` column (`row["password_hash"] != password`) — despite the column's name, nothing is actually hashed. Anyone with read access to the `utilisateur` table can read every password in plain text. This needs a real hashing scheme (e.g. `passlib` with bcrypt or argon2) and a migration of existing rows before this is used with real accounts.
- **Professor account passwords are configurable.** Set `DEFAULT_PROFESSOR_PASSWORD` in the local `.env` when a fallback password is required. Never commit the real value.
- **CORS is wide open** (`allow_origins=["*"]` in `main.py`). `allow_credentials` is `False`, which limits the risk, but tighten this to your actual frontend origin(s) before any public deployment.
- A real, filled-in sample answer sheet and a CSV of real students' names and e-mail addresses existed alongside this backend in the original delivery. **Neither was included here** — do not add scanned sheets or student records with real names to this repository.

## What it does

- **Accounts & access**: `/api/auth/login`; admin management of professors, classes and students.
- **QCM lifecycle**: create, save as draft, publish, and fetch a QCM; `/api/qcms/draft` and `/api/qcms/sync` match what the [web app](../src/lib/api) already calls.
- **Sessions & results**: `/api/sessions`, `/api/sessions/{id}/results`, and an endpoint to receive AI-produced corrections (`.../ai-corrections`) — this is where a result coming back from the AI service would land.
- **PDF generation** (`pdf_generator.py`, ReportLab + pypdf): the QCM subject sheet, the answer key, and a results/statements document. A separate path (`_render_web_page_pdf` in `api/routes.py`) renders a *live web page* to PDF via a headless Chrome/Edge subprocess — this needs a Chromium-based browser installed on the host and the web app reachable at `WEB_BASE_URL`.
- **Result e-mails** (`api/routes.py`, `smtplib`): sends a templated e-mail (school logo, subject, grade) per student once results are available, over SMTP with STARTTLS.
- **Training data** (`data/patches/checked/`, 7,288 images): cropped checkbox samples from real scanned sheets, used to train the checkbox-classification model — a subset of the larger dataset described in the project's README. `data/answer_key.json` is the answer key for the reference QCM template, not student data.
- **Specification documents** (`docs/`): the project's own *cahier des charges* (functional specification) and a plain-language guide to how the platform is meant to work.

## Running it locally

Requires Python 3.11+ (the pinned `tensorflow==2.19.0` needs 3.9–3.12) and a PostgreSQL database, plus the missing modules noted above.

```bash
cd backend
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env             # then fill in real local values
uvicorn main:app --reload --host 127.0.0.1 --port 8001
```

`_render_web_page_pdf` additionally needs a Chromium-based browser (Chrome or Edge) installed and discoverable on the host, and the web app running at `WEB_BASE_URL` for that specific PDF path to work.

## How this fits with the rest of the project

```text
Web app (src/)  →  this backend  →  PostgreSQL
                              ↘︎  AI grading service (ai-service/), via IA_API_BASE_URL
                              ↘︎  SMTP (result e-mails)
                              ↘︎  headless Chrome (PDF of a live web page)
```

This is the piece that, once it actually runs, connects the already-deployed web app to real data instead of the demo API (see the root README's deployment notes) — but given the gaps above, don't point the deployed site at it yet. **It is not a fit for Vercel**: it holds a persistent database connection, shells out to a headless browser, and is a long-running process, none of which match Vercel's serverless model. A small VM, Render, Railway or Fly.io are realistic hosts, the same as for the AI service.

## Repository layout

```text
backend/
├── api/
│   ├── __init__.py
│   └── routes.py                 # All HTTP routes
├── classification/
│   ├── cnn_classifier.py         # Loads/queries a local Keras model (model file not included)
│   ├── pixel_threshold.py        # Non-ML checkbox detection by pixel-darkness ratio
│   └── train_cnn.py              # Training entry point
├── configs/template_60q.json     # Geometry for the 60-question answer-sheet template
├── data/
│   ├── answer_key.json           # Reference answer key (not student data)
│   └── patches/checked/          # Training images (cropped checkboxes)
├── docs/                         # Functional specification and a plain-language guide
├── db.py                         # PostgreSQL connection helper (reads DATABASE_URL)
├── main.py                       # FastAPI app, CORS, router registration
├── pdf_generator.py              # Subject sheet / answer key / statements PDFs
├── scoring.py                    # Compares detected vs. expected answers
├── requirements.txt
└── .env.example
```

