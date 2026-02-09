#!/usr/bin/env python
"""
Create test database for pytest
"""
import asyncio
import asyncpg
import sys

async def create_test_db():
    """Create landbiznes_test database"""
    try:
        # Connect to default postgres database
        conn = await asyncpg.connect(
            user='landbiznes',
            password='landbiznes',
            database='postgres',
            host='localhost',
            port=5432
        )
        
        # Check if test database exists
        exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'landbiznes_test')"
        )
        
        if not exists:
            await conn.execute("CREATE DATABASE landbiznes_test;")
            print("[OK] Test database created: landbiznes_test")
        else:
            print("[INFO] Test database already exists: landbiznes_test")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to create test database: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(create_test_db())
    sys.exit(0 if result else 1)
