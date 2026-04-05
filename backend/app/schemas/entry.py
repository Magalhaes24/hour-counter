from datetime import datetime

from pydantic import BaseModel, Field, model_validator


class LogEntryCreate(BaseModel):
    project_id: int
    entry_date: str = Field(..., pattern=r"^\d{4}-\d{2}-\d{2}$")
    duration_minutes: int | None = Field(default=None, ge=0)
    start_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    notes: str | None = None

    @model_validator(mode="after")
    def validate_duration_or_times(self) -> "LogEntryCreate":
        has_both_times = self.start_time is not None and self.end_time is not None
        has_duration = self.duration_minutes is not None
        if not has_both_times and not has_duration:
            raise ValueError(
                "Either duration_minutes or both start_time and end_time must be provided."
            )
        return self


class LogEntryUpdate(BaseModel):
    project_id: int | None = None
    entry_date: str | None = Field(default=None, pattern=r"^\d{4}-\d{2}-\d{2}$")
    duration_minutes: int | None = Field(default=None, ge=0)
    start_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    end_time: str | None = Field(default=None, pattern=r"^\d{2}:\d{2}$")
    notes: str | None = None


class LogEntryResponse(BaseModel):
    id: int
    project_id: int
    entry_date: str
    start_time: str | None
    end_time: str | None
    duration_minutes: int
    notes: str | None
    created_at: datetime

    model_config = {"from_attributes": True}
