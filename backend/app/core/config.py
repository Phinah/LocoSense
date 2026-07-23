from pydantic_settings import BaseSettings
from pydantic import ConfigDict


class Settings(BaseSettings):
    DATABASE_URL:       str = "sqlite:///./locosense.db"
    ENVIRONMENT:        str = "development"
    MODEL_PATH:         str = "./app/ml/artifacts/model.joblib"
    SCALER_PATH:        str = "./app/ml/artifacts/scaler.joblib"
    ANTHROPIC_API_KEY:  str = ""

    model_config = ConfigDict(env_file=".env", extra="ignore")


settings = Settings()