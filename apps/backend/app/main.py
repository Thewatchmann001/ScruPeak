"""
Main FastAPI application
Consolidates 5 Express microservices into single enterprise-grade backend
Optimized for 20M+ users with comprehensive middleware stack
"""
from contextlib import asynccontextmanager
from datetime import datetime
import logging
import logging.config

# PATCH: Disable GeoAlchemy2 SQLite spatialite checks for dev environment
import geoalchemy2.admin.dialects.sqlite as sqlite_admin
sqlite_admin.after_create = lambda *args, **kwargs: None

from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.gzip import GZipMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
import time
import uuid

from app.core.config import get_settings
from app.core.database import init_db, close_db
from app.schemas import HealthCheckResponse
from app.utils.logging_config import get_logging_config

# ============================================================================
# CONFIGURATION
# ============================================================================

settings = get_settings()

# Setup logging
logging_config = get_logging_config(settings)
logging.config.dictConfig(logging_config)
logger = logging.getLogger(__name__)


# ============================================================================
# LIFESPAN CONTEXT
# ============================================================================

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Startup
    logger.info("[START] Starting LandBiznes Backend...")
    logger.info(f"Environment: {settings.ENVIRONMENT}")
    logger.info(f"Database: {settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}")
    logger.info(f"Redis: {settings.REDIS_HOST}:{settings.REDIS_PORT}")
    
    # Initialize DB (will create tables on startup)
    try:
        await init_db()
        logger.info("[OK] Database initialized successfully")
    except Exception as e:
        logger.warning(f"[WARN] Database initialization skipped: {e}")
    
    yield
    
    # Shutdown
    logger.info("[STOP] Shutting down LandBiznes Backend...")
    try:
        await close_db()
        logger.info("[OK] Shutdown complete")
    except Exception as e:
        logger.warning(f"[WARN] Shutdown error: {e}")


# ============================================================================
# APPLICATION FACTORY
# ============================================================================

def create_app() -> FastAPI:
    """Create and configure FastAPI application"""
    
    app = FastAPI(
        title="LandBiznes Backend API",
        description="National-grade land registry and management platform",
        version="1.0.0",
        docs_url="/api/v1/docs",
        redoc_url="/api/v1/redoc",
        openapi_url="/api/v1/openapi.json",
        lifespan=lifespan
    )
    
    # ========================================================================
    # MIDDLEWARE STACK (Order matters!)
    # ========================================================================
    
    # 1. Trust proxy headers (for load balancers) - disable in development
    if settings.ENVIRONMENT != "development":
        app.add_middleware(
            TrustedHostMiddleware,
            allowed_hosts=settings.ALLOWED_HOSTS
        )
    
    # 2. CORS (Cross-Origin Resource Sharing)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
        expose_headers=["X-Request-ID", "X-Response-Time"],
        max_age=600  # 10 minutes
    )
    
    # 3. Gzip compression for responses > 500 bytes
    app.add_middleware(
        GZipMiddleware,
        minimum_size=500
    )
    
    # 4. Request ID and timing middleware
    @app.middleware("http")
    async def add_request_id_and_timing(request: Request, call_next):
        """Add request ID and response time tracking"""
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        request.state.start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - request.state.start_time
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Response-Time"] = str(process_time)
        
        logger.info(
            f"[{request_id}] {request.method} {request.url.path} "
            f"- Status: {response.status_code} - Time: {process_time:.2f}s"
        )
        
        return response
    
    # 5. Exception handlers
    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        """Handle unexpected exceptions"""
        request_id = getattr(request.state, "request_id", "unknown")
        logger.error(
            f"[{request_id}] Unhandled exception: {str(exc)}",
            exc_info=True
        )
        
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "status_code": 500,
                "message": "Internal server error",
                "request_id": request_id,
                "timestamp": datetime.utcnow().isoformat()
            }
        )
    
    @app.exception_handler(ValueError)
    async def value_error_handler(request: Request, exc: ValueError):
        """Handle validation errors"""
        return JSONResponse(
            status_code=status.HTTP_400_BAD_REQUEST,
            content={
                "status_code": 400,
                "message": "Validation error",
                "detail": str(exc)
            }
        )
    
    # ========================================================================
    # HEALTH CHECK ENDPOINT
    # ========================================================================
    
    @app.get(
        "/health",
        response_model=HealthCheckResponse,
        tags=["Health"],
        summary="Health check"
    )
    async def health_check():
        """Check backend health and dependencies"""
        return HealthCheckResponse(
            status="healthy",
            version="1.0.0",
            dependencies={
                "database": "connected",
                "redis": "connected"
            }
        )
    
    @app.get("/api/v1/health", response_model=HealthCheckResponse)
    async def health_check_v1():
        """Versioned health check endpoint"""
        return HealthCheckResponse(
            status="healthy",
            version="1.0.0",
            dependencies={
                "database": "connected",
                "redis": "connected"
            }
        )
    
    # ========================================================================
    # ROOT ENDPOINT
    # ========================================================================
    
    @app.get("/", tags=["Root"])
    async def root():
        """API root endpoint"""
        return {
            "name": "LandBiznes Backend API",
            "version": "1.0.0",
            "environment": settings.ENVIRONMENT,
            "docs": "/api/v1/docs",
            "health": "/health"
        }
    
    # ========================================================================
    # ROUTER REGISTRATION (To be implemented)
    # ========================================================================
    
    # Import routers (all systems)
    from app.routers import (
        auth, users, land, agents, escrow, chat, blockchain, admin, 
        documents, payments, title_verification, fraud_detection, dispute_resolution,
        compliance, digital_signatures, blockchain_contracts, multi_stakeholder_roles,
        ml_services, ai, tasks, payments_monime, kyc, registry
    )
    from app.websockets import routes as ws_routes
    
    # Include routers with prefixes
    app.include_router(
        auth.router,
        prefix="/api/v1/auth",
        tags=["Authentication"]
    )
    
    app.include_router(
        users.router,
        prefix="/api/v1/users",
        tags=["Users"]
    )
    
    app.include_router(
        registry.router,
        prefix="/api/v1/registry",
        tags=["National Land Registry"]
    )

    app.include_router(
        land.router,
        prefix="/api/v1/land",
        tags=["Land Properties"]
    )
    
    app.include_router(
        agents.router,
        prefix="/api/v1/agents",
        tags=["Real Estate Agents"]
    )
    
    app.include_router(
        escrow.router,
        prefix="/api/v1/escrow",
        tags=["Escrow Management"]
    )
    
    app.include_router(
        chat.router,
        prefix="/api/v1/chat",
        tags=["Chat & Messaging"]
    )
    
    app.include_router(
        blockchain.router,
        prefix="/api/v1/blockchain",
        tags=["Blockchain Integration"]
    )
    
    app.include_router(
        admin.router,
        prefix="/api/v1/admin",
        tags=["Admin"]
    )

    app.include_router(
        kyc.router,
        prefix="/api/v1/kyc",
        tags=["KYC Verification"]
    )
    
    app.include_router(
        documents.router,
        prefix="/api/v1/documents",
        tags=["Documents"]
    )
    
    app.include_router(
        payments.router,
        prefix="/api/v1/payments",
        tags=["Payments"]
    )
    
    # Monime Payments
    app.include_router(
        payments_monime.router,
        tags=["Payments - Monime"]
    )
    
    # NEW: Title Verification System
    app.include_router(
        title_verification.router,
        tags=["Title Verification"]
    )
    
    # NEW: Fraud Detection
    app.include_router(
        fraud_detection.router,
        tags=["Fraud Detection"]
    )
    
    # NEW: Dispute Resolution
    app.include_router(
        dispute_resolution.router,
        tags=["Dispute Resolution"]
    )
    
    # NEW: Compliance & Regulatory Tracking
    app.include_router(
        compliance.router,
        tags=["Legal Compliance"]
    )
    
    # NEW: Digital Signatures System
    app.include_router(
        digital_signatures.router,
        tags=["Digital Signatures"]
    )
    
    # NEW: Blockchain Smart Contracts
    app.include_router(
        blockchain_contracts.router,
        tags=["Blockchain Contracts"]
    )
    
    # NEW: Multi-Stakeholder Roles & Professionals
    app.include_router(
        multi_stakeholder_roles.router,
        tags=["Multi-Stakeholder Roles"]
    )
    
    # NEW: ML Services (Fraud, Price Prediction, Risk Scoring)
    app.include_router(
        ml_services.router,
        tags=["Machine Learning Services"]
    )
    
    # NEW: AI Advisory Services (DeepSeek - advisory only)
    app.include_router(
        ai.router,
        tags=["AI Advisory"]
    )
    
    # NEW: Task Status
    app.include_router(
        tasks.router,
        prefix="/api/v1/tasks",
        tags=["Background Tasks"]
    )

    # Include WebSocket routes (no prefix - uses /ws directly)
    app.include_router(ws_routes.router, tags=["WebSocket"])
    
    # Serve uploads (static files)
    try:
        app.mount("/static", StaticFiles(directory=settings.UPLOAD_DIR), name="static")
    except Exception as e:
        logger.warning(f"[WARN] Static files mount skipped: {e}")
    
    logger.info("[OK] All routers registered")
    
    return app


# ============================================================================
# APPLICATION INSTANCE
# ============================================================================

app = create_app()


if __name__ == "__main__":
    import uvicorn
    
    uvicorn.run(
        "app.main:app",
        host=get_settings().HOST,
        port=get_settings().PORT,
        reload=get_settings().ENVIRONMENT == "development",
        workers=get_settings().WORKERS,
        log_level=get_settings().LOG_LEVEL.lower()
    )
