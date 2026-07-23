"""
Area Analysis API — queries OpenStreetMap Overpass API for landuse
composition within a Rwanda district.

GET /api/v1/area-analysis?district=Gasabo&types=construction,commercial,residential
Returns counts of each landuse type and business interpretation.
"""
import urllib.parse
import httpx
from fastapi import APIRouter, Query, HTTPException
from typing import Optional

router = APIRouter()

# Rwanda district → OSM name mapping (some differ slightly in OSM)
DISTRICT_OSM_NAMES = {
    "Gasabo":       "Gasabo",
    "Kicukiro":     "Kicukiro",
    "Nyarugenge":   "Nyarugenge",
    "Musanze":      "Musanze",
    "Gicumbi":      "Gicumbi",
    "Rulindo":      "Rulindo",
    "Burera":       "Burera",
    "Gakenke":      "Gakenke",
    "Huye":         "Huye",
    "Muhanga":      "Muhanga",
    "Nyanza":       "Nyanza",
    "Ruhango":      "Ruhango",
    "Kamonyi":      "Kamonyi",
    "Gisagara":     "Gisagara",
    "Nyamagabe":    "Nyamagabe",
    "Rwamagana":    "Rwamagana",
    "Nyagatare":    "Nyagatare",
    "Kayonza":      "Kayonza",
    "Kirehe":       "Kirehe",
    "Ngoma":        "Ngoma",
    "Bugesera":     "Bugesera",
    "Gatsibo":      "Gatsibo",
    "Rubavu":       "Rubavu",
    "Rusizi":       "Rusizi",
    "Karongi":      "Karongi",
    "Nyamasheke":   "Nyamasheke",
    "Ngororero":    "Ngororero",
    "Nyabihu":      "Nyabihu",
    "Rutsiro":      "Rutsiro",
}

# Sector → district mapping
SECTOR_TO_DISTRICT = {
    "Kimironko":  "Gasabo",    "Remera":      "Gasabo",
    "Gisozi":     "Gasabo",    "Kibagabaga":  "Gasabo",
    "Kicukiro":   "Kicukiro",  "Niboye":      "Kicukiro",
    "Kanombe":    "Kicukiro",  "Gikondo":     "Kicukiro",
    "CityCenter": "Nyarugenge","Nyamirambo":  "Nyarugenge",
    "Musanze":    "Musanze",   "Byumba":      "Gicumbi",
    "Rulindo":    "Rulindo",   "Huye":        "Huye",
    "Muhanga":    "Muhanga",   "Nyanza":      "Nyanza",
    "Ruhango":    "Ruhango",   "Rwamagana":   "Rwamagana",
    "Nyagatare":  "Nyagatare", "Rubavu":      "Rubavu",
    "Rusizi":     "Rusizi",    "Karongi":     "Karongi",
    "Nyamasheke": "Nyamasheke",
}

# All 16 landuse types present in Rwanda OSM
LANDUSE_META = {
    "residential": {
        "label":          "Residential areas",
        "icon":           "🏘️",
        "description":    "Housing zones — larger coverage means more local customer base",
        "business_signal":"positive",
        "good_for":       ["restaurant", "pharmacy", "salon", "supermarket", "school"],
    },
    "commercial": {
        "label":          "Commercial zones",
        "icon":           "🏢",
        "description":    "Business districts — foot traffic and synergy with other businesses",
        "business_signal":"positive",
        "good_for":       ["cafe", "restaurant", "retail", "gym"],
    },
    "construction": {
        "label":          "Active construction",
        "icon":           "🏗️",
        "description":    "New buildings underway — signals incoming population and future customers",
        "business_signal":"positive",
        "good_for":       ["supermarket", "pharmacy", "restaurant", "cafe"],
    },
    "retail": {
        "label":          "Retail areas",
        "icon":           "🛍️",
        "description":    "Shops and markets — good for complementary businesses, competitive for direct competitors",
        "business_signal":"neutral",
        "good_for":       ["cafe", "pharmacy", "salon"],
    },
    "industrial": {
        "label":          "Industrial zones",
        "icon":           "🏭",
        "description":    "Factories and warehouses — limited retail foot traffic but good for B2B services",
        "business_signal":"negative",
        "good_for":       ["restaurant", "supermarket"],
    },
    "education": {
        "label":          "Schools & universities",
        "icon":           "📚",
        "description":    "Educational institutions — captive student and staff market during term time",
        "business_signal":"positive",
        "good_for":       ["cafe", "restaurant", "pharmacy", "salon", "gym"],
    },
    "healthcare": {
        "label":          "Healthcare facilities",
        "icon":           "🏥",
        "description":    "Hospitals and clinics — steady patient, visitor, and staff foot traffic",
        "business_signal":"positive",
        "good_for":       ["pharmacy", "restaurant", "cafe", "supermarket"],
    },
    "religious": {
        "label":          "Religious sites",
        "icon":           "⛪",
        "description":    "Churches and mosques are extremely common in Rwanda — weekend congregation traffic peaks",
        "business_signal":"neutral",
        "good_for":       ["restaurant", "cafe", "supermarket"],
    },
    "recreation_ground": {
        "label":          "Parks & recreation",
        "icon":           "🌳",
        "description":    "Public parks, sports grounds — evening and weekend foot traffic hotspots",
        "business_signal":"positive",
        "good_for":       ["cafe", "restaurant", "gym"],
    },
    "farmland": {
        "label":          "Farmland",
        "icon":           "🌾",
        "description":    "Agricultural land — indicates low population density, limited walk-in customers",
        "business_signal":"negative",
        "good_for":       [],
    },
    "forest": {
        "label":          "Forest / woodland",
        "icon":           "🌲",
        "description":    "Forested areas — very low density, mainly eco-tourism or remote contexts",
        "business_signal":"negative",
        "good_for":       [],
    },
    "grass": {
        "label":          "Open grassland",
        "icon":           "🌿",
        "description":    "Undeveloped open land — potential future development site",
        "business_signal":"neutral",
        "good_for":       [],
    },
    "quarry": {
        "label":          "Quarry / excavation",
        "icon":           "⛏️",
        "description":    "Rwanda has many stone quarries — industrial activity, not customer-friendly",
        "business_signal":"negative",
        "good_for":       [],
    },
    "cemetery": {
        "label":          "Cemetery",
        "icon":           "🪦",
        "description":    "Burial grounds — nearby can affect customer perception for some business types",
        "business_signal":"negative",
        "good_for":       [],
    },
    "military": {
        "label":          "Military zone",
        "icon":           "🪖",
        "description":    "Military installations — restricted access areas, reduces nearby foot traffic",
        "business_signal":"negative",
        "good_for":       [],
    },
    "greenhouse_horticulture": {
        "label":          "Horticulture / greenhouses",
        "icon":           "🌱",
        "description":    "Agricultural production areas — limited retail value, found in peri-urban zones",
        "business_signal":"neutral",
        "good_for":       [],
    },
}

OVERPASS_URL = "https://overpass-api.de/api/interpreter"


async def _query_overpass(district_osm: str, landuse_types: list[str]) -> dict[str, int]:
    """
    Query OpenStreetMap Overpass API for landuse counts in a Rwanda district.
    Uses admin_level=6 boundaries which correspond to Rwanda districts.
    """
    types_filter = "|".join(landuse_types)
    query = f"""
[out:json][timeout:30];
area["name"="Rwanda"]->.country;
area["admin_level"="6"]["name"="{district_osm}"](area.country)->.district;
(
  way["landuse"~"^({types_filter})$"](area.district);
  relation["landuse"~"^({types_filter})$"](area.district);
);
out tags;
"""
    encoded_body = urllib.parse.urlencode({"data": query}).encode("utf-8")
    async with httpx.AsyncClient(timeout=35.0) as client:
        r = await client.post(
            OVERPASS_URL,
            content=encoded_body,
            headers={"Content-Type": "application/x-www-form-urlencoded"},
        )
        r.raise_for_status()
        data = r.json()

    counts: dict[str, int] = {t: 0 for t in landuse_types}
    for element in data.get("elements", []):
        lt = element.get("tags", {}).get("landuse", "")
        if lt in counts:
            counts[lt] += 1
    return counts


@router.get("/area-analysis/landuse-types")
def list_landuse_types():
    """Return all supported landuse types with metadata — used to populate the UI checklist."""
    return [
        {
            "key":            key,
            "label":          meta["label"],
            "icon":           meta["icon"],
            "description":    meta["description"],
            "business_signal":meta["business_signal"],
            "good_for":       meta["good_for"],
        }
        for key, meta in LANDUSE_META.items()
    ]


@router.get("/area-analysis/sector-to-district")
def sector_district_map():
    """Return the sector → district mapping for the frontend."""
    return SECTOR_TO_DISTRICT


@router.get("/area-analysis")
async def analyse_area(
    district: str = Query(..., description="Rwanda district name e.g. Gasabo"),
    types:    str = Query(
        default="residential,commercial,construction,education,healthcare,religious",
        description="Comma-separated landuse types to query",
    ),
    sector:   Optional[str] = Query(default=None, description="Sector name — auto-resolves district"),
):
    """
    Query OpenStreetMap for landuse composition in a Rwanda district.
    If sector is provided, district is resolved automatically.
    """
    # Resolve sector → district
    resolved_district = district
    if sector and sector in SECTOR_TO_DISTRICT:
        resolved_district = SECTOR_TO_DISTRICT[sector]

    osm_name = DISTRICT_OSM_NAMES.get(resolved_district, resolved_district)
    requested_types = [t.strip() for t in types.split(",") if t.strip() in LANDUSE_META]

    if not requested_types:
        raise HTTPException(status_code=400, detail="No valid landuse types specified.")

    try:
        counts = await _query_overpass(osm_name, requested_types)
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail="OpenStreetMap query timed out. Try fewer types or try again.")
    except Exception as e:
        raise HTTPException(status_code=502, detail=f"OpenStreetMap error: {str(e)}")

    results = []
    for ltype, count in counts.items():
        meta = LANDUSE_META[ltype]
        results.append({
            "type":           ltype,
            "label":          meta["label"],
            "icon":           meta["icon"],
            "count":          count,
            "description":    meta["description"],
            "business_signal":meta["business_signal"],
            "good_for":       meta["good_for"],
            "coverage":       "High" if count >= 20 else "Moderate" if count >= 5 else "Low" if count >= 1 else "None found",
        })

    return {
        "district":         resolved_district,
        "osm_name":         osm_name,
        "sector":           sector,
        "types_queried":    len(requested_types),
        "results":          sorted(results, key=lambda x: -x["count"]),
        "data_note":        "Data from OpenStreetMap contributors. Coverage is better in Kigali than rural areas.",
    }