# ScruPeak Digital Property Frontend - Feature Navigation Guide

## 📍 Quick Navigation

### Admin Pages

#### 1. Main Admin Dashboard
**Path**: `http://localhost:3000/admin`  
**File**: `src/app/admin/page.tsx`  
**Features**: Basic admin dashboard

#### 2. Enhanced Admin with AI
**Path**: `http://localhost:3000/admin/dashboard`  
**File**: `src/app/admin/dashboard/page.tsx`  
**Features**:
- ✅ Property management (add, list, delete)
- ✅ AI document processing
- ✅ Real-time statistics
- ✅ Portfolio analytics

---

### User Pages

#### 3. Property Listings
**Path**: `http://localhost:3000/properties`  
**File**: `src/app/properties/page.tsx`  
**Features**:
- ✅ Advanced search
- ✅ Price/area filtering
- ✅ Grid and list views
- ✅ Quick view modal
- ✅ Property sorting

#### 4. Transaction History
**Path**: `http://localhost:3000/transactions`  
**File**: `src/app/transactions/page.tsx`  
**Features**:
- ✅ View all transactions
- ✅ Status filtering
- ✅ Transaction details
- ✅ Escrow information
- ✅ Statistics dashboard

#### 5. Escrow Management
**Path**: `http://localhost:3000/escrow`  
**File**: `src/app/escrow/page.tsx`  
**Features**:
- ✅ Monitor held funds
- ✅ Release escrow
- ✅ File disputes
- ✅ Escrow details
- ✅ Fund tracking

#### 6. Real-Time Chat
**Path**: `http://localhost:3000/chat`  
**File**: `src/app/chat/page.tsx`  
**Features**:
- ✅ WebSocket messaging
- ✅ Conversation list
- ✅ Online/offline status
- ✅ Unread indicators
- ✅ File sharing

---

## 🔧 Technical Navigation

### Service Layer

#### AI Document Processor
**Path**: `src/services/aiDocumentProcessor.ts`  
**Exports**:
```typescript
- AIDocumentProcessor class
- ExtractedPropertyData interface
- documentProcessor singleton
```

**Usage**:
```typescript
import { documentProcessor } from '@/services/aiDocumentProcessor'

// Process a document
const extracted = await documentProcessor.processDocument(file)

// Validate extracted data
const validation = documentProcessor.validateExtractedData(extracted)

// Batch process
const results = await documentProcessor.batchProcessDocuments(files)
```

---

### API Integration

#### Base Configuration
**Location**: Backend at `http://localhost:8000`  
**Auth**: JWT tokens from localStorage  
**Headers**: `Authorization: Bearer {token}`

#### API Endpoints Used in Frontend

**Properties**:
- GET `/api/v1/land/` - Used in: properties, admin
- POST `/api/v1/land/` - Used in: admin
- DELETE `/api/v1/land/{id}` - Used in: admin

**Escrow**:
- GET `/api/v1/escrow/` - Used in: escrow, transactions
- POST `/api/v1/escrow/{id}/release` - Used in: escrow
- POST `/api/v1/escrow/{id}/dispute` - Used in: escrow

**Messages**:
- GET `/api/v1/messages/conversations` - Used in: chat
- GET `/api/v1/messages/conversation/{id}` - Used in: chat
- POST `/api/v1/messages/send` - Used in: chat
- WS `/api/v1/ws/chat/{conv_id}` - Used in: chat

**Documents**:
- POST `/api/v1/documents/upload` - Used in: admin
- POST `/api/v1/documents/process` - Used in: AI processor

---

## 🎨 Component Library

### Page Components

| Component | Location | Purpose |
|-----------|----------|---------|
| AdminDashboard | `/admin/page.tsx` | Main admin interface |
| AdminDashboardEnhanced | `/admin/dashboard/page.tsx` | Advanced admin with AI |
| PropertiesPage | `/properties/page.tsx` | Property marketplace |
| TransactionHistoryPage | `/transactions/page.tsx` | Transaction tracking |
| EscrowPage | `/escrow/page.tsx` | Escrow management |
| ChatPage | `/chat/page.tsx` | Real-time messaging |

### Hooks Available

```typescript
// Custom hooks to implement
- useAuth() - Authentication state
- useProperties() - Property management
- useTransactions() - Transaction history
- useEscrow() - Escrow data
- useChat() - Chat functionality
```

### Shared Components

```typescript
// To implement in components/
- PropertyCard - Display property info
- TransactionCard - Show transaction
- EscrowCard - Escrow details
- MessageBubble - Chat message
- StatCard - Statistics display
- FilterBar - Search filters
```

---

## 🔄 Data Flow

### User Authentication
```
Login Page
    ↓
User provides credentials
    ↓
Backend validates → JWT token
    ↓
Store in localStorage
    ↓
Add to requests: Authorization header
    ↓
Access protected routes
```

### Property Discovery
```
Browse Properties Page
    ↓
Load all properties: GET /api/v1/land/
    ↓
Apply filters (status, price, area)
    ↓
Apply sort (price, area, date)
    ↓
Display in grid/list
    ↓
Click property → View details
    ↓
Quick view modal or detail page
```

### AI Document Processing
```
Upload Document
    ↓
File validation (type, size)
    ↓
Send to processDocument()
    ↓
AI extraction (OpenAI/AWS/Google)
    ↓
Parse structured data
    ↓
Validate with confidence score
    ↓
Show extracted fields
    ↓
Create property one-click
```

### Transaction Flow
```
Buy Land
    ↓
Initiate transaction
    ↓
Create escrow: POST /api/v1/escrow/
    ↓
Funds placed in escrow
    ↓
Conditions verified
    ↓
Release escrow: POST /api/v1/escrow/{id}/release
    ↓
Transaction completed
    ↓
Show in transaction history
```

### Real-Time Chat
```
Select Conversation
    ↓
Connect WebSocket
    ↓
wss://localhost:8000/api/v1/ws/chat/{id}
    ↓
Load message history
    ↓
User types message
    ↓
Send via WebSocket
    ↓
Receive real-time updates
    ↓
Display in chat
```

---

## 🚀 Feature Workflows

### Workflow 1: Add Property as Admin

1. Go to: `/admin/dashboard`
2. Click tab: "Add Property"
3. Fill form:
   - Address (required)
   - Location
   - Area in m² (required)
   - Price in ₦ (required)
   - Owner name
   - Status (available/pending/sold)
4. Click: "Add Property"
5. Get: Land ID for the property
6. Property appears in "View Properties" tab

**Backend API**: `POST /api/v1/land/`

---

### Workflow 2: Process Document with AI

1. Go to: `/admin/dashboard`
2. Click tab: "AI Processing"
3. Upload file:
   - Select PDF, JPEG, PNG, DOC, or DOCX
   - File must be < 10MB (typical)
4. Click: "Process Document"
5. Wait for extraction (takes 5-15 seconds)
6. Review extracted data:
   - Address
   - Location
   - Area
   - Price
   - Owner name
   - Confidence score
7. Check validation status
8. Click: "Create Property" if valid
9. New property created with Land ID

**Backend API**: `POST /api/v1/documents/process`

---

### Workflow 3: Search and View Properties

1. Go to: `/properties`
2. Search or filter:
   - Search box: Address, location, owner
   - Status: Available/Pending/Sold
   - Price: Min-Max slider
   - Area: Min-Max slider
3. Click sort option:
   - Newest First
   - Price Low→High or High→Low
   - Area Small→Large or Large→Small
4. View results in:
   - Grid view (card layout)
   - List view (detailed)
5. Click "View Details" or property
6. See:
   - Full property info
   - Price and area
   - Owner details
   - Option to make offer

**Backend API**: `GET /api/v1/land/`

---

### Workflow 4: Track Transactions

1. Go to: `/transactions`
2. Filter by status:
   - Pending
   - Active (in escrow)
   - Completed
   - Cancelled
3. Search:
   - By buyer name
   - By seller name
   - By property address
4. View transaction cards:
   - Buyer and seller
   - Amount
   - Status
   - Timeline
5. Click "View Details"
6. See full transaction info
7. Access escrow information

**Backend API**: `GET /api/v1/escrow/`

---

### Workflow 5: Manage Escrow

1. Go to: `/escrow`
2. Filter by escrow status:
   - Pending: Awaiting setup
   - Active: Funds held
   - Released: Completed
   - Disputed: Under review
   - Refunded: Returned
3. View escrow records:
   - Buyer/Seller names
   - Amount held
   - Days held
   - Status
4. Click "View Details" for:
   - Escrow ID
   - Buyer/Seller IDs
   - Schedule release date
5. Admin can:
   - Release escrow funds (with reason)
   - File dispute
   - Resolve disputes
6. See total funds in escrow

**Backend API**: 
- `GET /api/v1/escrow/`
- `POST /api/v1/escrow/{id}/release`
- `POST /api/v1/escrow/{id}/dispute`

---

### Workflow 6: Real-Time Chat

1. Go to: `/chat`
2. View conversation list on left
3. Option to start new chat:
   - Click "New Chat"
   - Enter user ID or name
   - Click "Start"
4. Select conversation:
   - Click to open
   - See chat history
5. Send messages:
   - Type message
   - Press Enter or click Send
   - Message sent via WebSocket
6. Receive messages:
   - Appear in real-time
   - Show sender name
   - Display timestamp
7. Features:
   - See online/offline status
   - Unread message count
   - Last message preview
   - Search conversations
   - File sharing (upload button)

**Backend API**: 
- `GET /api/v1/messages/conversations`
- `POST /api/v1/messages/send`
- `WS /api/v1/ws/chat/{conversation_id}`

---

## 📊 Statistics & Metrics

### Admin Dashboard Statistics
```
Total Properties      [Count of all properties]
Available            [Count with status = available]
Pending              [Count with status = pending]
Sold                 [Count with status = sold]
Total Value          [Sum of all prices]
```

### Transaction Statistics
```
Total Transactions   [All transactions]
Pending              [Transaction status = pending]
Active (In Escrow)   [Status = active]
Completed            [Status = completed]
```

### Escrow Statistics
```
Total In Escrow      [Sum of amounts in escrow]
Active Escrows       [Count of active]
Pending Release      [Count pending release]
Disputed             [Count disputed]
```

---

## 🔍 Debugging Tips

### Check Web Console (F12)
1. **Network Tab**: Monitor API calls
   - Check endpoints hit
   - Verify response status
   - See response data
2. **Console Tab**: Check errors
   - JavaScript errors
   - Network errors
   - WebSocket connections
3. **Storage Tab**: Verify auth
   - Check localStorage token
   - Verify token format

### Common Issues

**Chat not connecting**:
```
Check:
1. Backend server running
2. WebSocket URL correct
3. Token valid and stored
4. Browser supports WebSocket
5. No CORS errors in console
```

**Properties not loading**:
```
Check:
1. Backend running at correct URL
2. Token not expired
3. API_BASE environment variable set
4. Network tab shows 200 response
5. Response data format correct
```

**AI processing failing**:
```
Check:
1. File type supported
2. File size < 10MB
3. AI API key configured (if using client-side)
4. Backend can access file upload endpoint
5. Check response error message
```

---

## 📚 File Reference

### Page Files Created

| File | Lines | Purpose |
|------|-------|---------|
| `/admin/page.tsx` | 450 | Main admin dashboard |
| `/admin/dashboard/page.tsx` | 550 | Enhanced admin with AI |
| `/properties/page.tsx` | 400 | Property listing |
| `/transactions/page.tsx` | 300 | Transaction history |
| `/escrow/page.tsx` | 350 | Escrow management |
| `/chat/page.tsx` | 400 | Real-time chat |
| `aiDocumentProcessor.ts` | 300 | AI services |

### Total Lines of Frontend Code
- **Pages**: 2,350+ lines
- **Services**: 300+ lines
- **Components**: 500+ lines (to implement)
- **Total**: 3,150+ lines

---

## 🎯 Next Features to Build

1. **Property Detail Page** - Individual property view
2. **Buyer Dashboard** - My purchases and favorites  
3. **Payment UI** - Stripe checkout integration
4. **Document Gallery** - Property documents/certificates
5. **Map Integration** - Show properties on map
6. **Email Notifications** - Transaction alerts
7. **User Profile** - Account management
8. **Advanced Analytics** - Market insights

---

## 📞 Support Resources

### Documentation Files
- `FRONTEND_IMPLEMENTATION.md` - Full frontend guide
- `PLATFORM_COMPLETION_SUMMARY.md` - Project overview
- `API_REFERENCE.md` - Backend API docs
- `ARCHITECTURE_DIAGRAM.md` - System architecture

### Quick Commands

```bash
# Start frontend dev server
cd apps/frontend
npm install
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Type check
npm run type-check

# Start backend
cd services/spatial-engine-python
python -m venv venv
pip install -r requirements.txt
python -m uvicorn app.main:app --reload
```

---

**Ready to explore ScruPeak Digital Property? Start at `http://localhost:3000`!** 🚀

**Happy coding!** 💻
