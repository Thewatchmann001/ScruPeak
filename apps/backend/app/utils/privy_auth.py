import os
import httpx
import logging
from functools import lru_cache
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt

logger = logging.getLogger(__name__)
security = HTTPBearer()

PRIVY_APP_ID = os.environ.get("PRIVY_APP_ID", "cmmxpr19800000cl51l48f0yv")

@lru_cache(maxsize=1)
def get_privy_public_key():
    """Fetch Privy's public key for JWT verification"""
    try:
        response = httpx.get(
            f"https://auth.privy.io/api/v1/apps/{PRIVY_APP_ID}/jwks",
            timeout=10.0
        )
        response.raise_for_status()
        return response.json()
    except Exception as e:
        logger.error(f"Failed to fetch Privy public key: {e}")
        return None

async def verify_privy_token(
    credentials: HTTPAuthorizationCredentials = Security(security)
) -> dict:
    """Verify Privy JWT and return user claims"""
    token = credentials.credentials

    try:
        # Get public keys from Privy
        jwks = get_privy_public_key()
        if not jwks:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not fetch Privy public keys"
            )

        # Verify the token
        # Note: Privy uses ES256
        payload = jwt.decode(
            token,
            jwks,
            algorithms=["ES256"],
            audience=PRIVY_APP_ID,
            issuer="privy.io"
        )

        return payload

    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token expired"
        )
    except jwt.JWTError as e:
        logger.error(f"Token verification failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )
    except Exception as e:
        logger.error(f"Unexpected error during token verification: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
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
