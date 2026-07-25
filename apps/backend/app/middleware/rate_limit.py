from fastapi import Request, HTTPException
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.services.redis_cache import RateLimitManager
import logging

logger = logging.getLogger(__name__)

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    FastAPI Middleware for global and endpoint-specific rate limiting.
    Identifies users via JWT 'sub' or source IP fallback.
    """
    def __init__(self, app, rate_limit_manager: RateLimitManager):
        super().__init__(app)
        self.limiter = rate_limit_manager

    async def dispatch(self, request: Request, call_next):
        # 1. Resolve Identity
        # Attempts to get user_id from state (usually set by AuthMiddleware)
        # Fallback to client host IP if unauthenticated
        user_id = str(getattr(request.state, "user_id", request.client.host))
        
        # 2. Map path to rate limit categories
        path = request.url.path
        endpoint_type = "general"
        
        if "/search" in path:
            endpoint_type = "search"
        elif "/price" in path:
            endpoint_type = "price_estimate"
        elif "/fraud" in path:
            endpoint_type = "fraud_check"

        # 3. Check limit
        allowed, info = await self.limiter.check_rate_limit(user_id, endpoint_type)
        
        if not allowed:
            return JSONResponse(
                status_code=429,
                content={
                    "detail": "Too many requests",
                    "limit": info.get("limit"),
                    "reset_in_seconds": info.get("reset_in_seconds")
                },
                headers={"Retry-After": str(info.get("reset_in_seconds", 60))}
            )

        response = await call_next(request)
        
        # 4. Inject rate limit metadata into response headers
        if "limit" in info:
            response.headers["X-RateLimit-Limit"] = str(info["limit"])
            response.headers["X-RateLimit-Remaining"] = str(info.get("remaining", 0))
            
        return response