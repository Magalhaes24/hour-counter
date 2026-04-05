from datetime import date as date_type
from pathlib import Path

from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.services import report_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("/summary")
def get_summary(
    date: str | None = None,
    db: Session = Depends(get_db),
):
    if date is not None:
        try:
            anchor = date_type.fromisoformat(date)
        except ValueError:
            from fastapi import HTTPException, status
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="date must be a valid ISO date string (YYYY-MM-DD).",
            )
    else:
        anchor = date_type.today()

    return report_service.get_summary(db, anchor)


@router.get("/export.csv")
def export_csv(
    from_date: str | None = None,
    to_date: str | None = None,
    project_id: int | None = None,
    db: Session = Depends(get_db),
):
    csv_content = report_service.export_csv(
        db,
        from_date=from_date,
        to_date=to_date,
        project_id=project_id,
    )

    def iter_content():
        yield csv_content

    return StreamingResponse(
        iter_content(),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=hours_export.csv"},
    )


@router.get("/export/timesheet")
def export_timesheet(
    month: str,  # YYYY-MM format
    db: Session = Depends(get_db),
):
    from fastapi import HTTPException
    import calendar
    try:
        year, mon = month.split("-")
        anchor = date_type(int(year), int(mon), 1)
    except (ValueError, AttributeError):
        raise HTTPException(status_code=422, detail="month must be YYYY-MM format")

    from app.services.report_service import generate_timesheet_xlsx

    try:
        xlsx_bytes = generate_timesheet_xlsx(db, anchor)
    except FileNotFoundError as e:
        raise HTTPException(status_code=500, detail=str(e))

    settings_path = Path(__file__).parent.parent.parent / "storage" / "settings.json"
    import json
    settings = json.loads(settings_path.read_text(encoding="utf-8")) if settings_path.exists() else {}
    emp_code = settings.get("employee_code", "000")
    filename = f"TS{emp_code}-{str(anchor.year)[2:]}{str(anchor.month).zfill(2)}.xlsx"

    def iter_bytes():
        yield xlsx_bytes

    return StreamingResponse(
        iter_bytes(),
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
