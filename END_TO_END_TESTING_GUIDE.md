# End-to-End Testing Guide: Admin Dashboard & Role-Based Access

## Overview
This guide provides step-by-step instructions to test the complete admin dashboard, role-based access control, and verification workflows across the ScruPeak platform.

---

## Part 1: Admin Access Setup

### Test 1.1: Admin User Login
**Objective**: Verify that josephemsamah@gmail.com is automatically assigned the ADMIN role

**Steps**:
1. Visit the application home page
2. Click "Get Started" or "Sign In"
3. Log in with Privy using **josephemsamah@gmail.com**
4. Verify the following:
   - ✅ User is authenticated successfully
   - ✅ Backend creates user with ADMIN role (auto-provisioned)
   - ✅ Dashboard is fully verified (kyc_verified=True)

**Expected Results**:
- User is logged in
- User profile in frontend shows role: "admin"
- User email shows as josephemsamah@gmail.com

### Test 1.2: Admin Navbar Links
**Objective**: Verify that admin sees the correct navbar options

**Steps**:
1. Log in as josephemsamah@gmail.com (admin)
2. Look at the desktop navigation menu

**Expected Results**:
- ✅ "Admin Panel" link appears in navbar (NOT "Dashboard")
- ✅ "Admin Panel" link is clickable and visible

**For Mobile**:
1. Open mobile menu (hamburger icon)
2. Verify "Admin Panel" link appears in mobile menu

---

## Part 2: Admin Dashboard Access

### Test 2.1: Admin Dashboard Main Page
**Objective**: Verify admin can access the admin dashboard and see system statistics

**Steps**:
1. Log in as admin (josephemsamah@gmail.com)
2. Click "Admin Panel" in navbar
3. Navigate to `/admin` URL

**Expected Results**:
- ✅ Page loads without permission errors
- ✅ Admin Dashboard displays with header "System Administration"
- ✅ System stats are displayed:
  - Total Users count
  - Properties count
  - Agent Approvals pending
  - System Status: "Healthy"

### Test 2.2: Admin Statistics API
**Objective**: Verify the backend statistics endpoint works

**Steps**:
1. Open browser developer tools (F12)
2. Go to Admin Dashboard
3. Watch Network tab for API call to `/api/v1/admin/system/stats`

**Expected Results**:
- ✅ API call returns 200 status
- ✅ Response includes:
  - users.total
  - users.verified
  - lands.total
  - lands.available
  - transactions.total_escrows

### Test 2.3: Admin Quick Actions
**Objective**: Verify quick action buttons work

**Steps**:
1. In Admin Dashboard, look for "Quick Actions" section
2. Verify buttons present:
   - Manage Users
   - Review Agents
   - Approve Lands
   - KYC Reviews

**Expected Results**:
- ✅ All buttons visible
- ✅ Each button links to correct admin page:
  - /admin/users
  - /admin/agents
  - /admin/lands
  - /admin/kyc

---

## Part 3: Agent Verification Workflow

### Test 3.1: Apply as Agent
**Objective**: Create an agent application for testing verification

**Steps**:
1. Log out from admin account
2. Create NEW user account (not admin email)
3. Log in with new account
4. Navigate to `/apply-role`
5. Complete agent application form with:
   - Full Legal Name: "Test Agent"
   - NIN: "123456789"
   - All required fields filled
6. Submit application

**Expected Results**:
- ✅ Application submitted successfully
- ✅ Message shows "Application submitted, pending admin review"
- ✅ Navbar shows "Application Pending" badge
- ✅ Dashboard link is NOT visible yet

### Test 3.2: Admin Reviews Agent Application
**Objective**: Verify admin can review agent applications

**Steps**:
1. Log in as admin (josephemsamah@gmail.com)
2. Navigate to `/admin/agents`
3. Look for "Pending Agent Applications" section
4. Find the test agent created in Test 3.1

**Expected Results**:
- ✅ Test agent appears in pending list
- ✅ Shows agent name, email, and details
- ✅ "Verify" button is available

### Test 3.3: Admin Verifies Agent
**Objective**: Verify the agent verification endpoint works

**Steps**:
1. In `/admin/agents`, click "Verify" button for test agent
2. Confirm verification in popup (if shown)

**Expected Results**:
- ✅ Success message appears
- ✅ Agent is removed from pending list
- ✅ Backend sets: user.role = AGENT, user.kyc_verified = True

### Test 3.4: Verified Agent Can Access Dashboard
**Objective**: Verify verified agent sees dashboard link and correct content

**Steps**:
1. Log out admin
2. Log in with test agent account
3. Check navbar

**Expected Results**:
- ✅ "Dashboard" link appears in navbar (for agent/owner + verified)
- ✅ "Application Pending" badge is gone

**Steps** (continued):
1. Click "Dashboard" or navigate to `/dashboard`

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows "Agent Dashboard" title
- ✅ Shows agent-specific content:
  - "Find Properties" button
  - Active Listings stat
  - Pending Transactions stat
  - Commissions Earned stat
  - Assigned Properties section
- ✅ Navbar shows "Verified" status

---

## Part 4: Landowner Verification Workflow

### Test 4.1: User Completes KYC
**Objective**: Verify a landowner can complete KYC but isn't verified yet

**Steps**:
1. Create NEW user account (if not already)
2. Log in
3. Navigate to `/kyc` or dashboard (will redirect to KYC if not verified)
4. Complete KYC submission with all required documents

**Expected Results**:
- ✅ KYC submission accepted
- ✅ Message shows "KYC submission pending review"
- ✅ User profile shows kyc_verified = False initially
- ✅ Dashboard link NOT visible in navbar

### Test 4.2: Admin Reviews KYC
**Objective**: Verify admin can review KYC submissions

**Steps**:
1. Log in as admin
2. Navigate to `/admin/kyc`
3. Find "Pending Submissions" section

**Expected Results**:
- ✅ KYC submission from Test 4.1 appears
- ✅ Shows user name, email, status

### Test 4.3: Admin Approves KYC & Verifies Landowner
**Objective**: Verify admin can approve KYC and grant dashboard access

**Steps**:
1. In `/admin/kyc`, find the KYC submission
2. Click "Approve" button

**Expected Results**:
- ✅ Success message appears
- ✅ User role updated to OWNER
- ✅ User kyc_verified set to True

**Alternative**: Using API directly for testing:
```bash
curl -X POST http://localhost:8000/api/v1/admin/landowners/{user_id}/verify \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

### Test 4.4: Verified Landowner Can Access Dashboard
**Objective**: Verify landowner sees dashboard link and correct content

**Steps**:
1. Log out admin
2. Log in with the KYC-verified user account
3. Check navbar

**Expected Results**:
- ✅ "Dashboard" link appears in navbar
- ✅ Link NOT labeled as "Seller Dashboard" but "Dashboard"

**Steps** (continued):
1. Click "Dashboard" or navigate to `/dashboard`

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows "Landowner Dashboard" title
- ✅ Shows landowner-specific content:
  - "List New Property" button
  - "Browse Listings" button
  - Active Listings stat
  - Inquiries stat
  - Documents stat
  - "Verify Status" showing all green checks
- ✅ Account status shows: Email, Phone, KYC all verified

---

## Part 5: Unverified User Restrictions

### Test 5.1: Unverified User Redirected from Dashboard
**Objective**: Verify unverified users cannot access dashboard

**Steps**:
1. Create NEW user account
2. Log in
3. Try to navigate directly to `/dashboard` URL

**Expected Results**:
- ✅ User is redirected to `/kyc`
- ✅ Message shows: "Verification Required"
- ✅ Button shows: "Complete KYC Now"
- ✅ Navbar does NOT show Dashboard link

### Test 5.2: Unverified User Can Browse Marketplace
**Objective**: Verify unverified users can still access public areas

**Steps**:
1. As unverified user, click "Listings" in navbar
2. Navigate to `/marketplace`

**Expected Results**:
- ✅ Page loads successfully
- ✅ User can browse listings
- ✅ User can view marketplace normally

### Test 5.3: Unverified User Cannot Apply for Role Twice
**Objective**: Verify "Application Pending" state prevents duplicate applications

**Steps**:
1. Apply as agent (complete the form and submit)
2. See "Application Pending" badge
3. Try to navigate to `/apply-role` again

**Expected Results**:
- ✅ Page shows "Application Pending" message
- ✅ "Be a Seller / Agent" link is disabled (replaced with badge)
- ✅ User cannot submit duplicate applications

---

## Part 6: Navbar Behavior Verification

### Test 6.1: Buyer Role Navbar
**Objective**: Verify buyer sees "Be a Seller / Agent" link

**Steps**:
1. Create new user (buyer role by default)
2. Log in
3. Check desktop navbar

**Expected Results**:
- ✅ Shows: "Be a Seller / Agent" link (if no pending application)
- ✅ Shows: "Application Pending" badge (if application exists)
- ✅ Does NOT show: "Dashboard" link
- ✅ Does NOT show: "Admin Panel" link

### Test 6.2: Agent/Owner Unverified Navbar
**Objective**: Verify unverified agent/owner doesn't see dashboard

**Steps**:
1. Create user and apply as agent
2. Check navbar BEFORE admin verification

**Expected Results**:
- ✅ Shows: "Application Pending" badge
- ✅ Does NOT show: "Dashboard" link
- ✅ Does NOT show: "Admin Panel" link

### Test 6.3: Agent/Owner Verified Navbar
**Objective**: Verify verified agent/owner sees dashboard

**Steps**:
1. After admin verifies agent/owner
2. Check navbar

**Expected Results**:
- ✅ Shows: "Dashboard" link (ONLY visible when verified)
- ✅ Does NOT show: "Application Pending" badge
- ✅ Does NOT show: "Admin Panel" link

### Test 6.4: Admin Navbar
**Objective**: Verify admin sees only "Admin Panel"

**Steps**:
1. Log in as josephemsamah@gmail.com
2. Check desktop navbar

**Expected Results**:
- ✅ Shows: "Admin Panel" link
- ✅ Does NOT show: "Dashboard" link
- ✅ Does NOT show: "Be a Seller / Agent" link

### Test 6.5: Mobile Navbar Behavior
**Objective**: Verify mobile menu reflects same logic

**Steps**:
1. Resize browser to mobile width (or use device)
2. For each user role, open mobile menu
3. Verify same links appear as desktop

**Expected Results**:
- ✅ Mobile menu matches desktop behavior for all roles

---

## Part 7: Admin Sub-Pages Verification

### Test 7.1: Admin Users Page Access
**Objective**: Verify /admin/users is protected and shows users

**Steps**:
1. Log in as admin
2. Click "Manage Users" in Admin Dashboard
3. Or navigate to `/admin/users` directly

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows list of users
- ✅ Shows user details (name, email, KYC status, role)

### Test 7.2: Admin Agents Page Access
**Objective**: Verify /admin/agents is protected and functional

**Steps**:
1. Log in as admin
2. Click "Review Agents" in Admin Dashboard
3. Or navigate to `/admin/agents` directly

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows pending agent applications
- ✅ Shows "Verify" and "Reject" action buttons

### Test 7.3: Admin Lands Page Access
**Objective**: Verify /admin/lands is protected and functional

**Steps**:
1. Log in as admin
2. Click "Approve Lands" in Admin Dashboard
3. Or navigate to `/admin/lands` directly

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows pending land listings for approval
- ✅ Shows "Approve" button with parcel ID generation

### Test 7.4: Admin KYC Page Access
**Objective**: Verify /admin/kyc is protected and functional

**Steps**:
1. Log in as admin
2. Click "KYC Reviews" in Admin Dashboard
3. Or navigate to `/admin/kyc` directly

**Expected Results**:
- ✅ Page loads successfully
- ✅ Shows KYC submissions
- ✅ Shows "Approve" and "Reject" buttons

---

## Part 8: Permission Denial Tests

### Test 8.1: Non-Admin Accessing Admin Routes
**Objective**: Verify non-admin users are denied admin access

**Steps**:
1. Log in as regular user (agent or owner)
2. Try to navigate directly to `/admin`
3. Try to navigate to `/admin/users`, `/admin/agents`, etc.

**Expected Results**:
- ✅ Redirected to home page `/`
- ✅ No error is shown (graceful redirect)
- ✅ User sees home page content

### Test 8.2: Non-Admin Accessing Admin API
**Objective**: Verify API endpoints are protected

**Steps**:
1. Get access token from non-admin user
2. In browser console, try API call:
   ```javascript
   fetch('/api/v1/admin/system/stats', {
     headers: { 'Authorization': 'Bearer ' + token }
   })
   ```

**Expected Results**:
- ✅ Returns 403 Forbidden
- ✅ Message: "Admin access required"

### Test 8.3: Unverified User Accessing Verified Routes
**Objective**: Verify unverified users cannot access protected routes

**Steps**:
1. Create user but don't verify KYC
2. Try to navigate to `/dashboard`
3. Check navbar

**Expected Results**:
- ✅ Redirected to `/kyc`
- ✅ Navbar does NOT show Dashboard link

---

## Part 9: Cross-Browser & Mobile Testing

### Test 9.1: Desktop Browser Testing
**Objective**: Verify functionality in Chrome, Firefox, Safari

**Steps**:
1. Perform critical tests (Admin login, agent verification, dashboard access) in:
   - Chrome
   - Firefox
   - Safari (if available)

**Expected Results**:
- ✅ All tests pass consistently across browsers
- ✅ Styling appears correct
- ✅ Navigation works properly

### Test 9.2: Mobile Responsiveness
**Objective**: Verify dashboards are mobile-responsive

**Steps**:
1. Log in as different user roles
2. Resize browser to mobile (iPhone 12 width: 390px)
3. Access each dashboard:
   - Admin Dashboard
   - Landowner Dashboard
   - Agent Dashboard

**Expected Results**:
- ✅ All dashboards are readable on mobile
- ✅ Buttons are touchable (48px+ height)
- ✅ Cards stack vertically appropriately
- ✅ Mobile menu works correctly

---

## Part 10: Error Handling Tests

### Test 10.1: Admin Stats API Failure
**Objective**: Verify graceful error handling

**Steps**:
1. Simulate API failure (disable network or use browser DevTools)
2. Go to Admin Dashboard
3. Click "Refresh" button

**Expected Results**:
- ✅ Error message displays: "Failed to load statistics"
- ✅ Page doesn't crash
- ✅ Fallback stats shown (0 values)

### Test 10.2: Verification API Failure
**Objective**: Verify error handling during verification

**Steps**:
1. (For local testing) Simulate API failure during agent verification
2. Try to verify agent

**Expected Results**:
- ✅ Error message displays
- ✅ User can retry
- ✅ Page doesn't crash

---

## Summary Checklist

- [ ] Admin user (josephemsamah@gmail.com) can log in and access admin panel
- [ ] Admin sees correct system statistics
- [ ] Agent application workflow works (apply → admin reviews → verify)
- [ ] Verified agent can access dashboard and sees Agent Dashboard
- [ ] Landowner KYC workflow works (complete KYC → admin verifies)
- [ ] Verified landowner can access dashboard and sees Landowner Dashboard
- [ ] Unverified users are redirected from dashboard
- [ ] Navbar correctly shows/hides dashboard link based on verification
- [ ] All three dashboard types (admin, agent, landowner) display correctly
- [ ] Admin sub-pages (users, agents, lands, kyc) are accessible and functional
- [ ] Non-admin users cannot access admin routes
- [ ] API endpoints properly check for admin role
- [ ] Mobile responsive design works across all pages
- [ ] Error handling works gracefully

---

## Deployment Notes

1. **Environment Variables**: Ensure PRIVY_APP_ID is set correctly
2. **Database**: Ensure all migrations have run
3. **Privy Configuration**: Ensure josephemsamah@gmail.com is added to test users in Privy console
4. **CORS**: Ensure CORS is configured for your deployment domain
5. **SSL/TLS**: Ensure HTTPS is enabled in production

---

## Quick Test Commands

### Test Admin Verification Endpoint
```bash
# Get admin token first
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"josephemsamah@gmail.com","password":"..."}' \

# Then use token to verify landowner
curl -X POST http://localhost:8000/api/v1/admin/landowners/{user_id}/verify \
  -H "Authorization: Bearer {admin_token}" \
  -H "Content-Type: application/json"
```

### Check User Role
```bash
curl http://localhost:8000/api/v1/users/me \
  -H "Authorization: Bearer {user_token}"
```

---

## Troubleshooting

### Admin link not showing in navbar
- Ensure user.role = "admin" in database
- Check AuthContext is receiving correct user data
- Verify Navbar component is reading user.role correctly

### Dashboard redirecting to KYC for verified users
- Check user.kyc_verified = True in database
- Verify AuthContext is synced with database user

### Admin routes showing "Redirect to home"
- Check ProtectedRoute component is checking allowedRoles
- Verify user.role = "admin"
- Check API endpoints have get_current_admin dependency

### Stats not loading in admin dashboard
- Check /api/v1/admin/system/stats endpoint is working
- Verify admin user is authenticated
- Check database queries in admin router

