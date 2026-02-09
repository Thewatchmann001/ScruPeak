# Land Registry Database - Quick Start Guide

## ✅ Status
**Container is running!** PostgreSQL with PostGIS is now active on port 5432.

## Connection Details
- **Host**: localhost
- **Port**: 5432
- **Database**: landbiznes
- **Username**: landbiznes
- **Password**: landbiznes
- **Connection String**: `postgresql://landbiznes:landbiznes@localhost:5432/landbiznes`

## Next Steps

### 1. Verify Schema is Applied
```bash
docker exec landbiznes_db psql -U landbiznes -d landbiznes \
  -c "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='land_registry';"
```

### 2. Connect with psql
```bash
psql -h localhost -U landbiznes -d landbiznes
```

### 3. Query Sample Data
```sql
-- List all owners (if any were inserted)
SELECT * FROM land_registry.owners;

-- List property types
SELECT * FROM land_registry.property_types;

-- View current ownership
SELECT * FROM land_registry.current_ownership;
```

### 4. Test Spatial Queries
```sql
-- Test PostGIS
SELECT ST_GeomFromText('POINT(0 0)', 4326) as test_geometry;

-- Search parcels near coordinates
SELECT parcel_id, location_name 
FROM land_registry.parcels
WHERE ST_DWithin(geometry, ST_GeomFromText('POINT(40.7128 -74.0060)', 4326), 0.1);
```

## Database Schema Includes

✅ **Owners & Stakeholders** - Property owner management
✅ **Parcels & Properties** - Land parcel tracking with spatial data
✅ **Ownership Records** - Historical and current ownership  
✅ **Transactions** - Sales, leases, mortgages, inheritances
✅ **Disputes** - Conflict resolution tracking
✅ **Rights & Restrictions** - Easements, mortgages, protections
✅ **Surveys** - Boundary measurements (PostGIS geometry)
✅ **Documents** - Title deeds, certificates
✅ **Audit Logs** - Complete change history
✅ **Notifications** - Alert system for owners

## Backup & Restore

### Backup
```bash
docker exec landbiznes_db pg_dump -U landbiznes landbiznes > backup_$(date +%Y%m%d).sql
```

### Restore
```bash
docker exec -i landbiznes_db psql -U landbiznes landbiznes < backup.sql
```

## Stop/Start Container

### Stop
```bash
docker-compose down
# or
docker stop landbiznes_db
```

### Start
```bash
docker-compose up -d db
# or
docker start landbiznes_db
```

### Remove Everything (Fresh Start)
```bash
docker-compose down -v
docker-compose up -d db
# Then reapply schema:
docker exec -i landbiznes_db psql -U landbiznes -d landbiznes < init-scripts/01-schema.sql
```

## Connect from Applications

### Python
```python
import psycopg2
conn = psycopg2.connect(
    host="localhost", database="landbiznes", 
    user="landbiznes", password="landbiznes"
)
```

### Node.js
```javascript
const { Client } = require('pg');
const client = new Client({
  connectionString: 'postgresql://landbiznes:landbiznes@localhost:5432/landbiznes'
});
```

### Go
```go
connStr := "user=landbiznes password=landbiznes dbname=landbiznes sslmode=disable"
db, _ := sql.Open("postgres", connStr)
```

## Troubleshooting

### Check if container is running
```bash
docker ps | grep landbiznes_db
```

### View container logs
```bash
docker logs landbiznes_db
```

### Test connection with pg_isready
```bash
docker exec landbiznes_db pg_isready -U landbiznes
```

### Check database size
```bash
docker exec landbiznes_db psql -U landbiznes -d landbiznes \
  -c "SELECT pg_size_pretty(pg_database_size('landbiznes'));"
```

### Increase security in production
- Change default password: `POSTGRES_PASSWORD=your_secure_password`
- Restrict PostgreSQL port to internal network only
- Use SSL connections
- Enable authentication in application layer
- Regular backups to secure location

## Schema Documentation

See `DATABASE_SETUP.md` for:
- Detailed table descriptions
- Sample queries
- API connection examples
- Database administration tasks

## Need Help?

Check the documentation files:
- `DATABASE_SETUP.md` - Comprehensive setup guide
- `MANUAL_SETUP.py` - Alternative setup methods
- `init-scripts/01-schema.sql` - Full schema definition
