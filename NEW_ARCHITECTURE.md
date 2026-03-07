# ScruPeak Digital Property - Modern Architecture Restructuring Guide

## 📁 New Project Structure

```
ScruPeak Digital Property/
│
├── apps/
│   │
│   ├── frontend/                          # Next.js 14 + TypeScript + Tailwind
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── dashboard/             # User/agent dashboard
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── layout.tsx
│   │   │   │   │   └── components/
│   │   │   │   │
│   │   │   │   ├── land/                  # Land listings & details
│   │   │   │   │   ├── page.tsx           # Browse listings
│   │   │   │   │   ├── [id]/              # Land detail page
│   │   │   │   │   ├── create/            # Listing creation (agent/owner)
│   │   │   │   │   └── components/
│   │   │   │   │
│   │   │   │   ├── escrow/                # Purchase & payment tracking
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/              # Escrow transaction detail
│   │   │   │   │   └── components/
│   │   │   │   │
│   │   │   │   ├── chat/                  # In-app messaging
│   │   │   │   │   ├── page.tsx
│   │   │   │   │   ├── [id]/              # Chat thread
│   │   │   │   │   └── components/
│   │   │   │   │
│   │   │   │   ├── auth/                  # Login, registration, KYC
│   │   │   │   │   ├── login/
│   │   │   │   │   ├── register/
│   │   │   │   │   ├── kyc/
│   │   │   │   │   └── verify/
│   │   │   │   │
│   │   │   │   ├── chatbot/               # AI chatbot overlay
│   │   │   │   │   └── layout.tsx
│   │   │   │   │
│   │   │   │   ├── admin/                 # Admin verification panel
│   │   │   │   │   ├── verifications/
│   │   │   │   │   ├── disputes/
│   │   │   │   │   └── analytics/
│   │   │   │   │
│   │   │   │   └── page.tsx               # Landing/home page
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── layout/
│   │   │   │   │   ├── Header.tsx
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Footer.tsx
│   │   │   │   │
│   │   │   │   ├── maps/
│   │   │   │   │   ├── MapViewer.tsx      # Leaflet map component
│   │   │   │   │   ├── MapPin.tsx         # Individual property pin
│   │   │   │   │   ├── GeoSearch.tsx      # GPS location search
│   │   │   │   │   └── MapFilters.tsx     # Price/size filters
│   │   │   │   │
│   │   │   │   ├── forms/
│   │   │   │   │   ├── ListingForm.tsx    # Create/edit listing
│   │   │   │   │   ├── KYCForm.tsx        # ID verification
│   │   │   │   │   ├── DocumentUpload.tsx # Survey/chief form upload
│   │   │   │   │   └── EscrowForm.tsx     # Payment form
│   │   │   │   │
│   │   │   │   ├── chat/
│   │   │   │   │   ├── ChatWindow.tsx
│   │   │   │   │   ├── ChatMessage.tsx
│   │   │   │   │   ├── ChatList.tsx
│   │   │   │   │   └── FraudAlert.tsx     # Fraud warning popup
│   │   │   │   │
│   │   │   │   ├── chatbot/
│   │   │   │   │   ├── ChatbotOverlay.tsx
│   │   │   │   │   ├── FAQPanel.tsx
│   │   │   │   │   └── ConversationThread.tsx
│   │   │   │   │
│   │   │   │   └── ui/
│   │   │   │       ├── Button.tsx
│   │   │   │       ├── Card.tsx
│   │   │   │       ├── Badge.tsx
│   │   │   │       ├── Modal.tsx
│   │   │   │       ├── Loading.tsx
│   │   │   │       └── ErrorBoundary.tsx
│   │   │   │
│   │   │   ├── hooks/
│   │   │   │   ├── useAuth.ts             # Auth context + login state
│   │   │   │   ├── useChat.ts             # Chat WebSocket connection
│   │   │   │   ├── useLandListings.ts     # Fetch listings
│   │   │   │   ├── useMap.ts              # Map interactions
│   │   │   │   └── useForms.ts            # Form state management
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── api.ts                 # Axios instance + base URL
│   │   │   │   ├── auth.ts                # Login, register, KYC endpoints
│   │   │   │   ├── land.ts                # Land listing API calls
│   │   │   │   ├── escrow.ts              # Escrow payment API calls
│   │   │   │   ├── chat.ts                # Chat API + WebSocket setup
│   │   │   │   ├── blockchain.ts          # Blockchain transactions (Web3.js)
│   │   │   │   └── imageUpload.ts         # S3/storage upload service
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── formatters.ts          # Price, date formatters
│   │   │   │   ├── validators.ts          # Form validation rules
│   │   │   │   ├── geolocation.ts         # GPS utilities
│   │   │   │   ├── constants.ts           # App constants
│   │   │   │   └── localStorage.ts        # Client-side storage
│   │   │   │
│   │   │   ├── types/
│   │   │   │   ├── user.ts                # User, Agent, Buyer types
│   │   │   │   ├── land.ts                # Land, Listing types
│   │   │   │   ├── escrow.ts              # Escrow transaction types
│   │   │   │   ├── chat.ts                # Message, Chat types
│   │   │   │   └── api.ts                 # API response types
│   │   │   │
│   │   │   ├── context/
│   │   │   │   ├── AuthContext.tsx        # Global auth state
│   │   │   │   ├── ChatContext.tsx        # Global chat state
│   │   │   │   └── ThemeContext.tsx       # Dark/light mode
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── auth.middleware.ts     # Route protection
│   │   │   │   └── errorHandler.ts        # Global error handling
│   │   │   │
│   │   │   └── globals.css                # Tailwind styles
│   │   │
│   │   ├── public/
│   │   │   ├── images/
│   │   │   ├── icons/
│   │   │   └── favicons/
│   │   │
│   │   ├── next.config.js
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   ├── .env.local
│   │   ├── .env.example
│   │   ├── package.json
│   │   └── README.md
│   │
│   ├── backend/                           # FastAPI + SQLAlchemy
│   │   ├── app/
│   │   │   ├── main.py                    # FastAPI app init
│   │   │   │
│   │   │   ├── config/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── settings.py            # Environment config
│   │   │   │   ├── database.py            # PostgreSQL connection
│   │   │   │   └── constants.py           # App constants
│   │   │   │
│   │   │   ├── routers/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py                # /auth routes
│   │   │   │   ├── users.py               # /users routes
│   │   │   │   ├── land.py                # /land routes
│   │   │   │   ├── agents.py              # /agents routes
│   │   │   │   ├── escrow.py              # /escrow routes
│   │   │   │   ├── chat.py                # /chat routes
│   │   │   │   ├── blockchain.py          # /blockchain routes
│   │   │   │   └── admin.py               # /admin routes
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth_service.py        # User auth logic
│   │   │   │   ├── land_service.py        # Land listing logic
│   │   │   │   ├── escrow_service.py      # Escrow payment logic
│   │   │   │   ├── agent_service.py       # Agent verification
│   │   │   │   ├── chat_service.py        # Chat + message logic
│   │   │   │   ├── ai_service.py          # AI microservice calls
│   │   │   │   ├── blockchain_service.py  # Smart contract calls
│   │   │   │   └── kyc_service.py         # KYC document processing
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py                # User model
│   │   │   │   ├── land.py                # Land model
│   │   │   │   ├── document.py            # Document model
│   │   │   │   ├── escrow.py              # Escrow model
│   │   │   │   ├── chat.py                # Chat message model
│   │   │   │   ├── agent.py               # Agent model
│   │   │   │   └── ownership.py           # Ownership history model
│   │   │   │
│   │   │   ├── schemas/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── user.py                # Pydantic user schemas
│   │   │   │   ├── land.py                # Pydantic land schemas
│   │   │   │   ├── escrow.py              # Pydantic escrow schemas
│   │   │   │   ├── chat.py                # Pydantic chat schemas
│   │   │   │   └── responses.py           # Response models
│   │   │   │
│   │   │   ├── middleware/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py                # JWT verification
│   │   │   │   ├── rate_limit.py          # Rate limiting
│   │   │   │   ├── error_handler.py       # Exception handling
│   │   │   │   └── cors.py                # CORS configuration
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── hash.py                # SHA256, bcrypt
│   │   │   │   ├── jwt.py                 # JWT token creation/validation
│   │   │   │   ├── validators.py          # Input validation
│   │   │   │   ├── notifications.py       # Email, SMS alerts
│   │   │   │   └── enums.py               # Status enums
│   │   │   │
│   │   │   ├── dependencies/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── auth.py                # Auth dependency injection
│   │   │   │   ├── database.py            # DB session dependency
│   │   │   │   └── validators.py          # Request validators
│   │   │   │
│   │   │   └── migrations/                # Alembic migrations
│   │   │       ├── versions/
│   │   │       ├── env.py
│   │   │       ├── script.py.mako
│   │   │       └── alembic.ini
│   │   │
│   │   ├── tests/
│   │   │   ├── conftest.py
│   │   │   ├── test_auth.py
│   │   │   ├── test_land.py
│   │   │   ├── test_escrow.py
│   │   │   └── test_chat.py
│   │   │
│   │   ├── requirements.txt
│   │   ├── .env.example
│   │   ├── Dockerfile
│   │   ├── docker-compose.override.yml
│   │   └── README.md
│   │
│   ├── ai-service/                        # Python ML/Fraud Detection
│   │   ├── src/
│   │   │   ├── main.py
│   │   │   │
│   │   │   ├── models/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── fraud_detector.py      # ML fraud scoring
│   │   │   │   ├── land_valuation.py      # Land price estimation
│   │   │   │   └── document_analyzer.py   # Document verification
│   │   │   │
│   │   │   ├── services/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── fraud_service.py
│   │   │   │   ├── valuation_service.py
│   │   │   │   └── chatbot_faq.py         # FAQ responses
│   │   │   │
│   │   │   ├── ml_models/                 # Pre-trained models
│   │   │   │   ├── fraud_model.pkl
│   │   │   │   └── valuation_model.pkl
│   │   │   │
│   │   │   ├── utils/
│   │   │   │   ├── __init__.py
│   │   │   │   ├── feature_extraction.py
│   │   │   │   └── logger.py
│   │   │   │
│   │   │   └── routers/
│   │   │       ├── __init__.py
│   │   │       ├── fraud.py               # /fraud endpoint
│   │   │       ├── valuation.py           # /valuation endpoint
│   │   │       └── chatbot.py             # /chatbot endpoint
│   │   │
│   │   ├── requirements.txt
│   │   ├── Dockerfile
│   │   ├── .env.example
│   │   └── README.md
│   │
│   └── blockchain/                        # Solana + Anchor programs
│       ├── programs/
│       │   ├── asset_registry/            # Document hash storage
│       │   │   ├── src/
│       │   │   │   ├── lib.rs
│       │   │   │   └── instructions/      # Program instructions
│       │   │   ├── Cargo.toml
│       │   │   └── Xargo.toml
│       │   │
│       │   ├── land_ownership/            # Ownership transfers
│       │   │   ├── src/
│       │   │   │   ├── lib.rs
│       │   │   │   └── instructions/
│       │   │   ├── Cargo.toml
│       │   │   └── Xargo.toml
│       │   │
│       │   └── escrow_contract/           # Escrow logic
│       │       ├── src/
│       │       │   ├── lib.rs
│       │       │   └── instructions/
│       │       ├── Cargo.toml
│       │       └── Xargo.toml
│       │
│       ├── idls/                          # Generated IDL files
│       │   ├── asset_registry.json
│       │   ├── land_ownership.json
│       │   └── escrow_contract.json
│       │
│       ├── tests/
│       │   ├── asset_registry.ts
│       │   ├── land_ownership.ts
│       │   └── escrow_contract.ts
│       │
│       ├── migrations/
│       │   └── deploy.ts
│       │
│       ├── Anchor.toml
│       ├── package.json
│       ├── tsconfig.json
│       └── README.md
│
├── shared/                                 # Shared utilities
│   ├── types/
│   │   ├── index.ts                       # Shared TypeScript types
│   │   └── api.ts                         # API contract types
│   │
│   ├── constants/
│   │   └── index.ts                       # Shared constants
│   │
│   └── utils/
│       ├── formatting.ts
│       └── validation.ts
│
├── docker-compose.yml                     # Main composition
├── docker-compose.dev.yml                 # Development overrides
├── docker-compose.prod.yml                # Production overrides
│
├── docs/
│   ├── ARCHITECTURE.md                    # Detailed architecture
│   ├── DIRECTORY_STRUCTURE.md             # This file
│   ├── DEPLOYMENT.md                      # Deployment guide
│   ├── DATABASE.md                        # Schema & migrations
│   ├── ENVIRONMENT.md                     # Env vars & secrets
│   ├── FRONTEND_GUIDE.md                  # Frontend development
│   ├── BACKEND_GUIDE.md                   # Backend development
│   ├── BLOCKCHAIN_GUIDE.md                # Blockchain development
│   ├── API_DOCS.md                        # API reference
│   ├── WebSocket_Chat.md                  # Real-time chat
│   ├── TESTING.md                         # Test suite
│   └── PRODUCTION_CHECKLIST.md            # Pre-launch checks
│
├── .github/
│   ├── workflows/
│   │   ├── ci.yml                         # GitHub Actions CI
│   │   └── deploy.yml                     # CD pipeline
│   └── ISSUE_TEMPLATE/
│
├── .gitignore
├── .env.example                           # Root env template
├── README.md                              # Project root README
└── LICENSE
```

## 🔄 Migration Path from Old to New Structure

### Old Structure → New Structure Mapping

| Old | New | Notes |
|-----|-----|-------|
| `frontend/` | `apps/frontend/` | Next.js replaces React |
| `api-gateway/` | `apps/backend/routers/` | All routers in one FastAPI app |
| `services/parcel-service/` | `apps/backend/` | Merged into single backend |
| `services/grid-service/` | `apps/backend/` | Merged into single backend |
| `services/conflict-service/` | `apps/backend/` | Merged into single backend |
| `services/ownership-service/` | `apps/backend/` | Merged into single backend |
| N/A | `apps/ai-service/` | NEW: Fraud + valuation |
| N/A | `apps/blockchain/` | NEW: Solana smart contracts |
| `shared/` | `shared/` | Expanded with types |

## 🎯 Key Architecture Changes

### Why Next.js over React?
- ✅ Built-in routing (vs React Router complexity)
- ✅ Server-side rendering for SEO
- ✅ API routes for proxy calls
- ✅ Image optimization
- ✅ Better TypeScript support
- ✅ File-based routing (simpler structure)

### Why FastAPI Backend?
- ✅ Single Python backend for all services
- ✅ Async/await out of the box
- ✅ Automatic API documentation (Swagger)
- ✅ Built-in dependency injection
- ✅ Better performance than Node.js for computation
- ✅ Easier ML/AI integration

### Why Separate AI Service?
- ✅ Independent ML model serving
- ✅ Can scale separately
- ✅ Doesn't block main API
- ✅ Supports long-running inference

### Why Blockchain (Solana)?
- ✅ Document hash immutability
- ✅ Ownership history ledger
- ✅ Smart contract-based escrow
- ✅ Low transaction costs
- ✅ Anchor framework for safety

## 📋 Implementation Phases

### Phase 1: Backend Consolidation (1-2 weeks)
- [ ] Create `apps/backend/` structure
- [ ] Migrate Express → FastAPI
- [ ] Merge 5 microservices into routers/
- [ ] Implement database models/schemas
- [ ] Create service layer
- [ ] Add authentication middleware

### Phase 2: Frontend Upgrade (1-2 weeks)
- [ ] Create `apps/frontend/` with Next.js
- [ ] Migrate React components
- [ ] Set up Tailwind configuration
- [ ] Implement page structure
- [ ] Create API client (axios)
- [ ] Add authentication flows

### Phase 3: AI & Chat (1 week)
- [ ] Create `apps/ai-service/`
- [ ] Implement fraud detection models
- [ ] Implement land valuation models
- [ ] Create chatbot FAQ service
- [ ] Integrate with backend
- [ ] Add WebSocket chat handler

### Phase 4: Blockchain (1-2 weeks)
- [ ] Set up Anchor project
- [ ] Write AssetRegistry program
- [ ] Write Ownership program
- [ ] Write EscrowContract program
- [ ] Create IDL files
- [ ] Integrate with backend

### Phase 5: Testing & Deployment (1 week)
- [ ] Write test suites
- [ ] Create docker-compose
- [ ] Set up CI/CD
- [ ] Production checklist
- [ ] Deployment documentation

## 🚀 Getting Started with New Structure

See [DEPLOYMENT.md](./docs/DEPLOYMENT.md) for step-by-step setup instructions.
