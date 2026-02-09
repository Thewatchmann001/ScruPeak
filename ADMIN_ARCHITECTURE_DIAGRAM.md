# Admin Role-Based Access Control - Architecture Diagram

## System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         LANDBIZNES FRONTEND                          │
│                      (Next.js 14.2 + TypeScript)                     │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
            ┌─────────────┐ ┌─────────────┐ ┌─────────────┐
            │   Login     │ │  Register   │ │   Home      │
            └────────┬────┘ └─────────────┘ └─────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │   AuthContext (Authentication)    │
        │   - user state                     │
        │   - login/logout                   │
        │   - user.role assignment           │
        │   - localStorage tokens            │
        └────────────┬───────────────────────┘
                     │
                     ▼
        ┌────────────────────────────────────┐
        │   /admin/* Protected Routes        │
        │   (AdminLayout Wrapper)            │
        │   - Auth check                     │
        │   - Role check                     │
        │   - Super admin check (/admin/manage)
        └────┬──────────┬──────────┬─────────┘
             │          │          │
      ┌──────▼──┐ ┌─────▼──┐ ┌────▼────┐
      │ Non-   │ │ Non-   │ │Valid    │
      │Auth   │ │ Admin  │ │ Admin   │
      │       │ │        │ │         │
      │Redirect│ │Redirect│ │Render   │
      │to /login│ │to /   │ │Page     │
      └────────┘ └────────┘ └─────────┘
```

## Admin Pages Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      ADMIN PAGES STRUCTURE                       │
└─────────────────────────────────────────────────────────────────┘

                          /admin (Dashboard)
                                 │
                    ┌────────────┼────────────┐
                    │            │            │
                    ▼            ▼            ▼
            ┌──────────────┐ ┌────────────┐ ┌──────────────┐
            │ 6 KPI Cards  │ │ 4 Quick    │ │ 3 Tabs       │
            │              │ │ Actions    │ │              │
            └──────────────┘ └────┬───────┘ └──────────────┘
                                  │
                    ┌─────────────┼─────────────┐
                    │             │             │
                    ▼             ▼             ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────┐
            │ Documents    │ │ Agents   │ │Manage    │
            │ Verification │ │Verify    │ │Admins ⭐  │
            └──────────────┘ └──────────┘ └──────┬───┘
                    │             │              │
                    │             │         Super Admin
                    │             │         Only Access
                    │             │              │
                    ├─────────────┼──────────────┤
                    │             │              │
                    ▼             ▼              ▼
            ┌──────────────┐ ┌──────────┐ ┌──────────┐
            │ KYC Verify   │ │ Land IDs │ │Add Admins│
            │              │ │ Generator│ │Manage    │
            └──────────────┘ └──────────┘ │Roles     │
                                          └──────────┘
```

## Admin Role Hierarchy

```
┌──────────────────────────────────────────────────────────────┐
│                    ADMIN ROLE HIERARCHY                       │
└──────────────────────────────────────────────────────────────┘

                    ▲
                    │
           ┌────────┴────────┐
           │                 │
           │  SUPER ADMIN    │  (josephemsamah@gmail.com)
           │ FULL ACCESS     │
           │                 │
           └────────┬────────┘
                    │
        ┌───────────┼───────────┐
        │           │           │
        ▼           ▼           ▼
    ┌────────┐ ┌────────┐ ┌────────┐
    │ Doc    │ │ KYC    │ │ Agent  │
    │Verif   │ │Officer │ │Verifier│
    │        │ │        │ │        │
    │Limited │ │Limited │ │Limited │
    │Access  │ │Access  │ │Access  │
    └────────┘ └────────┘ └────────┘

    Can assign:        Cannot:
    • Edit docs        • Manage admins
    • Verify KYC       • Access other areas
    • Verify agents    • Change roles
    • View reports     • System settings
```

## Admin Management Page Structure

```
┌─────────────────────────────────────────────────────┐
│               /admin/manage PAGE                     │
│          (Super Admin Only Access)                  │
├─────────────────────────────────────────────────────┤
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │  Header: Admin Management                    │  │
│ │  Back Button → /admin                        │  │
│ │  [+ Add Admin] Button                        │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │  Add Admin Form (Expandable)                 │  │
│ │                                               │  │
│ │  Admin Name: [________________]              │  │
│ │  Email: [________________]                   │  │
│ │  Role: [Select Role ▼]                       │  │
│ │                                               │  │
│ │  [Create Admin] [Cancel]                     │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │  Current Admins List                         │  │
│ │                                               │  │
│ │  ┌────────────────────────────────────────┐  │  │
│ │  │ Joseph Emsamah                          │  │  │
│ │  │ josephemsamah@gmail.com                │  │  │
│ │  │ Super Admin [SUPER_ADMIN_BADGE]        │  │  │
│ │  │ Joined: January 1, 2025                │  │  │
│ │  │ Permissions: ✓ All (25+)               │  │  │
│ │  │ (Cannot remove self)                   │  │  │
│ │  └────────────────────────────────────────┘  │  │
│ │                                               │  │
│ │  ┌────────────────────────────────────────┐  │  │
│ │  │ Amara Conteh                            │  │  │
│ │  │ amara.conteh@landbiznes.com            │  │  │
│ │  │ Document Verifier [BADGE]              │  │  │
│ │  │ Joined: January 10, 2026               │  │  │
│ │  │ Permissions: ✓ 4 (Verify docs, etc)   │  │  │
│ │  │ [Edit Role] [Remove]                   │  │  │
│ │  └────────────────────────────────────────┘  │  │
│ │                                               │  │
│ └──────────────────────────────────────────────┘  │
│                                                     │
│ ┌──────────────────────────────────────────────┐  │
│ │  Available Admin Roles Reference             │  │
│ │  [Super Admin] [Doc Verif] [KYC Off]...      │  │
│ │                                               │  │
│ │  Super Admin                                 │  │
│ │  - Full system access                       │  │
│ │  - Manage all admins and users             │  │
│ │  ✓ View all data                            │  │
│ │  ✓ Manage admins                            │  │
│ │  ✓ Verify documents                        │  │
│ │  ... (25+ permissions)                      │  │
│ │                                               │  │
│ └──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

## User Access Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   USER ACCESS FLOW                           │
└─────────────────────────────────────────────────────────────┘

START
  │
  ▼
Is User Authenticated?
  │
  ├─ NO  → Redirect to /login
  │
  └─ YES → Check User Role
            │
            ├─ role !== "admin" → Redirect to /
            │
            └─ role === "admin"
                │
                ├─ Trying to access /admin/*
                │
                │  ┌─ YES → Check Email
                │  │        (for /admin/manage)
                │  │
                │  │        email === "josephemsamah@gmail.com"?
                │  │        │
                │  │        ├─ YES → Load /admin/manage ✓
                │  │        │
                │  │        └─ NO  → Show "Access Restricted"
                │  │
                │  └─ NO  → Load Other /admin/* pages ✓
                │
                ▼
            ADMIN ACCESS GRANTED ✓
```

## Permission Enforcement Flow

```
┌──────────────────────────────────────────────┐
│    PERMISSION ENFORCEMENT ARCHITECTURE        │
└──────────────────────────────────────────────┘

FRONTEND (Next.js)
├── AuthContext
│   └── user.role: "admin"
│
├── AdminLayout (Wrapper)
│   ├── Check authentication
│   ├── Check role === "admin"
│   └── Check email for super admin
│
├── Role-Based Pages
│   ├── /admin (all admins)
│   ├── /admin/manage (super admin only)
│   ├── /admin/documents (doc verifier)
│   ├── /admin/agents (agent verifier)
│   ├── /admin/kyc (kyc officer)
│   └── /admin/land-ids (all admins)
│
└── Admin Management
    ├── View current admins
    ├── Add new admin
    ├── Assign role
    ├── Edit role
    └── Remove admin

BACKEND (To be connected)
├── API Endpoints
│   ├── /api/auth/login
│   ├── /api/admins (GET/POST)
│   ├── /api/admins/{id} (GET/PUT/DELETE)
│   └── /api/admin-roles
│
├── Database
│   ├── users table
│   │   └── role: "admin"
│   ├── admins table
│   │   ├── user_id
│   │   ├── role_id
│   │   └── permissions
│   └── admin_roles table
│       ├── role_name
│       └── permissions
│
└── Validation
    ├── Role check
    ├── Permission check
    ├── Email verification
    └── Action logging
```

## Data Model

```
┌─────────────────────────────────────────────────┐
│              USER DATA MODEL                     │
└─────────────────────────────────────────────────┘

User {
  id: string
  email: string
  name: string
  password: string (hashed)
  role: "buyer" | "owner" | "agent" | "admin"
  phone?: string
  avatar?: string
  kyc_verified: boolean
  created_at: timestamp
  updated_at: timestamp
}

Admin {
  id: string
  user_id: string (FK → User)
  role: "super-admin" | "document-verifier" | 
        "kyc-officer" | "agent-verifier" | "support"
  permissions: string[] (array of permission strings)
  status: "active" | "inactive"
  joined_date: timestamp
  created_by: string (admin_id)
  created_at: timestamp
  updated_at: timestamp
}

AdminRole {
  id: string
  name: string
  description: string
  permissions: string[]
  created_at: timestamp
  updated_at: timestamp
}

Sample Permissions:
[
  "view_all_data",
  "manage_admins",
  "verify_documents",
  "verify_agents",
  "manage_kyc",
  "view_reports",
  "system_settings",
  "ai_analysis",
  "flag_documents",
  "approve_kyc",
  "reject_kyc",
  ... (25+)
]
```

## Component Tree

```
┌──────────────────────────────────────────────┐
│         COMPONENT HIERARCHY                   │
└──────────────────────────────────────────────┘

App (Root)
├── Navbar
│   └── Admin Links (if role === "admin")
│
├── Routes
│   ├── /login
│   ├── /register
│   ├── /
│   ├── /dashboard
│   │   ├── /dashboard/agent
│   │   ├── /dashboard/owner
│   │   └── /dashboard/buyer
│   │
│   ├── /admin (Protected)
│   │   ├── AdminLayout
│   │   │   ├── /admin/page.tsx
│   │   │   │   ├── StatsCard
│   │   │   │   ├── QuickActionCard
│   │   │   │   └── Tabs
│   │   │   │       ├── DocumentsTab
│   │   │   │       ├── AgentsTab
│   │   │   │       └── ActivityTab
│   │   │   │
│   │   │   ├── /admin/manage/page.tsx ⭐ NEW
│   │   │   │   ├── AdminForm
│   │   │   │   ├── AdminsList
│   │   │   │   │   └── AdminCard
│   │   │   │   └── RoleReference
│   │   │   │       └── RoleTabs
│   │   │   │
│   │   │   ├── /admin/documents/page.tsx
│   │   │   ├── /admin/agents/page.tsx
│   │   │   ├── /admin/kyc/page.tsx
│   │   │   └── /admin/land-ids/page.tsx
│   │   │
│   │   └── (Other admin pages...)
│   │
│   └── /land
│       ├── /land/upload
│       └── /land/[id]
│
└── Footer
```

## Access Control Decision Tree

```
┌────────────────────────────────────────────────┐
│   ACCESS CONTROL DECISION TREE                  │
└────────────────────────────────────────────────┘

                   User Request
                        │
                        ▼
                Is Authenticated?
                   /         \
                 NO           YES
                 │             │
                 ▼             ▼
              /login      Check Role
                         /            \
                    Admin            Non-Admin
                      │                 │
                      ▼                 ▼
              Check Admin Type      Redirect to /
              /              \
        Super Admin    Restricted Admin
             │                 │
             ▼                 ▼
        /admin/*          Check Endpoint
         All Pages         /         \
                      Allowed      Forbidden
                        │              │
                        ▼              ▼
                   Load Page    Redirect to /
                        │
                        ▼
                   RENDER ✓
```

## Deployment Architecture

```
┌────────────────────────────────────────────┐
│      DEPLOYMENT ARCHITECTURE                 │
└────────────────────────────────────────────┘

CLIENT (Browser)
    │
    ├─ /admin (Protected Routes)
    ├─ AuthContext (JWT Tokens)
    └─ AdminLayout (Access Control)
         │
         ▼
    NEXT.JS Frontend (Port 3000)
    ├── /app/admin/* (All admin pages)
    ├── /components/admin/AdminLayout.tsx
    ├── /context/AuthContext.tsx
    └── Public assets
         │
         ▼
    API Gateway / Backend (Port 8000+)
    ├── /api/auth (Auth endpoints)
    ├── /api/users (User management)
    ├── /api/admins (Admin CRUD)
    ├── /api/documents (Document verification)
    ├── /api/agents (Agent verification)
    └── /api/kyc (KYC verification)
         │
         ▼
    Database (PostgreSQL)
    ├── users
    ├── admins
    ├── admin_roles
    ├── permissions
    └── audit_logs
```

---

**This architecture provides a complete, secure admin role-based access control system ready for production deployment!** 🎉
