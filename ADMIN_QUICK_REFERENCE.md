# Quick Reference: Admin Role Management

## 🚀 Quick Start

### For Super Admin (josephemsamah@gmail.com)
1. Sign in with your email
2. Go to `/admin` (Admin Dashboard)
3. Click "Manage Admins" card
4. Add new admins with roles

### Available Routes
- **Admin Dashboard**: http://localhost:3000/admin
- **Manage Admins**: http://localhost:3000/admin/manage
- **Verify Documents**: http://localhost:3000/admin/documents
- **Verify Agents**: http://localhost:3000/admin/agents
- **KYC Verification**: http://localhost:3000/admin/kyc
- **Land IDs**: http://localhost:3000/admin/land-ids

## 👥 Admin Roles & Permissions

### 1. Super Admin
- **Email**: josephemsamah@gmail.com (hardcoded)
- **Can Do**: Everything (manage admins, verify all, system settings)
- **Access**: All admin pages
- **Special**: Only role that can manage other admins

### 2. Document Verifier
- **Can Do**: Verify land documents, AI analysis, flag issues
- **Access**: `/admin/documents`
- **Cannot**: Manage admins, verify agents/KYC

### 3. KYC Officer
- **Can Do**: Verify KYC applications, review documents, approve/reject
- **Access**: `/admin/kyc`
- **Cannot**: Manage admins, verify documents/agents

### 4. Agent Verifier
- **Can Do**: Verify agents, check credentials, approve/reject
- **Access**: `/admin/agents`
- **Cannot**: Manage admins, verify documents/KYC

### 5. Support Officer
- **Can Do**: Handle tickets, respond to users, view complaints
- **Access**: Support portal (when built)
- **Cannot**: Verify anything, manage admins

## 📋 How to Add a New Admin

1. **Sign in** as josephemsamah@gmail.com
2. **Go to** `/admin/manage`
3. **Click** "Add Admin" button
4. **Fill in**:
   - Admin Name: Full name
   - Email: Email address
   - Admin Role: Select from dropdown
5. **Click** "Create Admin"
6. **Done!** New admin can now sign in

## 🔐 Access Control

```
┌─────────────────────────────────────┐
│   Super Admin                       │
│   (josephemsamah@gmail.com)         │
│   - All admin pages                 │
│   - Manage other admins             │
│   - Full system access              │
└──────────────┬──────────────────────┘
               │
    ┌──────────┼──────────┐
    ▼          ▼          ▼
  Doc        KYC       Agent
Verifier    Officer   Verifier
  │          │          │
  └──────────┼──────────┘
             ▼
      Specific Access Only
      (Cannot manage admins)
```

## 📱 Admin Dashboard Cards

| Card | Link | Feature |
|------|------|---------|
| Upload Documents | `/admin/documents` | Upload & verify land docs |
| Verify Agents | `/admin/agents` | Approve agents |
| Land IDs | `/admin/land-ids` | View generated IDs |
| Manage Admins | `/admin/manage` | Add/remove other admins |

## ✅ Permission Matrix

| Feature | Super Admin | Doc Verifier | KYC Officer | Agent Verifier | Support |
|---------|:-----------:|:------------:|:-----------:|:--------------:|:-------:|
| Manage Admins | ✅ | ❌ | ❌ | ❌ | ❌ |
| Verify Docs | ✅ | ✅ | ❌ | ❌ | ❌ |
| Verify KYC | ✅ | ❌ | ✅ | ❌ | ❌ |
| Verify Agents | ✅ | ❌ | ❌ | ✅ | ❌ |
| View Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| System Settings | ✅ | ❌ | ❌ | ❌ | ❌ |

## 🎯 Current Admins (Sample Data)

| Name | Email | Role | Status |
|------|-------|------|--------|
| Joseph Emsamah | josephemsamah@gmail.com | Super Admin | Active |
| Amara Conteh | amara.conteh@landbiznes.com | Document Verifier | Active |
| Mohamed Hassan | mohamed.hassan@landbiznes.com | KYC Officer | Active |

## 🔗 File Structure

```
frontend/
├── src/
│   ├── app/admin/
│   │   ├── page.tsx              ← Main Dashboard
│   │   ├── manage/
│   │   │   └── page.tsx          ← Add/Manage Admins (SUPER ADMIN ONLY)
│   │   ├── documents/
│   │   │   └── page.tsx          ← Document Verification
│   │   ├── agents/
│   │   │   └── page.tsx          ← Agent Verification
│   │   ├── kyc/
│   │   │   └── page.tsx          ← KYC Verification
│   │   └── land-ids/
│   │       └── page.tsx          ← Land ID Generator
│   ├── components/admin/
│   │   └── AdminLayout.tsx       ← Route Protection
│   └── context/
│       └── AuthContext.tsx       ← Auth Management
```

## 🧪 Testing Checklist

- [ ] Sign in as josephemsamah@gmail.com
- [ ] Access `/admin` dashboard
- [ ] See "Manage Admins" card
- [ ] Click "Manage Admins" → goes to `/admin/manage`
- [ ] See current admins list
- [ ] Fill "Add Admin" form with test data
- [ ] Click "Create Admin"
- [ ] New admin appears in list
- [ ] Try to remove an existing admin
- [ ] Sign out and sign in as different user
- [ ] Try to access `/admin` → should redirect to home
- [ ] Try to access `/admin/manage` → should show "Access Restricted"

## 💡 Pro Tips

1. **Super Admin Email is Hardcoded**: josephemsamah@gmail.com cannot be changed in frontend
2. **Can't Remove Self**: Super admin cannot remove their own account
3. **Sample Data**: Current admin list has sample data (needs API integration)
4. **Auto-Redirect**: Non-admins are automatically sent home if they try to access `/admin`
5. **Role Permissions**: Each role has specific permissions shown in tabs

## ❗ Important Notes

- ✅ Super admin can add unlimited other admins
- ✅ Each admin role has specific, limited permissions
- ✅ Non-admins cannot access `/admin/*` pages
- ⚠️ lucide-react dependency needs to be installed
- ⚠️ Backend API integration needed for persistence
- ⚠️ Currently uses sample/demo data

## 🔧 Installation & Setup

```bash
# Install dependencies
cd apps/frontend
npm install lucide-react

# Start dev server
npm run dev

# Access frontend
# http://localhost:3000
```

## 📞 Support & Documentation

- **Setup Guide**: See `ADMIN_RBAC_SETUP.md`
- **Implementation Details**: See `ADMIN_IMPLEMENTATION_COMPLETE.md`
- **Backend Integration**: Pending API documentation

## 🎓 User Stories Implemented

### User Story 1: Super Admin Auto-Access
```
As josephemsamah@gmail.com
I want to automatically get admin access when I sign in
So that I can manage the admin dashboard
✅ COMPLETE
```

### User Story 2: Add Restricted Admins
```
As the super admin
I want to add other admins with restricted roles
So that I can delegate specific tasks
✅ COMPLETE
```

### User Story 3: Role-Based Permissions
```
As a restricted admin (e.g., Document Verifier)
I want to only see and access relevant admin features
So that I don't get overwhelmed with irrelevant tasks
✅ FRAMEWORK COMPLETE (needs backend enforcement)
```

## 🚀 Next Steps

1. **Install Dependencies**: `npm install lucide-react`
2. **Test Frontend**: Sign in and test admin access
3. **API Integration**: Connect to backend admin endpoints
4. **Backend Validation**: Validate admin roles on server
5. **Permission Checks**: Enforce role permissions in backend
6. **Audit Logging**: Log all admin actions
7. **Production Deploy**: Deploy to production environment

---

**Last Updated**: 2025
**Status**: Implementation Complete, Ready for API Integration
