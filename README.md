# Hour Counter

A local-only desktop app to track working hours per project. Runs entirely on your machine — no cloud, no accounts required.

Built with Next.js, FastAPI, and Electron.

---

## Requirements

Before installing, make sure you have the following on your machine:

- **Python 3.11+** — [python.org/downloads](https://www.python.org/downloads/)  
  During installation, check **"Add Python to PATH"**
- **Node.js 18+** — [nodejs.org](https://nodejs.org/)

You can verify both are installed by opening a terminal and running:

```
python --version
node --version
```

---

## Installation

1. **Clone or download the repository**

   ```bash
   git clone https://github.com/Magalhaes24/hour-counter.git
   cd hour-counter
   ```

2. **Install Electron dependencies**

   ```bash
   cd electron
   npm install
   cd ..
   ```

That's it. The app handles the rest automatically on first launch — it creates the Python virtual environment and installs all frontend packages.

---

## Running the App

### Option A — Electron desktop app (recommended)

```bash
cd electron
npm start
```

A splash screen will appear while the app starts up. The main window opens automatically once everything is ready (usually 20–40 seconds on first run, faster on subsequent launches).

### Option B — Browser only (for development)

Open two terminals:

**Terminal 1 — Backend:**
```bash
cd backend
python -m venv .venv
.venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

- API docs: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## First Run

On first launch the app will:

1. Create a Python virtual environment under `backend/.venv/`
2. Install Python dependencies (`fastapi`, `uvicorn`, `sqlalchemy`, `openpyxl`, etc.)
3. Install frontend npm packages under `frontend/node_modules/`
4. Start the backend (port 8000) and frontend (port 3000)
5. Create the SQLite database at `backend/storage/hours_counter.db`

This process takes roughly 1–3 minutes depending on your internet speed. Subsequent launches are much faster.

---

## Features

- **Log entries** — Record time worked per project with optional start/end times and notes
- **Projects** — Create and manage projects with a name, code, and color
- **Summary** — Weekly overview with breakdowns per project; export to Excel (.xlsx)
- **Timesheet settings** — Set your name, department, employee code, and supervisor for the exported timesheet

---

## Project Structure

```
backend/               Python/FastAPI backend
  main.py              Entry point
  app/
    models/            SQLAlchemy ORM models
    schemas/           Pydantic request/response schemas
    routers/           API route handlers
    services/          Business logic
  storage/
    hours_counter.db   SQLite database (auto-created, not in git)

frontend/              Next.js frontend
  src/
    app/               Pages: /log, /projects, /summary
    components/        UI components
    lib/               API wrappers and utilities
    types/             TypeScript interfaces

electron/              Electron wrapper
  main.js              Main process — starts backend + frontend
  preload.js           Exposes window controls to renderer
  assets/              App icon (icon.ico, icon.png)
```

---

## Troubleshooting

**The app shows "Failed to start" on launch**  
Check the log files in the `logs/` folder:
- `logs/electron.log` — Electron process log
- `logs/backend.log` — Python/FastAPI server log
- `logs/frontend.log` — Next.js server log

**Python is not found**  
Make sure Python is added to your system PATH. Reinstall Python and check the "Add to PATH" option.

**Port already in use**  
The app automatically frees ports 8000 and 3000 on startup. If it still fails, manually close any processes using those ports.

**Slow first launch**  
Normal — dependencies are being downloaded. Check `logs/backend.log` and `logs/frontend.log` to monitor progress.

---

## Data

All data is stored locally in `backend/storage/hours_counter.db` (SQLite). Nothing is sent to any server. To back up your data, copy that file.
