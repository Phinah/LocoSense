"""Tests for the /api/v1/sectors endpoints."""


class TestSectors:

    def test_list_sectors_returns_all_23(self, client):
        res = client.get("/api/v1/sectors")
        assert res.status_code == 200
        assert len(res.json()) == 23

    def test_grouped_sectors_returns_5_provinces(self, client):
        res = client.get("/api/v1/sectors/grouped")
        assert res.status_code == 200
        data = res.json()
        assert set(data.keys()) == {"Kigali", "Northern", "Southern", "Eastern", "Western"}

    def test_kigali_has_10_sectors(self, client):
        res = client.get("/api/v1/sectors/grouped")
        assert len(res.json()["Kigali"]) == 10

    def test_each_sector_has_required_fields(self, client):
        res = client.get("/api/v1/sectors/grouped")
        for province, sectors in res.json().items():
            for s in sectors:
                assert "name" in s
                assert "lat" in s
                assert "lng" in s
                assert "province" in s