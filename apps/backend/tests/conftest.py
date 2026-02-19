"""
Test configuration and fixtures for LandBiznes backend
"""
import pytest
import pytest_asyncio
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession, async_sessionmaker
from httpx import AsyncClient, ASGITransport
from typing import AsyncGenerator
from sqlalchemy import event
import sqlite3

from app.main import create_app
from app.core.database import Base, get_db


# Test database URL
TEST_DATABASE_URL = "sqlite+aiosqlite:///./test.db"


@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for async tests"""
    loop = asyncio.new_event_loop()
    asyncio.set_event_loop(loop)
    yield loop
    loop.close()


# Test database setup - using function scope for isolation with SQLite
@pytest_asyncio.fixture(scope="function")
def test_db_engine(event_loop):
    """Create test database engine"""
    engine = create_async_engine(
        TEST_DATABASE_URL,
        echo=False,
        future=True,
    )

    @event.listens_for(engine.sync_engine, "connect")
    def connect(dbapi_connection, connection_record):
        if isinstance(dbapi_connection, sqlite3.Connection):
            def CheckSpatialIndex(*args): return 0
            def RecoverGeometryColumn(*args): return 0
            def DiscardGeometryColumn(*args): return 0
            dbapi_connection.create_function("CheckSpatialIndex", 2, CheckSpatialIndex)
            dbapi_connection.create_function("RecoverGeometryColumn", 4, RecoverGeometryColumn)
            dbapi_connection.create_function("RecoverGeometryColumn", 5, RecoverGeometryColumn)
            dbapi_connection.create_function("DiscardGeometryColumn", 4, DiscardGeometryColumn)
            dbapi_connection.create_function("AddGeometryColumn", 5, lambda *args: 0)
            dbapi_connection.create_function("CreateSpatialIndex", 3, lambda *args: 0)
    
    # Synchronously create/drop tables using asyncio.run
    def setup():
        import os
        if os.path.exists("./test.db"):
            os.remove("./test.db")
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


@pytest_asyncio.fixture
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
    """Create FastAPI test app"""
    return create_app()


@pytest_asyncio.fixture
async def client(app, test_db_session):
    """Create test client with dependency override"""
    
    async def override_get_db():
        yield test_db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
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
