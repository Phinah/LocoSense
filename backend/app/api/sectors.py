from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.schemas import SectorOut
from app.models.orm import Sector

router = APIRouter()


@router.get("/sectors", response_model=list[SectorOut])
def list_sectors(db: Session = Depends(get_db)):
    return db.query(Sector).all()
