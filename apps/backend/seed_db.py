
import asyncio
import uuid
from datetime import datetime
from decimal import Decimal
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from app.models import Base, User, UserRole, Land, LandStatus
from app.utils.spatial import compute_grid_id

# Database URL for SQLite
DATABASE_URL = "sqlite+aiosqlite:///landbiznes.db"

async def seed_data():
    engine = create_async_engine(DATABASE_URL)
    async_session = sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)

    async with async_session() as session:
        # 1. Create a few users
        owner_id = uuid.uuid4()
        owner = User(
            id=owner_id,
            email="owner@landbiznes.sl",
            name="John Kamara",
            password_hash="hashed_password", # Dummy
            role=UserRole.OWNER,
            kyc_verified=True,
            is_active=True,
            created_at=datetime.utcnow()
        )

        buyer_id = uuid.uuid4()
        buyer = User(
            id=buyer_id,
            email="buyer@landbiznes.sl",
            name="Marie Sesay",
            password_hash="hashed_password",
            role=UserRole.BUYER,
            kyc_verified=True,
            is_active=True,
            created_at=datetime.utcnow()
        )

        session.add_all([owner, buyer])
        await session.flush()

        # 2. Create some land listings
        lands_data = [
            {
                "title": "Prime Residential Plot in Bureh Town",
                "description": "Beautiful 2,500 sqm plot near the beach, ideal for a vacation home.",
                "size_sqm": Decimal("2500.00"),
                "price": Decimal("45000.00"),
                "region": "Western Area Rural",
                "district": "Waterloo",
                "latitude": 8.2435,
                "longitude": -13.0856,
                "status": LandStatus.AVAILABLE
            },
            {
                "title": "Agricultural Land in Lungi",
                "description": "5 acres of fertile land perfect for palm oil plantation.",
                "size_sqm": Decimal("20234.30"),
                "price": Decimal("25000.00"),
                "region": "Northern Province",
                "district": "Port Loko",
                "latitude": 8.6186,
                "longitude": -13.1906,
                "status": LandStatus.AVAILABLE
            },
            {
                "title": "Commercial Space in Freetown Central",
                "description": "Strategic location for office or retail development.",
                "size_sqm": Decimal("500.00"),
                "price": Decimal("120000.00"),
                "region": "Western Area Urban",
                "district": "Freetown",
                "latitude": 8.4844,
                "longitude": -13.2344,
                "status": LandStatus.AVAILABLE
            }
        ]

        for data in lands_data:
            grid_info = compute_grid_id(data["latitude"], data["longitude"])
            land = Land(
                id=uuid.uuid4(),
                owner_id=owner_id,
                title=data["title"],
                description=data["description"],
                size_sqm=data["size_sqm"],
                price=data["price"],
                region=data["region"],
                district=data["district"],
                latitude=data["latitude"],
                longitude=data["longitude"],
                status=data["status"],
                grid_id=str(grid_info[0]),
                # Location and Boundary would normally be Geometry but we are deferring them
                # For SQLite/GeoAlchemy2 we'd need spatialite to insert them easily as WKT
                # Since we defer them, let's just use a dummy WKT or leave them None if allowed
                location="POINT(-13.0 8.0)", # Dummy string that might work if cast
                blockchain_verified=True,
                created_at=datetime.utcnow(),
                updated_at=datetime.utcnow()
            )
            session.add(land)

        await session.commit()
        print("Seed data inserted successfully!")

if __name__ == "__main__":
    asyncio.run(seed_data())
