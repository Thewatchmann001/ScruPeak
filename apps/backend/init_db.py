#!/usr/bin/env python
"""
Database initialization script
Creates tables and seeds initial data
"""
import asyncio
import logging
from app.core.database import engine, Base, AsyncSessionLocal
from app.core.config import get_settings
from app.models import User, UserRole, Land, LandStatus
# Import auth utils for password hashing
from app.utils.auth import hash_password

logger = logging.getLogger(__name__)

async def init_db():
    """Initialize database - create all tables"""
    async with engine.begin() as conn:
        try:
            # Drop all tables to ensure clean slate with correct schema/data
            print("[*] Dropping existing tables...")
            await conn.run_sync(Base.metadata.drop_all)
            print("[*] Creating tables...")
            await conn.run_sync(Base.metadata.create_all)
            print("[+] Database tables created")
        except Exception as e:
            if "already exists" in str(e):
                print("[+] Database tables already exist")
            else:
                raise

async def seed_demo_data():
    """Seed database with demo data for testing"""
    async with AsyncSessionLocal() as session:
        try:
            # Check if data already exists
            from sqlalchemy import select, func
            count = await session.execute(select(func.count(User.id)))
            if count.scalar() > 0:
                print("[*] Database already has data, skipping seed")
                return
            
            # Create demo users
            demo_users = [
                User(
                    email="owner@demo.com",
                    full_name="John Owner",
                    phone="+234 701 234 5678",
                    password_hash="demo_hash_1",  # In prod, use proper hashing
                    role=UserRole.OWNER,
                    is_verified=True,
                ),
                User(
                    email="buyer@demo.com",
                    full_name="Jane Buyer",
                    phone="+234 702 234 5678",
                    password_hash="demo_hash_2",
                    role=UserRole.BUYER,
                    is_verified=True,
                ),
                User(
                    email="agent@demo.com",
                    full_name="Mike Agent",
                    phone="+234 703 234 5678",
                    password_hash="demo_hash_3",
                    role=UserRole.AGENT,
                    is_verified=True,
                ),
            ]
            
            session.add_all(demo_users)
            await session.flush()
            
            print("[+] Demo users created")
            
            # Create demo properties
            demo_lands = [
                Land(
                    title="Sunset Apartment Complex",
                    description="Modern 5-story apartment building with 20 units",
                    owner_id=demo_users[0].id,
                    region="Western Area",
                    district="Lagos Island",
                    size_sqm=2500.0,
                    status=LandStatus.AVAILABLE,
                    price=50000000.0,
                    latitude=6.4274,
                    longitude=3.4289,
                    location="POINT(3.4289 6.4274)",
                    has_survey_plan=True,
                    has_agreement=True
                ),
                Land(
                    title="Commercial Plaza",
                    description="Ready-to-occupy commercial space in CBD",
                    owner_id=demo_users[0].id,
                    region="Western Area",
                    district="Ikoyi",
                    size_sqm=1500.0,
                    status=LandStatus.AVAILABLE,
                    price=35000000.0,
                    latitude=6.4614,
                    longitude=3.6315,
                    location="POINT(3.6315 6.4614)",
                    has_survey_plan=True,
                    has_agreement=True
                ),
            ]
            
            session.add_all(demo_lands)
            await session.commit()
            
            print("[+] Demo properties created")
            print(f"   - Created {len(demo_users)} users")
            print(f"   - Created {len(demo_lands)} properties")
            
        except Exception as e:
            await session.rollback()
            logger.error(f"Error seeding data: {e}")
            raise

async def main():
    """Run database initialization"""
    print("[*] Initializing database...")
    
    try:
        await init_db()
        await seed_demo_data()
        print("[+] Database initialization complete!")
    except Exception as e:
        print(f"[-] Database initialization failed: {e}")
        raise
    finally:
        await engine.dispose()

if __name__ == "__main__":
    asyncio.run(main())
