"""
Hunch — Google Places API Fetcher (Rwanda-wide)
=================================================
Fetches real restaurant data across all Rwanda provinces.

Usage:
    python app/ml/google_places_fetcher.py --key YOUR_KEY             # all Rwanda
    python app/ml/google_places_fetcher.py --key YOUR_KEY --mode kigali  # Kigali only

Cost estimate:
    Kigali mode:  ~60 API calls  → well within free $200/month credit
    Rwanda mode:  ~150 API calls → still well within free credit
"""
import argparse
import json
import math
import time
import requests
import pandas as pd

# ─── Search centers ────────────────────────────────────────────────────────────
# Each entry: (display_name, lat, lng, province, radius_m)
# Radius 1000m for dense urban, 3000m for smaller towns

KIGALI_CENTERS = [
    ("Kimironko",   -1.9302, 30.1074, "Kigali", 1000),
    ("Remera",      -1.9480, 30.1152, "Kigali", 1000),
    ("Kicukiro",    -2.0100, 30.0800, "Kigali", 1000),
    ("Nyamirambo",  -1.9820, 30.0450, "Kigali", 1000),
    ("Gisozi",      -1.9100, 30.0700, "Kigali", 1000),
    ("CityCenter",  -1.9441, 30.0619, "Kigali", 1000),
    ("Gikondo",     -2.0000, 30.0700, "Kigali", 1000),
    ("Niboye",      -2.0250, 30.0600, "Kigali", 1000),
    ("Kanombe",     -1.9690, 30.1380, "Kigali", 1000),
    ("Kibagabaga",  -1.9200, 30.0900, "Kigali", 1000),
]

RWANDA_CENTERS = KIGALI_CENTERS + [
    # Northern Province
    ("Musanze",        -1.4990, 29.6340, "Northern", 3000),
    ("Byumba",         -1.5760, 30.0680, "Northern", 3000),
    ("Rulindo",        -1.7180, 29.9350, "Northern", 3000),
    ("Burera",         -1.4620, 29.8500, "Northern", 3000),

    # Southern Province
    ("Huye",           -2.5960, 29.7390, "Southern", 3000),
    ("Muhanga",        -2.0820, 29.7540, "Southern", 3000),
    ("Nyanza",         -2.3510, 29.7440, "Southern", 3000),
    ("Ruhango",        -2.2180, 29.7780, "Southern", 3000),
    ("Kamonyi",        -2.0010, 29.8760, "Southern", 3000),
    ("Gisagara",       -2.6280, 29.8230, "Southern", 3000),

    # Eastern Province
    ("Rwamagana",      -1.9488, 30.4350, "Eastern",  3000),
    ("Nyagatare",      -1.2980, 30.3280, "Eastern",  3000),
    ("Kayonza",        -1.8750, 30.6450, "Eastern",  3000),
    ("Kirehe",         -2.1400, 30.6580, "Eastern",  3000),
    ("Ngoma",          -2.1570, 30.4890, "Eastern",  3000),
    ("Bugesera",       -2.1820, 30.2540, "Eastern",  3000),

    # Western Province
    ("Rubavu",         -1.6862, 29.2539, "Western",  3000),
    ("Rusizi",         -2.4798, 28.9072, "Western",  3000),
    ("Karongi",        -2.0660, 29.3790, "Western",  3000),
    ("Nyamasheke",     -2.3140, 29.1310, "Western",  3000),
    ("Ngororero",      -1.8920, 29.5900, "Western",  3000),
    ("Rutsiro",        -1.9570, 29.3610, "Western",  3000),
]

NEARBY_URL = "https://maps.googleapis.com/maps/api/place/nearbysearch/json"


def fetch_nearby_restaurants(lat, lng, radius, api_key):
    results = []
    params = {
        "location": f"{lat},{lng}",
        "radius":   radius,
        "type":     "restaurant",
        "key":      api_key,
    }
    while True:
        r = requests.get(NEARBY_URL, params=params, timeout=10)
        data = r.json()
        status = data.get("status")
        if status not in ("OK", "ZERO_RESULTS"):
            print(f"    API status: {status} — {data.get('error_message', '')}")
            break
        results.extend(data.get("results", []))
        token = data.get("next_page_token")
        if not token:
            break
        time.sleep(2)
        params = {"pagetoken": token, "key": api_key}
    return results


def haversine_km(lat1, lng1, lat2, lng2):
    R = 6371.0
    phi1, phi2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dlmb = math.radians(lng2 - lng1)
    a = math.sin(dphi/2)**2 + math.cos(phi1)*math.cos(phi2)*math.sin(dlmb/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1-a))


def engineer_features(place, all_places, center_lat, center_lng, sector_name, province):
    lat = place["geometry"]["location"]["lat"]
    lng = place["geometry"]["location"]["lng"]

    competitor_density = sum(
        1 for p in all_places
        if p["place_id"] != place["place_id"]
        and haversine_km(lat, lng,
                         p["geometry"]["location"]["lat"],
                         p["geometry"]["location"]["lng"]) <= 0.5
    )

    nearby_types = sum(
        len(p.get("types", [])) for p in all_places
        if haversine_km(lat, lng,
                        p["geometry"]["location"]["lat"],
                        p["geometry"]["location"]["lng"]) <= 0.5
    )
    foot_traffic_score = min(nearby_types / 15.0, 10.0)

    has_rating = "rating" in place
    has_photos = int(len(place.get("photos", [])) > 0)
    infrastructure_score = min(
        6.0
        + (1.5 if has_rating else 0)
        + (1.5 if has_photos else 0)
        + (1.0 if place.get("opening_hours") else 0),
        10.0
    )

    price_level = place.get("price_level", 1)
    income_proxy = {0: 100_000, 1: 350_000, 2: 600_000, 3: 900_000, 4: 1_300_000}.get(price_level, 400_000)

    dist_from_center = haversine_km(lat, lng, center_lat, center_lng)
    transit_stops_nearby = max(0, int(8 - dist_from_center * 5))

    google_rating = place.get("rating", 3.5)
    review_count  = place.get("user_ratings_total", 0)
    is_chain      = int(any(
        chain in place.get("name", "").lower()
        for chain in ["kfc", "pizza", "subway", "chicken", "cafe amazon", "java", "burger"]
    ))
    status    = place.get("business_status", "OPERATIONAL")
    years_op  = max(0.5, review_count / 150.0)

    label = int(
        status == "OPERATIONAL"
        and google_rating >= 3.8
        and review_count >= 15
    )

    return {
        "place_id":             place["place_id"],
        "name":                 place.get("name", ""),
        "sector_name":          sector_name,
        "province":             province,
        "lat":                  round(lat, 6),
        "lng":                  round(lng, 6),
        "business_status":      status,
        "competitor_density":   competitor_density,
        "foot_traffic_score":   round(foot_traffic_score, 2),
        "infrastructure_score": round(infrastructure_score, 2),
        "income_proxy":         float(income_proxy),
        "transit_stops_nearby": transit_stops_nearby,
        "google_rating":        google_rating,
        "review_count":         review_count,
        "price_level":          price_level,
        "years_operational":    round(years_op, 1),
        "is_chain":             is_chain,
        "has_photos":           has_photos,
        "label":                label,
    }


def main(api_key, mode="rwanda", output="app/ml/artifacts/training_data_real.csv"):
    centers = KIGALI_CENTERS if mode == "kigali" else RWANDA_CENTERS
    print(f"Mode: {mode.upper()} — {len(centers)} search centers")
    print(f"Estimated API calls: ~{len(centers) * 3} (3 pages max per center)\n")

    all_rows = []
    seen_ids = set()

    for sector_name, lat, lng, province, radius in centers:
        print(f"Fetching {sector_name} ({province}, radius={radius}m)...")
        places = fetch_nearby_restaurants(lat, lng, radius, api_key)
        new_count = 0
        for p in places:
            pid = p["place_id"]
            if pid in seen_ids:
                continue
            seen_ids.add(pid)
            row = engineer_features(p, places, lat, lng, sector_name, province)
            all_rows.append(row)
            new_count += 1
        print(f"  {new_count} new unique records (total so far: {len(all_rows)})")
        time.sleep(0.5)

    df = pd.DataFrame(all_rows)
    df.to_csv(output, index=False)

    print(f"\n{'='*50}")
    print(f"Done! {len(df)} unique records → {output}")
    print(f"Positive class: {df['label'].mean()*100:.1f}%")
    print(f"\nBy province:\n{df['province'].value_counts()}")
    print(f"\nBy sector (top 15):\n{df['sector_name'].value_counts().head(15)}")
    print(f"\nNext step: retrain with blended real + synthetic data.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--key",    required=True, help="Google Places API key")
    parser.add_argument("--mode",   default="rwanda", choices=["kigali", "rwanda"],
                        help="Coverage mode (default: rwanda)")
    parser.add_argument("--output", default="app/ml/artifacts/training_data_real.csv")
    args = parser.parse_args()
    main(args.key, args.mode, args.output)