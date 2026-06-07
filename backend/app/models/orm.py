from sqlalchemy import Column, String, Float, Integer, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid

from app.db.session import Base


def _uuid():
    return str(uuid.uuid4())


class Sector(Base):
    __tablename__ = "sectors"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(100), nullable=False, unique=True)
    district = Column(String(100), nullable=False)
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    population_density = Column(Integer)
    income_proxy = Column(Float)

    records = relationship("BusinessRecord", back_populates="sector")


class BusinessRecord(Base):
    __tablename__ = "business_records"

    id = Column(String(36), primary_key=True, default=_uuid)
    name = Column(String(200), nullable=False)
    category = Column(String(100), nullable=False, default="restaurant")
    lat = Column(Float, nullable=False)
    lng = Column(Float, nullable=False)
    sector_id = Column(String(36), ForeignKey("sectors.id"), nullable=True)

    google_rating = Column(Float)
    review_count = Column(Integer, default=0)
    competitor_density = Column(Integer, default=0)
    foot_traffic_score = Column(Float, default=0.0)
    infrastructure_score = Column(Float, default=0.0)
    income_proxy = Column(Float, default=0.0)
    transit_stops_nearby = Column(Integer, default=0)
    months_operational = Column(Integer, default=0)
    label = Column(Integer, default=None)
    source = Column(String(50), default="registration")
    created_at = Column(DateTime, server_default=func.now())

    sector = relationship("Sector", back_populates="records")


class LocationQuery(Base):
    __tablename__ = "location_queries"

    id = Column(String(36), primary_key=True, default=_uuid)
    business_type = Column(String(100), nullable=False)
    target_lat = Column(Float, nullable=False)
    target_lng = Column(Float, nullable=False)
    target_sector_name = Column(String(100))
    submitted_at = Column(DateTime, server_default=func.now())

    score = relationship("SuitabilityScore", back_populates="query", uselist=False)


class SuitabilityScore(Base):
    __tablename__ = "suitability_scores"

    id = Column(String(36), primary_key=True, default=_uuid)
    query_id = Column(String(36), ForeignKey("location_queries.id"), nullable=False)
    score = Column(Float, nullable=False)
    confidence = Column(String(20))
    top_features = Column(JSON)
    model_version = Column(String(50), default="xgboost-v1")
    generated_at = Column(DateTime, server_default=func.now())

    query = relationship("LocationQuery", back_populates="score")
