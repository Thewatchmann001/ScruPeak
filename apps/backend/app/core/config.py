"""
Core configuration for ScruPeak backend
Handles environment variables, database config, security settings
"""
from functools import lru_cache
from typing import Optional
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings - environment-based configuration"""
    
    # App
    APP_NAME: str = "ScruPeak Digital Property"
    APP_VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = False
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    WORKERS: int = 4
    
    # Database
    DB_TYPE: str = "sqlite"  # options: postgres, sqlite
    
    # Database - Main PostgreSQL (only used if DB_TYPE="postgres")
    DB_HOST: str = "localhost"
    DB_PORT: int = 5432
    DB_NAME: str = "scrupeak"
    DB_USER: str = "scrupeak"
    DB_PASSWORD: str = "scrupeak"
    
    # Database - Connection Pool Settings (for 20M+ users)
    DB_POOL_SIZE: int = 20  # Base connections
    DB_MAX_OVERFLOW: int = 40  # Max overflow connections
    DB_POOL_RECYCLE: int = 3600  # Recycle connections after 1 hour
    DB_POOL_PRE_PING: bool = True  # Verify connections before use
    DB_ECHO: bool = False
    
    # Redis Cache (Critical for 20M+ users)
    REDIS_HOST: str = "localhost"
    REDIS_PORT: int = 6379
    REDIS_DB: int = 0
    REDIS_PASSWORD: Optional[str] = None
    REDIS_POOL_SIZE: int = 50

    # MeiliSearch (Search Engine)
    MEILI_HOST: str = "http://localhost:7700"
    MEILI_MASTER_KEY: str = "masterKey"
    MEILI_INDEX: str = "scrupeak_land"

    # Celery (Background Tasks)
    CELERY_BROKER_URL: str = "redis://localhost:6379/0"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/0"
    
    # Security
    SECRET_KEY: str = "dev-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # JWT
    JWT_ISSUER: str = "scrupeak"
    JWT_AUDIENCE: str = "scrupeak-users"
    
    # CORS
    CORS_ORIGINS: list = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
        "http://localhost:3004",
        "http://localhost:3005",
        "http://localhost:5173",
        "http://localhost:8000",
    ]
    CORS_ALLOW_CREDENTIALS: bool = True
    CORS_ALLOW_METHODS: list = ["*"]
    CORS_ALLOW_HEADERS: list = ["*"]
    
    # Allowed Hosts (for TrustedHostMiddleware)
    ALLOWED_HOSTS: list = ["*"]
    
    # Rate Limiting (for scalability)
    RATE_LIMIT_REQUESTS: int = 1000  # requests
    RATE_LIMIT_WINDOW: int = 60  # seconds
    
    # API
    API_PREFIX: str = "/api/v1"
    API_TITLE: str = "ScruPeak API"
    
    # Pagination
    DEFAULT_PAGE_SIZE: int = 20
    MAX_PAGE_SIZE: int = 100
    
    # File Upload
    MAX_FILE_SIZE: int = 50 * 1024 * 1024  # 50MB
    ALLOWED_FILE_TYPES: list = ["pdf", "jpg", "jpeg", "png", "doc", "docx"]
    
    # Solana Blockchain
    SOLANA_RPC_URL: str = "https://api.devnet.solana.com"
    SOLANA_NETWORK: str = "devnet"
    SOLANA_WALLET_SECRET: Optional[str] = None
    BLOCKCHAIN_ENABLED: bool = False
    
    # Email (Optional)
    EMAIL_ENABLED: bool = False
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "json"
    
    # OpenAI AI (Primary Intelligence Layer)
    OPENAI_API_KEY: Optional[str] = "proj_DWGnbduxzc3M7p3AD6IAZ1iC"
    OPENAI_ENABLED: bool = True

    # DeepSeek AI (Fallback Layer)
    DEEPSEEK_API_KEY: Optional[str] = None
    DEEPSEEK_ENABLED: bool = True  # Enable if API key is provided
    
    # Monime Payments
    MONIME_API_URL: str = "https://api.monime.app"
    MONIME_ACCESS_TOKEN: Optional[str] = None
    MONIME_WEBHOOK_ID: Optional[str] = None
    MONIME_APP_URL: Optional[str] = None
    
    # Uploads
    UPLOAD_DIR: str = "uploads"
    
    # Monime Payments
    MONIME_API_URL: str = "https://api.monime.io/v1"
    MONIME_ACCESS_TOKEN: Optional[str] = None
    MONIME_SPACE_ID: Optional[str] = None
    MONIME_WEBHOOK_ID: Optional[str] = None
    MONIME_APP_URL: Optional[str] = None  # For building success/cancel URLs
    MONIME_ENABLE_RECEIPTS: bool = True
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"  # Ignore extra fields from .env


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


# Database URL builder
def get_database_url(settings: Settings) -> str:
    """
    Build database connection URL
    Supports PostgreSQL and SQLite
    """
    if settings.DB_TYPE == "sqlite":
        return f"sqlite+aiosqlite:///./{settings.DB_NAME}.db"
    
    return (
        f"postgresql+asyncpg://{settings.DB_USER}:{settings.DB_PASSWORD}"
        f"@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    )


# Redis URL builder
def get_redis_url(settings: Settings) -> str:
    """
    Build Redis connection URL
    Format: redis://[:password]@host:port/db
    """
    auth = f":{settings.REDIS_PASSWORD}@" if settings.REDIS_PASSWORD else ""
    return f"redis://{auth}{settings.REDIS_HOST}:{settings.REDIS_PORT}/{settings.REDIS_DB}"
