from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PredictRequest(BaseModel):
    business_type: str = Field(default="restaurant", description="Type of business")
    target_lat: float = Field(..., ge=-90, le=90)
    target_lng: float = Field(..., ge=-180, le=180)
    target_sector_name: Optional[str] = None
    competitor_density: Optional[int] = Field(default=None, ge=0)
    foot_traffic_score: Optional[float] = Field(default=None, ge=0, le=10)
    infrastructure_score: Optional[float] = Field(default=None, ge=0, le=10)
    income_proxy: Optional[float] = Field(default=None, ge=0)
    transit_stops_nearby: Optional[int] = Field(default=None, ge=0)

    class Config:
        json_schema_extra = {
            "example": {
                "business_type": "restaurant",
                "target_lat": -1.9441,
                "target_lng": 30.0619,
                "target_sector_name": "Kimironko",
            }
        }


class FeatureExplanation(BaseModel):
    feature: str
    value: float
    impact: float
    direction: str


class PredictResponse(BaseModel):
    query_id: str
    score: float = Field(..., ge=0, le=1)
    confidence: str
    verdict: str
    top_features: list[FeatureExplanation]
    sector_name: Optional[str]
    model_version: str
    generated_at: datetime


class BusinessRecordCreate(BaseModel):
    name: str
    category: str = "restaurant"
    lat: float
    lng: float
    sector_id: Optional[str] = None
    google_rating: Optional[float] = Field(default=None, ge=0, le=5)
    review_count: Optional[int] = Field(default=0, ge=0)
    competitor_density: Optional[int] = Field(default=0, ge=0)
    foot_traffic_score: Optional[float] = Field(default=0.0, ge=0, le=10)
    infrastructure_score: Optional[float] = Field(default=0.0, ge=0, le=10)
    income_proxy: Optional[float] = Field(default=0.0, ge=0)
    transit_stops_nearby: Optional[int] = Field(default=0, ge=0)
    months_operational: Optional[int] = Field(default=0, ge=0)


class BusinessRecordOut(BusinessRecordCreate):
    id: str
    label: Optional[int]
    source: str
    created_at: datetime

    class Config:
        from_attributes = True


class SectorOut(BaseModel):
    id: str
    name: str
    district: str
    lat: float
    lng: float
    population_density: Optional[int]
    income_proxy: Optional[float]

    class Config:
        from_attributes = True
