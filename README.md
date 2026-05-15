# Regex Transformer

A web app for matching and replacing patterns in CSV / Excel files using natural language. You describe the pattern (e.g. "find email addresses"), an LLM converts it to regex, and the app applies it to your file.

Built as a portfolio project to practice Django + React.

## Demo

**Live app:** <https://filetransformer.duckdns.org>

📹 **Demo video:** https://www.loom.com/share/49eed0dc55454a67926f2adb425e66d7

## Stack

- **Backend:** Django, Django REST Framework, pandas, pyarrow
- **Frontend:** React, TypeScript, Vite, Tailwind CSS, TanStack Query, Axios
- **LLM:** Groq API (`llama-3.3-70b-versatile`)
- **Deployment:** DigitalOcean Droplet, nginx, gunicorn, Let's Encrypt

## Features

- Upload CSV / Excel files
- Two LLM-powered transformations:
  - **Replace patterns** — describe what to find and what to replace it with
  - **Filter rows** — describe which rows to keep
- Download the transformed file as CSV

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # then fill in GROQ_API_KEY
python manage.py migrate
python manage.py runserver
```

Backend runs at `http://localhost:8000`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at `http://localhost:5173`.

### Environment Variables

| Variable                 | Purpose                                    |
| ------------------------ | ------------------------------------------ |
| `GROQ_API_KEY`           | LLM access                                 |
| `DJANGO_DEBUG`           | `True` for dev, `False` for prod           |
| `DJANGO_ALLOWED_HOSTS`   | Comma-separated hostnames                  |
| `DJANGO_CORS_ORIGINS`    | Comma-separated origins allowed to call API |

## API Endpoints

| Method | Path                          | Purpose                                                  |
| ------ | ----------------------------- | -------------------------------------------------------- |
| GET    | `/api/health/`                | Health check                                             |
| POST   | `/api/upload/`                | Upload a CSV / Excel file; returns `file_id` + preview   |
| POST   | `/api/generate-regex/`        | LLM-generated regex + suggested columns and replacement  |
| POST   | `/api/apply-regex/`           | Apply a regex to one or more columns                     |
| POST   | `/api/generate-filter/`       | LLM-generated pandas query expression                    |
| POST   | `/api/apply-filter/`          | Apply a query expression and return only matching rows   |
| GET    | `/api/download/<file_id>/`    | Download the transformed file as CSV                     |


## Notes / Design Decisions

- **Frontend vs backend validation.** The frontend `accept` attribute is just a UX hint. All real validation happens on the backend, which never trusts client input.
- **Regex validation.** LLM-generated regex is never trusted directly. It's compiled, length-checked, and screened for catastrophic backtracking before being returned.
- **Stateful storage.** Uploaded files are saved as Parquet on disk and identified by a UUID. CSVs are streamed back on download. Parquet for storage, CSV for transport.
- **LLM suggests, user reviews.** The LLM endpoint returns suggested columns and a suggested replacement alongside the pattern. The user reviews the suggestion before applying. Hallucinations stay visible and correctable.
- **Services layer.** Business logic (LLM calls, regex validation, regex application, file storage) lives in `api/services/` rather than inside views. Views stay thin and only handle HTTP. Easier to test and reuse from background workers later.
- **Error specificity.** Different failure modes return different HTTP status codes (400 invalid input, 404 missing file, 502 upstream LLM failure, 500 unexpected). Internal exception messages are logged server-side, never echoed in responses, to avoid leaking implementation details.

## Known Limitations

- **Read-only LLM suggestions.** The UI shows the pattern, columns, and replacement as read-only. Users edit the prompt and regenerate to make changes. With more time I'd add inline editing of all three, since LLMs sometimes get one piece wrong out of three.
- **No third transformation.** Designed an auto-redact PII feature (LLM classifies which columns contain PII, applies appropriate redactions) but didn't ship it for time.
- **No large file support.** Currently each file is processed synchronously. A production version would push large files to a Celery worker with progress polling on the frontend.
- **Mixed-type Excel columns can fail to save.** Excel files with columns containing both numbers and strings (e.g. a salary column with one stray text value) fail pyarrow's strict type checking. Documented in code; fix is one-line (`astype(str)` on object columns) but not yet applied.
- **No automated tests.** Pytest for services and integration tests for views would be the natural next step.
- **No rate limiting or LLM call caching.** Identical descriptions hit the LLM every time.
- **ReDoS protection is heuristic.** Catches obvious nested quantifiers in regex but isn't bulletproof. A production version would sandbox the regex with a wall-clock timeout, or use `re2`.
- **Project hosted under `/root/` for speed.** A production setup would put the app under `/srv/` with proper user ownership instead of chmodding `/root/` to be traversable.
- **No file cleanup.** Uploaded and transformed files persist on disk indefinitely. Should expire after a few hours.
- **Output is always CSV** even if the original file was Excel. Would track the original format and match on download.
- **No authentication or per-user file isolation.** Single-tenant by design.
- **Column names are sent to the LLM.** Cell values never leave the server. Worth knowing for sensitive schemas.