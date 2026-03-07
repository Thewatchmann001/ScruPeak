# Backend Integration & Deployment Checklist

## ✅ Phase 1: Local Development Setup

### Environment Setup
- [ ] Clone repository
- [ ] Navigate to `apps/backend/`
- [ ] Create Python 3.11+ virtual environment
  ```bash
  python -m venv venv
  source venv/bin/activate  # Windows: venv\Scripts\activate
  ```
- [ ] Install dependencies
  ```bash
  pip install -r requirements.txt
  ```
- [ ] Copy `.env.example` to `.env`
  ```bash
  cp .env.example .env
  ```

### Database Setup
- [ ] Install PostgreSQL 15 locally
- [ ] Install PostGIS extension
- [ ] Create database: `landbiznes_db`
- [ ] Update `.env` with database credentials
  ```
  DB_HOST=localhost
  DB_PORT=5432
  DB_NAME=landbiznes_db
  DB_USER=postgres
  DB_PASSWORD=your_password
  ```
- [ ] Test connection: `psql -h localhost -U postgres -d landbiznes_db`

### Redis Setup
- [ ] Install Redis 7+ locally
- [ ] Update `.env` with Redis config
  ```
  REDIS_HOST=localhost
  REDIS_PORT=6379
  ```
- [ ] Test connection: `redis-cli ping`

### Application Start
- [ ] Set `SECRET_KEY` in `.env` (at least 32 characters)
  ```
  SECRET_KEY=your-very-secret-key-change-in-production-minimum-32-chars
  ```
- [ ] Start FastAPI development server
  ```bash
  uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  ```
- [ ] Verify server running at `http://localhost:8000`
- [ ] Check API docs at `http://localhost:8000/api/v1/docs`

## ✅ Phase 2: Database Initialization

### Create Tables
- [ ] Run database initialization (when migrations are set up)
  ```bash
  python -m alembic upgrade head
  ```
- [ ] Verify tables created
  ```bash
  psql -h localhost -U postgres -d landbiznes_db -c "\dt"
  ```
- [ ] Check indexes
  ```bash
  psql -h localhost -U postgres -d landbiznes_db -c "\di"
  ```

### Enable PostGIS
- [ ] Connect to database
  ```bash
  psql -h localhost -U postgres -d landbiznes_db
  ```
- [ ] Enable PostGIS extension
  ```sql
  CREATE EXTENSION IF NOT EXISTS postgis;
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  SELECT PostGIS_version();
  ```

### Seed Initial Data (Optional)
- [ ] Create admin user
- [ ] Create test properties
- [ ] Create test users

## ✅ Phase 3: API Testing

### Health Checks
- [ ] GET `/health` → 200 OK
- [ ] GET `/api/v1/health` → 200 OK
- [ ] GET `/` → 200 OK

### Authentication Endpoints
- [ ] POST `/api/v1/auth/register` → 201 Created
  ```json
  {
    "email": "test@example.com",
    "name": "Test User",
    "password": "Password123"
  }
  ```
- [ ] POST `/api/v1/auth/login` → 200 OK
  ```json
  {
    "email": "test@example.com",
    "password": "Password123"
  }
  ```
- [ ] POST `/api/v1/auth/refresh` → 200 OK
  ```json
  {
    "refresh_token": "..."
  }
  ```

### User Endpoints
- [ ] GET `/api/v1/users/me` → 200 OK (with auth token)
- [ ] PUT `/api/v1/users/me` → 200 OK
- [ ] GET `/api/v1/users` → 200 OK
- [ ] GET `/api/v1/users/{user_id}` → 200 OK

### Land Endpoints
- [ ] POST `/api/v1/land` → 201 Created
  ```json
  {
    "title": "Property",
    "size_sqm": 1000,
    "region": "Lagos",
    "district": "Victoria Island",
    "location": {"latitude": 6.426, "longitude": 3.427}
  }
  ```
- [ ] GET `/api/v1/land` → 200 OK (paginated)
- [ ] GET `/api/v1/land/{land_id}` → 200 OK
- [ ] PUT `/api/v1/land/{land_id}` → 200 OK
- [ ] DELETE `/api/v1/land/{land_id}` → 204 No Content

### Error Handling
- [ ] Invalid email → 422 Unprocessable Entity
- [ ] Wrong password → 401 Unauthorized
- [ ] Non-existent resource → 404 Not Found
- [ ] Expired token → 401 Unauthorized
- [ ] Missing auth header → 403 Forbidden

## ✅ Phase 4: Docker Deployment

### Docker Build
- [ ] Build Docker image
  ```bash
  docker build -t landbiznes-backend:latest ./apps/backend
  ```
- [ ] Verify image
  ```bash
  docker images | grep landbiznes
  ```

### Docker Compose Local
- [ ] Start full stack
  ```bash
  docker-compose -f docker-compose-prod.yml up -d
  ```
- [ ] Verify containers
  ```bash
  docker ps
  ```
- [ ] Check logs
  ```bash
  docker-compose logs -f backend
  ```
- [ ] Test API
  ```bash
  curl http://localhost:8000/health
  ```

### Container Testing
- [ ] Backend container healthy
  ```bash
  docker ps | grep landbiznes-backend
  ```
- [ ] Database container healthy
  ```bash
  docker ps | grep landbiznes-postgres
  ```
- [ ] Redis container healthy
  ```bash
  docker ps | grep landbiznes-redis
  ```

## ✅ Phase 5: Integration with Frontend

### API Configuration
- [ ] Update frontend API base URL
  ```javascript
  // frontend/.env
  NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
  ```
- [ ] Verify CORS configuration in backend
  ```python
  # app/core/config.py
  CORS_ORIGINS=["http://localhost:3000"]
  ```

### Authentication Flow
- [ ] Test login from frontend
- [ ] Verify tokens stored in cookies/localStorage
- [ ] Test token refresh
- [ ] Test logout
- [ ] Verify protected routes work

### API Integration
- [ ] User profile loading
- [ ] Land property listing
- [ ] Property search
- [ ] Escrow management
- [ ] Chat messaging

## ✅ Phase 6: Testing & Validation

### Unit Tests
- [ ] Create `tests/conftest.py` (fixtures)
- [ ] Create `tests/test_auth.py`
- [ ] Create `tests/test_users.py`
- [ ] Create `tests/test_land.py`
- [ ] Run tests
  ```bash
  pytest -v
  ```

### Integration Tests
- [ ] Test user registration → login → profile
- [ ] Test land creation → search → detail
- [ ] Test escrow creation → status update
- [ ] Test chat message → fraud detection

### Load Testing
- [ ] Create k6 load test script
- [ ] Run load test
  ```bash
  k6 run load-test.js
  ```
- [ ] Verify performance metrics
  - Average response time < 200ms
  - 95th percentile < 500ms
  - Error rate < 1%

### Security Testing
- [ ] SQL injection tests
- [ ] XSS prevention tests
- [ ] CSRF token validation
- [ ] Rate limiting tests
- [ ] JWT validation tests

## ✅ Phase 7: Performance Optimization

### Database Optimization
- [ ] Verify all 17 indexes created
- [ ] Check query execution plans
  ```sql
  EXPLAIN ANALYZE SELECT * FROM land WHERE region = 'Lagos';
  ```
- [ ] Monitor slow queries
- [ ] Optimize if needed

### Caching Optimization
- [ ] Verify Redis connected
- [ ] Check cache hit rates
- [ ] Monitor memory usage
- [ ] Adjust TTLs if needed

### Application Optimization
- [ ] Monitor response times
- [ ] Check CPU usage
- [ ] Check memory usage
- [ ] Monitor database connection pool usage
- [ ] Monitor Redis connection pool usage

## ✅ Phase 8: Monitoring & Logging

### Log Files
- [ ] Check application logs
  ```bash
  tail -f logs/app.log
  ```
- [ ] Verify log format (JSON or text)
- [ ] Check log rotation (10MB files)
- [ ] Monitor error logs

### Metrics
- [ ] Response time metrics
- [ ] Request rate metrics
- [ ] Error rate metrics
- [ ] Database metrics
- [ ] Cache metrics

### Alerting (Optional)
- [ ] Set up error rate alerts
- [ ] Set up response time alerts
- [ ] Set up database alerts
- [ ] Set up cache alerts

## ✅ Phase 9: Production Deployment (Kubernetes)

### Prerequisites
- [ ] Kubernetes cluster ready
- [ ] kubectl configured
- [ ] Docker registry access (Docker Hub, ECR, GCR)
- [ ] Secrets configured (DB_PASSWORD, SECRET_KEY, etc.)

### Deployment
- [ ] Create Kubernetes namespaces
  ```bash
  kubectl create namespace landbiznes
  ```
- [ ] Deploy PostgreSQL StatefulSet
- [ ] Deploy Redis StatefulSet
- [ ] Deploy backend Deployment (500 replicas)
- [ ] Configure load balancer
- [ ] Configure ingress (HTTPS)

### Verification
- [ ] All pods running
  ```bash
  kubectl get pods -n landbiznes
  ```
- [ ] All services healthy
  ```bash
  kubectl get svc -n landbiznes
  ```
- [ ] Health checks passing
- [ ] API responding
- [ ] Database connected

### Scaling
- [ ] Horizontal Pod Autoscaling configured
- [ ] Test scaling up
- [ ] Test scaling down
- [ ] Monitor performance under load

## ✅ Phase 10: Post-Deployment

### Monitoring
- [ ] Set up Prometheus scraping
- [ ] Set up Grafana dashboards
- [ ] Set up ELK stack for logging
- [ ] Set up alerts in monitoring system

### Backup & Recovery
- [ ] Verify PostgreSQL backups running
- [ ] Test restore procedure
- [ ] Verify Redis persistence
- [ ] Document recovery procedures

### Documentation
- [ ] Update deployment runbooks
- [ ] Document scaling procedures
- [ ] Document troubleshooting guides
- [ ] Update runbooks for on-call

### Maintenance
- [ ] Schedule regular backups
- [ ] Schedule security updates
- [ ] Schedule dependency updates
- [ ] Schedule performance reviews

## 📋 Troubleshooting Guide

### Connection Issues

**PostgreSQL Connection Failed**
```bash
# Check if PostgreSQL is running
sudo systemctl status postgresql

# Check connection
psql -h localhost -U postgres -d landbiznes_db

# Check firewall
sudo ufw status
```

**Redis Connection Failed**
```bash
# Check if Redis is running
redis-cli ping

# Check connection
redis-cli -h localhost -p 6379
```

### Application Issues

**Port Already in Use**
```bash
# Find process using port
lsof -i :8000

# Kill process
kill -9 <PID>
```

**Module Import Error**
```bash
# Verify virtual environment activated
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

**Database Migration Failed**
```bash
# Check migration status
alembic current

# View available migrations
alembic history

# Downgrade if needed
alembic downgrade -1
```

### Performance Issues

**High Memory Usage**
```bash
# Check Python process
ps aux | grep uvicorn

# Monitor memory
watch -n 1 'free -h'
```

**High Database Connection Usage**
```sql
-- Check connections
SELECT datname, count(*) FROM pg_stat_activity GROUP BY datname;

-- Check connection limit
SHOW max_connections;
```

**High Redis Memory Usage**
```bash
# Check memory
redis-cli info memory

# Check key space
redis-cli info keyspace
```

## 📞 Support Resources

- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **SQLAlchemy Docs**: https://docs.sqlalchemy.org/
- **PostgreSQL Docs**: https://www.postgresql.org/docs/
- **Redis Docs**: https://redis.io/documentation
- **Docker Docs**: https://docs.docker.com/
- **Kubernetes Docs**: https://kubernetes.io/docs/

## ✅ Final Checklist

- [ ] All files created and in place
- [ ] Environment configured
- [ ] Database initialized
- [ ] Redis connected
- [ ] API endpoints tested
- [ ] Frontend integration verified
- [ ] Docker builds successfully
- [ ] Docker Compose runs all services
- [ ] Tests passing
- [ ] Performance meets targets
- [ ] Monitoring in place
- [ ] Documentation complete
- [ ] Ready for production deployment

---

**Deployment Status**: 🟡 Ready for Testing  
**Last Updated**: January 2024  
**Maintainer**: ScruPeak Digital Property Team
