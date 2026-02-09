from app.core.celery_app import celery
from app.services.search_service import search_service
from app.services.blockchain import BlockchainService
from app.core.config import get_settings
from app.models import Land
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import logging
import time
import random
from datetime import datetime

logger = logging.getLogger(__name__)

def get_sync_db_session():
    settings = get_settings()
    if settings.DB_TYPE == "sqlite":
        url = f"sqlite:///./{settings.DB_NAME}.db"
    else:
        url = f"postgresql://{settings.DB_USER}:{settings.DB_PASSWORD}@{settings.DB_HOST}:{settings.DB_PORT}/{settings.DB_NAME}"
    
    engine = create_engine(url)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

@celery.task(name="sync_land_to_search")
def sync_land_to_search(land_data: dict):
    """
    Background task to sync land data to MeiliSearch.
    This keeps the search index up-to-date without blocking the API.
    """
    try:
        logger.info(f"Syncing land {land_data.get('id')} to search index...")
        search_service.index_document(land_data)
        return "Indexed successfully"
    except Exception as e:
        logger.error(f"Error syncing land to search: {e}")
        return f"Error: {e}"

@celery.task(name="generate_title_document")
def generate_title_document(land_id: str, owner_name: str):
    """
    Simulates a long-running task to generate a PDF title deed.
    In a real app, this would generate a PDF and upload to S3/Cloud storage.
    """
    logger.info(f"Starting PDF generation for Land ID: {land_id}")
    
    # Simulate heavy processing (e.g., 5 seconds)
    time.sleep(5)
    
    # Simulate success
    document_url = f"https://landbiznes-storage.s3.amazonaws.com/titles/{land_id}.pdf"
    logger.info(f"PDF generated: {document_url}")
    
    return {"status": "completed", "url": document_url}

@celery.task(name="process_blockchain_hash")
def process_blockchain_hash(land_id: str):
    """
    Hashes land data to the Blockchain (Solana/Ethereum) and updates the database.
    """
    logger.info(f"Hashing land {land_id} to blockchain...")
    
    session = get_sync_db_session()
    try:
        # 1. Fetch Land Record
        # Note: We cast string ID to UUID if needed, but SQLAlchemy often handles string->uuid
        land = session.query(Land).filter(Land.id == land_id).first()
        
        if not land:
            logger.error(f"Land {land_id} not found for blockchain hashing")
            return "Error: Land not found"
            
        # 2. Prepare Data for Hashing
        land_data = BlockchainService.prepare_land_data(
            land_id=str(land.id),
            owner_id=str(land.owner_id),
            title=land.title,
            location={
                "lat": land.latitude,
                "lng": land.longitude,
                "region": land.region,
                "district": land.district,
                "size_sqm": float(land.size_sqm)
            }
        )
        
        # 3. Generate Hash & Send Transaction
        data_hash = BlockchainService.generate_hash(land_data)
        # Note: This might fail if wallet has no funds. In production, handle retries or alerting.
        tx_hash = BlockchainService.send_transaction(data_hash)
        
        # 4. Update Database
        land.blockchain_hash = tx_hash
        land.blockchain_verified = True
        land.blockchain_verified_at = datetime.utcnow()
        
        session.commit()
        
        logger.info(f"Blockchain hash confirmed: {tx_hash} for Land {land_id}")
        return {"tx_hash": tx_hash, "status": "verified"}
        
    except Exception as e:
        logger.error(f"Blockchain processing failed: {e}")
        session.rollback()
        raise e
    finally:
        session.close()
