# Admin Role-Based Access Control Setup

## Overview
This guide explains how the admin role-based access control (RBAC) system works in ScruPeak Digital Property.

## Key Components

### 1. Super Admin
- **Email**: `josephemsamah@gmail.com` (hardcoded)
- **Access**: Full access to all admin features
- **Default Route**: `/admin/manage` to manage other admins

### 2. Admin Roles

#### Super Admin
- Full system access
- Manage all admins and users
- Verify documents, agents, KYC
- View all reports
- System settings

#### Document Verifier
- Verify land documents (survey, title, approval)
- Perform AI analysis on documents
- Flag suspicious documents
- Cannot access other admin features

#### KYC Officer
- Verify land owner and agent KYC applications
- Review identity documents
- Approve or reject KYC applications
- View risk assessments

#### Agent Verifier
- Verify and manage real estate agents
- Review agent credentials
- Approve or reject agent applications
- Flag problematic agents

#### Support Officer
- Respond to user inquiries
- Manage support tickets
- View complaints
- Limited to support functions

## How It Works

### 1. Protected Admin Pages
All admin pages are wrapped with the `AdminLayout` component which:
- Checks if user is authenticated
- Verifies user has `admin` role
- Redirects non-admins to home page
- Redirects unauthenticated users to login

**Location**: `src/components/admin/AdminLayout.tsx`

```tsx
import AdminLayout from "@/components/admin/AdminLayout";

export default function AdminPage() {
  return (
    <AdminLayout>
      {/* Page content here */}
    </AdminLayout>
  );
}
```

### 2. Admin Management Page
**Location**: `/admin/manage`

Only the super admin (josephemsamah@gmail.com) can:
- View all existing admins
- Add new admins with specific roles
- Edit admin roles
- Remove admin accounts
- View admin permissions per role

### 3. Role-Based Permissions
Each role has specific permissions:

```typescript
const adminRoles = [
  {
    id: "super-admin",
    name: "Super Admin",
    permissions: [
      "View all data",
      "Manage admins",
      "Verify documents",
      "Verify agents",
      "Manage KYC",
      "View reports",
      "System settings",
    ],
  },
  {
    id: "document-verifier",
    name: "Document Verifier",
    permissions: [
      "Verify documents",
      "Review documents",
      "AI analysis",
      "Flag issues",
    ],
  },
  // ... other roles
];
```

## Implementation Details

### AuthContext
**File**: `src/context/AuthContext.tsx`

Manages:
- User authentication state
- User role assignment
- Login/logout functionality
- Access token storage

User object includes:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: "buyer" | "owner" | "agent" | "admin";
  // ... other fields
}
```

### AdminLayout Component
**File**: `src/components/admin/AdminLayout.tsx`

Provides:
- Super admin email constant (exported)
- Protected route wrapper
- Auto-redirect for non-admins
- Loading state handling
- Access verification

## Usage Examples

### Add Admin Management to Page
```tsx
"use client";
import AdminLayout from "@/components/admin/AdminLayout";

export default function MyAdminPage() {
  return (
    <AdminLayout>
      <h1>My Protected Admin Page</h1>
      {/* Content here is only shown to authenticated admins */}
    </AdminLayout>
  );
}
```

### Check User Role in Component
```tsx
"use client";
import { useAuth } from "@/context/AuthContext";

export default function Component() {
  const { user } = useAuth();
  
  if (user?.role !== "admin") {
    return <div>Not authorized</div>;
  }
  
  return <div>Admin content</div>;
}
```

## Testing the System

### Test as Super Admin
1. Sign in with: `josephemsamah@gmail.com`
2. Navigate to `/admin/manage`
3. You should see admin management page
4. Add a new admin with email and role
5. View all admins and their permissions

### Test as Non-Admin
1. Sign in with any other email
2. Navigate to `/admin` or `/admin/manage`
3. You should be redirected to home page

### Test as Unauthenticated
1. Log out
2. Try to access any `/admin` page
3. You should be redirected to login page

## Frontend Pages

### Admin Dashboard
- **URL**: `/admin`
- **Requires**: `admin` role
- **Features**: 
  - 6 KPI stats (listings, documents, pending, agents, issues, volume)
  - Quick action cards (documents, agents, land IDs, manage admins)
  - Recent documents tab
  - Pending agents tab
  - Activity log tab

### Admin Management
- **URL**: `/admin/manage`
- **Requires**: Super admin (josephemsamah@gmail.com)
- **Features**:
  - Add new admin form
  - List all admins with roles
  - View admin permissions per role
  - Edit/remove admin accounts
  - Role reference guide

### Document Verification
- **URL**: `/admin/documents`
- **Requires**: `admin` role with "document-verifier" capability
- **Features**:
  - Upload land documents
  - AI extraction of document data
  - Document verification workflow
  - Flag suspicious documents

### Agent Verification
- **URL**: `/admin/agents`
- **Requires**: `admin` role with "agent-verifier" capability
- **Features**:
  - Review agent applications
  - Verify agent credentials
  - Approve/reject agents
  - Agent statistics

### KYC Verification
- **URL**: `/admin/kyc`
- **Requires**: `admin` role with "kyc-verifier" capability
- **Features**:
  - Review pending KYC applications
  - Approve/reject KYC
  - Risk scoring
  - KYC statistics

### Land ID Generator
- **URL**: `/admin/land-ids`
- **Requires**: `admin` role
- **Features**:
  - View generated land IDs
  - Copy ID to clipboard
  - Search by location
  - Filter by date

## Next Steps

1. **Install lucide-react**: `npm install lucide-react` in frontend directory
2. **API Integration**: Connect admin pages to backend endpoints
3. **Permission Enforcement**: Add permission checks to all admin pages
4. **Audit Logging**: Log all admin actions
5. **Role Customization**: Add ability to create custom roles with specific permissions
6. **Multi-factor Authentication**: Add MFA for super admin account
7. **Session Management**: Implement session timeout for admin accounts

## Security Considerations

- ✅ Super admin email is hardcoded and cannot be changed
- ✅ Non-admins are automatically redirected from admin pages
- ✅ Unauthenticated users are redirected to login
- ✅ Role-based permissions are enforced in frontend
- ⚠️ Backend API should validate admin role and permissions
- ⚠️ Implement proper JWT token expiration
- ⚠️ Add rate limiting to admin endpoints
- ⚠️ Log all admin actions for audit trail
- ⚠️ Use HTTPS for all admin communications

## File Structure

```
src/
├── context/
│   └── AuthContext.tsx           # Authentication context
├── components/
│   └── admin/
│       └── AdminLayout.tsx       # Admin route protection
├── types/
│   └── index.ts                  # User interface with role
├── app/
│   ├── admin/
│   │   ├── page.tsx              # Main dashboard
│   │   ├── manage/
│   │   │   └── page.tsx          # Admin management (super admin only)
│   │   ├── documents/
│   │   │   └── page.tsx          # Document verification
│   │   ├── agents/
│   │   │   └── page.tsx          # Agent verification
│   │   ├── kyc/
│   │   │   └── page.tsx          # KYC verification
│   │   └── land-ids/
│   │       └── page.tsx          # Land ID generator
│   ├── login/
│   ├── register/
│   └── ...
```

## Troubleshooting

**Issue**: "Access Restricted" message in admin management page
- **Solution**: Make sure you're signed in with josephemsamah@gmail.com

**Issue**: Redirected to home page when accessing admin pages
- **Solution**: Check that your user account has `role: "admin"` set in the backend

**Issue**: lucide-react icons not showing
- **Solution**: Run `npm install lucide-react` in frontend directory

**Issue**: Admin pages not loading
- **Solution**: Check that AuthContext is properly set up and user role is being set during login

## Contact & Support

For questions about the admin role system, contact the development team.
