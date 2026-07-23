"""
Hunch Recommendation Engine — built from scratch using the trained Random Forest model.
No external AI API. Pure ML.

POST /api/v1/recommend
Takes: business preferences, budget, province, risk tolerance
Returns: top 3 sector recommendations with full ML scoring and reasoning
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.ml.model import model_registry, SECTOR_DEFAULTS

router = APIRouter()

# Budget → income_proxy range mapping
BUDGET_INCOME = {
    "low":    (0,       400_000),
    "medium": (300_000, 700_000),
    "high":   (600_000, 2_000_000),
}

# Risk tolerance → score threshold
RISK_THRESHOLD = {
    "low":    0.65,   # only recommend high-confidence locations
    "medium": 0.45,   # recommend moderate+ locations
    "high":   0.25,   # show all options including risky ones
}

# Business type → key features that matter most (for explanation)
BUSINESS_PRIORITIES = {
    "restaurant":  ["foot_traffic_score", "income_proxy", "competitor_density"],
    "cafe":        ["foot_traffic_score", "income_proxy", "transit_stops_nearby"],
    "pharmacy":    ["income_proxy", "competitor_density", "infrastructure_score"],
    "salon":       ["income_proxy", "foot_traffic_score", "years_operational"],
    "hotel":       ["transit_stops_nearby", "income_proxy", "foot_traffic_score"],
    "supermarket": ["competitor_density", "foot_traffic_score", "income_proxy"],
    "gym":         ["income_proxy", "infrastructure_score", "foot_traffic_score"],
    "school":      ["income_proxy", "infrastructure_score", "transit_stops_nearby"],
}

PROVINCE_SECTORS = {
    "All":      list(SECTOR_DEFAULTS.keys()),
    "Kigali":   ["CityCenter","Kimironko","Remera","Nyamirambo","Kicukiro","Gisozi","Kanombe","Gikondo","Niboye","Kibagabaga"],
    "Northern": ["Musanze","Byumba","Rulindo"],
    "Southern": ["Huye","Muhanga","Nyanza","Ruhango"],
    "Eastern":  ["Rwamagana","Nyagatare"],
    "Western":  ["Rubavu","Rusizi","Karongi","Nyamasheke"],
}


class RecommendRequest(BaseModel):
    business_types:     list[str]
    budget_range:       str = "medium"   # low / medium / high
    preferred_province: str = "All"
    risk_tolerance:     str = "medium"   # low / medium / high

    class Config:
        json_schema_extra = {
            "example": {
                "business_types":     ["restaurant", "cafe"],
                "budget_range":       "medium",
                "preferred_province": "Kigali",
                "risk_tolerance":     "medium",
            }
        }


def _explain(sector: str, biz_type: str, features: dict, score: float) -> str:
    priorities = BUSINESS_PRIORITIES.get(biz_type, [])
    parts = []
    for feat in priorities:
        val = features.get(feat, 0)
        if feat == "foot_traffic_score":
            level = "high" if val >= 7 else "moderate" if val >= 5 else "low"
            parts.append(f"{level} foot traffic ({val:.1f}/10)")
        elif feat == "income_proxy":
            parts.append(f"area income RWF {int(val/1000)}K")
        elif feat == "competitor_density":
            level = "low" if val <= 7 else "moderate" if val <= 15 else "high"
            parts.append(f"{level} competition ({int(val)} nearby)")
        elif feat == "infrastructure_score":
            parts.append(f"infrastructure {val:.1f}/10")
        elif feat == "transit_stops_nearby":
            parts.append(f"{int(val)} transit stops nearby")
    return f"Score {round(score * 100)}% — " + ", ".join(parts) if parts else f"Score {round(score * 100)}%"


@router.post("/recommend")
def recommend(req: RecommendRequest, db: Session = Depends(get_db)):
    sectors = PROVINCE_SECTORS.get(req.preferred_province, PROVINCE_SECTORS["All"])
    min_income, max_income = BUDGET_INCOME.get(req.budget_range, (0, 2_000_000))
    min_score = RISK_THRESHOLD.get(req.risk_tolerance, 0.45)

    candidates = []

    for sector in sectors:
        defaults = SECTOR_DEFAULTS.get(sector, SECTOR_DEFAULTS["default"])
        # Filter by budget (income proxy)
        if not (min_income <= defaults["income_proxy"] <= max_income):
            continue

        for biz_type in req.business_types:
            features = model_registry.get_sector_features(sector, None)
            result   = model_registry.predict(features)

            if result.score < min_score:
                continue

            candidates.append({
                "sector":       sector,
                "business_type":biz_type,
                "score":        result.score,
                "confidence":   result.confidence,
                "verdict":      result.verdict,
                "explanation":  _explain(sector, biz_type, features, result.score),
                "key_features": result.top_features[:3],
                "income_proxy": defaults["income_proxy"],
                "foot_traffic": defaults["foot_traffic_score"],
                "competition":  defaults["competitor_density"],
            })

    # Rank by score, deduplicate sector+type, return top 3
    candidates.sort(key=lambda x: -x["score"])
    seen = set()
    top3 = []
    for c in candidates:
        key = (c["sector"], c["business_type"])
        if key not in seen:
            seen.add(key)
            top3.append(c)
        if len(top3) == 3:
            break

    return {
        "recommendations":   top3,
        "total_evaluated":   len(candidates),
        "province_filter":   req.preferred_province,
        "budget_range":      req.budget_range,
        "risk_tolerance":    req.risk_tolerance,
        "model_used":        "random_forest",
    }