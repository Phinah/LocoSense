from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from app.db.session import engine, Base, SessionLocal
from app.api import predict, records, sectors, health, dataset
from app.ml.model import model_registry
from app.db.seed import seed_sectors


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_sectors(db)
    finally:
        db.close()
    model_registry.load()
    yield


app = FastAPI(
    title="Hunch API",
    description="Business location recommendation system for Rwanda",
    version="2.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "https://hunch.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router,   tags=["health"])
app.include_router(predict.router,  prefix="/api/v1", tags=["predict"])
app.include_router(records.router,  prefix="/api/v1", tags=["records"])
app.include_router(sectors.router,  prefix="/api/v1", tags=["sectors"])
app.include_router(dataset.router,  prefix="/api/v1", tags=["dataset"])
