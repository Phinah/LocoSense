from sqlalchemy.orm import Session
from app.models.orm import Sector
import uuid


SECTORS = [
    {"name": "Kimironko",  "district": "Gasabo",     "lat": -1.9302, "lng": 30.1074, "population_density": 12000, "income_proxy": 350000},
    {"name": "Remera",     "district": "Gasabo",     "lat": -1.9577, "lng": 30.1080, "population_density": 14000, "income_proxy": 420000},
    {"name": "Nyabugogo",  "district": "Nyarugenge", "lat": -1.9386, "lng": 30.0480, "population_density": 18000, "income_proxy": 280000},
    {"name": "Gisozi",     "district": "Gasabo",     "lat": -1.9100, "lng": 30.0800, "population_density":  9000, "income_proxy": 300000},
    {"name": "Kacyiru",    "district": "Gasabo",     "lat": -1.9320, "lng": 30.0880, "population_density": 10000, "income_proxy": 500000},
]


def seed_sectors(db: Session):
    for s in SECTORS:
        exists = db.query(Sector).filter(Sector.name == s["name"]).first()
        if not exists:
            db.add(Sector(id=str(uuid.uuid4()), **s))
    db.commit()
