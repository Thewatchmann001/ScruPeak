# Deployment Checklist: Admin Dashboard & Role-Based Access

## Pre-Deployment

### Backend Verification
- [ ] `apps/backend/app/utils/auth.py` - Admin provisioning added
- [ ] `apps/backend/app/routers/admin.py` - Verification endpoints added
- [ ] All imports present (datetime, logging, UUID, etc.)
- [ ] Database models support all roles (ADMIN, AGENT, OWNER, BUYER)
- [ ] No syntax errors in backend code

### Frontend Verification
- [ ] `apps/web/src/components/layout/Navbar.tsx` - Updated
- [ ] `apps/web/src/pages/dashboard/DashboardPage.tsx` - Complete rewrite
- [ ] `apps/web/src/pages/admin/AdminDashboardPage.tsx` - Enhanced
- [ ] `apps/web/src/App.tsx` - Admin routes protected
- [ ] No TypeScript errors
- [ ] All imports present

### Environment Configuration
- [ ] PRIVY_APP_ID is set in `.env` or `.env.production`
- [ ] DATABASE_URL is correct
- [ ] API endpoints are reachable
- [ ] CORS is configured for your domain

---

## Testing in Staging

### Admin Setup
- [ ] Create test account with josephemsamah@gmail.com
- [ ] Can log in via Privy
- [ ] Backend auto-provisions with ADMIN role
- [ ] Can access `/admin` without errors
- [ ] Admin Dashboard loads and shows statistics

### Agent Verification Workflow
- [ ] Create new test user (agent)
- [ ] Navigate to `/apply-role`
- [ ] Complete agent application form
- [ ] Submit application
- [ ] See "Application Pending" badge in navbar
- [ ] Log in as admin
- [ ] Navigate to `/admin/agents`
- [ ] See pending agent in list
- [ ] Click "Verify" button
- [ ] Log out admin, log in as agent
- [ ] See "Dashboard" link in navbar
- [ ] Access `/dashboard` successfully
- [ ] See AgentDashboard content

### Landowner Verification Workflow
- [ ] Create new test user (landowner)
- [ ] Navigate to `/kyc`
- [ ] Complete KYC submission
- [ ] See "Verification Required" when trying to access dashboard
- [ ] Log in as admin
- [ ] Navigate to `/admin/users` or `/admin/kyc`
- [ ] Find user with kyc_verified=True
- [ ] Click "Verify as Landowner"
- [ ] Log out admin, log in as landowner
- [ ] See "Dashboard" link in navbar
- [ ] Access `/dashboard` successfully
- [ ] See LandownerDashboard content

### Unverified User Restrictions
- [ ] Create new user, DON'T verify KYC
- [ ] Try to navigate to `/dashboard`
- [ ] Get redirected to `/kyc`
- [ ] See "Verification Required" message
- [ ] Dashboard link NOT visible in navbar
- [ ] Can still access `/marketplace`

### Admin Routes Protection
- [ ] Log in as non-admin user
- [ ] Try to navigate to `/admin` directly
- [ ] Get redirected to home page
- [ ] No error message shown (graceful redirect)
- [ ] Try to access `/admin/users`, `/admin/agents`, etc.
- [ ] All redirected to home page

### API Endpoint Testing
- [ ] GET `/api/v1/admin/system/stats` returns 200 with stats
- [ ] POST `/api/v1/admin/agents/{id}/verify` works
- [ ] POST `/api/v1/admin/landowners/{id}/verify` works
- [ ] POST `/api/v1/admin/agents/{id}/reject` works
- [ ] All endpoints return 403 when called by non-admin

### Browser Compatibility
- [ ] Test in Chrome
- [ ] Test in Firefox
- [ ] Test in Safari (if available)
- [ ] All functionality works consistently

### Mobile Responsiveness
- [ ] Admin Dashboard responsive on mobile
- [ ] Landowner Dashboard responsive on mobile
- [ ] Agent Dashboard responsive on mobile
- [ ] Navbar works on mobile (hamburger menu)
- [ ] All buttons touchable (48px+ height)

### Error Handling
- [ ] Network failure during admin stats load - handled gracefully
- [ ] API error response - error message displayed
- [ ] Page reload during verification - no errors
- [ ] Invalid user ID - proper 404 response

---

## Database Checks

### User Table
```sql
-- Verify schema
DESC users;

-- Should have these columns:
-- - id (UUID)
-- - email (VARCHAR)
-- - role (ENUM: 'buyer', 'owner', 'agent', 'admin')
-- - kyc_verified (BOOLEAN)
-- - kyc_verified_at (DATETIME)
-- - has_pending_agent_application (BOOLEAN)
```

### Sample Data
```sql
-- Verify admin user exists
SELECT * FROM users WHERE email='josephemsamah@gmail.com';
-- Should show role='admin', kyc_verified=true

-- Verify verified agent exists
SELECT * FROM users WHERE role='agent' AND kyc_verified=true;

-- Verify verified landowner exists
SELECT * FROM users WHERE role='owner' AND kyc_verified=true;

-- Check pending agents
SELECT * FROM agents WHERE platform_verified=false;
```

---

## Performance Checks

### Page Load Times
- [ ] Admin Dashboard loads in < 2 seconds
- [ ] Landowner Dashboard loads in < 1.5 seconds
- [ ] Agent Dashboard loads in < 1.5 seconds
- [ ] Admin stats API responds in < 1 second

### Database Queries
- [ ] get_current_user() completes in < 100ms
- [ ] get_current_admin() completes in < 50ms
- [ ] Admin stats query completes in < 500ms

### Network
- [ ] No console errors
- [ ] No failed API calls
- [ ] No CORS errors
- [ ] All API calls successful

---

## Security Checks

### Authentication
- [ ] Privy token is validated on every protected endpoint
- [ ] Expired tokens are properly rejected
- [ ] Invalid tokens return 401 Unauthorized

### Authorization
- [ ] Admin role is checked on all admin endpoints
- [ ] Non-admin users cannot call admin endpoints
- [ ] Role verification happens both frontend and backend
- [ ] No direct role elevation possible

### Data Isolation
- [ ] Users can only see their own data
- [ ] Admin can see all users' data
- [ ] No private information exposed in API responses

### HTTPS/SSL
- [ ] All API calls use HTTPS (in production)
- [ ] SSL certificate is valid
- [ ] No mixed content warnings

---

## Production Deployment

### Pre-Production
- [ ] All staging tests pass
- [ ] Code review completed
- [ ] No console errors or warnings
- [ ] Performance metrics acceptable

### Deployment Steps
1. [ ] Backup production database
2. [ ] Deploy backend code
3. [ ] Deploy frontend code
4. [ ] Run database migrations (if any)
5. [ ] Verify admin email in environment
6. [ ] Test admin login in production

### Post-Deployment
- [ ] Monitor error logs
- [ ] Monitor API response times
- [ ] Verify admin functionality
- [ ] Verify agent verification workflow
- [ ] Verify landowner verification workflow
- [ ] Check user feedback
- [ ] Verify mobile access
- [ ] Check third-party integrations

---

## Monitoring & Alerts

### Set Up Monitoring
- [ ] Monitor `/api/v1/admin/*` endpoints for errors
- [ ] Monitor authentication failures
- [ ] Monitor page load times
- [ ] Monitor API response times
- [ ] Monitor database query performance

### Error Tracking
- [ ] Set up error logging (Sentry, LogRocket, etc.)
- [ ] Monitor frontend errors
- [ ] Monitor backend errors
- [ ] Set up alerts for critical errors

---

## Rollback Plan

If issues occur:

### Immediate Rollback
```bash
# Revert to previous version
git revert <commit-hash>
# Or
git checkout <previous-tag>
```

### Database Rollback
```bash
# Restore from backup
pg_restore -d production_db backup.sql
```

### Quick Fixes
- [ ] Clear browser cache
- [ ] Clear CDN cache
- [ ] Restart backend service
- [ ] Check Privy connection
- [ ] Verify database connection

---

## Sign-Off

### QA Sign-Off
- [ ] All tests passed
- [ ] No critical issues found
- [ ] Performance acceptable
- [ ] Security verified
- **Approved by**: _________________ **Date**: _______

### Product Owner Sign-Off
- [ ] Features meet requirements
- [ ] User experience acceptable
- [ ] Ready for production
- **Approved by**: _________________ **Date**: _______

### DevOps Sign-Off
- [ ] Deployment ready
- [ ] Monitoring configured
- [ ] Rollback plan in place
- **Approved by**: _________________ **Date**: _______

---

## Post-Deployment Monitoring (24 Hours)

### Metrics to Watch
- [ ] Error rate < 0.1%
- [ ] API response time avg < 500ms
- [ ] 99th percentile response time < 2s
- [ ] Zero authentication failures
- [ ] Zero authorization failures

### User Reports
- [ ] No critical issues reported
- [ ] Dashboard loading correctly
- [ ] Verification workflows working
- [ ] No performance complaints

### Database Health
- [ ] Database size normal
- [ ] Query performance normal
- [ ] No locks or contention
- [ ] Backups successful

---

## Ongoing Maintenance

### Weekly
- [ ] Review error logs
- [ ] Check database size
- [ ] Monitor slow queries
- [ ] Verify backups

### Monthly
- [ ] Performance analysis
- [ ] Security audit
- [ ] Database maintenance (VACUUM, ANALYZE)
- [ ] Dependency updates

### Quarterly
- [ ] Full security audit
- [ ] Performance optimization review
- [ ] Capacity planning
- [ ] Feature roadmap planning

---

## Support Resources

### During Deployment
- On-call engineer: ___________________
- Escalation contact: __________________
- War room channel: ____________________

### After Deployment
- Product team contact: _________________
- Engineering lead: ____________________
- Documentation: IMPLEMENTATION_COMPLETE_ADMIN_DASHBOARD.md

---

## Notes

### Known Issues
- [ ] None identified

### Outstanding Items
- [ ] None

### Future Work
- [ ] Sub-admin roles
- [ ] Audit trail UI
- [ ] Batch verification

---

## Checklist Summary

- [ ] Backend changes verified
- [ ] Frontend changes verified
- [ ] Environment configured
- [ ] Staging tests complete
- [ ] Database checks passed
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Mobile tested
- [ ] Error handling works
- [ ] Monitoring configured
- [ ] Rollback plan ready
- [ ] All sign-offs obtained
- [ ] Ready for production deployment

**Status**: Ready for deployment once all checkboxes are completed.

**Deployed**: _________ **Deployed By**: _____________ **Time**: _________

