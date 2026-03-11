# Land Registry PostgreSQL Database Setup

## Quick Start

### 1. Start the Docker Container

```bash
docker-compose up -d db
```

### 2. Verify the Container is Running

```bash
docker ps
```

Should show `scrupeak_db` running on port 5432.

### 3. Connect to the Database

#### Using psql (PostgreSQL CLI)
```bash
psql -h localhost -U scrupeak -d scrupeak
```

When prompted, enter password: `scrupeak`

#### Using a Database Client
- **Host**: localhost
- **Port**: 5432
- **Database**: scrupeak
- **Username**: scrupeak
- **Password**: scrupeak

#### Connection String
```
postgresql://scrupeak:scrupeak@localhost:5432/scrupeak
```

## Schema Overview

### Core Tables

#### Owners (`owners`)
- Manages property owners (individuals, companies, governments)
- Tracks contact info, tax IDs, and status

#### Parcels (`parcels`)
- Core table for land parcels
- Includes geospatial data with PostGIS geometry
- Links to property types and land use types

#### Ownership Records (`ownership_records`)
- Historical and current ownership records
- Supports joint ownership with percentages
- Tracks ownership history with start/end dates

#### Transactions (`transactions`)
- Records all property transfers and transactions
- Tracks sales, leases, mortgages, inheritances
- Links buyers and sellers with property value

#### Disputes (`disputes`)
- Manages property disputes
- Tracks claimants, respondents, and resolution status
- Links to dispute status tracking

#### Rights & Restrictions
- `parcel_rights`: Usage rights (usufruct, easement, mortgage)
- `parcel_restrictions`: Land restrictions (environmental, heritage, utilities)

#### Surveys (`surveys`)
- Land survey records with boundaries
- Supports geometric polygon data
- Tracks surveyor certification status

#### Documents (`documents`)
- Stores references to legal documents
- Tracks title deeds, certificates, agreements
- Document verification status

#### Audit Logs (`audit_logs`)
- Complete audit trail of all changes
- Tracks user, timestamp, before/after values

### Helper Tables

- `property_types`: Categorization of properties
- `land_use_types`: Land use classifications
- `transaction_types`: Types of transactions
- `rights_types`: Types of property rights
- `restriction_types`: Types of restrictions
- `dispute_statuses`: Dispute status codes
- `document_types`: Document type classifications

## Sample Queries

### 1. View All Active Parcels
```sql
SELECT p.parcel_id, p.location_name, p.area_sqm, pt.name as property_type
FROM land_registry.parcels p
JOIN land_registry.property_types pt ON p.property_type_id = pt.id
WHERE p.is_active = true;
```

### 2. Current Ownership Information
```sql
SELECT * FROM land_registry.current_ownership
ORDER BY parcel_id;
```

### 3. Find Owner's Portfolio
```sql
SELECT * FROM land_registry.owner_portfolio
WHERE name ILIKE '%owner_name%';
```

### 4. List Disputed Parcels
```sql
SELECT * FROM land_registry.disputed_parcels
WHERE dispute_count > 0;
```

### 5. Recent Transactions
```sql
SELECT 
  t.reference_number,
  p.parcel_id,
  from_o.name as from_owner,
  to_o.name as to_owner,
  t.value,
  t.transaction_date,
  tt.name as transaction_type
FROM land_registry.transactions t
JOIN land_registry.parcels p ON t.parcel_id = p.id
JOIN land_registry.transaction_types tt ON t.transaction_type_id = tt.id
LEFT JOIN land_registry.owners from_o ON t.from_owner_id = from_o.id
LEFT JOIN land_registry.owners to_o ON t.to_owner_id = to_o.id
ORDER BY t.transaction_date DESC
LIMIT 20;
```

### 6. Add a New Owner
```sql
INSERT INTO land_registry.owners (name, email, phone, owner_type, tax_id)
VALUES ('John Doe', 'john@example.com', '+1234567890', 'Individual', 'TAX123456');
```

### 7. Add a New Parcel
```sql
INSERT INTO land_registry.parcels 
(parcel_id, property_type_id, land_use_id, location_name, area_sqm, description)
VALUES (
  'PARCEL-001',
  (SELECT id FROM land_registry.property_types WHERE code = 'LAND'),
  (SELECT id FROM land_registry.land_use_types WHERE code = 'AGRICULTURAL'),
  'Farm Area Alpha',
  5000.00,
  'Agricultural land for farming'
);
```

### 8. Create Ownership Record
```sql
INSERT INTO land_registry.ownership_records 
(parcel_id, owner_id, ownership_percentage, ownership_type, start_date)
VALUES (
  (SELECT id FROM land_registry.parcels WHERE parcel_id = 'PARCEL-001'),
  (SELECT id FROM land_registry.owners WHERE tax_id = 'TAX123456'),
  100,
  'Sole',
  CURRENT_DATE
);
```

### 9. Search by Location (PostGIS)
```sql
SELECT parcel_id, location_name, ST_AsText(geometry) as boundary
FROM land_registry.parcels
WHERE ST_DWithin(geometry, ST_GeomFromText('POINT(40.7128 -74.0060)', 4326), 0.01)
LIMIT 10;
```

### 10. Audit Trail for a Parcel
```sql
SELECT * FROM land_registry.audit_logs
WHERE table_name = 'parcels' AND record_id = 'your-parcel-uuid'
ORDER BY created_at DESC;
```

## Database Administration

### View All Tables
```sql
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'land_registry';
```

### View Schema Statistics
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'land_registry'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Backup Database
```bash
docker exec scrupeak_db pg_dump -U scrupeak scrupeak > backup.sql
```

### Restore Database
```bash
docker exec -i scrupeak_db psql -U scrupeak scrupeak < backup.sql
```

### Access Database Shell
```bash
docker exec -it scrupeak_db psql -U scrupeak -d scrupeak
```

## Connection Examples

### Python (psycopg2)
```python
import psycopg2

conn = psycopg2.connect(
    host="localhost",
    database="scrupeak",
    user="scrupeak",
    password="scrupeak"
)
cursor = conn.cursor()
cursor.execute("SELECT * FROM land_registry.current_ownership;")
rows = cursor.fetchall()
cursor.close()
conn.close()
```

### Node.js (pg)
```javascript
const { Client } = require('pg');

const client = new Client({
  host: 'localhost',
  port: 5432,
  database: 'scrupeak',
  user: 'scrupeak',
  password: 'scrupeak'
});

client.connect();
client.query('SELECT * FROM land_registry.current_ownership', (err, res) => {
  console.log(res.rows);
  client.end();
});
```

### JavaScript (node-postgres with async/await)
```javascript
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://scrupeak:scrupeak@localhost:5432/scrupeak'
});

async function getOwnership() {
  const res = await pool.query('SELECT * FROM land_registry.current_ownership');
  console.log(res.rows);
}

getOwnership();
```

## Features

✅ **Comprehensive Land Registry Schema**
- Full property ownership tracking
- Historical transaction records
- Dispute resolution framework
- Audit logging for compliance

✅ **Spatial Data Support (PostGIS)**
- Geometric boundary storage
- Location-based queries
- Distance calculations

✅ **Data Integrity**
- Foreign key constraints
- Check constraints for valid data
- Unique constraints on critical fields
- Automatic audit trail

✅ **Performance**
- Strategic indexes on frequently queried columns
- Optimized views for common queries
- Support for millions of records

✅ **Scalability**
- Volume mounts for persistent data
- Network support for multi-container setup
- Connection pooling ready

## Environment Variables

Edit `docker-compose.yml` to modify:
- `POSTGRES_DB`: Database name (default: scrupeak)
- `POSTGRES_USER`: Database user (default: scrupeak)
- `POSTGRES_PASSWORD`: Database password (default: scrupeak)

⚠️ **Security Note**: Change default credentials in production!

## Troubleshooting

### Connection Refused
```bash
# Check if container is running
docker ps

# Check logs
docker logs scrupeak_db
```

### Database Not Initialized
```bash
# Stop and remove container
docker-compose down

# Remove volume
docker volume rm scrupeak_postgres_data

# Restart
docker-compose up -d db
```

### Insufficient Permissions
Ensure the user has proper PostgreSQL role permissions:
```sql
GRANT ALL PRIVILEGES ON SCHEMA land_registry TO scrupeak;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA land_registry TO scrupeak;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA land_registry TO scrupeak;
```
