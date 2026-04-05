from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.schemas.project import ProjectCreate, ProjectResponse, ProjectUpdate
from app.services import project_service

router = APIRouter(prefix="/projects", tags=["projects"])


@router.get("", response_model=list[ProjectResponse])
def list_projects(
    include_archived: bool = False,
    db: Session = Depends(get_db),
):
    return project_service.list_projects(db, include_archived=include_archived)


@router.post("", response_model=ProjectResponse, status_code=status.HTTP_201_CREATED)
def create_project(
    data: ProjectCreate,
    db: Session = Depends(get_db),
):
    return project_service.create_project(db, data)


@router.patch("/{project_id}", response_model=ProjectResponse)
def update_project(
    project_id: int,
    data: ProjectUpdate,
    db: Session = Depends(get_db),
):
    return project_service.update_project(db, project_id, data)


@router.delete("/{project_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_project(
    project_id: int,
    db: Session = Depends(get_db),
):
    project_service.delete_project(db, project_id)
