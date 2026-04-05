from datetime import date as date_type

from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.entry import LogEntryCreate, LogEntryResponse, LogEntryUpdate
from app.services import entry_service

router = APIRouter(prefix="/entries", tags=["entries"])


@router.get("", response_model=list[LogEntryResponse])
def list_entries(
    date: str | None = None,
    project_id: int | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
    db: Session = Depends(get_db),
):
    # Default to today when no date filter is provided
    effective_date = date
    if effective_date is None and from_date is None and to_date is None:
        effective_date = date_type.today().isoformat()

    return entry_service.list_entries(
        db,
        date=effective_date,
        project_id=project_id,
        from_date=from_date,
        to_date=to_date,
    )


@router.post("", response_model=LogEntryResponse, status_code=status.HTTP_201_CREATED)
def create_entry(
    data: LogEntryCreate,
    db: Session = Depends(get_db),
):
    return entry_service.create_entry(db, data)


@router.patch("/{entry_id}", response_model=LogEntryResponse)
def update_entry(
    entry_id: int,
    data: LogEntryUpdate,
    db: Session = Depends(get_db),
):
    return entry_service.update_entry(db, entry_id, data)


@router.delete("/{entry_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_entry(
    entry_id: int,
    db: Session = Depends(get_db),
):
    entry_service.delete_entry(db, entry_id)
