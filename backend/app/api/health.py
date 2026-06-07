from fastapi import APIRouter
from app.ml.model import model_registry

router = APIRouter()


@router.get("/health")
def health():
    return {
        "status": "ok",
        "model_loaded": model_registry.model is not None,
        "model_version": model_registry.version,
    }
