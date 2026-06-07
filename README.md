# LocoSense AI

**ML-based business location recommendation system for entrepreneurs in Kigali, Rwanda.**

> MVP v0.1 · BSc Software Engineering Capstone · Africa Quantitative Sciences

---

## Description

LocoSense AI helps first-time entrepreneurs in Kigali decide *where* to open a restaurant by scoring candidate locations on 7 data-driven indicators — competitor density, foot traffic, infrastructure quality, area income level, transit accessibility, nearby review ratings, and review volume. A supervised XGBoost model (benchmarked against Random Forest and SVM) trained on 1,500 geo-referenced Kigali restaurant records produces a 0–100 suitability score with feature-level explanations.

---

## GitHub Repository

https://github.com/YOUR_USERNAME/locosense-ai

---

## Quick start (Docker — recommended)

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running
- Ports 5173, 8000, 5432 available

```bash
# 1. Clone
git clone https://github.com/YOUR_USERNAME/locosense-ai.git
cd locosense-ai

# 2. Start all services (DB + backend + frontend)
docker-compose up --build

# 3. Open the app
open http://localhost:5173        # React frontend
open http://localhost:8000/docs   # FastAPI Swagger UI
```

The backend auto-trains the model on first startup if no saved artefacts exist (~10 seconds).

---

## Manual setup (no Docker)

### Backend

```bash
cd backend

python -m venv venv
source venv/bin/activate          # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Set up local Postgres (or use the Docker DB only)
export DATABASE_URL=postgresql://locosense:locosense_dev@localhost:5432/locosense_db

# Train model
python -m app.ml.train

# Run server
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
VITE_API_URL=http://localhost:8000 npm run dev
```

---

## Environment variables

| Variable       | Default                                                              | Description        |
|----------------|----------------------------------------------------------------------|--------------------|
| `DATABASE_URL` | `postgresql://locosense:locosense_dev@localhost:5432/locosense_db`   | Postgres connection |
| `ENVIRONMENT`  | `development`                                                        | `development` / `production` |
| `VITE_API_URL` | `http://localhost:8000`                                              | Backend URL (frontend) |

---

## Project structure

```
locosense/
├── docker-compose.yml
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── app/
│       ├── main.py              # FastAPI entry point
│       ├── api/
│       │   ├── predict.py       # POST /api/v1/predict
│       │   ├── records.py       # GET/POST /api/v1/records
│       │   ├── sectors.py       # GET /api/v1/sectors
│       │   └── health.py        # GET /health
│       ├── ml/
│       │   ├── train.py         # Model training script
│       │   ├── model.py         # ModelRegistry (load + predict)
│       │   └── artifacts/       # model.joblib, scaler.joblib, metrics.json
│       ├── models/orm.py        # SQLAlchemy ORM models
│       ├── schemas/schemas.py   # Pydantic schemas
│       ├── db/session.py        # DB engine + session
│       └── core/config.py       # Settings
└── frontend/
    ├── Dockerfile
    ├── src/
    │   ├── App.jsx              # Root + nav routing
    │   ├── pages/
    │   │   ├── HomePage.jsx     # Landing page
    │   │   ├── PredictPage.jsx  # Main feature: location check
    │   │   ├── RegisterPage.jsx # Business registration form
    │   │   └── DataPage.jsx     # Dataset stats + records table
    │   ├── components/
    │   │   ├── Navbar.jsx
    │   │   ├── KigaliMap.jsx    # Leaflet map with click-to-pin
    │   │   ├── ScoreRing.jsx    # Animated SVG score gauge
    │   │   └── FeatureChart.jsx # SHAP-style impact bars
    │   └── utils/api.js         # Axios API client
```

---

## API endpoints

| Method | Endpoint                | Description                          |
|--------|-------------------------|--------------------------------------|
| GET    | `/health`               | Health check + model status          |
| POST   | `/api/v1/predict`       | Run location suitability prediction  |
| GET    | `/api/v1/records`       | List registered business records     |
| POST   | `/api/v1/records`       | Register a new business              |
| GET    | `/api/v1/records/stats` | Dataset statistics                   |
| GET    | `/api/v1/sectors`       | List Kigali sectors                  |

Full interactive documentation: `http://localhost:8000/docs`

---

## ML model

- **Algorithm**: XGBoost (benchmarked against Random Forest and SVM)
- **Features**: competitor_density, foot_traffic_score, infrastructure_score, income_proxy, transit_stops_nearby, google_rating, review_count
- **Labels**: 1 = successful (rating ≥ 3.8 + ≥ 12 months operational), 0 = unsuccessful
- **Training data**: 1,500 synthetic records drawn from realistic Kigali distributions
- **Target metric**: AUC-ROC ≥ 0.80
- **Explainability**: marginal impact scoring per feature (SHAP-compatible approach)

Training artefacts stored in `backend/app/ml/artifacts/`:
- `model.joblib` — trained classifier
- `scaler.joblib` — StandardScaler
- `metrics.json` — benchmark results across all three algorithms
- `training_data.csv` — generated training dataset

---

## Designs

### Wireframes + mockups
See `/docs/wireframes/` (Figma link: [add your Figma URL here])

### App screenshots
| Screen | Description |
|--------|-------------|
| Home   | Landing page with hero + feature grid |
| Predict | Location input form + Leaflet map + score ring + feature chart |
| Register | Business data submission form |
| Data | Dataset stats cards + label distribution chart + records table |

---

## Deployment plan

| Layer    | Service         | Notes                                        |
|----------|-----------------|----------------------------------------------|
| Frontend | Vercel          | `npm run build` → auto-deploy on push to main |
| Backend  | Render.com      | Docker container, auto-deploy on push        |
| Database | Railway (MySQL) or Render Postgres | Managed PostgreSQL   |
| CI/CD    | GitHub Actions  | Lint + test on PR, deploy on merge to main   |

### Production deploy (Render)

1. Push repo to GitHub
2. Create new Web Service on Render → Docker → point to `/backend`
3. Set `DATABASE_URL` environment variable
4. Create Render Postgres instance, copy connection string
5. On Vercel: import repo, set `VITE_API_URL` to Render backend URL

---

## Video demo

[5–10 min demo link — add after recording]

Focus areas for the demo:
1. Home page overview
2. Selecting a sector + clicking map to pin a location
3. Running analysis and interpreting the score ring + feature chart
4. Switching sectors and comparing scores
5. Registering a business
6. Dataset page — live stats and records table
7. FastAPI Swagger UI — showing the `/predict` endpoint directly
