"""
Database setup with connection pooling and optimization for 20M+ users
"""
from typing import AsyncGenerator
from sqlalchemy import event, MetaData, create_engine
from sqlalchemy.ext.asyncio import (
    create_async_engine,
    AsyncSession,
    async_sessionmaker,
)
from sqlalchemy.pool import NullPool, QueuePool, AsyncAdaptedQueuePool
from sqlalchemy.orm import declarative_base
import logging
import sqlite3

from app.core.config import get_settings, get_database_url, get_redis_url

logger = logging.getLogger(__name__)
settings = get_settings()

# SQLAlchemy Base for ORM models
Base = declarative_base()

# Database engine with optimized connection pooling for scale
engine = create_async_engine(
    get_database_url(settings),
    echo=settings.DB_ECHO,
    future=True,
    # Connection pool optimized for 20M+ users - use AsyncAdaptedQueuePool for async
    poolclass=AsyncAdaptedQueuePool,
    pool_size=settings.DB_POOL_SIZE,  # 20 connections
    max_overflow=settings.DB_MAX_OVERFLOW,  # 40 overflow
    pool_recycle=settings.DB_POOL_RECYCLE,  # Recycle after 1 hour
    pool_pre_ping=settings.DB_POOL_PRE_PING,  # Test connections
    # Additional optimizations
    connect_args={
        "timeout": 30,
        **({"server_settings": {
            "application_name": "landbiznes_backend",
            "jit": "off",
        }} if settings.DB_TYPE == "postgres" else {"check_same_thread": False} if settings.DB_TYPE == "sqlite" else {})
    }
)

@event.listens_for(engine.sync_engine, "connect")
def connect(dbapi_connection, connection_record):
    if isinstance(dbapi_connection, sqlite3.Connection):
        try:
            dbapi_connection.enable_load_extension(True)
            # Try to load spatialite if available
            dbapi_connection.load_extension("mod_spatialite")
        except Exception as e:
            logger.warning(f"Could not load mod_spatialite: {e}")
            # Define mock functions to prevent crashes on Windows/Mac without spatialite
            # This allows the app to run but spatial queries will fail or be limited
            def CheckSpatialIndex(*args):
                return 0
            
            def RecoverGeometryColumn(*args):
                return 0
            
            def DiscardGeometryColumn(*args):
                return 0
                
            dbapi_connection.create_function("CheckSpatialIndex", 2, CheckSpatialIndex)
            dbapi_connection.create_function("RecoverGeometryColumn", 4, RecoverGeometryColumn)
            dbapi_connection.create_function("DiscardGeometryColumn", 4, DiscardGeometryColumn)

# Session factory for creating database sessions
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Dependency for getting database session
    Usage: async def handler(db: AsyncSession = Depends(get_db))
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            await session.rollback()
            logger.error(f"Database session error: {e}")
            raise
        finally:
            await session.close()


async def init_db():
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        logger.info("[OK] Database tables created")


async def close_db():
    """Close database connections"""
    await engine.dispose()
    logger.info("[OK] Database connections closed")


# Redis Connection Pool (for caching and rate limiting)
class RedisPool:
    """Manages Redis connection pool for cache operations"""
    
    _pool = None
    
    @classmethod
    async def init(cls):
        """Initialize Redis connection pool"""
        import redis.asyncio as redis
        
        cls._pool = await redis.from_url(
            get_redis_url(settings),
            encoding="utf8",
            decode_responses=True,
            max_connections=settings.REDIS_POOL_SIZE,
        )
        logger.info("[OK] Redis connection pool initialized")
    
    @classmethod
    async def get(cls):
        """Get Redis connection from pool"""
        if cls._pool is None:
            await cls.init()
        return cls._pool
    
    @classmethod
    async def close(cls):
        """Close Redis connection pool"""
        if cls._pool:
            await cls._pool.close()
            logger.info("[OK] Redis connection pool closed")


# Database indexes for common queries (improves performance at scale)
INDEXES_TO_CREATE = [
    # User indexes
    "CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)",
    "CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)",
    "CREATE INDEX IF NOT EXISTS idx_users_kyc_verified ON users(kyc_verified)",
    
    # Land indexes
    "CREATE INDEX IF NOT EXISTS idx_land_owner_id ON land(owner_id)",
    "CREATE INDEX IF NOT EXISTS idx_land_status ON land(status)",
    "CREATE INDEX IF NOT EXISTS idx_land_created_at ON land(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_land_location ON land USING GIST(location)",
    
    # Document indexes
    "CREATE INDEX IF NOT EXISTS idx_documents_land_id ON documents(land_id)",
    "CREATE INDEX IF NOT EXISTS idx_documents_verified_at ON documents(verified_at)",
    
    # Escrow indexes
    "CREATE INDEX IF NOT EXISTS idx_escrow_land_id ON escrow(land_id)",
    "CREATE INDEX IF NOT EXISTS idx_escrow_buyer_id ON escrow(buyer_id)",
    "CREATE INDEX IF NOT EXISTS idx_escrow_status ON escrow(status)",
    
    # Chat indexes
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_chat_id ON chat_messages(chat_id)",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at)",
    "CREATE INDEX IF NOT EXISTS idx_chat_messages_fraud_alert ON chat_messages(fraud_alert)",
    
    # Audit indexes
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id)",
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)",
    "CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at)",
]
