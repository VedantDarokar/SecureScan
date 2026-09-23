import os
from typing import List
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "SecureScan - Web Vulnerability Scanner & AI Remediation"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "dev_secret_key_change_in_production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 1 day

    # Database (MongoDB)
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "vuln_scanner"

    # Celery & Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"

    # OWASP ZAP
    ZAP_PROXY_URL: str = "http://localhost:8080"
    ZAP_API_KEY: str = ""

    # Gemini AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-flash-lite-latest"

    # Google Cloud Platform (GCP) OAuth
    GOOGLE_CLIENT_ID: str = ""

    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,https://secure1scan.vercel.app"

    @property
    def cors_origins_list(self) -> List[str]:
        origins = set()
        for origin in self.CORS_ORIGINS.split(","):
            cleaned = origin.strip().rstrip("/")
            if cleaned:
                origins.add(cleaned)
        return list(origins)

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True

settings = Settings()
