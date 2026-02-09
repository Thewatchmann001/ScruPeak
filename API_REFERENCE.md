# LandBiznes Backend API Reference

## Overview
Complete REST API for the LandBiznes real estate platform. Supports 61+ endpoints across 11 routers. Built with FastAPI for high performance and scalability.

**Base URL**: `http://localhost:8000/api/v1`

**WebSocket Base**: `ws://localhost:8000/ws`

---

## Authentication

### Token-Based Authentication (JWT)
All protected endpoints require a Bearer token in the Authorization header:

```bash
Authorization: Bearer <jwt_token>
```

### Token Types
- **Access Token**: Short-lived (15 minutes default)
- **Refresh Token**: Long-lived (7 days default)

---

## API Routers

### 1. Authentication Router (`/api/v1/auth`)
**Purpose**: User registration, login, and token management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register new user | No |
| POST | `/login` | Login and get tokens | No |
| POST | `/refresh` | Refresh access token | No |
| POST | `/verify-email` | Verify email address | No |
| GET | `/me` | Get current user | Yes |

---

### 2. Users Router (`/api/v1/users`)
**Purpose**: User profile management and account controls

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/me` | Get current profile | Yes | Any |
| PATCH | `/me` | Update profile | Yes | Any |
| GET | `/{user_id}` | Get user by ID | Yes | Any |
| GET | `/` | List users | Yes | Admin |
| POST | `/change-password` | Change password | Yes | Any |
| DELETE | `/delete-account` | Delete account | Yes | Any |
| POST | `/{user_id}/verify` | Verify user (admin) | Yes | Admin |
| POST | `/{user_id}/ban` | Ban user | Yes | Admin |
| POST | `/{user_id}/unban` | Unban user | Yes | Admin |

---

### 3. Land Properties Router (`/api/v1/land`)
**Purpose**: Property management and listing

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create property | Yes |
| GET | `/` | List properties | No |
| GET | `/{land_id}` | Get property details | No |
| PATCH | `/{land_id}` | Update property | Yes |
| DELETE | `/{land_id}` | Delete property | Yes |

---

### 4. Agents Router (`/api/v1/agents`)
**Purpose**: Real estate agent management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/register` | Register as agent | Yes |
| GET | `/me` | Get agent profile | Yes |
| PATCH | `/me` | Update agent profile | Yes |
| GET | `/` | List agents | No |
| GET | `/{agent_id}` | Get agent details | No |
| POST | `/{agent_id}/rate` | Rate agent | Yes |

---

### 5. Escrow Router (`/api/v1/escrow`)
**Purpose**: Transaction and escrow management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/` | Create escrow | Yes |
| GET | `/` | List escrows | Yes |
| GET | `/{escrow_id}` | Get escrow details | Yes |
| PATCH | `/{escrow_id}` | Update escrow | Yes |
| POST | `/{escrow_id}/release` | Release funds | Yes |
| POST | `/{escrow_id}/dispute` | Dispute escrow | Yes |

---

### 6. Chat Router (`/api/v1/chat`)
**Purpose**: Messaging and communication

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/messages` | Send message | Yes |
| GET | `/messages/{room_id}` | Get conversation | Yes |
| DELETE | `/messages/{message_id}` | Delete message | Yes |
| GET | `/conversations` | List conversations | Yes |

---

### 7. Blockchain Router (`/api/v1/blockchain`)
**Purpose**: Blockchain verification and recording

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/verify` | Verify property | Yes |
| GET | `/status/{property_id}` | Check verification | Yes |
| POST | `/record` | Record transaction | Yes |
| GET | `/transactions` | Get transactions | Yes |

---

### 8. Admin Router (`/api/v1/admin`)
**Purpose**: System administration and analytics

| Method | Endpoint | Description | Auth | Role |
|--------|----------|-------------|------|------|
| GET | `/stats` | System statistics | Yes | Admin |
| GET | `/dashboard` | Dashboard overview | Yes | Admin |
| GET | `/activity` | Activity report | Yes | Admin |
| GET | `/transactions` | Transaction report | Yes | Admin |

---

### 9. Documents Router (`/api/v1/documents`)
**Purpose**: Document upload and management

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/upload` | Upload document | Yes |
| GET | `/{document_id}` | Get document | Yes |
| GET | `/land/{land_id}` | List property docs | Yes |
| GET | `/user/me` | My documents | Yes |
| DELETE | `/{document_id}` | Delete document | Yes |
| POST | `/{document_id}/verify` | Verify doc (admin) | Yes |

---

### 10. Payments Router (`/api/v1/payments`)
**Purpose**: Payment processing and tracking

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| POST | `/initiate` | Initiate payment | Yes |
| POST | `/stripe/webhook` | Stripe webhook | No |
| POST | `/paystack/webhook` | Paystack webhook | No |
| GET | `/{payment_id}` | Get status | Yes |
| POST | `/{payment_id}/refund` | Request refund | Yes |
| GET | `/escrow/{escrow_id}/payments` | List escrow payments | Yes |

---

### 11. WebSocket Router (`/ws`)
**Purpose**: Real-time communication

| Endpoint | Type | Description |
|----------|------|-------------|
| `/ws/chat/{room_id}` | WebSocket | Real-time chat |
| `/ws/notifications` | WebSocket | Real-time notifications |
| `/ws/chat/{room_id}/users` | GET | Active users in room |
| `/ws/chat/{room_id}/status` | GET | Room status |
| `/ws/notifications/me` | GET | User notifications |
| `/ws/notifications/clear` | POST | Clear notifications |

---

## Request/Response Examples

### Register User
**Request**:
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!",
  "name": "John Doe",
  "phone": "+234901234567"
}
```

**Response** (200 OK):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "email": "user@example.com",
  "name": "John Doe",
  "role": "buyer",
  "kyc_verified": false,
  "created_at": "2026-01-23T17:40:00Z"
}
```

### Login
**Request**:
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response** (200 OK):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refresh_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 900
}
```

### Create Property
**Request**:
```bash
POST /api/v1/land/
Authorization: Bearer <token>
Content-Type: application/json

{
  "address": "123 Main St, Lagos",
  "price": 50000000,
  "size_sqm": 5000,
  "description": "Beautiful property",
  "coordinates": {
    "latitude": 6.5244,
    "longitude": 3.3792
  }
}
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "address": "123 Main St, Lagos",
  "price": 50000000,
  "size_sqm": 5000,
  "status": "available",
  "owner_id": "550e8400-e29b-41d4-a716-446655440000",
  "created_at": "2026-01-23T17:40:00Z"
}
```

### Initiate Payment
**Request**:
```bash
POST /api/v1/payments/initiate
Authorization: Bearer <token>
Content-Type: application/json

{
  "escrow_id": "550e8400-e29b-41d4-a716-446655440002",
  "amount": "50000.00",
  "payment_method": "stripe"
}
```

**Response** (201 Created):
```json
{
  "payment_id": "550e8400-e29b-41d4-a716-446655440003",
  "escrow_id": "550e8400-e29b-41d4-a716-446655440002",
  "amount": "50000.00",
  "status": "pending",
  "payment_method": "stripe",
  "payment_url": "/payments/stripe/checkout/550e8400-e29b-41d4-a716-446655440003"
}
```

### Upload Document
**Request**:
```bash
POST /api/v1/documents/upload
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: <binary file>
doc_type: proof_of_ownership
land_id: 550e8400-e29b-41d4-a716-446655440001
```

**Response** (201 Created):
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440004",
  "filename": "550e8400-e29b-41d4-a716-446655440004.pdf",
  "doc_type": "proof_of_ownership",
  "user_id": "550e8400-e29b-41d4-a716-446655440000",
  "verified": false,
  "created_at": "2026-01-23T17:40:00Z"
}
```

### WebSocket Chat
**Connect**:
```javascript
const ws = new WebSocket(
  'ws://localhost:8000/ws/chat/room123?token=<jwt_token>'
);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log(message);
};

ws.send(JSON.stringify({
  type: 'message',
  content: 'Hello, world!'
}));
```

**Message Format**:
```json
{
  "type": "message",
  "sender_id": "550e8400-e29b-41d4-a716-446655440000",
  "content": "Hello, world!",
  "timestamp": "2026-01-23T17:40:00Z"
}
```

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Invalid request parameter"
}
```

### 401 Unauthorized
```json
{
  "detail": "Invalid or expired token"
}
```

### 403 Forbidden
```json
{
  "detail": "You don't have permission to access this resource"
}
```

### 404 Not Found
```json
{
  "detail": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "detail": "Internal server error"
}
```

---

## Rate Limiting
- Default: 100 requests per minute
- Premium: 1000 requests per minute
- Admin: Unlimited

---

## Pagination
For list endpoints, use query parameters:
- `skip`: Number of items to skip (default: 0)
- `limit`: Number of items to return (default: 20, max: 100)

**Example**:
```bash
GET /api/v1/land/?skip=20&limit=50
```

---

## Sorting
For list endpoints:
- `sort_by`: Field to sort by
- `order`: `asc` or `desc` (default: `asc`)

**Example**:
```bash
GET /api/v1/land/?sort_by=price&order=desc
```

---

## Filtering
Each resource supports filtering by fields:

**Example**:
```bash
GET /api/v1/land/?status=available&min_price=10000000
```

---

## Status Codes

| Code | Meaning |
|------|---------|
| 200 | OK - Request successful |
| 201 | Created - Resource created |
| 204 | No Content - Successful deletion |
| 400 | Bad Request - Invalid parameters |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource not found |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation error |
| 429 | Too Many Requests - Rate limit exceeded |
| 500 | Internal Server Error |
| 503 | Service Unavailable |

---

## Documentation

### Interactive API Docs
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

---

## Support

For API support:
- Email: api-support@landbiznes.com
- Status Page: https://status.landbiznes.com
- Documentation: https://docs.landbiznes.com

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| v1.0.0 | 2026-01-23 | Initial release with 61 endpoints |

---

**Last Updated**: January 23, 2026
**API Status**: ✅ Production Ready
