from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine
from app.models import Base
from app.routers import entries_router, projects_router, reports_router
from app.routers import settings as settings_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables on startup
    Base.metadata.create_all(bind=engine)
    # Migrate existing databases: add code column if not present
    with engine.connect() as conn:
        try:
            conn.execute(text("ALTER TABLE projects ADD COLUMN code TEXT"))
            conn.commit()
        except Exception:
            pass  # column already exists
    yield


app = FastAPI(
    title="Hour Counter API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(projects_router, prefix="/api")
app.include_router(entries_router, prefix="/api")
app.include_router(reports_router, prefix="/api")
app.include_router(settings_router.router, prefix="/api")


@app.get("/")
def health_check():
    return {"status": "ok", "app": "Hour Counter"}
