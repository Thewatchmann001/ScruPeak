#!/usr/bin/env python
"""
Create test database for pytest
"""
import asyncio
import asyncpg
import sys

async def create_test_db():
    """Create scrupeak_test database"""
    try:
        # Connect to default postgres database
        conn = await asyncpg.connect(
            user='scrupeak',
            password='scrupeak',
            database='postgres',
            host='localhost',
            port=5432
        )
        
        # Check if test database exists
        exists = await conn.fetchval(
            "SELECT EXISTS(SELECT 1 FROM pg_database WHERE datname = 'scrupeak_test')"
        )
        
        if not exists:
            await conn.execute("CREATE DATABASE scrupeak_test;")
            print("[OK] Test database created: scrupeak_test")
        else:
            print("[INFO] Test database already exists: scrupeak_test")
        
        await conn.close()
        return True
        
    except Exception as e:
        print(f"[ERROR] Failed to create test database: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(create_test_db())
    sys.exit(0 if result else 1)
