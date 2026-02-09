# Quick Start - Microservices Setup

## Prerequisites

- Node.js 16+ (`node --version`)
- Docker + Docker Compose
- PostgreSQL 15 + PostGIS running (from previous setup)

## 1. Database Setup (One-Time)

If you haven't applied the schema yet:

```bash
# Copy the schema file into the running database
docker exec -i landbiznes_db psql -U landbiznes -d landbiznes < init-scripts/01-landbiznes-schema.sql
```

Verify with SQLTools in VS Code.

## 2. Install Dependencies

```bash
# API Gateway
cd api-gateway && npm install && cd ..

# Parcel Service
cd services/parcel-service && npm install && cd ../..

# Grid Service
cd services/grid-service && npm install && cd ../..

# Conflict Service
cd services/conflict-service && npm install && cd ../..

# Ownership Service
cd services/ownership-service && npm install && cd ../..

# Frontend
cd frontend && npm install && cd ..
```

## 3. Run Development Environment

### Terminal 1 - API Gateway
```bash
cd api-gateway
npm run dev
# ✓ API Gateway running on port 3000
```

### Terminal 2 - Parcel Service
```bash
cd services/parcel-service
npm run dev
# ✓ Parcel Service running on port 3001
```

### Terminal 3 - Grid Service
```bash
cd services/grid-service
npm run dev
# ✓ Grid Service running on port 3002
```

### Terminal 4 - Conflict Service
```bash
cd services/conflict-service
npm run dev
# ✓ Conflict Service running on port 3003
```

### Terminal 5 - Ownership Service
```bash
cd services/ownership-service
npm run dev
# ✓ Ownership Service running on port 3004
```

### Terminal 6 - Frontend
```bash
cd frontend
npm start
# ✓ Frontend running on http://localhost:3000
```

## 4. Verify Services

```bash
# Check API Gateway health
curl http://localhost:3000/api/health

# Check individual services
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "api-gateway"
}
```

## 5. Access Frontend

Open browser: **http://localhost:3000**

### Dashboard Features
- **Dashboard:** Overview statistics, parcel distribution charts
- **Parcels:** CRUD operations, search, spatial queries
- **Map:** Leaflet visualization of parcels by grid
- **Conflicts:** Detect overlaps, resolution workflow

## Production Deployment (Docker Compose)

```bash
# Build and start all services
docker-compose -f docker-compose.full.yml up -d

# Check status
docker-compose -f docker-compose.full.yml ps

# View logs
docker-compose -f docker-compose.full.yml logs -f api-gateway

# Stop services
docker-compose -f docker-compose.full.yml down
```

Access:
- Frontend: http://localhost:3006
- API Gateway: http://localhost:3000
- Services: http://localhost:300X (X=1-5)

## API Examples

### List Parcels
```bash
curl http://localhost:3000/api/parcels?grid_id=1&limit=10
```

### Get Parcel Details
```bash
curl http://localhost:3000/api/parcels/1
```

### Create Parcel
```bash
curl -X POST http://localhost:3000/api/parcels \
  -H "Content-Type: application/json" \
  -d '{
    "grid_id": 1,
    "parcel_code": "GRID_001-000001",
    "geometry": {"type":"Polygon","coordinates":[[...]]},
    "area_sqm": 1000
  }'
```

### List Conflicts
```bash
curl http://localhost:3000/api/conflicts?grid_id=1&resolved=false
```

### Detect Conflicts
```bash
curl -X POST http://localhost:3000/api/conflicts/detect/1
```

## Environment Configuration

Copy and customize `.env` files:

```bash
# API Gateway
cp api-gateway/.env.example api-gateway/.env
# Edit api-gateway/.env with your configuration
```

## Troubleshooting

### Service Port Already in Use
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill process
kill -9 <PID>
```

### Database Connection Errors
```bash
# Verify DB running
docker ps | grep postgres

# Check DB logs
docker logs landbiznes_db

# Reconnect from service
# Update DB_HOST to localhost if using Docker network
```

### CORS Issues
- Verify CORS enabled in api-gateway/src/index.js
- Check frontend REACT_APP_API_URL matches gateway URL

### Dependencies Not Installing
```bash
# Clear npm cache
npm cache clean --force

# Reinstall
rm -rf node_modules package-lock.json
npm install
```

## Next Steps

1. **Customize frontend components** in `/frontend/src/components`
2. **Add authentication** via JWT in API Gateway
3. **Implement service-to-service** communication for complex queries
4. **Add database migrations** for schema updates
5. **Deploy to Kubernetes** for production scaling
6. **Set up monitoring** (Prometheus, Grafana)
7. **Configure CI/CD** (GitHub Actions, GitLab CI)

## File Locations

| Component | Directory | Port |
|-----------|-----------|------|
| Database | Docker | 5432 |
| API Gateway | `api-gateway/` | 3000 |
| Parcel Service | `services/parcel-service/` | 3001 |
| Grid Service | `services/grid-service/` | 3002 |
| Conflict Service | `services/conflict-service/` | 3003 |
| Ownership Service | `services/ownership-service/` | 3004 |
| Frontend | `frontend/` | 3000 (dev) / 3006 (prod) |

