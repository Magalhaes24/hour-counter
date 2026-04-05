from datetime import datetime

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.models.entry import LogEntry
from app.models.project import Project
from app.schemas.entry import LogEntryCreate, LogEntryUpdate


def compute_duration(start: str, end: str) -> int:
    """Compute duration in minutes from HH:MM strings. Handles overnight entries."""
    fmt = "%H:%M"
    delta = datetime.strptime(end, fmt) - datetime.strptime(start, fmt)
    minutes = int(delta.total_seconds() / 60)
    if minutes < 0:
        minutes += 1440  # add 24 hours for overnight entries
    return minutes


def _assert_project_exists(db: Session, project_id: int) -> None:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )


def get_entry_or_404(db: Session, entry_id: int) -> LogEntry:
    entry = db.get(LogEntry, entry_id)
    if entry is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Entry {entry_id} not found.",
        )
    return entry


def list_entries(
    db: Session,
    date: str | None = None,
    project_id: int | None = None,
    from_date: str | None = None,
    to_date: str | None = None,
) -> list[LogEntry]:
    stmt = select(LogEntry)

    if from_date is not None or to_date is not None:
        if from_date is not None:
            stmt = stmt.where(LogEntry.entry_date >= from_date)
        if to_date is not None:
            stmt = stmt.where(LogEntry.entry_date <= to_date)
    elif date is not None:
        stmt = stmt.where(LogEntry.entry_date == date)

    if project_id is not None:
        stmt = stmt.where(LogEntry.project_id == project_id)

    stmt = stmt.order_by(LogEntry.entry_date.desc(), LogEntry.created_at.desc())
    return list(db.execute(stmt).scalars().all())


def create_entry(db: Session, data: LogEntryCreate) -> LogEntry:
    _assert_project_exists(db, data.project_id)

    if data.start_time is not None and data.end_time is not None:
        duration = compute_duration(data.start_time, data.end_time)
    else:
        duration = data.duration_minutes  # type: ignore[assignment]

    entry = LogEntry(
        project_id=data.project_id,
        entry_date=data.entry_date,
        start_time=data.start_time,
        end_time=data.end_time,
        duration_minutes=duration,
        notes=data.notes,
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    return entry


def update_entry(db: Session, entry_id: int, data: LogEntryUpdate) -> LogEntry:
    entry = get_entry_or_404(db, entry_id)

    if data.project_id is not None:
        _assert_project_exists(db, data.project_id)
        entry.project_id = data.project_id

    if data.entry_date is not None:
        entry.entry_date = data.entry_date

    if data.notes is not None:
        entry.notes = data.notes
    elif data.notes is None and "notes" in data.model_fields_set:
        entry.notes = None

    # Resolve start/end times — use updated values or fall back to existing
    new_start = data.start_time if "start_time" in data.model_fields_set else entry.start_time
    new_end = data.end_time if "end_time" in data.model_fields_set else entry.end_time

    entry.start_time = new_start
    entry.end_time = new_end

    # Recompute duration if both times are now set
    if new_start is not None and new_end is not None:
        entry.duration_minutes = compute_duration(new_start, new_end)
    elif data.duration_minutes is not None:
        entry.duration_minutes = data.duration_minutes

    db.commit()
    db.refresh(entry)
    return entry


def delete_entry(db: Session, entry_id: int) -> None:
    entry = get_entry_or_404(db, entry_id)
    db.delete(entry)
    db.commit()
