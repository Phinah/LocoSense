"""Tests for the /api/v1/dataset endpoints."""


class TestDataset:

    def test_stats_returns_expected_fields(self, client):
        res = client.get("/api/v1/dataset/stats")
        assert res.status_code == 200
        data = res.json()
        for field in ("total", "real_records", "synthetic_records", "success_rate", "by_sector"):
            assert field in data, f"Missing field: {field}"

    def test_total_records_above_4000(self, client):
        res = client.get("/api/v1/dataset/stats")
        assert res.json()["total"] >= 4000

    def test_list_dataset_default_limit(self, client):
        res = client.get("/api/v1/dataset")
        assert res.status_code == 200
        data = res.json()
        assert "records" in data
        assert "total" in data
        assert len(data["records"]) <= 50

    def test_sector_filter_returns_only_that_sector(self, client):
        res = client.get("/api/v1/dataset", params={"sector": "Kimironko"})
        assert res.status_code == 200
        for r in res.json()["records"]:
            assert r["sector_name"] == "Kimironko"

    def test_label_filter_successful_only(self, client):
        res = client.get("/api/v1/dataset", params={"label": 1})
        assert res.status_code == 200
        for r in res.json()["records"]:
            assert r["label"] == 1

    def test_pagination_offset_returns_different_records(self, client):
        page1 = client.get("/api/v1/dataset", params={"limit": 10, "offset": 0}).json()["records"]
        page2 = client.get("/api/v1/dataset", params={"limit": 10, "offset": 10}).json()["records"]
        ids1 = {r.get("place_id") for r in page1}
        ids2 = {r.get("place_id") for r in page2}
        assert ids1.isdisjoint(ids2), "Paginated pages should not overlap"