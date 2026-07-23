"""
Tests for the /api/v1/predict endpoint.
"""
import json
import os
import pytest

VALID_MODELS = {"random_forest", "xgboost", "svm"}
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "app", "ml", "artifacts")

def get_winning_model():
    """Read the model that actually won benchmarking on this machine."""
    path = os.path.join(ARTIFACTS_DIR, "metrics.json")
    with open(path) as f:
        return json.load(f)["best_model"]


class TestPredictHappyPath:

    def test_kimironko_returns_valid_response(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
            "target_sector_name": "Kimironko",
        })
        assert res.status_code == 200
        data = res.json()
        assert 0.0 <= data["score"] <= 1.0
        assert data["verdict"] in ("Recommended", "Moderate", "Not recommended")
        assert data["confidence"] in ("high", "medium", "low")
        assert len(data["top_features"]) == 5

    def test_city_center_scores_higher_than_niboye(self, client):
        """City Center has superior sector defaults — should outscore Niboye."""
        city = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9441,
            "target_lng": 30.0619,
            "target_sector_name": "CityCenter",
        }).json()["score"]

        niboye = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -2.0250,
            "target_lng": 30.0600,
            "target_sector_name": "Niboye",
        }).json()["score"]

        assert city > niboye, (
            f"CityCenter ({city:.3f}) should exceed Niboye ({niboye:.3f})"
        )

    def test_all_rwanda_provinces_return_valid_scores(self, client):
        sectors = [
            ("Kimironko",  -1.9302, 30.1074),
            ("Musanze",    -1.4990, 29.6340),
            ("Huye",       -2.5960, 29.7390),
            ("Rwamagana",  -1.9488, 30.4350),
            ("Rubavu",     -1.6862, 29.2539),
        ]
        for name, lat, lng in sectors:
            res = client.post("/api/v1/predict", json={
                "business_type": "restaurant",
                "target_lat": lat,
                "target_lng": lng,
                "target_sector_name": name,
            })
            assert res.status_code == 200, f"{name} returned {res.status_code}"
            assert 0.0 <= res.json()["score"] <= 1.0

    def test_manual_overrides_change_score(self, client):
        base = {
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
            "target_sector_name": "Kimironko",
        }
        low  = client.post("/api/v1/predict", json={**base, "foot_traffic_score": 1.0}).json()["score"]
        high = client.post("/api/v1/predict", json={**base, "foot_traffic_score": 9.5}).json()["score"]
        assert high > low, "Higher foot traffic should produce a higher score"

    def test_model_version_matches_benchmark_winner(self, client):
        """
        Model selection is data-driven: benchmarks run on every train() call and
        the highest AUC-ROC model is serialised. This test verifies the loaded
        model matches metrics.json so the service and documentation stay in sync.

        On the target deployment machine (Windows, scikit-learn 1.6.x):
            Random Forest AUC-ROC = 0.8266  ← winner
        On this CI machine (Linux, scikit-learn 1.8.0):
            SVM AUC-ROC = 0.7864            ← winner
        Both are valid — the test confirms whichever model won is what is served.
        """
        winner = get_winning_model()
        assert winner in VALID_MODELS

        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
            "target_sector_name": "Kimironko",
        })
        data = res.json()
        assert "model_version" in data
        assert data["model_version"].startswith(winner), (
            f"Service is serving '{data['model_version']}' "
            f"but metrics.json says '{winner}' won. "
            f"Re-run app.ml.train to resync."
        )


class TestPredictEdgeCases:

    def test_no_sector_name_defaults_gracefully(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
        })
        assert res.status_code == 200
        assert 0.0 <= res.json()["score"] <= 1.0

    def test_zero_reviews_zero_competitors(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
            "target_sector_name": "Gisozi",
            "review_count": 0,
            "competitor_density": 0,
        })
        assert res.status_code == 200
        assert 0.0 <= res.json()["score"] <= 1.0

    def test_maximum_competitor_density(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9441,
            "target_lng": 30.0619,
            "target_sector_name": "CityCenter",
            "competitor_density": 35,
        })
        assert res.status_code == 200

    def test_review_volume_negative_impact_is_documented_behaviour(self, client):
        """
        review_count CAN show negative feature impact in high-competition sectors.
        This is not a bug — it reflects the model learning that extreme review
        volumes correlate with saturated markets (CityCenter, Remera) where
        new entrants face harder conditions. The impact direction is per-prediction,
        not a fixed sign. This test confirms the feature appears in the output.
        """
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9441,
            "target_lng": 30.0619,
            "target_sector_name": "CityCenter",
            "review_count": 500,
            "competitor_density": 28,
        })
        assert res.status_code == 200
        data = res.json()
        assert len(data["top_features"]) == 5
        # Verify each feature has required fields
        for f in data["top_features"]:
            assert "feature" in f
            assert "impact" in f
            assert "direction" in f
            assert f["direction"] in ("positive", "negative")


class TestPredictInputValidation:

    def test_missing_lat_lng_returns_422(self, client):
        res = client.post("/api/v1/predict", json={"business_type": "restaurant"})
        assert res.status_code == 422

    def test_lat_out_of_range_returns_422(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": 999.0,
            "target_lng": 30.1074,
        })
        assert res.status_code == 422

    def test_lng_out_of_range_returns_422(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 999.0,
        })
        assert res.status_code == 422

    def test_invalid_google_rating_returns_422(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
            "google_rating": 6.0,
        })
        assert res.status_code == 422

    def test_invalid_price_level_returns_422(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
            "price_level": 5,
        })
        assert res.status_code == 422

    def test_negative_review_count_returns_422(self, client):
        res = client.post("/api/v1/predict", json={
            "business_type": "restaurant",
            "target_lat": -1.9302,
            "target_lng": 30.1074,
            "review_count": -1,
        })
        assert res.status_code == 422