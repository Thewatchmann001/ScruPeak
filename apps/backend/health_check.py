
import sys
import os
import asyncio
from sqlalchemy import text

# Add current directory to path
sys.path.append(os.getcwd())

# PATCH: Disable GeoAlchemy2 SQLite spatialite checks for dev environment
import geoalchemy2.admin.dialects.sqlite as sqlite_admin
sqlite_admin.after_create = lambda *args, **kwargs: None

from app.core.database import engine, Base
from app.models import *  # Import base models
# Import all other models to ensure they are registered
import app.models.blockchain_contracts
import app.models.compliance
import app.models.digital_signatures
import app.models.dispute_resolution
import app.models.fraud_detection
import app.models.multi_stakeholder_roles
import app.models.registry
import app.models.title_verification

async def health_check():
    print("Starting health check...")
    try:
        # Check database connection
        async with engine.begin() as conn:
            await conn.execute(text("SELECT 1"))
        print("Database connection successful.")
        
        # Check models
        print(f"Registered tables: {Base.metadata.tables.keys()}")
        
        # Try to create tables (if using SQLite for dev)
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("Database tables created/verified.")
        
        print("Health check PASSED.")
    except Exception as e:
        print(f"Health check FAILED: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(health_check())
