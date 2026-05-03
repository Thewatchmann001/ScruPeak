# Quick Reference: Admin Dashboard & Role-Based Access

## Quick Start for Testing

### Test Admin Access
```
Email: josephemsamah@gmail.com
Role: Admin (auto-assigned on first login)
Access: /admin and all admin routes
Navbar: Shows "Admin Panel" link
```

### Test Agent Workflow
```
1. Create new account
2. Go to /apply-role
3. Fill agent form and submit
4. Wait for admin approval
5. After admin verifies → Dashboard link appears
6. Access /dashboard → Shows AgentDashboard
```

### Test Landowner Workflow
```
1. Create new account
2. Complete KYC at /kyc
3. Admin verifies as landowner
4. Dashboard link appears
5. Access /dashboard → Shows LandownerDashboard
```

---

## Key API Endpoints

### New Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| POST | /api/v1/admin/landowners/{user_id}/verify | Verify landowner | Admin |
| POST | /api/v1/admin/agents/{agent_id}/reject | Reject agent | Admin |

### Existing Endpoints

| Method | Endpoint | Purpose | Auth |
|--------|----------|---------|------|
| GET | /api/v1/admin/system/stats | System statistics | Admin |
| GET | /api/v1/admin/users | List users | Admin |
| POST | /api/v1/admin/agents/{agent_id}/verify | Verify agent | Admin |
| POST | /api/v1/admin/kyc/submissions/{id}/approve | Approve KYC | Admin |

---

## Frontend Routes

| Route | Role(s) | Status | Content |
|-------|---------|--------|---------|
| /admin | admin | Admin | Admin Dashboard |
| /admin/users | admin | Admin | User management |
| /admin/agents | admin | Admin | Agent verification |
| /admin/kyc | admin | Admin | KYC submissions |
| /admin/lands | admin | Admin | Land approval |
| /dashboard | owner, agent | Verified | Role-based dashboard |
| /apply-role | buyer | Any | Apply as agent |
| /kyc | Any | Any | KYC submission |

---

## Navbar Link Logic

```
┌─ User not authenticated
│  └─ Show: Sign In, Get Started
│
└─ User authenticated
   ├─ Role = admin
   │  └─ Show: Admin Panel, Logout
   │
   ├─ Role = buyer
   │  ├─ No agent app
   │  │  └─ Show: Be a Seller / Agent
   │  │
   │  └─ Agent app pending
   │     └─ Show: Application Pending (badge)
   │
   └─ Role = agent or owner
      ├─ kyc_verified = false
      │  └─ Dashboard link HIDDEN
      │
      └─ kyc_verified = true
         └─ Show: Dashboard
```

---

## Dashboard Types

### Admin Dashboard (/admin)
- System stats (users, lands, transactions)
- Pending verifications list
- Quick action buttons
- System health status
- Activity log

### Landowner Dashboard (/dashboard?role=owner)
- List New Property button
- Active listings stats
- Inquiries count
- Documents count
- Verification status
- Recent activity

### Agent Dashboard (/dashboard?role=agent)
- Find Properties button
- Active listings stats
- Pending transactions
- Commissions earned
- Assigned properties
- Performance stats

---

## Code Snippets

### Check User Role (Frontend)
```typescript
import { useAuth } from '@/context/AuthContext';

function MyComponent() {
  const { user } = useAuth();
  
  if (user?.role === 'admin') {
    return <AdminContent />;
  }
  
  if (user?.role === 'agent' || user?.role === 'owner') {
    if (user?.kyc_verified) {
      return <Dashboard />;
    } else {
      return <KYCPrompt />;
    }
  }
  
  return <DefaultContent />;
}
```

### Protect Admin Route (Frontend)
```typescript
<Route path="/admin" element={
  <ProtectedRoute allowedRoles={['admin']}>
    <AdminDashboard />
  </ProtectedRoute>
} />
```

### Check Admin Role (Backend)
```python
from app.utils.auth import get_current_admin

@router.get("/users")
async def list_users(
    current_user: User = Depends(get_current_admin),  # Ensures admin role
    db: AsyncSession = Depends(get_db)
):
    """List all users (admin only)"""
    result = await db.execute(select(User))
    return result.scalars().all()
```

### Verify Landowner (Backend)
```python
@router.post("/admin/landowners/{user_id}/verify")
async def verify_landowner(
    user_id: UUID,
    current_user: User = Depends(get_current_admin),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalars().first()
    
    user.role = UserRole.OWNER
    user.kyc_verified = True
    user.kyc_verified_at = datetime.utcnow()
    
    await db.commit()
    
    return {
        "user_id": str(user_id),
        "role": UserRole.OWNER,
        "kyc_verified": True,
        "message": "Landowner verified and can now access dashboard"
    }
```

---

## Common Debugging

### Admin user can't access /admin
```
1. Check database: SELECT role FROM users WHERE email='josephemsamah@gmail.com'
   Expected: 'admin'
   
2. Check browser console: Check user.role in AuthContext
   Expected: 'admin'
   
3. Check route: Is ProtectedRoute checking allowedRoles=['admin']?
   Yes: ✓
```

### Agent can't see Dashboard link
```
1. Check: user.role = 'agent'
   Query: SELECT role FROM users WHERE id={user_id}
   
2. Check: user.kyc_verified = true
   Query: SELECT kyc_verified FROM users WHERE id={user_id}
   
3. Check: Navbar component checking both conditions
   Code: {user?.role === 'agent' && user?.kyc_verified && ...}
```

### Dashboard shows wrong content
```
1. Check DashboardPage is rendering correct component
   - owner role? → LandownerDashboard
   - agent role? → AgentDashboard
   - other? → DefaultDashboard
   
2. Check user.role is correct
   console.log(user.role)
   
3. If wrong: Login/logout to sync AuthContext
```

---

## Performance Considerations

### API Calls
- Admin Dashboard calls `/admin/system/stats` on page load
- Error handled gracefully if API fails
- Stats are not real-time, refresh button available

### Component Rendering
- Role-based rendering happens at DashboardPage level
- Different components for different roles
- AgentDashboard is lighter than AdminDashboard

### Database Queries
- `get_current_admin` checks role on every admin endpoint
- Stats endpoint does full count queries (O(n))
- For large datasets, consider pagination in future

---

## File Locations

**Backend**
- Auth logic: `apps/backend/app/utils/auth.py`
- Admin endpoints: `apps/backend/app/routers/admin.py`

**Frontend**
- Navbar: `apps/web/src/components/layout/Navbar.tsx`
- Dashboards: `apps/web/src/pages/dashboard/DashboardPage.tsx`
- Admin: `apps/web/src/pages/admin/AdminDashboardPage.tsx`
- Routes: `apps/web/src/App.tsx`

---

## FAQ

**Q: How do I make someone an admin?**
A: Admin role is automatically assigned to josephemsamah@gmail.com on first login. To change, modify the email check in `app/utils/auth.py`:
```python
admin_role = UserRole.ADMIN if email == "new-admin@example.com" else UserRole.BUYER
```

**Q: Can I have multiple admins?**
A: Yes, modify the check to support a list:
```python
ADMIN_EMAILS = ["josephemsamah@gmail.com", "another-admin@example.com"]
admin_role = UserRole.ADMIN if email in ADMIN_EMAILS else UserRole.BUYER
```

**Q: What happens to an agent's pending application if admin rejects?**
A: Agent can reapply. Use the reject endpoint: `POST /admin/agents/{agent_id}/reject`

**Q: Can an admin access both admin and landowner dashboards?**
A: Not currently. Admin role only accesses /admin. To have both, would need role hierarchy refactor.

**Q: How long does dashboard verification take?**
A: Instantaneous after admin clicks verify. Agent/Landowner logs out/in to refresh AuthContext.

**Q: What if agent application is stuck in pending?**
A: Check database: `SELECT has_pending_agent_application FROM users WHERE id={user_id}`
If stuck, admin can call: `POST /admin/agents/{agent_id}/reject` to clear status

---

## Next Steps

1. **Deploy to staging** and test with END_TO_END_TESTING_GUIDE.md
2. **Set admin password** in production environment
3. **Configure Privy** to recognize admin email
4. **Add audit logging** for all admin actions
5. **Implement notifications** when agents/landowners are verified

---

## Support

For issues or questions, refer to:
- `ADMIN_DASHBOARD_IMPLEMENTATION.md` - Detailed implementation
- `END_TO_END_TESTING_GUIDE.md` - Comprehensive testing
- Backend code comments in `app/routers/admin.py`
- Frontend code comments in `Dashboard*.tsx` files

