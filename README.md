# Regex Transformer

A web app for matching and replacing patterns in CSV / Excel files using natural language. You describe the pattern (e.g. "find email addresses"), an LLM converts it to regex, and the app applies it to your file.

Built as a portfolio project to practice Django + React.

## Status

🚧 Core feature complete. Polish and deployment in progress.

## Stack

- **Backend:** Django, Django REST Framework
- **Frontend:** React, TypeScript, Vite
- **LLM:** Groq API (`llama-3.3-70b-versatile`)

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

| Variable        | Purpose         |
| --------------- | --------------- |
| `GROQ_API_KEY`  | LLM access      |

## API Endpoints

| Method | Path            | Purpose                                          |
| ------ | --------------- | ------------------------------------------------ |
| GET    | `/api/health/`  | Health check                                     |
| POST   | `/api/upload/`  | Upload a CSV or Excel file; returns parsed preview |
| POST   | `/api/generate-regex/` | Convert a natural language description into a regex    |
| POST   | `/api/apply-regex/`           | Apply a pattern to one or more columns               |
| GET    | `/api/download/<file_id>/`    | Download the transformed file as CSV                 |

## TODO

- [x] Project scaffolding (Django + React + TS)
- [x] File upload endpoint (CSV / Excel)
- [x] Frontend file upload UI
- [x] Natural language → regex via LLM
- [x] Apply replacement to selected column
- [x] File download endpoint
- [x] Frontend integration (full upload → describe → apply → download flow)
- [x] Tailwind styling
- [ ] Backend logging
- [ ] Two extra LLM transformations
- [ ] Large file support (background processing)
- [ ] Deployment
- [ ] Demo video

## Notes / Design Decisions

- **Frontend vs backend validation.** The frontend `accept` attribute is just a UX hint. All real validation happens on the backend, which never trusts client input.
- **Regex validation.** LLM-generated regex is never trusted directly. It's compiled, length-checked, and screened for catastrophic backtracking before being returned.
- **Stateful storage.** Uploaded files are saved as Parquet on disk and identified by a UUID. CSVs are streamed back on download. Parquet for storage, CSV for transport.
- **LLM suggests, user reviews.** The LLM endpoint returns suggested columns and a suggested replacement alongside the pattern. The user reviews the suggestion before applying. Hallucinations stay visible and correctable.
- **Services layer.** Business logic (LLM calls, regex validation, regex application, file storage) lives in `api/services/` rather than inside views. Views stay thin and only handle HTTP. Easier to test and reuse from background workers later.
- **Error specificity.** Different failure modes return different HTTP status codes (400 invalid input, 404 missing file, 502 upstream LLM failure, 500 unexpected). Internal exception messages are logged server-side, never echoed in responses, to avoid leaking implementation details.

## Known Limitations

These are conscious deferrals, not oversights:

- **No request caching.** Identical descriptions hit the LLM every time. A simple in-memory cache keyed by description would cut LLM calls and cost significantly.
- **No rate limiting.** A user could spam the LLM endpoint and burn the API quota. Django REST Framework has built-in throttling that would be a 5-minute fix.
- **ReDoS protection is heuristic.** The regex validator catches obvious nested-quantifier patterns but isn't bulletproof. A production version would run the regex in a sandbox with a wall-clock timeout, or use a non-backtracking engine like Google's `re2`.
- **No authentication or per-user file isolation.** The app is single-tenant by design. Adding Django's auth + a `User` foreign key on uploaded files would be straightforward.
- **No undo / regex history.** Users can't undo a transformation or replay a previous pattern. A small UX improvement worth ~half a day.
- **No LLM eval harness.** When the prompt or model changes, there's no automated way to detect regressions in regex quality. A small set of test cases (description → expected behavior) would catch this.
- **Output is always CSV** even if the original file was Excel.
- **Replacement is const string** if user want the replacement to be difference for different cells, the function needs to be improved.