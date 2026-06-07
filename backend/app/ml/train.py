"""
Train LocoSense AI model on synthetic Kigali restaurant data.
Run: python -m app.ml.train
Saves model.joblib and scaler.joblib to app/ml/artifacts/
"""
import os
import json
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.ensemble import RandomForestClassifier
from sklearn.svm import SVC
from sklearn.metrics import (
    accuracy_score, f1_score, roc_auc_score,
    classification_report, confusion_matrix
)
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


def generate_synthetic_data(n: int = 1500, seed: int = SEED) -> pd.DataFrame:
    """
    Generate realistic synthetic training data for Kigali restaurant businesses.
    Features are drawn from distributions reflecting real-world Kigali conditions.
    Labels are assigned using a deterministic rule with noise to simulate ground truth.
    """
    rng = np.random.default_rng(seed)

    competitor_density   = rng.integers(0, 25, n)
    foot_traffic_score   = rng.uniform(0, 10, n)
    infrastructure_score = rng.uniform(1, 10, n)
    income_proxy         = rng.uniform(50_000, 800_000, n)  # RWF/month proxy
    transit_stops_nearby = rng.integers(0, 12, n)
    google_rating        = rng.uniform(2.5, 5.0, n)
    review_count         = rng.integers(0, 300, n)

    # Deterministic success score (weighted sum)
    score = (
        0.20 * (foot_traffic_score / 10)
        + 0.18 * (infrastructure_score / 10)
        + 0.16 * (income_proxy / 800_000)
        + 0.15 * (transit_stops_nearby / 12)
        + 0.14 * ((google_rating - 2.5) / 2.5)
        + 0.10 * (review_count / 300)
        - 0.07 * (competitor_density / 25)   # more competitors = harder
    )

    # Add noise and threshold at 0.45
    noise = rng.normal(0, 0.08, n)
    label = ((score + noise) >= 0.45).astype(int)

    df = pd.DataFrame({
        "competitor_density":   competitor_density,
        "foot_traffic_score":   foot_traffic_score.round(2),
        "infrastructure_score": infrastructure_score.round(2),
        "income_proxy":         income_proxy.round(0),
        "transit_stops_nearby": transit_stops_nearby,
        "google_rating":        google_rating.round(1),
        "review_count":         review_count,
        "label":                label,
    })
    return df


def benchmark_models(X_train, X_test, y_train, y_test) -> dict:
    models = {
        "random_forest": RandomForestClassifier(
            n_estimators=200, max_depth=8, min_samples_split=4,
            class_weight="balanced", random_state=SEED
        ),
        "xgboost": xgb.XGBClassifier(
            n_estimators=200, max_depth=6, learning_rate=0.1,
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
    print("Generating synthetic training data...")
    df = generate_synthetic_data(1500)
    df.to_csv(os.path.join(ARTIFACTS_DIR, "training_data.csv"), index=False)
    print(f"  {len(df)} records  |  {df['label'].mean()*100:.1f}% positive class")

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

    # Full classification report
    y_pred = best["model"].predict(X_test_s)
    print("\nClassification report:")
    print(classification_report(y_test, y_pred, target_names=["unsuccessful", "successful"]))

    # Save artefacts
    joblib.dump(best["model"], os.path.join(ARTIFACTS_DIR, "model.joblib"))
    joblib.dump(scaler, os.path.join(ARTIFACTS_DIR, "scaler.joblib"))

    metrics = {
        "best_model":  best_name,
        "accuracy":    best["accuracy"],
        "f1":          best["f1"],
        "auc_roc":     best["auc_roc"],
        "train_size":  len(X_train),
        "test_size":   len(X_test),
        "feature_cols": FEATURE_COLS,
        "feature_labels": FEATURE_LABELS,
        "benchmark":   {k: {m: v for m, v in res.items() if m != "model"}
                        for k, res in results.items()},
    }
    with open(os.path.join(ARTIFACTS_DIR, "metrics.json"), "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"\nArtifacts saved to {ARTIFACTS_DIR}")
    return metrics


if __name__ == "__main__":
    train()
