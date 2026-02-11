import asyncio
import logging
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text
from app.core.database import engine

async def add_parcel_id_columns():
    print("Checking database for 'parcel_id' columns...")
    async with engine.begin() as conn:
        try:
            await conn.execute(text("SELECT parcel_id FROM land LIMIT 1"))
            print("Columns already exist.")
            return
        except Exception:
            print("Columns missing. Adding...")

    async with engine.begin() as conn:
        # Add parcel_id
        await conn.execute(text("ALTER TABLE land ADD COLUMN parcel_id VARCHAR(50)"))
        await conn.execute(text("CREATE UNIQUE INDEX idx_land_parcel_id ON land (parcel_id)"))
        
        # Add grid_id
        await conn.execute(text("ALTER TABLE land ADD COLUMN grid_id VARCHAR(20)"))
        await conn.execute(text("CREATE INDEX idx_land_grid_id ON land (grid_id)"))
        
        print("Columns added successfully.")

    await engine.dispose()

if __name__ == "__main__":
    try:
        asyncio.run(add_parcel_id_columns())
        print("Migration completed.")
    except Exception as e:
        print(f"Migration failed: {e}")
