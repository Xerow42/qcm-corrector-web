# Deployment

The web application is a **Next.js server application**. It needs the QCM Corrector backend API (FastAPI) to be reachable:
without it the pages load but show an API error banner and empty tables.

> GitHub Pages cannot host this app (it needs a Node.js server). Use Vercel, or any host that runs Node.js.

## Requirements

- Node.js 20.9 or later
- A reachable backend, its URL set in `NEXT_PUBLIC_API_URL`
- For a public deployment, the backend must be served over **HTTPS** and allow the front-end origin with CORS

## Option 1 — Local

```bash
cp .env.example .env.local      # set NEXT_PUBLIC_API_URL
npm install
npm run dev                     # http://localhost:3000
```

## Option 2 — Any Node.js server

```bash
npm install
npm run build
npm start                       # listens on port 3000 (PORT=8080 npm start to change it)
```

## Option 3 — Vercel (free tier)

1. Push the repository to GitHub.
2. On <https://vercel.com>, choose **Add New → Project** and import the repository. The Next.js preset is detected automatically.
3. Under **Environment Variables**, add `NEXT_PUBLIC_API_URL` with the public HTTPS URL of your backend
   (and optionally `NEXT_PUBLIC_DEMO_TEACHER_EMAIL` / `NEXT_PUBLIC_DEMO_TEACHER_ID`).
4. Click **Deploy**.

`NEXT_PUBLIC_*` variables are read at **build time**: after changing one, redeploy.

## Backend side: CORS

The browser calls the backend directly from client pages, so the FastAPI backend must allow the front-end origin:

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://<your-project>.vercel.app", "http://localhost:3000"],
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type"],
)
```

## Troubleshooting

| Symptom | Likely cause |
| --- | --- |
| Red/orange API error banner on every page | Wrong `NEXT_PUBLIC_API_URL`, backend down, or CORS not allowing the front-end origin |
| Works locally, fails on Vercel | Backend still on `http://127.0.0.1` or plain HTTP (browsers block mixed content) |
| "Failed to fetch" | CORS or network; open the browser console → Network tab |
| Changed the env variable, nothing happened | Redeploy: values are embedded at build time |
