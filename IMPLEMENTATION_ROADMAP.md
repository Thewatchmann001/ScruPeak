# ScruPeak - Implementation Roadmap & Quick Reference

## 🎯 Project Overview

Transform your ScruPeak system from 5 separate microservices into a modern, scalable architecture with:
- **Next.js 14** frontend (replacing React)
- **FastAPI** unified backend (consolidating 5 microservices)
- **Solana Smart Contracts** for blockchain integration
- **AI Microservice** for fraud detection and valuation
- **Real-time Chat** with WebSocket
- **Complete CI/CD** pipeline

---

## 📊 Migration Timeline

```
Week 1-2: Backend Consolidation
  ├─ Create FastAPI app structure
  ├─ Migrate Express → FastAPI routers
  ├─ Consolidate 5 microservices
  └─ Database schema setup

Week 3-4: Frontend Migration
  ├─ Set up Next.js project
  ├─ Migrate React components
  ├─ Implement new page structure
  └─ Update API client

Week 5: AI & Chat Services
  ├─ Create AI service
  ├─ Implement WebSocket chat
  └─ Add fraud detection

Week 6-7: Blockchain Integration
  ├─ Write Solana programs
  ├─ Create contract bindings
  └─ Integrate with backend

Week 8: Testing & Deployment
  ├─ Unit/integration tests
  ├─ Docker setup
  └─ Production deployment
```

---

## 🚀 Phase 1: Backend Consolidation (Week 1-2)

### Step 1: Create FastAPI Project Structure

```bash
cd apps/backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install fastapi uvicorn sqlalchemy psycopg2-binary python-jose pydantic
```

### Step 2: Create Configuration Files

**app/config/settings.py** - Environment configuration
```python
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    # Database
    DATABASE_URL: str = "postgresql://user:pass@localhost/scrupeak"
    
    # API
    API_TITLE: str = "ScruPeak API"
    API_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # Security
    SECRET_KEY: str
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440
    
    # CORS
    ALLOWED_ORIGINS: list = ["http://localhost:3000", "http://localhost:3006"]
    
    # External Services
    AI_SERVICE_URL: str = "http://localhost:8001"
    BLOCKCHAIN_RPC_URL: str = "https://api.devnet.solana.com"
    
    class Config:
        env_file = ".env"

settings = Settings()
```

### Step 3: Migrate Database Models

**app/models/user.py**
```python
from sqlalchemy import Column, String, Boolean, DateTime, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid
import enum

class UserRole(str, enum.Enum):
    buyer = "buyer"
    owner = "owner"
    agent = "agent"
    admin = "admin"

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, index=True)
    phone = Column(String, unique=True, nullable=True)
    name = Column(String)
    password_hash = Column(String)
    role = Column(SQLEnum(UserRole), default=UserRole.buyer)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
```

### Step 4: Create Routers from Microservices

**app/routers/land.py** (consolidate from parcel-service, grid-service, conflict-service)
```python
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.dependencies import get_db, get_current_user

router = APIRouter(prefix="/land", tags=["land"])

@router.get("/listings")
async def get_listings(
    skip: int = 0,
    limit: int = 10,
    db: Session = Depends(get_db)
):
    """Get all land listings"""
    return db.query(Land).offset(skip).limit(limit).all()

@router.get("/listings/{id}")
async def get_listing(id: str, db: Session = Depends(get_db)):
    """Get specific land listing"""
    land = db.query(Land).filter(Land.id == id).first()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    return land

@router.post("/listings")
async def create_listing(
    listing_data: LandCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create new land listing (owner/agent only)"""
    if current_user.role not in ["owner", "agent"]:
        raise HTTPException(status_code=403, detail="Only owners/agents can create listings")
    
    land = Land(**listing_data.dict(), owner_id=current_user.id)
    db.add(land)
    db.commit()
    return land

@router.put("/listings/{id}")
async def update_listing(
    id: str,
    listing_data: LandUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update land listing"""
    land = db.query(Land).filter(Land.id == id).first()
    if not land:
        raise HTTPException(status_code=404, detail="Land not found")
    
    if land.owner_id != current_user.id and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    for key, value in listing_data.dict().items():
        setattr(land, key, value)
    
    db.commit()
    return land

@router.get("/conflicts")  # From conflict-service
async def detect_conflicts(land_id: str, db: Session = Depends(get_db)):
    """Detect spatial conflicts/overlaps"""
    # Use PostGIS to find overlapping boundaries
    conflicts = db.query(Land).filter(
        func.ST_Intersects(
            Land.boundary,
            db.query(Land.boundary).filter(Land.id == land_id).scalar()
        )
    ).all()
    return conflicts
```

### Step 5: Consolidate Services Layer

**app/services/land_service.py**
```python
from sqlalchemy.orm import Session
from app.models import Land, User, Document
from app.utils.hash import calculate_sha256
from datetime import datetime

class LandService:
    
    @staticmethod
    def create_listing(land_data: dict, owner_id: str, db: Session):
        """Create new land listing"""
        land = Land(**land_data, owner_id=owner_id, status="draft")
        db.add(land)
        db.commit()
        db.refresh(land)
        return land
    
    @staticmethod
    def verify_listing(land_id: str, admin_id: str, db: Session):
        """Admin verification workflow"""
        land = db.query(Land).filter(Land.id == land_id).first()
        
        # Check all documents verified
        docs = db.query(Document).filter(Document.land_id == land_id).all()
        if not all(d.verified for d in docs):
            raise ValueError("Not all documents verified")
        
        # Check AI fraud scores acceptable
        fraud_scores = [d.ai_fraud_score for d in docs if d.ai_fraud_score]
        if fraud_scores and max(fraud_scores) > 0.7:  # High fraud risk
            raise ValueError("High fraud risk detected")
        
        # Mark as verified
        land.status = "verified"
        land.verified_by_admin_id = admin_id
        land.verified_at = datetime.utcnow()
        
        db.commit()
        return land
    
    @staticmethod
    def list_for_sale(land_id: str, price: float, db: Session):
        """Make listing publicly available"""
        land = db.query(Land).filter(Land.id == land_id).first()
        if land.status != "verified":
            raise ValueError("Must be verified before listing")
        
        land.status = "listed"
        land.estimated_price = price
        db.commit()
        return land
    
    @staticmethod
    def find_conflicts(land_id: str, db: Session):
        """Find spatial conflicts using PostGIS"""
        land = db.query(Land).filter(Land.id == land_id).first()
        
        # Find overlapping boundaries
        from sqlalchemy import func
        conflicts = db.query(Land).filter(
            func.ST_Intersects(Land.boundary, land.boundary),
            Land.id != land_id
        ).all()
        
        return conflicts
```

### Step 6: Create Pydantic Schemas

**app/schemas/land.py**
```python
from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID

class LandCreate(BaseModel):
    title: str
    description: Optional[str] = None
    location_name: str
    size_sqm: float
    size_acres: Optional[float] = None
    estimated_price: Optional[float] = None
    currency: str = "USD"
    features: Optional[dict] = None
    media_urls: Optional[list] = None

class LandUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    estimated_price: Optional[float] = None
    features: Optional[dict] = None

class LandResponse(BaseModel):
    id: UUID
    title: str
    owner_id: UUID
    location_name: str
    size_sqm: float
    status: str
    verified_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True
```

### Step 7: Create Authentication Middleware

**app/middleware/auth.py**
```python
from fastapi import HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthCredentials
from jose import JWTError, jwt
from datetime import datetime, timedelta
import os

security = HTTPBearer()
SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key")
ALGORITHM = "HS256"

async def get_current_user(credentials: HTTPAuthCredentials = Depends(security)):
    """Extract and verify JWT token"""
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_id
    except JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

def create_access_token(user_id: str, expires_delta: Optional[timedelta] = None):
    """Create JWT token"""
    if expires_delta is None:
        expires_delta = timedelta(hours=24)
    
    expire = datetime.utcnow() + expires_delta
    to_encode = {"sub": user_id, "exp": expire}
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt
```

---

## 🎨 Phase 2: Frontend Migration (Week 3-4)

### Step 1: Create Next.js Project

```bash
cd apps/frontend
npx create-next-app@latest . --typescript --tailwind
```

### Step 2: Create API Client Service

**src/services/api.ts**
```typescript
import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000',
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error)
  }
)

export default api
```

### Step 3: Create Hooks

**src/hooks/useAuth.ts**
```typescript
'use client'

import { useCallback, useState } from 'react'
import api from '@/services/api'

export function useAuth() {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(false)

  const login = useCallback(async (email: string, password: string) => {
    setLoading(true)
    try {
      const { data } = await api.post('/auth/login', { email, password })
      localStorage.setItem('auth_token', data.access_token)
      setUser(data.user)
      return data.user
    } catch (error) {
      console.error('Login failed:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }, [])

  return { user, loading, login }
}
```

### Step 4: Create Page Structure

**src/app/layout.tsx**
```typescript
import type { Metadata } from 'next'
import { Providers } from './providers'
import './globals.css'

export const metadata: Metadata = {
  title: 'ScruPeak - Land Registry & Marketplace',
  description: 'Secure land registry with AI verification and blockchain ownership',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  )
}
```

**src/app/dashboard/page.tsx**
```typescript
'use client'

import { useAuth } from '@/hooks/useAuth'
import { useEffect } from 'react'
import { redirect } from 'next/navigation'

export default function Dashboard() {
  const { user } = useAuth()

  useEffect(() => {
    if (!user) {
      redirect('/auth/login')
    }
  }, [user])

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      <p>Welcome, {user?.name}</p>
    </div>
  )
}
```

---

## 🤖 Phase 3: AI & Chat (Week 5)

### Create AI Service

**apps/ai-service/src/main.py**
```python
from fastapi import FastAPI
from app.routers import fraud, valuation, chatbot

app = FastAPI(
    title="ScruPeak AI Service",
    version="1.0.0"
)

app.include_router(fraud.router, prefix="/fraud", tags=["fraud"])
app.include_router(valuation.router, prefix="/valuation", tags=["valuation"])
app.include_router(chatbot.router, prefix="/chatbot", tags=["chatbot"])

@app.post("/fraud/analyze")
async def analyze_fraud(documents: list):
    """Analyze documents for fraud indicators"""
    # ML model inference
    return {
        "fraud_score": 0.35,
        "risk_level": "medium",
        "flags": ["inconsistent_dates", "unclear_signatures"]
    }

@app.post("/valuation/estimate")
async def estimate_value(
    size_sqm: float,
    location: str,
    features: dict
):
    """Estimate land value"""
    # ML model inference
    return {
        "estimated_price": 125000,
        "currency": "USD",
        "confidence": 0.82,
        "comparable_sales": 5
    }
```

### Add WebSocket Chat Handler

In **app/main.py** (already added in template above)

---

## ⛓️ Phase 4: Blockchain Integration (Week 6-7)

### Create Solana Programs

**apps/blockchain/programs/asset_registry/src/lib.rs**
```rust
use anchor_lang::prelude::*;
use anchor_lang::solana_program::keccak;

declare_id!("AssetRegistry1111111111111111111111111111111");

#[program]
pub mod asset_registry {
    use super::*;

    pub fn register_asset(
        ctx: Context<RegisterAsset>,
        document_hash: [u8; 32],
        metadata_uri: String,
    ) -> Result<()> {
        let asset_record = &mut ctx.accounts.asset_record;
        asset_record.document_hash = document_hash;
        asset_record.metadata_uri = metadata_uri;
        asset_record.owner = ctx.accounts.owner.key();
        asset_record.created_at = Clock::get()?.unix_timestamp;
        
        Ok(())
    }
}

#[derive(Accounts)]
pub struct RegisterAsset<'info> {
    #[account(init, payer = owner, space = 8 + 32 + 200 + 32 + 8)]
    pub asset_record: Account<'info, AssetRecord>,
    #[account(mut)]
    pub owner: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[account]
pub struct AssetRecord {
    pub document_hash: [u8; 32],
    pub metadata_uri: String,
    pub owner: Pubkey,
    pub created_at: i64,
}
```

---

## 📋 Quick Configuration Checklist

### Environment Variables (.env)

```
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/scrupeak
SECRET_KEY=your-super-secret-key-min-32-chars
DEBUG=false

# Frontend
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_BLOCKCHAIN_RPC=https://api.devnet.solana.com

# AI Service
AI_SERVICE_URL=http://localhost:8001

# Blockchain
SOLANA_PRIVATE_KEY=your_solana_wallet_keypair_json
```

### Docker Compose

See [docker-compose.yml](./docker-compose.yml) template

---

## 🧪 Testing Checklist

- [ ] Backend API endpoints test
- [ ] Frontend components test
- [ ] Authentication flow test
- [ ] Land listing creation workflow
- [ ] Document upload & verification
- [ ] Escrow payment simulation
- [ ] Chat WebSocket connection
- [ ] Blockchain transaction verification

---

## 📚 Additional Resources

- [NEW_ARCHITECTURE.md](./NEW_ARCHITECTURE.md) - Full structure guide
- [DATABASE_SCHEMA.sql](./DATABASE_SCHEMA.sql) - Complete schema
- [BACKEND_MAIN_TEMPLATE.py](./BACKEND_MAIN_TEMPLATE.py) - FastAPI template
- [FRONTEND_NEXTJS_TEMPLATE.js](./FRONTEND_NEXTJS_TEMPLATE.js) - Next.js template

---

## 🆘 Troubleshooting

### Backend won't start
- Check DATABASE_URL is correct
- Ensure PostgreSQL is running
- Run migrations: `alembic upgrade head`

### Frontend can't connect to API
- Verify NEXT_PUBLIC_API_URL
- Check CORS is enabled in backend
- Check backend is running on port 8000

### Docker build fails
- Clear cache: `docker system prune -a`
- Rebuild: `docker-compose build --no-cache`

---

**Next Step**: Follow Phase 1 step-by-step to start consolidating your backend!
