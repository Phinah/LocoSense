from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from datetime import datetime
import uuid

from app.db.session import get_db
from app.schemas.schemas import PredictRequest, PredictResponse, FeatureExplanation
from app.models.orm import LocationQuery, SuitabilityScore
from app.ml.model import model_registry

router = APIRouter()


@router.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest, db: Session = Depends(get_db)):
    overrides = {
        "competitor_density":   request.competitor_density,
        "foot_traffic_score":   request.foot_traffic_score,
        "infrastructure_score": request.infrastructure_score,
        "income_proxy":         request.income_proxy,
        "transit_stops_nearby": request.transit_stops_nearby,
    }

    features = model_registry.get_sector_features(
        request.target_sector_name, overrides
    )

    # Fill fields not in overrides
    features.setdefault("google_rating", 3.8)
    features.setdefault("review_count", 30)

    result = model_registry.predict(features)

    query = LocationQuery(
        id=str(uuid.uuid4()),
        business_type=request.business_type,
        target_lat=request.target_lat,
        target_lng=request.target_lng,
        target_sector_name=request.target_sector_name,
    )
    db.add(query)
    db.flush()

    score_record = SuitabilityScore(
        id=str(uuid.uuid4()),
        query_id=query.id,
        score=result.score,
        confidence=result.confidence,
        top_features=result.top_features,
        model_version=result.model_version,
    )
    db.add(score_record)
    db.commit()
    db.refresh(score_record)

    return PredictResponse(
        query_id=query.id,
        score=result.score,
        confidence=result.confidence,
        verdict=result.verdict,
        top_features=[FeatureExplanation(**f) for f in result.top_features],
        sector_name=request.target_sector_name,
        model_version=result.model_version,
        generated_at=score_record.generated_at,
    )
