import os
import logging
from functools import lru_cache
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt
from jwt import PyJWKClientError

try:
    from jwt import PyJWKClient
except ImportError:
    # Fallback for older PyJWT versions
    from jwt.jwks_client import PyJWKClient

logger = logging.getLogger(__name__)
security = HTTPBearer()

PRIVY_APP_ID = os.environ.get("PRIVY_APP_ID", "cmmxpr19800000cl51l48f0yv")
PRIVY_ISSUER = "https://auth.privy.io"
PRIVY_JWKS_URL = f"https://auth.privy.io/api/v1/apps/{PRIVY_APP_ID}/jwks"

# Initialize JWKS client (handles caching and key rotation)
_jwks_client = None

def get_jwks_client():
    """Get or initialize the JWKS client with caching"""
    global _jwks_client
    if _jwks_client is None:
        logger.info(f"Initializing Privy JWKS client: {PRIVY_JWKS_URL}")
        _jwks_client = PyJWKClient(
            PRIVY_JWKS_URL,
            cache_keys=True,
            max_cached_keys=16,
            headers={}
        )
    return _jwks_client

async def verify_privy_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """
    Verify Privy JWT token and return user claims.
    
    Uses PyJWT's PyJWKClient for proper JWKS handling with key caching.
    Handles ES256 (ECDSA) signatures from Privy.
    
    Args:
        credentials: HTTP Bearer token from Authorization header
        
    Returns:
        Token payload with user claims (email, sub, etc.)
        
    Raises:
        HTTPException: Various authentication errors
    """
    token = credentials.credentials

    try:
        # Get the JWKS client
        client = get_jwks_client()
        
        # Decode header to get key ID
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        
        # Get the signing key from JWKS (uses cached keys)
        try:
            signing_key = client.get_signing_key(kid)
        except PyJWKClientError as e:
            logger.error(f"Could not find key in JWKS (kid={kid}): {e}")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token key"
            )
        
        # Decode and verify the token
        payload = jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256"],
            audience=PRIVY_APP_ID,
            issuer=PRIVY_ISSUER,
            options={"verify_exp": True, "verify_aud": True}
        )

        logger.debug(f"✓ Verified Privy token for: {payload.get('email', 'unknown')}")
        return payload

    except jwt.ExpiredSignatureError:
        logger.warning("Token verification failed: ExpiredSignatureError")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.InvalidAudienceError:
        logger.warning(f"Token verification failed: InvalidAudienceError (expected: {PRIVY_APP_ID})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token audience"
        )
    except jwt.InvalidIssuerError:
        logger.warning(f"Token verification failed: InvalidIssuerError (expected: {PRIVY_ISSUER})")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token issuer"
        )
    except jwt.InvalidSignatureError:
        logger.error("Token verification failed: InvalidSignatureError")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token signature"
        )
    except PyJWKClientError as e:
        logger.error(f"JWKS client error: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Authentication service temporarily unavailable"
        )
    except jwt.DecodeError as e:
        logger.error(f"Token decode error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token format"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error verifying Privy token: {type(e).__name__}: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )

async def get_current_user_privy(
    payload: dict = Security(verify_privy_token)
) -> dict:
    """Get current user from Privy token"""
    return {
        "privy_id": payload.get("sub"),
        "email": payload.get("email"),
        "wallet_address": payload.get("wallet_address"),
    }
