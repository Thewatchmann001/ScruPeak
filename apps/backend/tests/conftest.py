"""
Test configuration and fixtures for ScruPeak backend
"""
import pytest
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from sqlalchemy import event
from httpx import AsyncClient
from typing import AsyncGenerator

from app.main import create_app
from app.core.database import Base, get_db
from unittest.mock import MagicMock


# Test database URL - Use SQLite for local test environment if Postgres is not available
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


# Test database setup - using session scope for performance
@pytest.fixture(scope="session")
def test_db_engine(event_loop):
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
    )

    # Mock GeoAlchemy2 spatial functions for SQLite
    @event.listens_for(engine.sync_engine, "connect")
    def receive_connect(dbapi_connection, connection_record):
        dbapi_connection.create_function("CheckSpatialIndex", 2, lambda x, y: 1)
        dbapi_connection.create_function("AddGeometryColumn", 6, lambda *args: 1)
        dbapi_connection.create_function("DiscardGeometryColumn", 2, lambda *args: 1)
        dbapi_connection.create_function("DisableSpatialIndex", 2, lambda *args: 1)
        # Return a dummy WKB for Point(0,0) with SRID 4326
        dummy_wkb_hex = "0101000020E610000000000000000000000000000000000000"
        # In SQLite, we use the hex string for simplicity or let GeoAlchemy handle bytes
        dbapi_connection.create_function("GeomFromEWKT", 1, lambda x: dummy_wkb_hex)
        dbapi_connection.create_function("AsEWKB", 1, lambda x: dummy_wkb_hex)
    
    # Synchronously create/drop tables using asyncio.run
    def setup():
        async def _create():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.create_all)
        event_loop.run_until_complete(_create())
    
    def cleanup():
        async def _drop():
            async with engine.begin() as conn:
                await conn.run_sync(Base.metadata.drop_all)
            await engine.dispose()
        event_loop.run_until_complete(_drop())
    
    setup()
    yield engine
    cleanup()


@pytest.fixture
async def test_db_session(test_db_engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session"""
    async_session = async_sessionmaker(
        test_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session() as session:
        yield session
        await session.rollback()


@pytest.fixture
def app():
    """Create FastAPI test app with mocked background tasks"""
    # Mock sync_land_to_search task
    import app.tasks as tasks
    tasks.sync_land_to_search = MagicMock()
    tasks.sync_land_to_search.delay = MagicMock()

    return create_app()


@pytest.fixture
async def client(app, test_db_session):
    """Create test client with dependency override"""
    
    async def override_get_db():
        yield test_db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    from httpx import ASGITransport
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as async_client:
        yield async_client
    
    app.dependency_overrides.clear()


# Test data fixtures
@pytest.fixture
def test_user_data():
    """Test user registration data"""
    return {
        "email": "test@example.com",
        "name": "Test User",
        "phone": "+234 701 234 5678",
        "password": "TestPassword123!",
        "role": "owner"
    }


@pytest.fixture
def test_property_data():
    """Test property data"""
    return {
        "title": "Beautiful Land Property",
        "description": "A pristine land with excellent soil quality",
        "price": 5000000.0,
        "location": "Lagos, Nigeria",
        "region": "Lagos",
        "area": 5000,
        "status": "available"
    }
