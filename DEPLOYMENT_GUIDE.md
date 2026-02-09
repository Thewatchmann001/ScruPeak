# Deployment & Operations Guide

## 🚀 Deployment Checklist

### Pre-Deployment Verification

- [ ] All tests passing: `pytest tests/ -v`
- [ ] Code coverage >80%: `pytest tests/ --cov=app`
- [ ] No Pydantic warnings (can ignore for v1 compatibility)
- [ ] Environment variables configured
- [ ] Database backups enabled
- [ ] SSL/TLS certificates obtained
- [ ] Monitoring set up

### Environment Variables

Create `.env` file in `apps/backend/`:

```env
# Application
ENVIRONMENT=production
DEBUG=false

# Database
DATABASE_URL=postgresql+asyncpg://landbiznes:password@db-host:5432/landbiznes
DB_HOST=db-host
DB_PORT=5432
DB_NAME=landbiznes
DB_USER=landbiznes
DB_PASSWORD=<secure-password>

# Redis
REDIS_URL=redis://redis-host:6379
REDIS_HOST=redis-host
REDIS_PORT=6379

# JWT
SECRET_KEY=<generate-with-openssl-rand-hex-32>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

# CORS
ALLOWED_HOSTS=landbiznes.com,www.landbiznes.com,api.landbiznes.com

# Logging
LOG_LEVEL=INFO

# Features (optional)
ENABLE_WEBSOCKETS=true
ENABLE_PAYMENTS=true
```

**Generate SECRET_KEY (Linux/Mac)**:
```bash
openssl rand -hex 32
```

**Generate SECRET_KEY (Windows PowerShell)**:
```powershell
[System.Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes([guid]::NewGuid().ToString())) | % {$_.Substring(0, 32)}
```

---

## 🐳 Docker Deployment

### Using Docker Compose

**Production docker-compose.yml**:

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_USER: landbiznes
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: landbiznes
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U landbiznes"]
      interval: 10s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 5s
      retries: 5

  backend:
    build:
      context: ./services/api-gateway-node
      dockerfile: Dockerfile
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - REDIS_URL=${REDIS_URL}
      - SECRET_KEY=${SECRET_KEY}
      - ENVIRONMENT=production
    ports:
      - "8000:8000"
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    volumes:
      - ./logs:/app/logs
    restart: unless-stopped

volumes:
  postgres_data:
  redis_data:
```

**Deploy**:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

---

## 🚢 Kubernetes Deployment

### Backend Deployment

**deployment.yaml**:
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: landbiznes-backend
spec:
  replicas: 3
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
      - name: backend
        image: landbiznes/backend:latest
        ports:
        - containerPort: 8000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: landbiznes-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: landbiznes-secrets
              key: redis-url
        - name: SECRET_KEY
          valueFrom:
            secretKeyRef:
              name: landbiznes-secrets
              key: secret-key
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 8000
          initialDelaySeconds: 10
          periodSeconds: 5
```

### Service

**service.yaml**:
```yaml
apiVersion: v1
kind: Service
metadata:
  name: landbiznes-backend
spec:
  selector:
    app: backend
  ports:
  - protocol: TCP
    port: 80
    targetPort: 8000
  type: LoadBalancer
```

**Deploy to Kubernetes**:
```bash
kubectl apply -f deployment.yaml
kubectl apply -f service.yaml
kubectl get svc landbiznes-backend
```

---

## 📊 Monitoring & Logging

### Health Check Endpoint

**Request**:
```bash
curl http://localhost:8000/health
```

**Response**:
```json
{
  "status": "healthy",
  "database": "connected",
  "redis": "connected",
  "timestamp": "2024-01-15T10:30:00Z"
}
```

### Database Monitoring

**Check active connections**:
```sql
SELECT count(*) FROM pg_stat_activity;
```

**Check table sizes**:
```sql
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### Redis Monitoring

**Check memory usage**:
```bash
redis-cli INFO memory
```

**Check key count**:
```bash
redis-cli DBSIZE
```

---

## 🔄 Database Backups

### PostgreSQL Backup

**Full backup**:
```bash
pg_dump -U landbiznes -h localhost landbiznes > backup.sql
```

**Compressed backup**:
```bash
pg_dump -U landbiznes -h localhost landbiznes | gzip > backup.sql.gz
```

**Automated daily backup (cron)**:
```bash
# Add to crontab: crontab -e
0 2 * * * pg_dump -U landbiznes -h localhost landbiznes | gzip > /backups/landbiznes_$(date +\%Y\%m\%d).sql.gz
```

### Restore from Backup

```bash
gunzip < backup.sql.gz | psql -U landbiznes -h localhost landbiznes
```

---

## 🔐 Security Hardening

### Enable HTTPS

**Using Let's Encrypt with Certbot**:
```bash
certbot certonly --standalone -d landbiznes.com -d www.landbiznes.com
```

**Configure Nginx proxy**:
```nginx
server {
    listen 443 ssl http2;
    server_name landbiznes.com www.landbiznes.com;
    
    ssl_certificate /etc/letsencrypt/live/landbiznes.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/landbiznes.com/privkey.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

server {
    listen 80;
    server_name landbiznes.com www.landbiznes.com;
    return 301 https://$server_name$request_uri;
}
```

### Rate Limiting

**Add to FastAPI (app/main.py)**:
```python
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
```

**Apply to routes**:
```python
@router.post("/login")
@limiter.limit("5/minute")
async def login(request: Request, ...):
    ...
```

### Security Headers

**Update app/main.py**:
```python
@app.middleware("http")
async def add_security_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
    response.headers["Content-Security-Policy"] = "default-src 'self'"
    return response
```

---

## 📈 Performance Optimization

### Database Query Optimization

**Add indexes for frequently searched columns**:
```sql
CREATE INDEX idx_lands_owner_id ON lands(owner_id);
CREATE INDEX idx_lands_status ON lands(status);
CREATE INDEX idx_lands_region ON lands(region);
CREATE INDEX idx_lands_price ON lands(price);
CREATE INDEX idx_lands_created_at ON lands(created_at);
```

### Redis Caching

**Cache property listings** (in app/routers/land.py):
```python
@router.get("")
async def search_properties(
    region: Optional[str] = None,
    cache: Redis = Depends(get_redis)
):
    cache_key = f"properties:{region}"
    cached = await cache.get(cache_key)
    if cached:
        return json.loads(cached)
    
    # Query database
    results = ...
    
    # Cache for 1 hour
    await cache.setex(cache_key, 3600, json.dumps(results))
    return results
```

### Connection Pooling

**Verify pool settings** (app/core/database.py):
```python
engine = create_async_engine(
    DATABASE_URL,
    echo=False,
    poolclass=AsyncAdaptedQueuePool,
    pool_size=20,           # Max connections in pool
    max_overflow=10,        # Max additional connections
    pool_recycle=3600,      # Recycle connections after 1 hour
)
```

---

## 🚨 Troubleshooting

### Database Connection Issues

**Check PostgreSQL is running**:
```bash
pg_isready -h localhost -U landbiznes
```

**Verify credentials**:
```bash
psql -U landbiznes -h localhost -c "SELECT version();"
```

### Redis Connection Issues

**Check Redis is running**:
```bash
redis-cli ping
```

**Verify connectivity**:
```bash
redis-cli -h localhost ping
```

### API Not Responding

**Check logs**:
```bash
docker logs landbiznes-backend
# or
tail -f /var/log/landbiznes/backend.log
```

**Test endpoint**:
```bash
curl -v http://localhost:8000/health
```

### Memory Issues

**Check backend memory usage**:
```bash
docker stats landbiznes-backend
```

**Adjust limits** in docker-compose.yml:
```yaml
deploy:
  resources:
    limits:
      memory: 1G
    reservations:
      memory: 512M
```

---

## 📝 Maintenance Tasks

### Weekly
- [ ] Review error logs
- [ ] Check database size
- [ ] Verify backups completed
- [ ] Monitor API response times

### Monthly
- [ ] Update dependencies: `pip list --outdated`
- [ ] Security scan: `bandit -r app/`
- [ ] Performance analysis
- [ ] Clean up old logs

### Quarterly
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Database optimization
- [ ] Capacity planning

---

## 📞 Rollback Procedure

### If Deployment Fails

**Roll back to previous version**:
```bash
docker-compose down
docker pull landbiznes/backend:previous
docker-compose -f docker-compose.prod.yml up -d
```

**Or with Kubernetes**:
```bash
kubectl rollout undo deployment/landbiznes-backend
kubectl rollout history deployment/landbiznes-backend
```

### Database Rollback

**If data migration fails**:
```bash
# Restore from backup
gunzip < backup.sql.gz | psql -U landbiznes landbiznes
```

---

## 📊 Metrics & KPIs

**Target Metrics**
- Response Time: <200ms (p95)
- Error Rate: <0.1%
- Uptime: 99.9%
- Throughput: >1000 req/s
- Database Connections: <100

**Monitoring Tools**
- Prometheus: Metrics collection
- Grafana: Visualization
- ELK Stack: Log aggregation
- New Relic: APM

---

**Version**: 1.0
**Last Updated**: 2024
**Status**: Production Ready
