# Regex Transformer

A web app for matching and replacing patterns in CSV / Excel files using natural language. You describe the pattern (e.g. "find email addresses"), an LLM converts it to regex, and the app applies it to your file.

Built as a portfolio project to practice Django + React.

## Status

🚧 Work in progress.

## Stack

- **Backend:** Django, Django REST Framework
- **Frontend:** React, TypeScript, Vite
- **LLM:** Groq API

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
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

## API Endpoints

| Method | Path            | Purpose                                          |
| ------ | --------------- | ------------------------------------------------ |
| GET    | `/api/health/`  | Health check                                     |
| POST   | `/api/upload/`  | Upload a CSV or Excel file; returns parsed preview |

## TODO

- [x] Project scaffolding (Django + React + TS)
- [x] File upload endpoint (CSV / Excel)
- [ ] Frontend file upload UI
- [ ] Natural language → regex via LLM
- [ ] Apply replacement to selected column
- [ ] Display results in a table
- [ ] Two extra LLM transformations
- [ ] Large file support (background processing)
- [ ] Deployment
- [ ] Demo video