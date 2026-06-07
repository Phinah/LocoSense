# LocoSense AI

**ML-based business location recommendation system for entrepreneurs in Kigali, Rwanda.**

> BSc Software Engineering Capstone ·
---

## Description

LocoSense AI helps first-time entrepreneurs in Kigali decide *where* to open a restaurant by scoring candidate locations on 7 data-driven indicators competitor density, foot traffic, infrastructure quality, area income level, transit accessibility, nearby review ratings, and review volume. A supervised XGBoost model (benchmarked against Random Forest and SVM) trained on 1,500 geo-referenced Kigali restaurant records produces a 0–100 suitability score with feature-level explanations.

---

## GitHub Repository

https://github.com/Phinah/LocoSense

---

## Quick start (Docker : recommended)

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

## Designs

### App screenshots
![Home Screen](images/image.png)

Landing page with hero + feature grid

![Predicting Screen](images/image-1.png)

Location input form + Leaflet map + score ring + feature chart 

![Register Business Screen](images/image-2.png)
 Register  Business data submission form 

![Dataset Screen](images/image-3.png)
Dataset stats cards + label distribution chart + records table 

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


## Video Demo

https://drive.google.com/file/d/1BvLNxo5O6k-rUK6JiQBNaqFsEEmfxupm/view?usp=sharing


