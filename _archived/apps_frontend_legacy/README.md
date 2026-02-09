# LandBiznes Frontend

Modern, production-ready Next.js 14 frontend for the LandBiznes land management platform. Built with TypeScript, Tailwind CSS, and a focus on excellent UI/UX.

## 🎯 Features

- **Modern UI** - Clean, intuitive interface with Tailwind CSS
- **Responsive Design** - Works perfectly on desktop, tablet, and mobile
- **Type-Safe** - Full TypeScript support throughout
- **Authentication** - JWT-based auth with automatic token refresh
- **Real-time Features** - WebSocket support for live updates
- **Accessibility** - WCAG 2.1 compliant components
- **Performance** - Optimized with Next.js 14 best practices
- **Dark Mode Ready** - Easy to add dark theme support

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                 # Next.js 14 app router
│   │   ├── (auth)/         # Auth layout group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── land/           # Land browsing pages
│   │   │   ├── page.tsx    # Listings
│   │   │   └── [id]/       # Detail page
│   │   ├── dashboard/      # User dashboard
│   │   ├── admin/          # Admin panel
│   │   ├── layout.tsx      # Root layout
│   │   └── page.tsx        # Home page
│   ├── components/
│   │   ├── ui/            # Reusable UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Card.tsx
│   │   │   └── ...
│   │   └── layout/        # Layout components
│   │       ├── Navbar.tsx
│   │       ├── Footer.tsx
│   │       └── ...
│   ├── context/           # React context
│   │   ├── AuthContext.tsx
│   │   └── ToastProvider.tsx
│   ├── services/          # API client
│   │   └── api.ts
│   ├── hooks/            # Custom hooks
│   ├── types/            # TypeScript types
│   │   └── index.ts
│   ├── utils/            # Utilities
│   │   ├── formatters.ts
│   │   └── cn.ts
│   └── styles/           # Global styles
│       └── globals.css
├── public/               # Static assets
├── package.json
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
└── .env.local.example
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. **Copy environment variables:**
   ```bash
   cp .env.local.example .env.local
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Start development server:**
   ```bash
   npm run dev
   ```

4. **Open browser:**
   Navigate to `http://localhost:3000`

## 📝 Available Scripts

```bash
# Development
npm run dev          # Start dev server with hot reload

# Production
npm run build        # Build for production
npm start           # Start production server

# Quality
npm run lint        # Run ESLint
npm run type-check  # Check TypeScript types
```

## 🎨 Component Library

### UI Components

All components are in `src/components/ui/` and support extensive customization:

```tsx
// Button variants
<Button variant="default" size="md">Click me</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="danger">Dangerous</Button>

// Input fields
<Input label="Email" type="email" placeholder="user@example.com" />
<Input label="Name" error="Name is required" />

// Cards
<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Card description</CardDescription>
  </CardHeader>
  <CardContent>Content goes here</CardContent>
  <CardFooter>Footer content</CardFooter>
</Card>

// Badges
<Badge variant="default">Default</Badge>
<Badge variant="success">Success</Badge>
<Badge variant="warning">Warning</Badge>
<Badge variant="destructive">Destructive</Badge>

// Alerts
<Alert variant="default" title="Info">Information message</Alert>
<Alert variant="destructive">Error message</Alert>
<Alert variant="success">Success message</Alert>
<Alert variant="warning">Warning message</Alert>
```

### Layout Components

```tsx
// Container - max-width wrapper
<Container>Content with max-width</Container>

// Page Header - title + description + action
<PageHeader 
  title="Page Title"
  description="Optional description"
  action={<Button>Action</Button>}
/>

// Navbar - sticky navigation
<Navbar />

// Footer - site footer
<Footer />
```

## 🔐 Authentication

The `AuthContext` provides authentication state and methods:

```tsx
import { useAuth } from "@/context/AuthContext";

export function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  if (!isAuthenticated) return <div>Please log in</div>;

  return (
    <div>
      Welcome, {user?.name}!
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## 🌐 API Integration

The API client automatically handles:
- Base URL configuration
- JWT token injection
- Request/response interceptors
- Error handling
- 401 automatic redirect

```tsx
import { api } from "@/services/api";

// GET request
const { data } = await api.get<Land[]>("/land/listings");

// POST request
const response = await api.post<AuthResponse>("/auth/login", {
  email,
  password,
});

// PUT/PATCH/DELETE also available
```

## 🎯 Pages Guide

### Home Page (`/`)
- Hero section
- Feature highlights
- CTA buttons
- Responsive layout

### Auth Pages (`/login`, `/register`)
- Clean form layouts
- Input validation
- Error handling
- Demo credentials

### Land Listings (`/land`)
- Grid/list view toggle
- Search and filter
- Status badges
- Responsive cards

### Land Detail (`/land/[id]`)
- Full property information
- Document gallery
- Owner contact
- Blockchain verification info

### Dashboard (`/dashboard`)
- User activity
- Quick actions
- Property statistics
- Role-based content

### Admin (`/admin`)
- System metrics
- Pending verifications
- Fraud detection
- Management tools

## 🎨 Styling

Uses Tailwind CSS with custom configuration:

### Color Palette
- **Primary** - Blue (600-700 for main actions)
- **Success** - Green 
- **Warning** - Amber
- **Danger** - Red
- **Slate** - Gray scale (UI elements)

### Responsive Breakpoints
- `sm` - 640px
- `md` - 768px
- `lg` - 1024px
- `xl` - 1280px
- `2xl` - 1536px

## 📱 Mobile Optimization

- Touch-friendly buttons (minimum 44x44px)
- Mobile-first responsive design
- Safe area support for notched devices
- Optimized images
- Fast page loads

## ♿ Accessibility

- Semantic HTML
- ARIA labels where needed
- Keyboard navigation support
- Color contrast compliance
- Focus indicators
- Form labels

## 🧪 Testing (Setup Guide)

```bash
# Install testing dependencies
npm install --save-dev @testing-library/react @testing-library/jest-dom jest

# Create tests in __tests__ folders
# Run tests with: npm test
```

## 📦 Dependencies

### Core
- **next** - React framework
- **react** - UI library
- **typescript** - Type safety

### Styling
- **tailwindcss** - Utility-first CSS
- **class-variance-authority** - Component variants
- **tailwind-merge** - Merge Tailwind classes

### UI/UX
- **sonner** - Toast notifications
- **date-fns** - Date formatting
- **leaflet** - Map rendering
- **react-leaflet** - React wrapper for Leaflet

### API
- **axios** - HTTP client
- **zustand** - State management (optional)

## 🚀 Deployment

### Vercel (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel
```

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY .next ./
EXPOSE 3000
CMD ["npm", "start"]
```

### Environment Variables for Production

```
NEXT_PUBLIC_API_URL=https://api.landbiznes.com
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
```

## 🐛 Troubleshooting

### Port 3000 Already in Use
```bash
# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
# Then restart
npm run dev
```

### Module Not Found
```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
npm run dev
```

### TypeScript Errors
```bash
# Check types
npm run type-check

# Generate types
npm run dev  # runs automatically
```

## 📚 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)

## 📝 License

Proprietary - LandBiznes © 2024

## 👥 Support

For issues or questions:
- Check existing documentation
- Review component examples
- Check `.env.local.example` for configuration
- Review API integration patterns

---

**Built with ❤️ for LandBiznes**
