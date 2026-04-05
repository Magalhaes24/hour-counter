import json
from pathlib import Path
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/settings", tags=["settings"])

SETTINGS_FILE = Path(__file__).parent.parent.parent / "storage" / "settings.json"

class Settings(BaseModel):
    employee_name: str = "Francisco Magalhães"
    employee_code: str = "029"
    department: str = "Projeto"
    supervisor_name: str = "João Figueiras"

def _load() -> dict:
    if SETTINGS_FILE.exists():
        return json.loads(SETTINGS_FILE.read_text(encoding="utf-8"))
    return Settings().model_dump()

def _save(data: dict) -> None:
    SETTINGS_FILE.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")

@router.get("", response_model=Settings)
def get_settings():
    return _load()

@router.patch("", response_model=Settings)
def update_settings(data: Settings):
    _save(data.model_dump())
    return data
