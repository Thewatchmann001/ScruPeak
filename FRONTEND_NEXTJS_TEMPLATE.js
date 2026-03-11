"""
ScruPeak Frontend - Next.js 14 Project Setup
Modern React with TypeScript, Tailwind, and Maps
"""

# next.config.js
module.exports = {
  reactStrictMode: true,
  swcMinify: true,
  images: {
    domains: ['your-cdn.com', 'localhost'],
    formats: ['image/avif', 'image/webp'],
  },
  headers: async () => [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
        { key: 'Access-Control-Allow-Origin', value: '*' },
        { key: 'Access-Control-Allow-Methods', value: 'GET,OPTIONS,PATCH,DELETE,POST,PUT' },
        { key: 'Access-Control-Allow-Headers', value: 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version' },
      ],
    },
  ],
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
    NEXT_PUBLIC_BLOCKCHAIN_RPC: process.env.NEXT_PUBLIC_BLOCKCHAIN_RPC || 'https://api.devnet.solana.com',
    NEXT_PUBLIC_MAP_TOKEN: process.env.NEXT_PUBLIC_MAP_TOKEN,
  },
};

# tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E7D32',    // Green for land/nature
        secondary: '#1976D2',  // Blue
        success: '#4CAF50',
        warning: '#FF9800',
        error: '#F44336',
        neutral: '#757575',
      },
      spacing: {
        '128': '32rem',
        '144': '36rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}

export default config

# tsconfig.json
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,

    /* Bundler mode */
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "noEmit": true,
    "jsx": "react-jsx",

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/hooks/*": ["./src/hooks/*"],
      "@/services/*": ["./src/services/*"],
      "@/types/*": ["./src/types/*"],
      "@/utils/*": ["./src/utils/*"],
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}

# package.json example dependencies
{
  "name": "scrupeak-frontend",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "next": "^14.0.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "typescript": "^5.0.0",
    
    "tailwindcss": "^3.3.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0",
    
    "axios": "^1.6.0",
    "zustand": "^4.4.0",
    
    "leaflet": "^1.9.0",
    "react-leaflet": "^4.2.0",
    
    "@heroicons/react": "^2.0.0",
    "clsx": "^2.0.0",
    
    "@solana/web3.js": "^1.87.0",
    "@project-serum/anchor": "^0.29.0",
    "@solana/wallet-adapter-react": "^0.15.0",
    
    "socket.io-client": "^4.7.0",
    "react-hot-toast": "^2.4.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@tailwindcss/forms": "^0.5.0",
    "@tailwindcss/typography": "^0.5.0",
    
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0",
    
    "jest": "^29.0.0",
    "@testing-library/react": "^14.0.0",
    "@testing-library/jest-dom": "^6.0.0"
  }
}

# Key Environment Variables (.env.local)
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BLOCKCHAIN_RPC=https://api.devnet.solana.com
NEXT_PUBLIC_MAP_TOKEN=your_mapbox_token
NEXT_PUBLIC_AI_SERVICE_URL=http://localhost:8001

# App Layout Structure
# src/app/layout.tsx
export const metadata = {
  title: 'ScruPeak - Land Registry & Marketplace',
  description: 'A secure land registry platform with AI verification and blockchain ownership records.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Header />
        <main className="flex-1">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  )
}

# Dashboard Page Structure
# src/app/dashboard/page.tsx
'use client'

import { useAuth } from '@/hooks/useAuth'
import { StatsCard } from '@/components/dashboard/StatsCard'
import { RecentListings } from '@/components/dashboard/RecentListings'
import { EscrowStatus } from '@/components/dashboard/EscrowStatus'

export default function Dashboard() {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Welcome, {user.name}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatsCard title="Properties Owned" value="12" />
        <StatsCard title="Active Listings" value="3" />
        <StatsCard title="Escrow Balance" value="$45,000" />
        <StatsCard title="Verification Status" value="Verified" color="green" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <RecentListings />
        </div>
        <div>
          <EscrowStatus />
        </div>
      </div>
    </div>
  )
}

# Land Listing Page
# src/app/land/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { MapViewer } from '@/components/maps/MapViewer'
import { ListingCard } from '@/components/land/ListingCard'
import { FilterPanel } from '@/components/land/FilterPanel'
import { useLandListings } from '@/hooks/useLandListings'

export default function LandListings() {
  const { listings, loading } = useLandListings()
  const [viewMode, setViewMode] = useState<'map' | 'list'>('map')
  const [filters, setFilters] = useState({})

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Available Listings</h1>

      <div className="flex gap-4 mb-4">
        <button
          onClick={() => setViewMode('map')}
          className={`px-4 py-2 rounded ${viewMode === 'map' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          Map View
        </button>
        <button
          onClick={() => setViewMode('list')}
          className={`px-4 py-2 rounded ${viewMode === 'list' ? 'bg-primary text-white' : 'bg-gray-200'}`}
        >
          List View
        </button>
      </div>

      <div className="flex gap-4">
        <FilterPanel onFilterChange={setFilters} />

        {viewMode === 'map' ? (
          <div className="flex-1 h-96">
            <MapViewer listings={listings} />
          </div>
        ) : (
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {listings?.map(listing => (
              <ListingCard key={listing.id} listing={listing} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
