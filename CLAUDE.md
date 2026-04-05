# Hour Counter

A local-only app to track working hours per project. Runs entirely on your machine — no cloud, no accounts.

## Stack

| Layer | Tech |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind CSS |
| UI | Hand-written ShadCN-style components in `frontend/src/components/ui/` |
| Backend | FastAPI (Python), Uvicorn |
| Database | SQLite at `backend/storage/hours_counter.db` |
| ORM | SQLAlchemy 2.x (sync) |

## Running the app

```powershell
# From the project root (Windows PowerShell)
.\start.ps1
```

This opens two terminal windows (backend + frontend) and launches the browser automatically.

Or run manually:

```bash
# Backend
cd backend && python -m venv .venv && .venv/Scripts/activate && pip install -r requirements.txt && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm install && npm run dev
```

- App: http://localhost:3000
- API docs: http://localhost:8000/docs

## Project structure

```
backend/
  main.py                  # FastAPI entry point
  app/
    models/                # SQLAlchemy ORM models
    schemas/               # Pydantic v2 request/response schemas
    routers/               # API route handlers
    services/              # Business logic
  storage/
    hours_counter.db       # SQLite DB (auto-created on first run)

frontend/
  src/
    app/                   # Next.js pages (log, projects, summary)
    components/
      layout/              # Sidebar
      log/                 # QuickLogForm, EntryList, EntryRow
      projects/            # ProjectList, ProjectCard, ProjectDialog
      summary/             # StatCard, WeekGrid, ProjectBreakdown
      ui/                  # Button, Input, Select, Dialog, DropdownMenu, Badge
    lib/
      api.ts               # All typed API fetch wrappers
      utils.ts             # cn(), formatDuration(), parseDuration(), formatDate()
    types/
      index.ts             # Shared TypeScript interfaces
```

## Database schema

**`projects`** — `id, name, color, archived, created_at`  
**`log_entries`** — `id, project_id, entry_date, start_time, end_time, duration_minutes, notes, created_at`

`duration_minutes` is the canonical field — always stored. `start_time`/`end_time` are optional and stored for reference only.

## Agents

Specialized agents are in `agents/`. Use them via Claude Code:
- `frontend-engineer` — UI, Next.js pages, components
- `python-expert-engineer` — Backend logic, API endpoints
- `data-engineer-analyst` — SQL queries, report optimizations
- `senior-quality-auditor` — Code review, security audit
- `web-research-analyst` — Research tasks

## Design conventions

- Always dark mode (`dark` class on `<html>`)
- Color palette: zinc-950 bg, zinc-900 surfaces, indigo-500 accent
- No confirmation dialogs for entry deletion (instant delete)
- `QuickLogForm` is always visible on the Log page — never behind a click
- Duration input accepts: `2`, `2.5`, `2h30`, `2h 30m`, `2:30`, `90m`
