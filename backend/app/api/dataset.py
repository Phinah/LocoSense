"""
Dataset API — reads directly from the training_data.csv artifact.
"""
import math
import os
import pandas as pd
from fastapi import APIRouter, Query
from typing import Optional

ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "..", "ml", "artifacts")
CSV_PATH = os.path.join(ARTIFACTS_DIR, "training_data.csv")

router = APIRouter()
_df_cache: Optional[pd.DataFrame] = None


def _load() -> pd.DataFrame:
    global _df_cache
    if _df_cache is None:
        _df_cache = pd.read_csv(CSV_PATH)
    return _df_cache


def _safe(v):
    """Convert NaN / Inf floats to None so Python's json module doesn't choke."""
    if v is None:
        return None
    if isinstance(v, float) and (math.isnan(v) or math.isinf(v)):
        return None
    # pandas NA / NaT
    try:
        if pd.isna(v):
            return None
    except (TypeError, ValueError):
        pass
    return v


def _clean(records: list[dict]) -> list[dict]:
    return [{k: _safe(v) for k, v in row.items()} for row in records]


@router.get("/dataset/stats")
def dataset_stats():
    df = _load()
    total     = len(df)
    labeled   = int(df["label"].notna().sum())
    successful = int((df["label"] == 1).sum())

    by_sector = df["sector_name"].value_counts().to_dict()

    if "place_id" in df.columns:
        real_mask   = ~df["place_id"].astype(str).str.startswith("ChIJ_synthetic")
        real_count  = int(real_mask.sum())
        synth_count = int((~real_mask).sum())
    else:
        real_count  = 0
        synth_count = total

    return {
        "total":             total,
        "labeled":           labeled,
        "successful":        successful,
        "unsuccessful":      labeled - successful,
        "success_rate":      round(successful / labeled, 4) if labeled else 0,
        "real_records":      real_count,
        "synthetic_records": synth_count,
        "sectors_count":     len(by_sector),
        "by_sector":         by_sector,
    }


@router.get("/dataset")
def list_dataset(
    sector: Optional[str] = Query(default=None),
    label:  Optional[int] = Query(default=None),
    source: Optional[str] = Query(default=None, description="real or synthetic"),
    limit:  int = Query(default=50, le=200),
    offset: int = Query(default=0, ge=0),
):
    df = _load().copy()

    if sector:
        df = df[df["sector_name"] == sector]
    if label is not None:
        df = df[df["label"] == label]
    if source == "real" and "place_id" in df.columns:
        df = df[~df["place_id"].astype(str).str.startswith("ChIJ_synthetic")]
    elif source == "synthetic" and "place_id" in df.columns:
        df = df[df["place_id"].astype(str).str.startswith("ChIJ_synthetic")]

    total_filtered = len(df)
    page = df.iloc[offset: offset + limit]

    return {
        "total":   total_filtered,
        "offset":  offset,
        "limit":   limit,
        "records": _clean(page.to_dict(orient="records")),
    }