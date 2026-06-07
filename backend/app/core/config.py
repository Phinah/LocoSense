from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    DATABASE_URL: str = "sqlite:///./locosense.db"
    ENVIRONMENT: str = "development"
    MODEL_PATH: str = "./app/ml/artifacts/model.joblib"
    SCALER_PATH: str = "./app/ml/artifacts/scaler.joblib"

    class Config:
        env_file = ".env"


settings = Settings()
