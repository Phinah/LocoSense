"""
Train Hunch model on synthetic Kigali restaurant data.
Synthetic data mirrors Google Places API schema and Kigali sector characteristics.
Run: python -m app.ml.train
Saves model.joblib, scaler.joblib, metrics.json to app/ml/artifacts/
"""
import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
import xgboost as xgb
import joblib

SEED = 42
ARTIFACTS_DIR = os.path.join(os.path.dirname(__file__), "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

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
    "price_level":          "Price level (0-4)",
    "years_operational":    "Years in operation",
    "is_chain":             "Chain vs independent",
    "has_photos":           "Has photo presence",
}

# Kigali sector profiles: lat/lng center, foot traffic, avg income, infra quality,
# transit access, base competition density
SECTORS = {
    "Kimironko":    {"lat": -1.9302, "lng": 30.1074, "foot_mu": 7.2, "income_mu": 650_000,  "infra_mu": 7.0, "transit_mu": 5,  "comp_mu": 12},
    "Remera":       {"lat": -1.9480, "lng": 30.1152, "foot_mu": 8.1, "income_mu": 850_000,  "infra_mu": 8.5, "transit_mu": 7,  "comp_mu": 18},
    "Kicukiro":     {"lat": -2.0100, "lng": 30.0800, "foot_mu": 6.5, "income_mu": 580_000,  "infra_mu": 7.5, "transit_mu": 4,  "comp_mu": 10},
    "Nyamirambo":   {"lat": -1.9820, "lng": 30.0450, "foot_mu": 8.8, "income_mu": 350_000,  "infra_mu": 5.5, "transit_mu": 8,  "comp_mu": 22},
    "Gisozi":       {"lat": -1.9100, "lng": 30.0700, "foot_mu": 5.5, "income_mu": 500_000,  "infra_mu": 6.5, "transit_mu": 3,  "comp_mu": 7},
    "CityCenter":   {"lat": -1.9441, "lng": 30.0619, "foot_mu": 9.5, "income_mu": 1_100_000,"infra_mu": 9.0, "transit_mu": 10, "comp_mu": 28},
    "Gikondo":      {"lat": -2.0000, "lng": 30.0700, "foot_mu": 5.8, "income_mu": 420_000,  "infra_mu": 6.0, "transit_mu": 4,  "comp_mu": 9},
    "Niboye":       {"lat": -2.0250, "lng": 30.0600, "foot_mu": 4.2, "income_mu": 480_000,  "infra_mu": 6.5, "transit_mu": 2,  "comp_mu": 5},
    "Kanombe":      {"lat": -1.9690, "lng": 30.1380, "foot_mu": 6.8, "income_mu": 700_000,  "infra_mu": 8.0, "transit_mu": 4,  "comp_mu": 8},
    "Kibagabaga":   {"lat": -1.9200, "lng": 30.0900, "foot_mu": 4.8, "income_mu": 520_000,  "infra_mu": 6.8, "transit_mu": 3,  "comp_mu": 6},
}


def generate_synthetic_data(n: int = 5000, seed: int = SEED) -> pd.DataFrame:
    """
    Generate 5,000 synthetic records mirroring Google Places API schema
    across 10 Kigali sectors. Each record represents a restaurant-type
    business with realistic sector-level distributions.

    New fields vs. v1:
      price_level       - Google Places price_level (0-4)
      years_operational - estimated from review curve
      is_chain          - chain vs independent (binary)
      has_photos        - has photo presence (binary)

    Sector-level means give the model geographic variation to learn from.
    """
    rng = np.random.default_rng(seed)
    sector_names = list(SECTORS.keys())
    rows = []

    per_sector = n // len(sector_names)
    extra = n % len(sector_names)

    for i, (sector_name, prof) in enumerate(SECTORS.items()):
        count = per_sector + (1 if i < extra else 0)

        # Location features — sector-centered with noise
        lat = rng.normal(prof["lat"], 0.008, count)
        lng = rng.normal(prof["lng"], 0.008, count)

        competitor_density   = np.clip(rng.normal(prof["comp_mu"], 4, count), 0, 35).astype(int)
        foot_traffic_score   = np.clip(rng.normal(prof["foot_mu"], 1.2, count), 0, 10).round(2)
        infrastructure_score = np.clip(rng.normal(prof["infra_mu"], 1.0, count), 1, 10).round(2)
        income_proxy         = np.clip(rng.normal(prof["income_mu"], prof["income_mu"]*0.2, count), 50_000, 1_500_000).round(0)
        transit_stops_nearby = np.clip(rng.normal(prof["transit_mu"], 2, count), 0, 15).astype(int)

        # Business-level features (Google Places schema)
        google_rating  = np.clip(rng.normal(3.9, 0.55, count), 1.0, 5.0).round(1)
        review_count   = np.clip(rng.negative_binomial(20, 0.25, count), 0, 1500).astype(int)
        price_level    = rng.choice([0, 1, 2, 3, 4], count, p=[0.05, 0.30, 0.40, 0.20, 0.05])
        years_op       = np.clip(rng.exponential(2.5, count), 0.1, 15.0).round(1)
        is_chain       = rng.binomial(1, 0.18, count)
        has_photos     = rng.binomial(1, 0.70, count)

        # Business_status influences the label: closed businesses fail
        closed_flag = rng.binomial(1, 0.12, count)  # 12% closed

        # --- Composite success score ---
        # Weights reflect real decision factors for restaurant viability in Kigali
        score = (
            0.22 * (foot_traffic_score / 10)
            + 0.18 * (infrastructure_score / 10)
            + 0.15 * (income_proxy / 1_500_000)
            + 0.12 * (transit_stops_nearby / 15)
            + 0.10 * ((google_rating - 1.0) / 4.0)
            + 0.08 * np.minimum(review_count / 200, 1.0)
            + 0.06 * np.minimum(years_op / 5, 1.0)
            + 0.04 * is_chain
            + 0.02 * has_photos
            - 0.03 * (competitor_density / 35)
            - 0.03 * (price_level / 4)  # too pricey for local markets hurts
        )

        noise = rng.normal(0, 0.07, count)
        label = ((score + noise) >= 0.45).astype(int)
        # Closed businesses override to failure
        label[closed_flag == 1] = 0

        for j in range(count):
            rows.append({
                "place_id":             f"ChIJ_synthetic_{sector_name}_{j:04d}",
                "name":                 f"Restaurant_{sector_name}_{j}",
                "sector_name":          sector_name,
                "lat":                  round(float(lat[j]), 6),
                "lng":                  round(float(lng[j]), 6),
                "business_status":      "CLOSED_PERMANENTLY" if closed_flag[j] else "OPERATIONAL",
                "competitor_density":   int(competitor_density[j]),
                "foot_traffic_score":   float(foot_traffic_score[j]),
                "infrastructure_score": float(infrastructure_score[j]),
                "income_proxy":         float(income_proxy[j]),
                "transit_stops_nearby": int(transit_stops_nearby[j]),
                "google_rating":        float(google_rating[j]),
                "review_count":         int(review_count[j]),
                "price_level":          int(price_level[j]),
                "years_operational":    float(years_op[j]),
                "is_chain":             int(is_chain[j]),
                "has_photos":           int(has_photos[j]),
                "label":                int(label[j]),
            })

    df = pd.DataFrame(rows)
    df = df.sample(frac=1, random_state=seed).reset_index(drop=True)
    return df


def benchmark_models(X_train, X_test, y_train, y_test) -> dict:
    models = {
        "random_forest": RandomForestClassifier(
            n_estimators=300, max_depth=10, min_samples_split=4,
            class_weight="balanced", random_state=SEED
        ),
        "xgboost": xgb.XGBClassifier(
            n_estimators=300, max_depth=6, learning_rate=0.08,
            scale_pos_weight=1, eval_metric="logloss",
            use_label_encoder=False, random_state=SEED
        ),
        "svm": SVC(
            kernel="rbf", C=1.0, gamma="scale",
            probability=True, class_weight="balanced", random_state=SEED
        ),
    }

    results = {}
    for name, model in models.items():
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)
        y_prob = model.predict_proba(X_test)[:, 1]
        results[name] = {
            "model":    model,
            "accuracy": round(accuracy_score(y_test, y_pred), 4),
            "f1":       round(f1_score(y_test, y_pred), 4),
            "auc_roc":  round(roc_auc_score(y_test, y_prob), 4),
        }
        print(f"  {name:20s}  acc={results[name]['accuracy']:.4f}  "
              f"f1={results[name]['f1']:.4f}  auc={results[name]['auc_roc']:.4f}")

    return results


def train():
    real_path = os.path.join(ARTIFACTS_DIR, "training_data_real.csv")
    print("Loading real Google Places data...")
    df_real = pd.read_csv(real_path)
    print(f"  {len(df_real)} real records  |  {df_real['label'].mean()*100:.1f}% positive class")

    print("Generating synthetic data to supplement...")
    df_synth = generate_synthetic_data(4000)

    df = pd.concat([df_real, df_synth], ignore_index=True).sample(frac=1, random_state=42).reset_index(drop=True)
    df.to_csv(os.path.join(ARTIFACTS_DIR, "training_data.csv"), index=False)
    print(f"  Total: {len(df)} records  |  {df['label'].mean()*100:.1f}% positive class (blended)")
    print(f"  Sectors: {df['sector_name'].value_counts().to_dict()}")

    X = df[FEATURE_COLS].values
    y = df["label"].values

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=SEED, stratify=y
    )

    scaler = StandardScaler()
    X_train_s = scaler.fit_transform(X_train)
    X_test_s  = scaler.transform(X_test)

    print("\nBenchmarking models...")
    results = benchmark_models(X_train_s, X_test_s, y_train, y_test)

    best_name = max(results, key=lambda k: results[k]["auc_roc"])
    best      = results[best_name]
    print(f"\nBest model: {best_name}  (AUC-ROC={best['auc_roc']})")

    y_pred = best["model"].predict(X_test_s)
    print("\nClassification report:")
    print(classification_report(y_test, y_pred, target_names=["unsuccessful", "successful"]))

    joblib.dump(best["model"], os.path.join(ARTIFACTS_DIR, "model.joblib"))
    joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.joblib"))

    metrics = {
        "best_model":     best_name,
        "accuracy":       best["accuracy"],
        "f1":             best["f1"],
        "auc_roc":        best["auc_roc"],
        "train_size":     len(X_train),
        "test_size":      len(X_test),
        "n_features":     len(FEATURE_COLS),
        "feature_cols":   FEATURE_COLS,
        "feature_labels": FEATURE_LABELS,
        "sectors":        list(SECTORS.keys()),
        "benchmark": {k: {m: v for m, v in res.items() if m != "model"}
                      for k, res in results.items()},
    }
    with open(os.path.join(ARTIFACTS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nArtifacts saved to {ARTIFACTS_DIR}")
    return metrics


if __name__ == "__main__":
    train()
