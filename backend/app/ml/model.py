import os
import json
import numpy as np
import joblib
from dataclasses import dataclass

from app.core.config import settings

FEATURE_COLS = [
    "competitor_density",
    "foot_traffic_score",
    "infrastructure_score",
    "income_proxy",
    "transit_stops_nearby",
    "google_rating",
    "review_count",
    "price_level",
    "years_operational",
    "is_chain",
    "has_photos",
]

FEATURE_LABELS = {
    "competitor_density":   "Competitor density",
    "foot_traffic_score":   "Foot traffic score",
    "infrastructure_score": "Infrastructure quality",
    "income_proxy":         "Area income level (RWF)",
    "transit_stops_nearby": "Transit accessibility",
    "google_rating":        "Google rating",
    "review_count":         "Review volume",
    "price_level":          "Price level (0–4)",
    "years_operational":    "Years in operation",
    "is_chain":             "Chain vs independent",
    "has_photos":           "Has photo presence",
}

# Sector defaults for the 10 Kigali sectors Hunch models
SECTOR_DEFAULTS = {
    "Kimironko": {
        "competitor_density": 12, "foot_traffic_score": 7.2,
        "infrastructure_score": 7.0, "income_proxy": 650_000,
        "transit_stops_nearby": 5, "google_rating": 3.9,
        "review_count": 45, "price_level": 2,
        "years_operational": 2.5, "is_chain": 0, "has_photos": 1,
    },
    "Remera": {
        "competitor_density": 18, "foot_traffic_score": 8.1,
        "infrastructure_score": 8.5, "income_proxy": 850_000,
        "transit_stops_nearby": 7, "google_rating": 4.0,
        "review_count": 60, "price_level": 2,
        "years_operational": 3.0, "is_chain": 0, "has_photos": 1,
    },
    "Kicukiro": {
        "competitor_density": 10, "foot_traffic_score": 6.5,
        "infrastructure_score": 7.5, "income_proxy": 580_000,
        "transit_stops_nearby": 4, "google_rating": 3.8,
        "review_count": 35, "price_level": 1,
        "years_operational": 2.0, "is_chain": 0, "has_photos": 1,
    },
    "Nyamirambo": {
        "competitor_density": 22, "foot_traffic_score": 8.8,
        "infrastructure_score": 5.5, "income_proxy": 350_000,
        "transit_stops_nearby": 8, "google_rating": 3.7,
        "review_count": 40, "price_level": 1,
        "years_operational": 3.5, "is_chain": 0, "has_photos": 0,
    },
    "Gisozi": {
        "competitor_density": 7, "foot_traffic_score": 5.5,
        "infrastructure_score": 6.5, "income_proxy": 500_000,
        "transit_stops_nearby": 3, "google_rating": 3.8,
        "review_count": 20, "price_level": 1,
        "years_operational": 2.0, "is_chain": 0, "has_photos": 1,
    },
    "CityCenter": {
        "competitor_density": 28, "foot_traffic_score": 9.5,
        "infrastructure_score": 9.0, "income_proxy": 1_100_000,
        "transit_stops_nearby": 10, "google_rating": 4.1,
        "review_count": 120, "price_level": 3,
        "years_operational": 4.0, "is_chain": 1, "has_photos": 1,
    },
    "Gikondo": {
        "competitor_density": 9, "foot_traffic_score": 5.8,
        "infrastructure_score": 6.0, "income_proxy": 420_000,
        "transit_stops_nearby": 4, "google_rating": 3.6,
        "review_count": 18, "price_level": 1,
        "years_operational": 1.5, "is_chain": 0, "has_photos": 0,
    },
    "Niboye": {
        "competitor_density": 5, "foot_traffic_score": 4.2,
        "infrastructure_score": 6.5, "income_proxy": 480_000,
        "transit_stops_nearby": 2, "google_rating": 3.7,
        "review_count": 12, "price_level": 1,
        "years_operational": 1.5, "is_chain": 0, "has_photos": 0,
    },
    "Kanombe": {
        "competitor_density": 8, "foot_traffic_score": 6.8,
        "infrastructure_score": 8.0, "income_proxy": 700_000,
        "transit_stops_nearby": 4, "google_rating": 3.9,
        "review_count": 30, "price_level": 2,
        "years_operational": 2.5, "is_chain": 0, "has_photos": 1,
    },
    "Kibagabaga": {
        "competitor_density": 6, "foot_traffic_score": 4.8,
        "infrastructure_score": 6.8, "income_proxy": 520_000,
        "transit_stops_nearby": 3, "google_rating": 3.7,
        "review_count": 15, "price_level": 1,
        "years_operational": 1.8, "is_chain": 0, "has_photos": 0,
    },
    "default": {
        "competitor_density": 10, "foot_traffic_score": 6.0,
        "infrastructure_score": 7.0, "income_proxy": 550_000,
        "transit_stops_nearby": 5, "google_rating": 3.8,
        "review_count": 30, "price_level": 1,
        "years_operational": 2.0, "is_chain": 0, "has_photos": 1,
    },
}


@dataclass
class PredictionResult:
    score: float
    confidence: str
    verdict: str
    top_features: list[dict]
    model_version: str


class ModelRegistry:
    def __init__(self):
        self.model = None
        self.scaler = None
        self.version = "rf-v2"

    def load(self):
        artifacts = os.path.dirname(settings.MODEL_PATH)
        model_path  = settings.MODEL_PATH
        scaler_path = settings.SCALER_PATH

        if not os.path.exists(model_path):
            print("Model not found — training now...")
            from app.ml.train import train
            train()

        self.model  = joblib.load(model_path)
        self.scaler = joblib.load(scaler_path)

        metrics_path = os.path.join(artifacts, "metrics.json")
        if os.path.exists(metrics_path):
            with open(metrics_path) as f:
                m = json.load(f)
            self.version = f"{m['best_model']}-v2"

        print(f"Model loaded: {self.version}")

    def predict(self, features: dict) -> PredictionResult:
        row = np.array([[features[c] for c in FEATURE_COLS]], dtype=float)
        row_s = self.scaler.transform(row)

        prob = float(self.model.predict_proba(row_s)[0][1])
        impacts = self._compute_impacts(row_s, features)

        if prob >= 0.70:
            confidence, verdict = "high",   "Recommended"
        elif prob >= 0.45:
            confidence, verdict = "medium", "Moderate"
        else:
            confidence, verdict = "low",    "Not recommended"

        top = sorted(impacts, key=lambda x: abs(x["impact"]), reverse=True)[:5]
        return PredictionResult(
            score=round(prob, 4),
            confidence=confidence,
            verdict=verdict,
            top_features=top,
            model_version=self.version,
        )

    def _compute_impacts(self, row_s: np.ndarray, raw_features: dict) -> list[dict]:
        base_prob = float(self.model.predict_proba(row_s)[0][1])
        impacts = []
        for i, col in enumerate(FEATURE_COLS):
            perturbed = row_s.copy()
            perturbed[0, i] = 0.0
            p_prob = float(self.model.predict_proba(perturbed)[0][1])
            impact = base_prob - p_prob
            impacts.append({
                "feature":   FEATURE_LABELS.get(col, col),
                "value":     round(float(raw_features[col]), 2),
                "impact":    round(impact, 4),
                "direction": "positive" if impact >= 0 else "negative",
            })
        return impacts

    def get_sector_features(self, sector_name: str | None, overrides: dict | None) -> dict:
        base = SECTOR_DEFAULTS.get(sector_name or "", SECTOR_DEFAULTS["default"]).copy()
        if overrides:
            for k, v in overrides.items():
                if v is not None and k in FEATURE_COLS:
                    base[k] = v
        return base


model_registry = ModelRegistry()
