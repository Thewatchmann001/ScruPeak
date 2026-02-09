import asyncio
import sys
import os
import logging

# Add parent directory to path to allow importing app
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models import Land
from app.services.search_service import search_service

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def reindex_all():
    logger.info("Starting reindexing process...")
    
    # 1. Initialize Index Settings
    logger.info("Initializing MeiliSearch index settings...")
    search_service.initialize_index()
    
    # 2. Fetch all lands from DB
    async with AsyncSessionLocal() as session:
        logger.info("Fetching lands from database...")
        result = await session.execute(select(Land))
        lands = result.scalars().all()
        
        logger.info(f"Found {len(lands)} lands to index.")
        
        # 3. Index each land
        for land in lands:
            land_dict = {
                "id": str(land.id),
                "title": land.title,
                "description": land.description,
                "price": float(land.price) if land.price else 0,
                "region": land.region,
                "district": land.district,
                "size_sqm": float(land.size_sqm),
                "status": land.status,
                "owner_id": str(land.owner_id),
                "latitude": float(land.latitude),
                "longitude": float(land.longitude),
                "created_at": land.created_at.isoformat() if land.created_at else None
            }
            search_service.index_document(land_dict)
            
    logger.info("Reindexing complete!")

if __name__ == "__main__":
    asyncio.run(reindex_all())
