#!/usr/bin/env python3
"""
Land Registry Database Setup Guide
Manual setup instructions without docker-compose issues
"""

SETUP_STEPS = """
# MANUAL SETUP - If docker-compose has issues

## Option 1: Using Docker directly (Most Reliable)

# Pull the image
docker pull postgis/postgis:15-3.4

# Run container
docker run -d \
  --name scrupeak_db \
  -e POSTGRES_DB=scrupeak \
  -e POSTGRES_USER=scrupeak \
  -e POSTGRES_PASSWORD=scrupeak \
  -p 5432:5432 \
  -v postgres_data:/var/lib/postgresql/data \
  postgis/postgis:15-3.4

# Wait for container to start
sleep 5

# Check if running
docker ps

# Apply schema
docker exec -i scrupeak_db psql -U scrupeak -d scrupeak < init-scripts/01-schema.sql

# Test connection
psql -h localhost -U scrupeak -d scrupeak -c "SELECT version();"

## Option 2: Install PostgreSQL locally (Windows)

Download from: https://www.postgresql.org/download/windows/

Then:
- Install PostgreSQL 15+
- Install PostGIS extension
- Create database 'scrupeak'
- Run: psql -U postgres -d scrupeak < init-scripts/01-schema.sql

## Option 3: Use Cloud PostgreSQL

- Google Cloud SQL PostgreSQL
- AWS RDS PostgreSQL  
- Azure Database for PostgreSQL
- Digital Ocean Managed Database

Connection: postgresql://scrupeak:scrupeak@your-host:5432/scrupeak

## Verify Installation

# Test basic connection
psql -h localhost -U scrupeak -d scrupeak

# In psql, run:
SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'land_registry';

# List tables
\\dt land_registry.*

# Check PostGIS
SELECT ST_GeomFromText('POINT(0 0)', 4326);
"""

if __name__ == "__main__":
    print(SETUP_STEPS)
