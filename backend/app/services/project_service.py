from sqlalchemy.orm import Session
from sqlalchemy import select, func
from fastapi import HTTPException, status

from app.models.project import Project
from app.models.entry import LogEntry
from app.schemas.project import ProjectCreate, ProjectUpdate


def list_projects(db: Session, include_archived: bool = False) -> list[Project]:
    stmt = select(Project)
    if not include_archived:
        stmt = stmt.where(Project.archived == False)  # noqa: E712
    stmt = stmt.order_by(Project.name)
    return list(db.execute(stmt).scalars().all())


def get_project_or_404(db: Session, project_id: int) -> Project:
    project = db.get(Project, project_id)
    if project is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Project {project_id} not found.",
        )
    return project


def create_project(db: Session, data: ProjectCreate) -> Project:
    existing = db.execute(
        select(Project).where(Project.name == data.name)
    ).scalar_one_or_none()
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A project named '{data.name}' already exists.",
        )
    project = Project(name=data.name, color=data.color, code=data.code, client=data.client)
    db.add(project)
    db.commit()
    db.refresh(project)
    return project


def update_project(db: Session, project_id: int, data: ProjectUpdate) -> Project:
    project = get_project_or_404(db, project_id)

    if data.name is not None and data.name != project.name:
        existing = db.execute(
            select(Project).where(Project.name == data.name)
        ).scalar_one_or_none()
        if existing is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A project named '{data.name}' already exists.",
            )
        project.name = data.name

    if data.color is not None:
        project.color = data.color

    if data.archived is not None:
        project.archived = data.archived

    if "code" in data.model_fields_set:
        project.code = data.code

    if "client" in data.model_fields_set:
        project.client = data.client

    db.commit()
    db.refresh(project)
    return project


def delete_project(db: Session, project_id: int) -> None:
    project = get_project_or_404(db, project_id)

    entry_count = db.execute(
        select(func.count()).select_from(LogEntry).where(
            LogEntry.project_id == project_id
        )
    ).scalar_one()

    if entry_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Project has entries. Archive it instead.",
        )

    db.delete(project)
    db.commit()
