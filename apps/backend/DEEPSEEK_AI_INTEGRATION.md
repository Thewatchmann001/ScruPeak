# DeepSeek AI Integration

## Overview

DeepSeek AI has been integrated as a **non-invasive intelligence layer** providing advisory-only guidance for land transactions in Sierra Leone.

## Configuration

Add to your `.env` file:

```bash
DEEPSEEK_API_KEY=sk-7d00ad0d56ae4af3b5c209a675ac4210
DEEPSEEK_ENABLED=true
```

## API Endpoints

### 1. General AI Assistance
```
POST /api/v1/ai/assist
```

Request:
```json
{
  "query": "What documents do I need to buy land in Sierra Leone?",
  "context": {
    "location": "Freetown",
    "property_type": "residential"
  }
}
```

Response:
```json
{
  "success": true,
  "guidance": "Main answer...",
  "explanation": "Detailed explanation...",
  "cautions": ["Warning 1", "Warning 2"],
  "next_steps": ["Step 1", "Step 2"],
  "disclaimer": "This is advisory information only...",
  "timestamp": "2026-01-26T..."
}
```

### 2. Land Guidance
```
POST /api/v1/ai/land-guidance
```

Request:
```json
{
  "question": "How do I verify land ownership in Sierra Leone?",
  "context": {
    "location": "Bo District",
    "property_type": "commercial"
  }
}
```

### 3. Document Review
```
POST /api/v1/ai/document-review
```

Request:
```json
{
  "document_text": "Document content here...",
  "document_type": "survey_plan"
}
```

Response:
```json
{
  "success": true,
  "document_type": "survey_plan",
  "summary": "Brief summary...",
  "red_flags": ["Flag 1", "Flag 2"],
  "verification_points": ["Point 1", "Point 2"],
  "recommendations": ["Recommendation 1"],
  "confidence": 0.85,
  "disclaimer": "AI review is advisory only...",
  "timestamp": "2026-01-26T..."
}
```

### 4. Service Status
```
GET /api/v1/ai/status
```

## Features

- ✅ **Advisory Only**: No database writes, no legal guarantees
- ✅ **Sierra Leone Context**: Tailored for local land laws and customs
- ✅ **Structured Responses**: JSON format for easy integration
- ✅ **Red Flag Detection**: Identifies potential issues in documents
- ✅ **Plain English**: Easy-to-understand guidance
- ✅ **Cautions & Disclaimers**: Always includes warnings
- ✅ **Feature Flagged**: Can be disabled via config
- ✅ **Logged & Auditable**: All requests are logged

## Security

- Requires authentication (JWT token)
- API key stored in environment variables
- No sensitive data sent to AI (only document text/context)
- All responses include disclaimers

## Usage Example

```python
import httpx

async with httpx.AsyncClient() as client:
    response = await client.post(
        "http://localhost:8000/api/v1/ai/assist",
        headers={"Authorization": "Bearer YOUR_JWT_TOKEN"},
        json={
            "query": "What are the steps to register land in Sierra Leone?",
            "context": {"location": "Freetown"}
        }
    )
    result = response.json()
```

## Disabling AI

Set in `.env`:
```bash
DEEPSEEK_ENABLED=false
```

Or simply don't set `DEEPSEEK_API_KEY`. The service will gracefully degrade.
