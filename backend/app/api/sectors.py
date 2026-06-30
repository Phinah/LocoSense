from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.schemas.schemas import SectorOut
from app.models.orm import Sector
from app.db.seed import SECTORS as SECTOR_DATA

router = APIRouter()

# Province lookup built from seed data
PROVINCE_MAP = {s["name"]: s.get("province", "Kigali") for s in SECTOR_DATA}


@router.get("/sectors", response_model=list[SectorOut])
def list_sectors(db: Session = Depends(get_db)):
    return db.query(Sector).order_by(Sector.district, Sector.name).all()


@router.get("/sectors/grouped")
def list_sectors_grouped(db: Session = Depends(get_db)):
    """
    Returns sectors grouped by province — used by the frontend dropdown.
    Shape: { province: [ { name, lat, lng, district, income_proxy } ] }
    """
    sectors = db.query(Sector).order_by(Sector.name).all()
    grouped: dict[str, list] = {}

    for s in sectors:
        province = PROVINCE_MAP.get(s.name, "Kigali")
        grouped.setdefault(province, [])
        grouped[province].append({
            "name":         s.name,
            "district":     s.district,
            "province":     province,
            "lat":          s.lat,
            "lng":          s.lng,
            "income_proxy": s.income_proxy,
        })

    # Sort provinces in a meaningful order
    order = ["Kigali", "Northern", "Southern", "Eastern", "Western"]
    return {p: grouped[p] for p in order if p in grouped}
