import os
import asyncio
import logging
from sqlalchemy import text
from sqlalchemy.ext.asyncio import create_async_engine
from passlib.hash import bcrypt

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("bootstrap")

# Configuration from environment
DB_URL = os.environ.get("DATABASE_URL_DIRECT", "postgresql+asyncpg://user:pass@localhost:5432/scrupeak")
ADMIN_EMAIL = os.environ.get("BOOTSTRAP_ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD")

async def bootstrap_admin():
    """
    Initializes the first super admin user safely using environment variables.
    Avoids hardcoding sensitive data and ensures idempotency.
    """
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        logger.error("BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD must be set.")
        return

    engine = create_async_engine(DB_URL, echo=True)

    async with engine.begin() as conn:
        logger.info(f"Checking for existing admin: {ADMIN_EMAIL}")
        
        # Check if user already exists
        result = await conn.execute(
            text("SELECT id FROM users WHERE email = :email"),
            {"email": ADMIN_EMAIL}
        )
        user = result.fetchone()

        if user:
            logger.info("Admin user already exists. Skipping bootstrap.")
            return

        # Hash password securely
        hashed_pw = bcrypt.hash(ADMIN_PASSWORD)

        # Insert the super admin
        # Note: Assuming 'role' column exists as per RBAC requirements
        await conn.execute(
            text("""
                INSERT INTO users (email, hashed_password, role, is_active, is_verified)
                VALUES (:email, :password, 'super_admin', true, true)
            """),
            {
                "email": ADMIN_EMAIL,
                "password": hashed_pw
            }
        )
        
        logger.info(f"Successfully bootstrapped super admin: {ADMIN_EMAIL}")

    await engine.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(bootstrap_admin())
    except Exception as e:
        logger.error(f"Bootstrap failed: {e}")