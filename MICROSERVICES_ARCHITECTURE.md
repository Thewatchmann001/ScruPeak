# ScruPeak Microservices Architecture Guide

## Overview

ScruPeak is a production-ready, national-scale land registry system built with a **microservices-first architecture**. Each service operates independently, communicates via REST APIs, and connects to a shared PostgreSQL + PostGIS database.

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                      React Frontend                          │
│                  (Dashboard, Map, Admin)                     │
└────────────────────────┬────────────────────────────────────┘
                         │ HTTP/REST
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                    API Gateway (Node)                        │
│            Port 3000 - Request Routing & Auth                │
└────┬─────────┬─────────┬─────────┬─────────┬────────────────┘
     │         │         │         │         │
     ▼         ▼         ▼         ▼         ▼
┌────────┐ ┌────────┐ ┌────────┐ ┌───────┐ ┌───────┐
│ Parcel │ │ Grid   │ │Conflict│ │Ownership Owner │
│Service │ │Service │ │Service │ │Service │Service│
│ 3001   │ │ 3002   │ │ 3003   │ │ 3004   │ 3005 │
└────┬───┘ └────┬───┘ └────┬───┘ └────┬──┘ └────┬─┘
     │         │         │         │         │
     └─────────┴─────────┴─────────┴─────────┘
                         │
                         ▼
        ┌─────────────────────────────────┐
        │  PostgreSQL 15 + PostGIS 3.4    │
        │  Port 5432                      │
        │  - 8 Tables                     │
        │  - Spatial Indexes              │
        │  - Immutability Triggers        │
        │  - Audit Logs                   │
        └─────────────────────────────────┘
```

## Services Breakdown

### 1. **API Gateway** (Port 3000)
**Location:** `/api-gateway`

Entry point for all frontend requests. Routes requests to appropriate microservices, handles authentication, rate limiting, and request validation.

**Key Features:**
- Request routing via URL patterns
- JWT authentication
- Rate limiting (100 req/15min per IP)
- CORS handling
- Service health checks
- Error aggregation

**Routes:**
```
GET    /api/health                 → Health check
GET    /api/parcels                → Parcel Service
GET    /api/grids                  → Grid Service
GET    /api/conflicts              → Conflict Service
GET    /api/ownership              → Ownership Service
GET    /api/owners                 → Owner Service
```

### 2. **Parcel Service** (Port 3001)
**Location:** `/services/parcel-service`

Manages parcel records, spatial queries, and parcel genealogy.

**Endpoints:**
```
GET    /parcels                    → List parcels by grid
GET    /parcels/:id                → Get parcel details
POST   /parcels                    → Create new parcel
POST   /parcels/spatial-query      → Spatial intersection search
GET    /parcels/:id/lineage        → Get parcel genealogy
GET    /parcels/:id/history        → Get parcel event history
```

**Database Operations:**
- CRUD operations on `parcels` table
- Spatial joins with ownership records
- Lineage queries from `parcel_lineage` table
- Event log from `parcel_events` table

### 3. **Grid Service** (Port 3002)
**Location:** `/services/grid-service`

Manages spatial grids, hierarchy, and grid-level statistics.

**Endpoints:**
```
GET    /grids                      → List grids by level/parent
GET    /grids/:id                  → Get grid details
POST   /grids                      → Create new grid
GET    /grids/:id/statistics       → Get grid parcel statistics
GET    /grids/hierarchy            → Get full grid hierarchy (recursive)
```

**Database Operations:**
- CRUD operations on `spatial_grids` table
- Recursive queries for grid hierarchy
- Area calculations and coverage stats
- Parcel count and active status aggregations

### 4. **Conflict Service** (Port 3003)
**Location:** `/services/conflict-service`

Detects and resolves parcel overlaps and conflicts.

**Endpoints:**
```
GET    /conflicts                  → List conflicts (filtered by resolution)
GET    /conflicts/:id              → Get conflict details
POST   /conflicts/detect/:gridId   → Detect new conflicts in grid
PUT    /conflicts/:id/resolve      → Mark conflict as resolved
```

**Database Operations:**
- Queries on `parcel_conflicts` table
- Calls `detect_grid_conflicts()` function
- Computes overlap area using ST_Intersection
- Tracks resolution history

### 5. **Ownership Service** (Port 3004)
**Location:** `/services/ownership-service`

Manages parcel ownership records, transfers, and ownership history.

**Endpoints:**
```
GET    /ownership/:parcelId/current  → Get current owner(s)
GET    /ownership/:parcelId/history  → Get ownership history
POST   /ownership/:parcelId/transfer → Transfer ownership
```

**Database Operations:**
- CRUD on `parcel_ownership` table
- Transactional ownership transfers
- Event logging for ownership changes
- Current ownership views via `current_parcel_ownership`

### 6. **Owner Service** (Port 3005)
**Location:** `/services/owner-service` (skeleton)

Manages owner records and portfolio tracking.

**Endpoints:**
```
GET    /owners                     → List all owners
GET    /owners/:id                 → Get owner details
POST   /owners                     → Create new owner
GET    /owners/:id/portfolio       → Get owner's parcel portfolio
```

## Running the System

### Option 1: Development (Services Separately)

```bash
# Terminal 1 - Database
docker run --name scrupeak_db -e POSTGRES_PASSWORD=scrupeak \
  -e POSTGRES_USER=scrupeak -e POSTGRES_DB=scrupeak \
  -p 5432:5432 postgis/postgis:15-3.4

# Terminal 2 - API Gateway
cd api-gateway
npm install
npm run dev

# Terminal 3 - Parcel Service
cd services/parcel-service
npm install
npm run dev

# Terminal 4 - Grid Service
cd services/grid-service
npm install
npm run dev

# Terminal 5 - Conflict Service
cd services/conflict-service
npm install
npm run dev

# Terminal 6 - Ownership Service
cd services/ownership-service
npm install
npm run dev

# Terminal 7 - Frontend
cd frontend
npm install
npm start
```

### Option 2: Production (Docker Compose)

```bash
docker-compose -f docker-compose.full.yml up -d
```

Services automatically available at:
- Frontend: http://localhost:3006
- API Gateway: http://localhost:3000
- Individual services: http://localhost:300X

## Service Communication Patterns

### Frontend → API Gateway
```javascript
// Frontend calls API Gateway (single entry point)
const response = await fetch('http://localhost:3000/api/parcels');
```

### API Gateway → Microservices
```javascript
// Gateway proxies to services based on URL pattern
app.use('/api/parcels', proxy('http://localhost:3001'));
```

### Service → Database
```javascript
// Each service has direct DB connection
const pool = new Pool({
  host: 'localhost',
  port: 5432,
  database: 'scrupeak',
  // ...
});
```

### Service → Service (Future Enhancement)
```javascript
// For complex operations, services can call each other
const conflicts = await serviceClient.get(
  'http://conflict-service:3003/conflicts'
);
```

## Environment Variables

### API Gateway (`.env`)
```
PORT=3000
NODE_ENV=production
PARCEL_SERVICE_URL=http://localhost:3001
GRID_SERVICE_URL=http://localhost:3002
CONFLICT_SERVICE_URL=http://localhost:3003
OWNERSHIP_SERVICE_URL=http://localhost:3004
OWNER_SERVICE_URL=http://localhost:3005
DB_HOST=localhost
DB_PORT=5432
DB_USER=scrupeak
DB_PASSWORD=scrupeak
DB_NAME=scrupeak
JWT_SECRET=change-this-in-production
```

## Database Integration

All services connect to **single PostgreSQL database** at `postgresql://scrupeak:scrupeak@localhost:5432/scrupeak`

### Schema Overview
- **8 Tables:** spatial_grids, parcels, parcel_lineage, parcel_events, parcel_conflicts, grid_sequences, owners, parcel_ownership
- **6 Triggers:** Immutability, hash computation, area calculation, bounds, deletion prevention, event immutability
- **4 Functions:** find_overlapping_parcels, get_parcel_lineage, detect_grid_conflicts, get_parcel_history
- **7 GIST Indexes:** Spatial geometry indexing for O(log n) queries

## Deployment Considerations

### Scaling
- **Horizontal:** Run multiple instances of each service behind load balancer
- **Vertical:** Increase container resources (CPU, memory)
- **Database:** Connection pooling via `pg` node package (max: 20 connections per service)

### Monitoring
- Health endpoints: `/health` on each service
- Docker health checks configured
- Structured JSON logging in shared logger

### Security
- JWT authentication at API Gateway
- HTTPS/TLS in production (configure nginx reverse proxy)
- CORS configured per environment
- Helmet security headers enabled

## Frontend Integration

React frontend at `/frontend` uses Zustand stores for state management:

```javascript
// Store per microservice domain
useParcelStore()    // Parcel CRUD + queries
useGridStore()      // Grid management
useConflictStore()  // Conflict detection
useOwnershipStore() // Ownership transfers
```

API client automatically routes to API Gateway:
```javascript
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';
```

## Extension Points

### Adding New Service
1. Create directory: `/services/new-service`
2. Create `package.json`, `src/index.js`, `Dockerfile`
3. Add route in API Gateway
4. Add health check to docker-compose.full.yml
5. Update frontend API client

### Adding New Database Table
1. Modify `01-scrupeak-schema.sql`
2. Add triggers if immutability needed
3. Add GIST index for geometry columns
4. Update service CRUD operations
5. Add migration script

## File Structure

```
ScruPeak/
├── frontend/                 # React Dashboard
│   ├── src/
│   │   ├── components/      # UI Components
│   │   ├── services/        # API client + Zustand stores
│   │   ├── App.jsx
│   │   └── index.js
│   └── package.json
├── api-gateway/             # Request Router & Auth
│   ├── src/index.js
│   └── package.json
├── services/
│   ├── parcel-service/      # Parcel CRUD + Spatial
│   ├── grid-service/        # Grid Management
│   ├── conflict-service/    # Conflict Detection
│   └── ownership-service/   # Ownership Transfers
├── shared/                  # Shared utilities
│   ├── db.js               # Database pool
│   ├── errors.js           # Error classes
│   ├── httpClient.js       # Service-to-service HTTP
│   ├── logger.js           # Structured logging
│   └── middleware.js       # Express middleware
├── init-scripts/
│   └── 01-scrupeak-schema.sql
├── docker-compose.yml      # Existing (DB only)
├── docker-compose.full.yml # Complete stack
└── package.json
```

## Next Steps

1. **Install dependencies:** Run `npm install` in each service directory
2. **Apply database schema:** Run init scripts (already in postgres)
3. **Start API Gateway:** `npm run dev` in api-gateway
4. **Start microservices:** `npm run dev` in each service
5. **Start frontend:** `npm start` in frontend directory
6. **Access dashboard:** http://localhost:3000

## Troubleshooting

### Services won't connect to database
- Verify PostgreSQL is running on localhost:5432
- Check DB credentials in .env files
- Ensure database `scrupeak` exists

### Frontend can't reach API Gateway
- Verify API Gateway running on port 3000
- Check REACT_APP_API_URL environment variable
- Ensure CORS is enabled

### Microservices won't start
- Check Node version (requires 16+)
- Verify all dependencies: `npm install`
- Check port conflicts: `lsof -i :3001` (macOS/Linux)

