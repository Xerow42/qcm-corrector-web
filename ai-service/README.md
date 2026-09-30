# QCM Corrector — AI grading service

Standalone Python service that turns a photo of a scanned QCM answer sheet into a structured result: student name, student number, and the detected answer for each of up to 60 questions. It is one of the four components of the QCM Corrector project (see the [root README](../README.md) for how they fit together).

> Built primarily by other members of the QCM Corrector team. I participated in training the checkbox-classification models on the answer-sheet dataset.

## What it does

1. Locates the four corner markers printed on the sheet and corrects the scan's perspective (OpenCV).
2. Reads the student's name from the identification box with EasyOCR, trying a few preprocessing variants (contrast/threshold cleanup, horizontal-line removal) until one produces readable text.
3. Reads the student number from a grid of bubbled digits using a trained classification model (`qcm_model_id_augmente.h5`).
4. Reads each answer box the same way with a second trained model (`qcm_model2.h5`), combined with a dark-pixel-ratio check so a lightly-marked box is still counted (see `is_qcm_box_checked` in `api_qcm/service.py`).
5. Returns one JSON object with `nom_complet`, `id`, and `q1` through `q60` (`""` for no mark, `"A"` for one, `"BC"` for a multi-select).

The exact box positions on the sheet (240 boxes: 60 questions × 4 choices) are stored in `api_qcm/boxes_coords3.json`, matched to the printed template.

## Project status

- **Verified:** the Python source compiles, and the two model files (`api_qcm/*.h5`) are valid HDF5 files.
- **Not verified here:** I could not install `tensorflow`, `opencv-python` or `easyocr` in the environment used to prepare this repository (no network access), so the service has not been run end-to-end in this environment. Test it locally before relying on it (see below).
- **Fixed two bugs** found while preparing this service for the repository:
  - `run_api.py` hardcoded port `5000`, while every piece of documentation (`docs/API_QCM.md`, `docs/API_CONTRAT_WEB.md`) and the sheet-analysis contract describe port `8000`. It now defaults to `8000` and reads a `PORT` environment variable if you need a different one.
  - `requirements-training.txt` pinned `numpy==1.26.00` (an extra, non-standard zero); corrected to `1.26.0`.
- **Not included:** the scripts used to build the training dataset and train the two `.h5` models. Only the already-trained models and the inference service were available for this repository. A real sample scanned sheet was excluded because it carried a real student's name — see "Testing it yourself" below for how to supply your own.

## Running it locally

Requires Python 3.10+ and, separately, the system libraries OpenCV and pdf2image need:

```bash
# Debian/Ubuntu
sudo apt update
sudo apt install -y libgl1 poppler-utils
```

Then, from `ai-service/`:

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python run_api.py
```

The first request will be slow: EasyOCR downloads its recognition models on first use, and both `.h5` models are loaded into memory at startup (see `initialize_resources()` in `api_qcm/service.py`).

Check it's up:

```bash
curl http://127.0.0.1:8000/health
```

## API contract

Full contract (request/response shapes, error codes, a TypeScript type) is in [`docs/API_CONTRAT_WEB.md`](docs/API_CONTRAT_WEB.md) and [`docs/API_CONTRAT_IOS_SWIFT.md`](docs/API_CONTRAT_IOS_SWIFT.md). Short version:

```text
POST /analyze
Content-Type: multipart/form-data
file: <scanned sheet image (jpg/jpeg/png/bmp)>
```

```json
{
  "nom_complet": "Nom Prenom",
  "id": "123456",
  "q1": "A",
  "q2": "BC",
  "q3": ""
}
```

Errors come back as `{"error": {"code": "...", "message": "..."}}` with an appropriate HTTP status (400, 422 or 500); see the contract doc for the full list of `error.code` values.

## Testing it yourself

A blank or your-own filled answer sheet works — do not commit a scanned sheet carrying a real name or student number to this repository (a sample one was deliberately left out of this delivery for that reason). Once you have an image:

```bash
curl -X POST "http://127.0.0.1:8000/analyze" -F "file=@your-sheet.jpg"
```

or call `python -m api_qcm.service <path-to-image>` for a quick command-line check without starting the API.

## How this fits with the rest of the project

This service is called by the project's main backend (not part of this repository), which in turn is what the [web app](../src) talks to. **The web app does not call this service directly**, and adding this folder to the repository does not change the behavior of the deployed web app — see the root README's architecture diagram.

This service is a plain Python process (FastAPI + TensorFlow + EasyOCR + OpenCV, with native system libraries and two 19 MB model files). It is not a fit for Vercel's serverless functions: it needs `libgl1`/`poppler-utils` installed at the OS level, and a persistent process to keep the models loaded in memory rather than reloading them on every cold start. To run it somewhere reachable over the network, a small VM, Render, Railway, Fly.io or a Hugging Face Space are realistic options; see the root README's deployment notes.

## Repository layout

```text
ai-service/
├── api_qcm/
│   ├── app.py                    # FastAPI app: /health, /analyze
│   ├── service.py                # Image processing, OCR, model inference
│   ├── boxes_coords3.json        # Answer-box coordinates on the template sheet
│   ├── qcm_model2.h5             # Trained model: answer-box checked/unchecked
│   └── qcm_model_id_augmente.h5  # Trained model: student-number digit boxes
├── docs/                         # API contracts (web + iOS)
├── requirements.txt              # Runtime dependencies (serving the API)
├── requirements-training.txt     # Dependencies used to prepare/train the models
├── run_api.py                    # Entry point: python run_api.py
└── launch_api_tf.sh              # Convenience script: install + run
```
