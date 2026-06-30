# Hunch AI

**ML-based business location recommendation system for entrepreneurs in Kigali, Rwanda.**

> BSc Software Engineering Capstone ·
---
## Deployed Links

Frontend: https://loco-sense-o6rw-lime.vercel.app/
Backend: https://locosense.onrender.com



## Video Demo
https://drive.google.com/drive/folders/1k9Adgj7xyYVH9rPjKtASCxCKR8ymCEtu?usp=sharing



## Description

Hunch AI helps first-time entrepreneurs in Kigali decide *where* to open a restaurant by scoring candidate locations on 7 data-driven indicators competitor density, foot traffic, infrastructure quality, area income level, transit accessibility, nearby review ratings, and review volume. A supervised XGBoost model (benchmarked against Random Forest and SVM) trained on 1,500 geo-referenced Kigali restaurant records produces a 0–100 suitability score with feature-level explanations.

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
git clone https://github.com/Phinah/LocoSense.git

cd LocoSense

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

