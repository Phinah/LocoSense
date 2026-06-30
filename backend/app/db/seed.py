from sqlalchemy.orm import Session
from app.models.orm import Sector
import uuid

SECTORS = [
    # Kigali
    {"name": "CityCenter",  "district": "Kigali",   "province": "Kigali",   "lat": -1.9441, "lng": 30.0619, "population_density": 22000, "income_proxy": 1_100_000},
    {"name": "Kimironko",   "district": "Kigali",   "province": "Kigali",   "lat": -1.9302, "lng": 30.1074, "population_density": 12000, "income_proxy":   650_000},
    {"name": "Remera",      "district": "Kigali",   "province": "Kigali",   "lat": -1.9480, "lng": 30.1152, "population_density": 14000, "income_proxy":   850_000},
    {"name": "Nyamirambo",  "district": "Kigali",   "province": "Kigali",   "lat": -1.9820, "lng": 30.0450, "population_density": 16000, "income_proxy":   350_000},
    {"name": "Kicukiro",    "district": "Kigali",   "province": "Kigali",   "lat": -2.0100, "lng": 30.0800, "population_density": 11000, "income_proxy":   580_000},
    {"name": "Gisozi",      "district": "Kigali",   "province": "Kigali",   "lat": -1.9100, "lng": 30.0700, "population_density":  9000, "income_proxy":   500_000},
    {"name": "Kanombe",     "district": "Kigali",   "province": "Kigali",   "lat": -1.9690, "lng": 30.1380, "population_density":  8000, "income_proxy":   700_000},
    {"name": "Gikondo",     "district": "Kigali",   "province": "Kigali",   "lat": -2.0000, "lng": 30.0700, "population_density":  9000, "income_proxy":   420_000},
    {"name": "Niboye",      "district": "Kigali",   "province": "Kigali",   "lat": -2.0250, "lng": 30.0600, "population_density":  7000, "income_proxy":   480_000},
    {"name": "Kibagabaga",  "district": "Kigali",   "province": "Kigali",   "lat": -1.9200, "lng": 30.0900, "population_density":  8500, "income_proxy":   520_000},
    # Northern
    {"name": "Musanze",     "district": "Musanze",  "province": "Northern", "lat": -1.4990, "lng": 29.6340, "population_density":  6000, "income_proxy":   350_000},
    {"name": "Byumba",      "district": "Gicumbi",  "province": "Northern", "lat": -1.5760, "lng": 30.0680, "population_density":  4000, "income_proxy":   280_000},
    {"name": "Rulindo",     "district": "Rulindo",  "province": "Northern", "lat": -1.7180, "lng": 29.9350, "population_density":  3000, "income_proxy":   250_000},
    # Southern
    {"name": "Huye",        "district": "Huye",     "province": "Southern", "lat": -2.5960, "lng": 29.7390, "population_density":  5500, "income_proxy":   320_000},
    {"name": "Muhanga",     "district": "Muhanga",  "province": "Southern", "lat": -2.0820, "lng": 29.7540, "population_density":  4500, "income_proxy":   290_000},
    {"name": "Nyanza",      "district": "Nyanza",   "province": "Southern", "lat": -2.3510, "lng": 29.7440, "population_density":  3500, "income_proxy":   260_000},
    {"name": "Ruhango",     "district": "Ruhango",  "province": "Southern", "lat": -2.2180, "lng": 29.7780, "population_density":  3000, "income_proxy":   240_000},
    # Eastern
    {"name": "Rwamagana",   "district": "Rwamagana","province": "Eastern",  "lat": -1.9488, "lng": 30.4350, "population_density":  5000, "income_proxy":   320_000},
    {"name": "Nyagatare",   "district": "Nyagatare","province": "Eastern",  "lat": -1.2980, "lng": 30.3280, "population_density":  3000, "income_proxy":   270_000},
    # Western
    {"name": "Rubavu",      "district": "Rubavu",   "province": "Western",  "lat": -1.6862, "lng": 29.2539, "population_density":  7000, "income_proxy":   400_000},
    {"name": "Rusizi",      "district": "Rusizi",   "province": "Western",  "lat": -2.4798, "lng": 28.9072, "population_density":  4500, "income_proxy":   310_000},
    {"name": "Karongi",     "district": "Karongi",  "province": "Western",  "lat": -2.0660, "lng": 29.3790, "population_density":  3000, "income_proxy":   260_000},
    {"name": "Nyamasheke",  "district": "Nyamasheke","province":"Western",  "lat": -2.3140, "lng": 29.1310, "population_density":  2500, "income_proxy":   230_000},
]


def seed_sectors(db: Session):
    for s in SECTORS:
        exists = db.query(Sector).filter(Sector.name == s["name"]).first()
        if not exists:
            payload = {k: v for k, v in s.items() if k != "province"}
            db.add(Sector(id=str(uuid.uuid4()), **payload))
    db.commit()
