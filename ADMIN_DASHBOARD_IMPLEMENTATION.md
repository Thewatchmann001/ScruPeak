# Admin Dashboard & Role-Based Access - Implementation Details

## Overview
This document provides a comprehensive summary of all changes made to implement admin dashboard, role-based access control, and verification workflows for agents and landowners in the ScruPeak platform.

---

## Architecture

### Three User Roles
1. **ADMIN**: System management, user verification, compliance oversight
2. **AGENT**: Real estate agents, facilitate transactions, earn commissions
3. **OWNER** (Landowner): Property owners, list lands, manage inquiries

### Three Dashboard Types
- **Admin Dashboard** (`/admin`) - Manage system, verify users, view stats
- **Agent Dashboard** (`/dashboard`) - View listings, transactions, commissions
- **Landowner Dashboard** (`/dashboard`) - List properties, manage inquiries, track documents

---

## Backend Implementation

### 1. Authentication (app/utils/auth.py)

**Changes Made**:
```python
# Auto-provisioning admin user
admin_role = UserRole.ADMIN if email == "josephemsamah@gmail.com" else UserRole.BUYER
user = User(
    email=email,
    name=name,
    role=admin_role,
    kyc_verified=True if admin_role == UserRole.ADMIN else False
)
```

**How it works**:
- When josephemsamah@gmail.com logs in via Privy
- Backend JIT provisioning automatically creates them with ADMIN role
- Admin is auto-verified (kyc_verified=True)
- This happens in `get_current_user()` dependency

**Key Benefit**: No manual database setup needed - admin is auto-provisioned on first login

### 2. Admin Router (app/routers/admin.py)

**Existing Endpoints**:
- `GET /api/v1/admin/users` - List all users
- `POST /api/v1/admin/users/{user_id}/kyc/approve` - Approve KYC (legacy)
- `POST /api/v1/admin/agents/{agent_id}/verify` - Verify agent
- `GET /api/v1/admin/system/stats` - System statistics
- `POST /api/v1/admin/land/{land_id}/approve` - Approve land listing

**New Endpoints**:
```python
POST /api/v1/admin/landowners/{user_id}/verify
- Purpose: Verify landowner after KYC completion
- Body: None (user_id in URL)
- Response: {user_id, role: "owner", kyc_verified: true, message}
- Sets: user.role = OWNER, user.kyc_verified = True

POST /api/v1/admin/agents/{agent_id}/reject
- Purpose: Reject agent application
- Body: {reason: string}
- Response: {agent_id, status: "rejected", reason}
- Sets: user.has_pending_agent_application = False
```

**Authorization**: All endpoints require `get_current_admin` dependency
```python
async def get_current_admin(
    current_user: User = Depends(get_current_user),
) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user
```

### 3. Database Models (app/models/__init__.py)

**User Model Fields Used**:
- `role` (Enum: BUYER, OWNER, AGENT, ADMIN)
- `kyc_verified` (Boolean)
- `kyc_verified_at` (DateTime)
- `has_pending_agent_application` (Boolean)

**No new fields needed** - existing User model already supports all roles

### 4. Workflow: Agent Verification

**Agent Application Flow**:
```
1. User selects "Be a Seller / Agent" in navbar
2. Navigates to /apply-role
3. Fills RoleApplicationPage form
4. Submits to POST /api/v1/agents (existing endpoint)
5. Backend creates Agent record, sets user.has_pending_agent_application = True

6. Admin views /admin/agents
7. Admin reviews pending agent applications
8. Admin clicks "Verify" button
9. Frontend calls POST /api/v1/admin/agents/{agent_id}/verify
10. Backend:
    - Sets Agent.platform_verified = True
    - Sets User.role = AGENT
    - Sets User.kyc_verified = True
    - Sets User.has_pending_agent_application = False
    - Logs verification event

11. Agent logs back in
12. Navbar now shows "Dashboard" (because role=AGENT and kyc_verified=True)
13. Agent navigates to /dashboard
14. DashboardPage detects role=AGENT and renders AgentDashboard
```

### 5. Workflow: Landowner Verification

**Landowner Verification Flow**:
```
1. User creates account (default role = BUYER)
2. User completes KYC at /kyc
3. User kyc_verified = True, but role still = BUYER
4. Dashboard link still hidden (requires role = OWNER or AGENT)

5. Admin views /admin/users or /admin/kyc
6. Admin finds user with kyc_verified=True but role=BUYER
7. Admin clicks "Verify as Landowner"
8. Frontend calls POST /api/v1/admin/landowners/{user_id}/verify
9. Backend:
    - Sets User.role = OWNER
    - User.kyc_verified remains True
    - Logs verification event

10. Landowner logs back in
11. Navbar now shows "Dashboard" (because role=OWNER and kyc_verified=True)
12. Landowner navigates to /dashboard
13. DashboardPage detects role=OWNER and renders LandownerDashboard
```

---

## Frontend Implementation

### 1. Navigation Component (src/components/layout/Navbar.tsx)

**Changes Made**:

**Before**:
```tsx
{isAuthenticated && user?.email === 'josephemsamah@gmail.com' && (
  <NavLink to="/admin">Admin</NavLink>
)}
```

**After**:
```tsx
{isAuthenticated && user?.role === 'admin' && (
  <NavLink to="/admin">Admin Panel</NavLink>
)}
```

**Dashboard Link Logic**:

**Before**:
```tsx
{isAuthenticated && (user?.role === 'agent' || user?.role === 'owner') && (
  <NavLink to="/sell">Dashboard</NavLink>
)}
```

**After**:
```tsx
{isAuthenticated && (user?.role === 'agent' || user?.role === 'owner') && user?.kyc_verified && (
  <NavLink to="/dashboard">Dashboard</NavLink>
)}
```

**Key Points**:
- Dashboard link only shows if BOTH conditions are true:
  1. Role is agent OR owner
  2. kyc_verified is true
- This ensures unverified agents/owners don't see dashboard link
- Admin sees "Admin Panel" instead of "Dashboard"

### 2. Dashboard Page (src/pages/dashboard/DashboardPage.tsx)

**Changes Made**: Complete rewrite with role-based rendering

**Structure**:
```
export default DashboardPage()
  ├─ Check: user.kyc_verified
  │  └─ If false: Show "Verification Required" alert
  │
  ├─ Check: user.role
  │  ├─ If "owner": Render LandownerDashboard
  │  ├─ If "agent": Render AgentDashboard
  │  └─ Else: Render DefaultDashboard
```

**LandownerDashboard Features**:
- "List New Property" button (links to /sell)
- Active listings count
- Inquiries count
- Documents count
- Verification status checkmarks
- Recent activity timeline

**AgentDashboard Features**:
- "Find Properties" button (links to /marketplace)
- Active listings count
- Pending transactions count
- Commissions earned display
- Pending approvals count
- Assigned properties list
- Performance statistics
- Verification status checkmarks

**DefaultDashboard Features**:
- Generic dashboard for other roles
- Stats cards (views, inquiries, documents, actions)
- Recent activity timeline
- Account status verification

### 3. Admin Dashboard (src/pages/admin/AdminDashboardPage.tsx)

**Changes Made**: Major enhancement with real API integration

**Key Features**:
1. **System Statistics**:
   - Fetches from `GET /api/v1/admin/system/stats`
   - Displays: users (total, verified), lands (total, available, sold, pending)
   - Shows agent approvals pending

2. **Pending Verifications**:
   - List of agents pending review
   - List of landowners pending verification
   - Links to respective admin pages

3. **Quick Actions**:
   - Manage Users (→ /admin/users)
   - Review Agents (→ /admin/agents)
   - Approve Lands (→ /admin/lands)
   - KYC Reviews (→ /admin/kyc)

4. **System Health**:
   - Status indicators (Online/Offline)
   - API Server, Database, Blockchain, Email service status

5. **Transaction Summary**:
   - Total escrows count
   - Compliance percentage

6. **Activity Log**:
   - Recent verification actions
   - Land approvals
   - System events

### 4. App Routing (src/App.tsx)

**Changes Made**: Added ProtectedRoute with admin role check

**Before**:
```tsx
<Route path="/admin" element={
  <AdminLayout>
    <AdminDashboardPage />
  </AdminLayout>
} />
```

**After**:
```tsx
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminLayout>
      <AdminDashboardPage />
    </AdminLayout>
  </ProtectedRoute>
} />
```

**Applied to all admin routes**:
- /admin
- /admin/agents
- /admin/users
- /admin/lands
- /admin/kyc
- /admin/tax

### 5. Protected Route Component (src/components/auth/ProtectedRoute.tsx)

**How it works**:
```tsx
if (!isAuthenticated) {
  // Redirect to login
  return <Navigate to="/auth/login" replace />;
}

if (allowedRoles && user && !allowedRoles.includes(user.role)) {
  // Redirect to home if role not allowed
  return <Navigate to="/" replace />;
}

return <>{children}</>;
```

**This ensures**:
- Unauthenticated users are redirected to login
- Users with wrong role are redirected to home
- Only users with allowed role can access the page

---

## API Integration

### Admin Stats Endpoint Usage

**Frontend Call**:
```typescript
// In AdminDashboardPage.tsx
const response = await api.get('/api/v1/admin/system/stats');
setStats(response.data);
```

**Backend Response Format**:
```json
{
  "users": {
    "total": 152,
    "verified": 48,
    "banned": 0
  },
  "lands": {
    "total": 45,
    "available": 32,
    "sold": 8,
    "pending": 5
  },
  "transactions": {
    "total_escrows": 12
  }
}
```

**Error Handling**:
```typescript
catch (err: any) {
  setError(err.response?.data?.detail || 'Failed to load statistics');
  setStats({
    users: { total: 0, verified: 0, banned: 0 },
    lands: { total: 0, available: 0, sold: 0, pending: 0 },
    transactions: { total_escrows: 0 }
  });
}
```

### Agent Verification Endpoint

**Frontend Call**:
```typescript
const response = await api.post(
  `/api/v1/admin/agents/${agentId}/verify`
);
```

**Backend Response**:
```json
{
  "agent_id": "uuid",
  "platform_verified": true,
  "message": "Agent verified"
}
```

### Landowner Verification Endpoint

**Frontend Call**:
```typescript
const response = await api.post(
  `/api/v1/admin/landowners/${userId}/verify`
);
```

**Backend Response**:
```json
{
  "user_id": "uuid",
  "role": "owner",
  "kyc_verified": true,
  "message": "Landowner verified and can now access dashboard"
}
```

---

## Data Flow Diagrams

### Admin Login Flow
```
josephemsamah@gmail.com logs in via Privy
        ↓
Frontend gets Privy token
        ↓
Backend verifies token in get_current_user()
        ↓
JIT Provisioning checks email
        ↓
Email = "josephemsamah@gmail.com" ?
  ├─ YES → Create user with role=ADMIN, kyc_verified=True
  └─ NO → Create user with role=BUYER
        ↓
AuthContext receives user with role=admin
        ↓
Navbar displays "Admin Panel" link
        ↓
User clicks Admin Panel
        ↓
ProtectedRoute checks allowedRoles=['admin']
        ↓
User.role == 'admin' ? → YES
        ↓
AdminDashboardPage loads
```

### Agent Verification Flow
```
Agent User
  ├─ Selects "Be a Seller / Agent"
  ├─ Fills application form
  └─ Submits → POST /api/v1/agents
       ↓
Backend creates Agent record
User.has_pending_agent_application = True
User.role still = BUYER
Navbar shows "Application Pending" badge
       ↓
Admin User
  ├─ Navigates to /admin/agents
  ├─ Sees pending agent in list
  └─ Clicks "Verify"
       ↓
Frontend calls POST /api/v1/admin/agents/{agent_id}/verify
       ↓
Backend:
  ├─ Agent.platform_verified = True
  ├─ User.role = AGENT
  ├─ User.kyc_verified = True
  └─ User.has_pending_agent_application = False
       ↓
Agent logs back in
AuthContext receives user with role=agent, kyc_verified=true
Navbar shows "Dashboard" link
Agent clicks Dashboard
DashboardPage renders AgentDashboard
```

### Landowner Verification Flow
```
User
  ├─ Creates account (role = BUYER)
  ├─ Navigates to /kyc
  └─ Completes KYC submission
       ↓
Admin reviews and approves KYC
User.kyc_verified = True, role still BUYER
Dashboard link hidden (needs role = OWNER or AGENT)
       ↓
Admin navigates to /admin/users or /admin/kyc
Finds user with kyc_verified=True, role=BUYER
Clicks "Verify as Landowner"
       ↓
Frontend calls POST /api/v1/admin/landowners/{user_id}/verify
       ↓
Backend:
  ├─ User.role = OWNER
  └─ User.kyc_verified remains True
       ↓
Landowner logs back in
AuthContext receives user with role=owner, kyc_verified=true
Navbar shows "Dashboard" link
Landowner clicks Dashboard
DashboardPage renders LandownerDashboard
```

---

## Configuration & Environment

### No Additional Configuration Needed
- Uses existing Privy authentication
- Uses existing database models
- Uses existing API architecture

### Required for Production
- PRIVY_APP_ID environment variable (already set)
- Database with User table (already exists)
- Privy configured with josephemsamah@gmail.com as test user

---

## Testing & Validation

### Unit Tests to Add
1. `test_admin_auto_provisioning()` - Verify admin email gets admin role
2. `test_agent_verification_endpoint()` - Verify agent can be verified
3. `test_landowner_verification_endpoint()` - Verify landowner can be verified
4. `test_dashboard_redirects_unverified()` - Verify unverified redirected to KYC
5. `test_navbar_shows_dashboard_only_when_verified()` - Verify navbar logic

### Integration Tests
1. Complete agent application to verification flow
2. Complete KYC to landowner verification flow
3. Admin accessing all sub-pages
4. Non-admin attempting to access admin routes

### E2E Tests
See END_TO_END_TESTING_GUIDE.md for comprehensive test scenarios

---

## Security Considerations

### Role-Based Access Control (RBAC)
- ✅ Admin role strictly controlled by email match during JIT provisioning
- ✅ Admin endpoints require `get_current_admin` dependency
- ✅ Frontend routes wrapped with ProtectedRoute
- ✅ All role checks happen on both frontend and backend

### Verification Workflow Security
- ✅ Only admins can verify agents/landowners
- ✅ Verification creates audit trail in database
- ✅ JIT provisioning only assigns ADMIN to specific email

### Potential Vulnerabilities & Mitigations
- **Email spoofing**: Use Privy's verified email claims
- **Role escalation**: Check role on every protected endpoint
- **Token replay**: Privy handles JWT security
- **Admin access**: Limited to one email, can be changed in config

---

## Future Enhancements

### Phase 2
- [ ] Admin can revoke verification
- [ ] Verification audit trail UI
- [ ] Batch verification operations
- [ ] Agent performance dashboard
- [ ] Landowner analytics

### Phase 3
- [ ] Sub-admin roles (agents manager, lands manager)
- [ ] Custom verification requirements per region
- [ ] Automated verification workflows
- [ ] KYC integration with external services

---

## Deployment Checklist

- [ ] Verify PRIVY_APP_ID is set
- [ ] Run database migrations
- [ ] Test admin provisioning in staging
- [ ] Verify Privy has test users configured
- [ ] Test agent verification workflow
- [ ] Test landowner verification workflow
- [ ] Check all admin routes are protected
- [ ] Verify navbar shows correct links for each role
- [ ] Test on mobile devices
- [ ] Test error handling (network failures, API errors)
- [ ] Performance test with large user counts
- [ ] Security audit of endpoints

---

## Support & Troubleshooting

### Common Issues

**Issue**: Admin can't access /admin
- Check: user.role = 'admin' in database
- Check: Privy email matches josephemsamah@gmail.com
- Check: ProtectedRoute has allowedRoles=['admin']

**Issue**: Dashboard link not showing for verified agent
- Check: user.kyc_verified = True
- Check: user.role = 'agent'
- Check: Navbar re-renders after verification
- Check: AuthContext is synced with backend

**Issue**: Agent/Landowner verification fails
- Check: Admin has admin role
- Check: User exists in database
- Check: Agent record exists for agent verification

---

## Files Modified Summary

**Backend**:
- ✅ app/utils/auth.py - Admin JIT provisioning
- ✅ app/routers/admin.py - Verification endpoints

**Frontend**:
- ✅ src/components/layout/Navbar.tsx - Dashboard visibility logic
- ✅ src/pages/dashboard/DashboardPage.tsx - Role-based rendering
- ✅ src/pages/admin/AdminDashboardPage.tsx - Admin dashboard UI
- ✅ src/App.tsx - Admin route protection

**Documentation**:
- ✅ END_TO_END_TESTING_GUIDE.md - Comprehensive testing guide

---

## References

- Privy Docs: https://docs.privy.io
- FastAPI Security: https://fastapi.tiangolo.com/tutorial/security/
- React Router: https://reactrouter.com/
- SQLAlchemy: https://docs.sqlalchemy.org/

