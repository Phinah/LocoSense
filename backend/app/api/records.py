from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Optional
import uuid

from app.db.session import get_db
from app.schemas.schemas import BusinessRecordCreate, BusinessRecordOut
from app.models.orm import BusinessRecord

router = APIRouter()


@router.post("/records", response_model=BusinessRecordOut, status_code=201)
def create_record(payload: BusinessRecordCreate, db: Session = Depends(get_db)):
    record = BusinessRecord(id=str(uuid.uuid4()), **payload.model_dump(), source="registration")

    # Auto-label: rating >= 3.8 and operational >= 12 months = success
    if record.google_rating and record.months_operational:
        if record.google_rating >= 3.8 and record.months_operational >= 12:
            record.label = 1
        elif record.google_rating < 3.0:
            record.label = 0

    db.add(record)
    db.commit()
    db.refresh(record)
    return record


@router.get("/records", response_model=list[BusinessRecordOut])
def list_records(
    category: Optional[str] = Query(default=None),
    limit: int = Query(default=50, le=200),
    offset: int = Query(default=0),
    db: Session = Depends(get_db),
):
    q = db.query(BusinessRecord)
    if category:
        q = q.filter(BusinessRecord.category == category)
    return q.order_by(BusinessRecord.created_at.desc()).offset(offset).limit(limit).all()


@router.get("/records/stats")
def record_stats(db: Session = Depends(get_db)):
    total   = db.query(BusinessRecord).count()
    labeled = db.query(BusinessRecord).filter(BusinessRecord.label.isnot(None)).count()
    success = db.query(BusinessRecord).filter(BusinessRecord.label == 1).count()
    return {
        "total":          total,
        "labeled":        labeled,
        "successful":     success,
        "unsuccessful":   labeled - success,
        "unlabeled":      total - labeled,
        "success_rate":   round(success / labeled, 4) if labeled else 0,
    }
