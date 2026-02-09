# Frontend Development Guide

## 🎯 Quick Start (5 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Copy environment file
cp .env.local.example .env.local

# 3. Start development server
npm run dev

# 4. Open browser
open http://localhost:3000
```

## 📖 Architecture Overview

### Pages (App Router)
- Every folder in `src/app/` with a `page.tsx` becomes a route
- Example: `src/app/land/page.tsx` → `/land`
- Dynamic routes: `src/app/land/[id]/page.tsx` → `/land/123`

### Components
- Atomic design pattern in `src/components/`
- UI components in `src/components/ui/` (buttons, inputs, cards, etc.)
- Layout components in `src/components/layout/` (navbar, footer, etc.)

### Context & Hooks
- Global state with AuthContext
- Custom hooks for logic reuse
- Authentication context provider in root layout

### Services
- API client in `src/services/api.ts`
- Handles authentication, error handling, base URL

## 🎨 Creating Components

### Functional Component Pattern

```tsx
// src/components/ui/MyComponent.tsx
import { cn } from "@/utils/cn";

interface MyComponentProps {
  className?: string;
  title: string;
  // ... other props
}

export function MyComponent({ className, title, ...props }: MyComponentProps) {
  return (
    <div className={cn("default-styles", className)} {...props}>
      {title}
    </div>
  );
}
```

### Using Variants (class-variance-authority)

```tsx
import { cva, type VariantProps } from "class-variance-authority";

const componentVariants = cva("base-styles", {
  variants: {
    variant: {
      default: "variant-default",
      secondary: "variant-secondary",
    },
    size: {
      sm: "size-sm",
      md: "size-md",
    },
  },
  defaultVariants: {
    variant: "default",
    size: "md",
  },
});

export interface ComponentProps extends VariantProps<typeof componentVariants> {
  children: React.ReactNode;
}

export function Component({ variant, size, children }: ComponentProps) {
  return <div className={componentVariants({ variant, size })}>{children}</div>;
}
```

## 📄 Creating Pages

### Basic Page Structure

```tsx
// src/app/my-page/page.tsx
"use client";

import { Container } from "@/components/layout/Container";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/Button";

export default function MyPage() {
  return (
    <Container className="py-12">
      <PageHeader 
        title="My Page"
        description="Page description"
        action={<Button>Action</Button>}
      />
      
      {/* Page content */}
    </Container>
  );
}
```

### With Data Fetching

```tsx
"use client";

import { useState, useEffect } from "react";
import { api } from "@/services/api";
import { Land } from "@/types";

export default function DataPage() {
  const [data, setData] = useState<Land[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get<Land[]>("/land");
        setData(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {data.map(item => (
        <div key={item.id}>{item.title}</div>
      ))}
    </div>
  );
}
```

### Protected Pages

```tsx
"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  if (loading || !user) return null;

  return <div>Protected content for {user.name}</div>;
}
```

## 🔄 State Management

### Authentication State

```tsx
import { useAuth } from "@/context/AuthContext";

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  return (
    <>
      {isAuthenticated ? (
        <>
          <p>Welcome {user?.name}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <button onClick={() => login("email", "password")}>Login</button>
      )}
    </>
  );
}
```

### Local State (useState)

```tsx
export function Counter() {
  const [count, setCount] = useState(0);

  return (
    <>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </>
  );
}
```

## 🌐 API Usage

### Simple GET

```tsx
const { data } = await api.get<Land>("/land/123");
```

### POST with Data

```tsx
const { data } = await api.post<AuthResponse>("/auth/login", {
  email: "user@example.com",
  password: "password123",
});
```

### Error Handling

```tsx
try {
  const { data } = await api.get("/land/123");
  setLand(data);
} catch (error) {
  if (error.response?.status === 404) {
    setError("Land not found");
  } else {
    setError("An error occurred");
  }
}
```

## 📱 Responsive Patterns

### Tailwind Responsive Classes

```tsx
export function ResponsiveComponent() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {/* Columns: 1 on mobile, 2 on tablet, 3 on desktop */}
      <div>Item 1</div>
      <div>Item 2</div>
      <div>Item 3</div>
    </div>
  );
}
```

### Mobile-First Approach

```tsx
// Text that's hidden on mobile, visible on md and up
<h1 className="hidden md:block">Desktop Only</h1>

// Text visible on mobile, hidden on md and up  
<h1 className="md:hidden">Mobile Only</h1>

// Different padding on mobile vs desktop
<div className="px-4 md:px-6 lg:px-8">Content</div>
```

## 🎨 Styling Best Practices

### Using Tailwind Classes

```tsx
// Good - Use Tailwind utilities
<div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 hover:bg-slate-100 transition-colors">

// Bad - Custom CSS instead
<div style={{display: 'flex', padding: '16px'}}>

// Combine with cn() utility for conditional classes
<div className={cn(
  "base-styles",
  isActive && "active-styles",
  variant === "primary" && "primary-styles"
)}>
```

### Color Palette

```tsx
// Primary colors
className="bg-primary-600 text-primary-50 border-primary-200"

// Status colors
className="bg-success-100 text-success-700"  // Success
className="bg-warning-100 text-warning-700"  // Warning
className="bg-danger-100 text-danger-700"    // Danger

// Neutral
className="bg-slate-50 text-slate-900"
```

## 🧩 Form Patterns

### Controlled Input

```tsx
"use client";

import { useState } from "react";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validation
    // API call
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Email"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={errors.email}
        required
      />
      <Input
        label="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={errors.password}
        required
      />
      <Button type="submit">Login</Button>
    </form>
  );
}
```

## 💬 Toast Notifications

```tsx
import { toast } from "sonner";

// Success
toast.success("Operation successful!");

// Error
toast.error("Something went wrong");

// Info
toast.info("Here's some information");

// Warning
toast.warning("Be careful!");

// Custom
toast.message("Custom message", {
  description: "Additional description",
});
```

## 🧪 Common Patterns

### Loading States

```tsx
const [loading, setLoading] = useState(false);

if (loading) return <Skeleton className="h-64" />;
```

### Empty States

```tsx
if (items.length === 0) {
  return (
    <div className="text-center py-12">
      <p className="text-slate-600">No items found</p>
      <Button className="mt-4">Create New</Button>
    </div>
  );
}
```

### Error States

```tsx
if (error) {
  return (
    <Alert variant="destructive">
      {error}
      <Button onClick={retry} className="mt-2">Retry</Button>
    </Alert>
  );
}
```

## 📚 File Organization

### Naming Conventions

- Components: PascalCase (Button.tsx, InputField.tsx)
- Pages: kebab-case folder + page.tsx (pages/my-page/page.tsx)
- Types: index.ts (types/index.ts)
- Utils: camelCase (formatters.ts, cn.ts)
- Services: camelCase (api.ts)

### Export Patterns

```tsx
// Named export (for components)
export function MyComponent() {}
export { MyComponent };

// Default export (for pages)
export default function Page() {}

// Type exports
export type { MyComponentProps };
export interface MyInterface {}
```

## 🔗 Linking

### Internal Links

```tsx
import Link from "next/link";

<Link href="/land">Browse Land</Link>
<Link href={`/land/${id}`}>View Details</Link>
```

### External Links

```tsx
<a href="https://example.com" target="_blank" rel="noopener noreferrer">
  External Link
</a>
```

## 🚀 Performance Tips

1. **Image Optimization** - Use Next.js Image component for remote images
2. **Code Splitting** - Next.js automatically splits code by route
3. **Lazy Loading** - Use dynamic imports for heavy components
4. **Memoization** - Use React.memo for expensive renders
5. **Data Caching** - Implement caching for API responses

## 📋 Development Checklist

- [ ] Create TypeScript types
- [ ] Create API service methods
- [ ] Create reusable components
- [ ] Create pages
- [ ] Add error handling
- [ ] Add loading states
- [ ] Test on mobile
- [ ] Check accessibility
- [ ] Optimize performance
- [ ] Add documentation

---

**Happy coding! 🎉**
