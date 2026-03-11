# 🚀 QUICK DEPLOYMENT GUIDE

**Status**: Ready for production  
**Estimated Setup Time**: 30 minutes

---

## Step 1: Create Database Migration Files

Run these commands in `/apps/backend`:

```bash
# Create migration for new models
alembic revision --autogenerate -m "Add title verification, fraud detection, disputes, compliance"

# Review the migration file:
# It will be in alembic/versions/
```

---

## Step 2: Update Models Import

Edit `/apps/backend/app/models/__init__.py`:

```python
from app.models.title_verification import (
    TitleVerification, TitleIssue, VerificationHistory, 
    GovernmentRegistry, RegistrySyncLog
)

from app.models.fraud_detection import (
    FraudAnalysis, FraudFlag, PartyRiskProfile,
    FraudDetectionModel, FraudDetectionLog
)

from app.models.dispute_resolution import (
    Dispute, DisputeEvidenceSubmission, MediationSession,
    ArbitrationHearing, DisputeResolution, DisputeAuditTrail
)

from app.models.compliance import (
    ComplianceCheck, CompliancePolicy, ComplianceTraining,
    ComplianceReport, ComplianceAuditTrail
)

# Export all
__all__ = [
    # Existing...
    # Title Verification
    "TitleVerification", "TitleIssue", "VerificationHistory",
    "GovernmentRegistry", "RegistrySyncLog",
    # Fraud Detection
    "FraudAnalysis", "FraudFlag", "PartyRiskProfile",
    "FraudDetectionModel", "FraudDetectionLog",
    # Disputes
    "Dispute", "DisputeEvidenceSubmission", "MediationSession",
    "ArbitrationHearing", "DisputeResolution", "DisputeAuditTrail",
    # Compliance
    "ComplianceCheck", "CompliancePolicy", "ComplianceTraining",
    "ComplianceReport", "ComplianceAuditTrail",
]
```

---

## Step 3: Create __init__.py for Routers

Edit `/apps/backend/app/routers/__init__.py`:

```python
# Add to existing imports:
from . import title_verification
from . import fraud_detection
from . import dispute_resolution
from . import compliance
```

---

## Step 4: Run Migrations

```bash
cd /apps/backend

# Apply migrations
alembic upgrade head

# Verify tables were created
psql -U scrupeak -d scrupeak -c "\dt" | grep -E "title|fraud|dispute|compliance"
```

Expected output:
```
 public | title_verifications
 public | title_issues
 public | verification_history
 public | government_registries
 public | registry_sync_logs
 public | fraud_analyses
 public | fraud_flags
 public | party_risk_profiles
 public | fraud_detection_models
 public | fraud_detection_logs
 public | disputes
 public | dispute_evidence
 public | mediation_sessions
 public | arbitration_hearings
 public | dispute_resolutions
 public | dispute_audit_trail
 public | compliance_checks
 public | compliance_policies
 public | compliance_training
 public | compliance_reports
 public | compliance_audit_trail
```

---

## Step 5: Update Backend Requirements

```bash
# No new Python packages needed - all dependencies already installed

# But verify FastAPI version (should be 0.104+)
pip show fastapi

# If needed:
pip install --upgrade fastapi
```

---

## Step 6: Test Endpoints

```bash
# Start backend (if not running)
cd /apps/backend
python -m uvicorn app.main:app --reload

# In another terminal, test new endpoints:
curl http://localhost:8000/api/v1/docs

# Should show:
# - Title Verification (12 endpoints)
# - Fraud Detection (11 endpoints)  
# - Dispute Resolution (12 endpoints)
# - Compliance (13 endpoints)
```

---

## Step 7: Verify in Swagger UI

1. Open http://localhost:8000/api/v1/docs
2. Scroll down to new sections:
   - **title-verification** 
   - **fraud-detection**
   - **disputes**
   - **compliance**
3. Click "Try it out" on any endpoint to test

---

## Step 8: Run Tests

```bash
# Run backend tests (should all pass)
cd /apps/backend
pytest tests/ -v

# If any errors, check:
# - Database connection
# - Model imports
# - Router imports
```

---

## Step 9: Deploy to Staging

```bash
# Build Docker image
docker build -t scrupeak-backend:latest .

# Push to registry (if using Docker Hub/ECR)
docker tag scrupeak-backend:latest <your-registry>/scrupeak-backend:latest
docker push <your-registry>/scrupeak-backend:latest

# Deploy to staging
docker-compose -f docker-compose.yml up -d
```

---

## Step 10: Production Deployment

```bash
# 1. Backup production database
pg_dump -U scrupeak scrupeak > backup_$(date +%Y%m%d).sql

# 2. Deploy updated code
git pull origin main
docker build -t scrupeak-backend:1.1 .

# 3. Run migrations
docker-compose run backend alembic upgrade head

# 4. Restart services
docker-compose restart backend
docker-compose restart api-gateway

# 5. Monitor logs
docker-compose logs -f backend

# 6. Health check
curl http://localhost:8000/api/v1/health
```

---

## Rollback Plan (if needed)

```bash
# 1. Restore database from backup
psql -U scrupeak scrupeak < backup_YYYYMMDD.sql

# 2. Restart with previous version
docker-compose restart backend

# 3. Verify all systems online
curl http://localhost:8000/api/v1/health
```

---

## Troubleshooting

### Issue: Migration fails with "table already exists"
**Solution**: 
```bash
# Check existing migrations
alembic current

# If needed, reset:
alembic downgrade base
alembic upgrade head
```

### Issue: Import errors when starting backend
**Solution**:
```bash
# Clear Python cache
find . -type d -name __pycache__ -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Reinstall dependencies
pip install -r requirements.txt --force-reinstall

# Start backend
python -m uvicorn app.main:app --reload
```

### Issue: Endpoints not showing in Swagger
**Solution**:
1. Check `/api/v1/docs` - should show all routers
2. Verify routers are imported in `main.py`
3. Clear browser cache and refresh
4. Check for Python errors in console

### Issue: Database connection errors
**Solution**:
```bash
# Verify PostgreSQL is running
docker ps | grep postgis

# Check connection
psql -U scrupeak -h localhost -d scrupeak -c "SELECT 1"

# Check environment variables
cat .env | grep DB_
```

---

## Testing New Endpoints

### Test Title Verification:
```bash
curl -X POST http://localhost:8000/api/v1/title-verification/verify \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "land_id": "<uuid>",
    "registry_source": "NATIONAL_REGISTRY",
    "title_holder_name": "John Doe"
  }'
```

### Test Fraud Detection:
```bash
curl -X POST http://localhost:8000/api/v1/fraud-detection/analyze \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "<uuid>",
    "include_historical": true
  }'
```

### Test Dispute Filing:
```bash
curl -X POST http://localhost:8000/api/v1/disputes/file \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "land_id": "<uuid>",
    "defendant_id": "<uuid>",
    "dispute_type": "boundary",
    "title": "Boundary Dispute",
    "description": "Property boundary misaligned"
  }'
```

### Test Compliance Check:
```bash
curl -X POST http://localhost:8000/api/v1/compliance/check \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "<uuid>",
    "land_id": "<uuid>",
    "requirement_type": "aml_kyc",
    "jurisdiction": "federal",
    "jurisdiction_name": "United States"
  }'
```

---

## Performance Checklist

- [ ] All new tables have proper indexes
- [ ] Foreign keys properly defined
- [ ] Audit trail tables optimized for logging
- [ ] Query plans reviewed (EXPLAIN ANALYZE)
- [ ] Connection pooling configured
- [ ] Redis caching ready (for future optimization)
- [ ] Logging configured and tested
- [ ] Error tracking working

---

## Monitoring Setup

Add to your monitoring/alerting system:

```
Endpoints to monitor:
- /api/v1/title-verification/verify - Should have <200ms latency
- /api/v1/fraud-detection/analyze - Should have <500ms latency (ML processing)
- /api/v1/disputes/file - Should have <200ms latency
- /api/v1/compliance/check - Should have <200ms latency

Alerts:
- Error rate > 1%
- Response time > 1 second
- Database connection pool exhausted
- New fraud patterns detected (high risk)
- Compliance violations (critical)
```

---

## Success Criteria

✅ All new tables created  
✅ All 48 new endpoints working  
✅ API documentation updated  
✅ Admin dashboard shows new systems  
✅ Tests pass (or updated)  
✅ Staging deployment successful  
✅ Production deployment successful  
✅ Zero data loss  
✅ Performance acceptable (<200ms avg)  

---

## Timeline

- **Day 1**: Database migration + Testing (2 hours)
- **Day 2**: Staging deployment + UAT (4 hours)
- **Day 3**: Production deployment + Monitoring (2 hours)

**Total**: ~8 hours for complete rollout

---

Ready to go live! 🚀

Questions? Check the CRITICAL_SYSTEMS_COMPLETE.md guide.
