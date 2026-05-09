# Regex Transformer

A web app for matching and replacing patterns in CSV / Excel files using natural language. You describe the pattern (e.g. "find email addresses"), an LLM converts it to regex, and the app applies it to your file.

Built as a portfolio project to practice Django + React.

## Status

🚧 Work in progress.

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
- [ ] Frontend integration (pattern input, replacement UI, download button)
- [ ] Two extra LLM transformations
- [ ] Large file support (background processing)
- [ ] Deployment
- [ ] Demo video

## Known Limitations

These are conscious deferrals, not oversights:

- **No request caching.** Identical descriptions hit the LLM every time. A simple in-memory cache (or Django's cache framework) keyed by description would cut LLM calls and cost significantly.
- **No rate limiting.** A user could spam the LLM endpoint and burn the API quota. Django REST Framework has built-in throttling that would be a 5-minute fix.
- **ReDoS protection is heuristic.** The regex validator catches obvious nested-quantifier patterns but isn't bulletproof. A production version would run the regex in a sandbox with a wall-clock timeout, or use a non-backtracking engine like Google's `re2`.
- **No authentication or per-user file isolation.** The app is single-tenant by design. Adding Django's auth + a `User` foreign key on uploaded files would be straightforward.
- **No undo / regex history.** Users can't undo a transformation or replay a previous pattern. A small UX improvement worth ~half a day.
- **Stateless replacement endpoint inefficient at scale.** See "Notes / Design Decisions" above. Phase 7 addresses this.
- **No LLM eval harness.** When the prompt or model changes, there's no automated way to detect regressions in regex quality. A small set of test cases (description → expected behavior) would catch this.
- **Output is always CSV** even if the original file was Excel.