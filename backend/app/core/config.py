import os
from typing import List, Optional
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    PROJECT_NAME: str = "Intelligent Hackathon Team Formation and Management Platform"
    TAGLINE: str = "Find the Right People. Build Stronger Teams."
    VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-production-key-change-in-prod-hackathon-2026-xyz789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    # Support both asyncpg and psycopg2/sqlite for maximum versatility
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/hackathon_platform"
    )
    
    # CORS
    BACKEND_CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://localhost:8000",
        "*"
    ]
    
    # Rate Limiting & Invitations
    INVITATION_CODE_LENGTH: int = 12
    INVITATION_DEFAULT_EXPIRY_HOURS: int = 72
    MAX_INVITATION_ATTEMPTS_PER_IP: int = 10
    
    # Matching Weights
    WEIGHT_SKILLS: float = 0.40
    WEIGHT_TIMEZONE: float = 0.25
    WEIGHT_AVAILABILITY: float = 0.20
    WEIGHT_ROLE_EXPERIENCE: float = 0.15

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()

