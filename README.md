# Hunch 🔮

**Machine learning-based restaurant location recommendation system for Rwanda.**

> BSc Software Engineering Capstone · African Leadership University · 2026
> Phinah Mahoro

---

## 📋 Description

Hunch helps entrepreneurs across Rwanda decide *where* to open a restaurant — before signing a lease. It scores any location using **11 data-driven indicators** drawn from real Google Places data, producing a 0–100 suitability score with feature-level explanations of exactly what drove it.

**Model:** Random Forest classifier · **AUC-ROC: 82.7%** (exceeds 80% proposal target)  
**Data:** 4,470 records — 470 real (Google Places API, Rwanda-wide) + 4,000 synthetic  
**Coverage:** 23 sectors across all 5 Rwanda provinces

### Features scored
| Feature | Description |
|---|---|
| Competitor density | Restaurants within 500m |
| Foot traffic score | Nearby POI density proxy |
| Infrastructure quality | Road and access quality |
| Area income level | Purchasing power proxy (RWF) |
| Transit accessibility | Bus stops within walking distance |
| Google rating | Average nearby business rating |
| Review volume | Total Google reviews |
| Price level | 0–4 market positioning |
| Years operational | Business longevity signal |
| Chain vs independent | Brand recognition factor |
| Photo presence | Online visibility indicator |

---

## 🎥 Video Demo

▶️ **[Watch the 5-minute demo](https://drive.google.com/drive/folders/1k9Adgj7xyYVH9rPjKtASCxCKR8ymCEtu?usp=sharing)**

---

## 🌐 Deployed App

🔗 **Frontend:** [https://loco-sense-o6rw-lime.vercel.app/](https://loco-sense-o6rw-lime.vercel.app/)
🔗 **API docs:** [https://locosense.onrender.com/](https://locosense.onrender.com/)

---

## ⚙️ Installation & Setup

### Prerequisites

- Python 3.10 or higher
- Node.js 18 or higher
- Git

---

### Step 1 — Clone the repository

```bash
git clone https://github.com/Phinah/LocoSense.git
cd LocoSense
```

---

### Step 2 — Backend setup

```bash
cd backend
```

**Create and activate a virtual environment:**

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS / Linux
python -m venv venv
source venv/bin/activate
```

**Install dependencies:**

```bash
pip install -r requirements.txt
```

**Train the ML model** *(runs automatically on first startup, but you can run it manually):*

```bash
python -m app.ml.train
```

This generates `app/ml/artifacts/model.joblib`, `scaler.joblib`, and `training_data.csv`. Takes about 30 seconds.

**Start the backend server:**

```bash
uvicorn app.main:app --reload --port 8000
```

Backend is now running at:
- App: `http://localhost:8000`
- API docs (Swagger UI): `http://localhost:8000/docs`

---

### Step 3 — Frontend setup

Open a **new terminal tab** and from the project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend is now running at: `http://localhost:5173`

---

### Step 4 — Open the app

Go to **[http://localhost:5173](http://localhost:5173)** in your browser.

> **Note:** Both the backend (port 8000) and the frontend (port 5173) must be running at the same time.

---

## 📸 App Screenshots

### Home
![Home](images/image.png)

### Check a Location
![Predict](images/image-1.png)

### Register Business
![Register](images/image-2.png)

### Dataset Explorer
![Dataset](images/image-3.png)

---

## 🚀 Deployment Plan

| Layer | Service | Status |
|---|---|---|
| Frontend | Vercel | Auto-deploy from GitHub main branch |
| Backend | Render.com | Python web service, auto-deploy on push |
| Database | SQLite (file-based) | Bundled with backend |

### Deploy backend to Render

1. Push repo to GitHub
2. Go to [render.com](https://render.com) → New → **Web Service**
3. Connect your GitHub repo
4. Set **Root Directory** to `backend`
5. Set **Runtime** to `Python 3`
6. Set **Build Command** to `pip install -r requirements.txt`
7. Set **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
8. Click **Deploy**

### Deploy frontend to Vercel

1. Go to [vercel.com](https://vercel.com) → New Project → import repo
2. Set **Root Directory** to `frontend`
3. Add environment variable: `VITE_API_URL` = your Render backend URL
4. Click **Deploy**

---

## 🤖 Collecting real data with Google Places

To refresh the training data with real Rwanda restaurant records:

```bash
cd backend
python app/ml/google_places_fetcher.py --key YOUR_GOOGLE_API_KEY
```

Then retrain:

```bash
python -m app.ml.train
```

Covers 32 search centers across all Rwanda provinces. Requires a Google Places API key (free tier is sufficient).

---

## 📊 Model Performance

| Model | Accuracy | F1 | AUC-ROC |
|---|---|---|---|
| **Random Forest** ✅ | 0.737 | 0.737 | **0.827** |
| XGBoost | 0.737 | 0.739 | 0.811 |
| SVM | 0.735 | 0.735 | 0.806 |

Random Forest selected as the best model — highest AUC-ROC and most interpretable feature importance.

---

## 🔗 GitHub Repository

[https://github.com/Phinah/LocoSense](https://github.com/Phinah/LocoSense)
