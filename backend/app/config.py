from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    DATABASE_URL: str = "postgresql://postgres:postgres@localhost:5432/ioms"
    SECRET_KEY: str = "changeme-in-production"
    ENVIRONMENT: str = "development"
    ALLOWED_ORIGINS: str = "*"

    class Config:
        env_file = ".env"


@lru_cache()
def get_settings():
    return Settings()


settings = get_settings()
