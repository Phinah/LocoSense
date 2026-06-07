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
]

FEATURE_LABELS = {
    "competitor_density":    "Competitor density",
    "foot_traffic_score":    "Foot traffic score",
    "infrastructure_score":  "Infrastructure quality",
    "income_proxy":          "Area income level",
    "transit_stops_nearby":  "Transit accessibility",
    "google_rating":         "Avg. nearby rating",
    "review_count":          "Review volume",
}

# Sensible defaults for Kimironko/Remera if user provides no overrides
SECTOR_DEFAULTS = {
    "Kimironko": {
        "competitor_density": 8, "foot_traffic_score": 7.2,
        "infrastructure_score": 7.5, "income_proxy": 350_000,
        "transit_stops_nearby": 6, "google_rating": 3.9, "review_count": 45,
    },
    "Remera": {
        "competitor_density": 10, "foot_traffic_score": 7.8,
        "infrastructure_score": 8.0, "income_proxy": 420_000,
        "transit_stops_nearby": 8, "google_rating": 4.0, "review_count": 60,
    },
    "Nyabugogo": {
        "competitor_density": 15, "foot_traffic_score": 8.5,
        "infrastructure_score": 6.0, "income_proxy": 280_000,
        "transit_stops_nearby": 10, "google_rating": 3.5, "review_count": 30,
    },
    "Gisozi": {
        "competitor_density": 5, "foot_traffic_score": 5.5,
        "infrastructure_score": 7.0, "income_proxy": 300_000,
        "transit_stops_nearby": 4, "google_rating": 3.8, "review_count": 20,
    },
    "Kacyiru": {
        "competitor_density": 7, "foot_traffic_score": 6.8,
        "infrastructure_score": 8.5, "income_proxy": 500_000,
        "transit_stops_nearby": 5, "google_rating": 4.1, "review_count": 55,
    },
    "default": {
        "competitor_density": 7, "foot_traffic_score": 6.0,
        "infrastructure_score": 6.5, "income_proxy": 300_000,
        "transit_stops_nearby": 5, "google_rating": 3.8, "review_count": 35,
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
        self.version = "xgboost-v1"

    def load(self):
        artifacts = os.path.dirname(settings.MODEL_PATH)
        model_path  = settings.MODEL_PATH
        scaler_path = settings.SCALER_PATH

        # Auto-train if artifacts don't exist
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
            self.version = f"{m['best_model']}-v1"

        print(f"Model loaded: {self.version}")

    def predict(self, features: dict) -> PredictionResult:
        row = np.array([[features[c] for c in FEATURE_COLS]], dtype=float)
        row_s = self.scaler.transform(row)

        prob = float(self.model.predict_proba(row_s)[0][1])

        # Compute SHAP-style feature impacts using tree leaf values
        impacts = self._compute_impacts(row_s, features)

        if prob >= 0.70:
            confidence, verdict = "high",   "Recommended"
        elif prob >= 0.45:
            confidence, verdict = "medium", "Moderate"
        else:
            confidence, verdict = "low",    "Not recommended"

        top = sorted(impacts, key=lambda x: abs(x["impact"]), reverse=True)[:4]
        return PredictionResult(
            score=round(prob, 4),
            confidence=confidence,
            verdict=verdict,
            top_features=top,
            model_version=self.version,
        )

    def _compute_impacts(self, row_s: np.ndarray, raw_features: dict) -> list[dict]:
        """Approximate feature impact via marginal prediction change."""
        base_prob = float(self.model.predict_proba(row_s)[0][1])
        impacts = []

        for i, col in enumerate(FEATURE_COLS):
            perturbed = row_s.copy()
            perturbed[0, i] = 0.0  # zero out (mean-baseline perturbation)
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
                if v is not None and k in base:
                    base[k] = v
        return base


model_registry = ModelRegistry()
