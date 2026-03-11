#!/bin/bash
# Verify database schema setup

echo "=== PostgreSQL Container Status ==="
docker ps | grep scrupeak_db

echo ""
echo "=== Testing Database Connection ==="
docker exec scrupeak_db psql -U scrupeak -d scrupeak -c "SELECT version();" || echo "Connection failed"

echo ""
echo "=== Checking Land Registry Schema ==="
docker exec scrupeak_db psql -U scrupeak -d scrupeak -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'land_registry';"

echo ""
echo "=== Listing Tables in land_registry ==="
docker exec scrupeak_db psql -U scrupeak -d scrupeak -c "SELECT table_name FROM information_schema.tables WHERE table_schema='land_registry' ORDER BY table_name;"

echo ""
echo "=== Table Count ==="
docker exec scrupeak_db psql -U scrupeak -d scrupeak -c "SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema='land_registry';"

echo ""
echo "=== Sample Data from owners table ==="
docker exec scrupeak_db psql -U scrupeak -d scrupeak -c "SELECT COUNT(*) as owner_count FROM land_registry.owners;"

echo ""
echo "Setup complete! Database is ready at: postgresql://scrupeak:scrupeak@localhost:5432/scrupeak"
