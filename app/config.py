from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache

class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 43200
    cookie_max_age_sec: int = 2592000
    cors_origins: str = "*"
    rate_limit_max_attempts: int = 100
    rate_limit_window_seconds: int = 60
    vapid_private_key: str = ""
    vapid_claims_email: str = "mailto:admin@example.com"
    redis_url: str = ""
    vercel: str = ""
    disable_rate_limiting: str = "0"
    disable_csrf_protection: str = "0"

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

@lru_cache
def get_settings() -> Settings:
    return Settings()
