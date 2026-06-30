from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class PredictRequest(BaseModel):
    business_type: str = Field(default="restaurant", description="Type of business")
    target_lat: float = Field(..., ge=-90, le=90)
    target_lng: float = Field(..., ge=-180, le=180)
    target_sector_name: Optional[str] = None
    # Optional overrides — if omitted, sector defaults are used
    competitor_density:   Optional[int]   = Field(default=None, ge=0)
    foot_traffic_score:   Optional[float] = Field(default=None, ge=0, le=10)
    infrastructure_score: Optional[float] = Field(default=None, ge=0, le=10)
    income_proxy:         Optional[float] = Field(default=None, ge=0)
    transit_stops_nearby: Optional[int]   = Field(default=None, ge=0)
    google_rating:        Optional[float] = Field(default=None, ge=1.0, le=5.0)
    review_count:         Optional[int]   = Field(default=None, ge=0)
    price_level:          Optional[int]   = Field(default=None, ge=0, le=4)
    years_operational:    Optional[float] = Field(default=None, ge=0)
    is_chain:             Optional[int]   = Field(default=None, ge=0, le=1)
    has_photos:           Optional[int]   = Field(default=None, ge=0, le=1)

    class Config:
        json_schema_extra = {
            "example": {
                "business_type":      "restaurant",
                "target_lat":         -1.9302,
                "target_lng":         30.1074,
                "target_sector_name": "Kimironko",
                "google_rating":      4.1,
                "review_count":       55,
            }
        }


class FeatureExplanation(BaseModel):
    feature:   str
    value:     float
    impact:    float
    direction: str


class PredictResponse(BaseModel):
    query_id:      str
    score:         float = Field(..., ge=0, le=1)
    confidence:    str
    verdict:       str
    top_features:  list[FeatureExplanation]
    sector_name:   Optional[str]
    model_version: str
    generated_at:  datetime


class BusinessRecordCreate(BaseModel):
    name:                 str
    category:             str = "restaurant"
    lat:                  float
    lng:                  float
    sector_id:            Optional[str]   = None
    google_rating:        Optional[float] = Field(default=None, ge=0, le=5)
    review_count:         Optional[int]   = Field(default=0, ge=0)
    competitor_density:   Optional[int]   = Field(default=0, ge=0)
    foot_traffic_score:   Optional[float] = Field(default=0.0, ge=0, le=10)
    infrastructure_score: Optional[float] = Field(default=0.0, ge=0, le=10)
    income_proxy:         Optional[float] = Field(default=0.0, ge=0)
    transit_stops_nearby: Optional[int]   = Field(default=0, ge=0)
    months_operational:   Optional[int]   = Field(default=0, ge=0)


class BusinessRecordOut(BusinessRecordCreate):
    id:         str
    label:      Optional[int]
    source:     str
    created_at: datetime

    class Config:
        from_attributes = True


class SectorOut(BaseModel):
    id:                 str
    name:               str
    district:           str
    lat:                float
    lng:                float
    population_density: Optional[int]
    income_proxy:       Optional[float]

    class Config:
        from_attributes = True
