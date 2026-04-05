from app.routers.projects import router as projects_router
from app.routers.entries import router as entries_router
from app.routers.reports import router as reports_router

__all__ = ["projects_router", "entries_router", "reports_router"]
