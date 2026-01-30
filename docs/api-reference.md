# API Reference

REST API endpoints for Ask Prism.

## Base URL

```
Development: http://localhost:3000/api
Production:  https://ask-prism.vercel.app/api
```

---

## Documents

### Upload Document

```
POST /api/documents
Content-Type: multipart/form-data
```

**Request:**
```
file: <binary>
processing_mode: basic | standard | advanced
doc_type?: string
firm_name?: string
```

**Response:**
```json
{
  "id": "doc_abc123",
  "filename": "q3-report.pdf",
  "status": "processing",
  "processing_mode": "standard"
}
```

---

### List Documents

```
GET /api/documents
```

**Query Parameters:**
- `status` - Filter by status (pending, processing, indexed, error)
- `doc_type` - Filter by document type
- `limit` - Max results (default: 50)
- `offset` - Pagination offset

**Response:**
```json
{
  "documents": [
    {
      "id": "doc_abc123",
      "filename": "q3-report.pdf",
      "status": "indexed",
      "doc_type": "financial_statement",
      "page_count": 15,
      "created_at": "2025-09-15T14:30:00Z"
    }
  ],
  "total": 42,
  "has_more": true
}
```

---

### Get Document

```
GET /api/documents/:id
```

**Response:**
```json
{
  "id": "doc_abc123",
  "filename": "q3-report.pdf",
  "storage_url": "https://blob.vercel.store/...",
  "status": "indexed",
  "processing_mode": "standard",
  "doc_type": "financial_statement",
  "page_count": 15,
  "extracted_fields": {
    "total_revenue": { "value": 4200000, "confidence": 0.98 }
  },
  "created_at": "2025-09-15T14:30:00Z"
}
```

---

### Delete Document

```
DELETE /api/documents/:id
```

**Response:**
```json
{
  "success": true
}
```

---

## Conversations

### Create Conversation

```
POST /api/conversations
Content-Type: application/json
```

**Request:**
```json
{
  "document_ids": ["doc_abc123", "doc_xyz789"]
}
```

**Response:**
```json
{
  "id": "conv_abc123",
  "document_ids": ["doc_abc123", "doc_xyz789"],
  "created_at": "2025-09-15T15:00:00Z"
}
```

---

### Get Conversation

```
GET /api/conversations/:id
```

**Response:**
```json
{
  "id": "conv_abc123",
  "document_ids": ["doc_abc123"],
  "messages": [
    {
      "id": "msg_1",
      "role": "user",
      "content": "What was Q3 revenue?",
      "created_at": "2025-09-15T15:01:00Z"
    },
    {
      "id": "msg_2",
      "role": "assistant",
      "content": "Q3 revenue was $4.2 million [1].",
      "citations": [
        {
          "marker": "[1]",
          "chunk_id": "chunk_abc123",
          "page": 7,
          "bbox": { "x": 10, "y": 45, "width": 80, "height": 8 },
          "text": "Q3 revenue was $4.2 million..."
        }
      ],
      "created_at": "2025-09-15T15:01:05Z"
    }
  ],
  "created_at": "2025-09-15T15:00:00Z"
}
```

---

### Send Message (Streaming)

```
POST /api/conversations/:id/messages
Content-Type: application/json
Accept: text/event-stream
```

**Request:**
```json
{
  "content": "What was Q3 revenue?",
  "response_mode": "standard"
}
```

**Response (SSE stream):**
```
event: thinking
data: {"step": "Routing query..."}

event: thinking
data: {"step": "Searching documents..."}

event: sources
data: {"citations": [{"marker": "[1]", "chunk_id": "...", "page": 7}]}

event: content
data: {"token": "Q3"}

event: content
data: {"token": " revenue"}

event: content
data: {"token": " was"}

event: verification
data: {"status": "checking"}

event: verification
data: {"status": "verified", "confidence": 0.95}

event: done
data: {"message_id": "msg_2", "trace_url": "https://smith.langchain.com/..."}
```

---

## Analytics

### Get Accuracy Stats

```
GET /api/analytics/accuracy
```

**Query Parameters:**
- `doc_type` - Filter by document type
- `firm_name` - Filter by firm
- `start_date` - Start of date range
- `end_date` - End of date range

**Response:**
```json
{
  "overall_accuracy": 0.942,
  "total_questions": 1234,
  "verified_count": 1162,

  "by_doc_type": [
    { "doc_type": "bank_statement", "accuracy": 0.961, "count": 450 },
    { "doc_type": "tax_form", "accuracy": 0.923, "count": 280 }
  ],

  "by_response_mode": [
    { "mode": "quick", "accuracy": 0.89, "count": 200 },
    { "mode": "standard", "accuracy": 0.94, "count": 800 },
    { "mode": "thorough", "accuracy": 0.98, "count": 234 }
  ]
}
```

---

### Get Pending Fields

```
GET /api/analytics/pending-fields
```

**Response:**
```json
{
  "pending_fields": [
    {
      "field_name": "routing_number",
      "occurrences": 52,
      "threshold": 50,
      "status": "pending",
      "sample_values": ["021000021", "026009593"],
      "doc_types": ["bank_statement"],
      "suggested_type": "string"
    }
  ]
}
```

---

### Promote Field

```
POST /api/analytics/pending-fields/:name/promote
```

**Response:**
```json
{
  "success": true,
  "field_name": "routing_number",
  "status": "promoted"
}
```

---

### Ignore Field

```
POST /api/analytics/pending-fields/:name/ignore
```

**Response:**
```json
{
  "success": true,
  "field_name": "routing_number",
  "status": "ignored"
}
```

---

### Submit Answer Feedback

```
POST /api/analytics/feedback
Content-Type: application/json
```

**Request:**
```json
{
  "answer_record_id": "ar_abc123",
  "correct": false,
  "correction": "The actual Q3 revenue was $4.1 million, not $4.2 million."
}
```

**Response:**
```json
{
  "success": true
}
```

---

## Processing

### Get Available Modes

```
GET /api/processing/modes
```

**Response:**
```json
{
  "modes": [
    {
      "mode": "basic",
      "available": true,
      "description": "Free, local parsing. Best for simple text PDFs."
    },
    {
      "mode": "standard",
      "available": true,
      "description": "Reducto parsing. Handles tables and mixed layouts."
    },
    {
      "mode": "advanced",
      "available": false,
      "description": "Reducto agentic. Requires REDUCTO_API_KEY."
    }
  ]
}
```

---

## Types

See [Types Reference](./types.md) for all TypeScript interfaces including:
- `Document`, `Message`, `Citation`
- `BoundingBox`, `Chunk`, `AnswerRecord`
- `VerificationResult`, `ReconciliationResult`
- `StreamEvent`, `ErrorResponse`

---

## Error Responses

All errors follow this format:

```json
{
  "error": {
    "code": "DOCUMENT_NOT_FOUND",
    "message": "Document with id 'doc_xyz' not found",
    "details": {}
  }
}
```

### Common Error Codes

| Code | HTTP Status | Description |
|------|-------------|-------------|
| `DOCUMENT_NOT_FOUND` | 404 | Document doesn't exist |
| `CONVERSATION_NOT_FOUND` | 404 | Conversation doesn't exist |
| `PROCESSING_FAILED` | 500 | Document processing error |
| `INVALID_MODE` | 400 | Invalid processing/response mode |
| `RATE_LIMITED` | 429 | Too many requests |
| `UNAUTHORIZED` | 401 | Missing or invalid auth |

---

## Rate Limits

| Tier | Requests/Hour | Concurrent |
|------|---------------|------------|
| Free | 10 | 1 |
| Pro | 100 | 5 |
| Enterprise | Unlimited | 20 |

Rate limit headers:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1631234567
```

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [RAG Pipeline](./rag-pipeline.md) - How queries work
- [Analytics](./analytics.md) - Tracking endpoints
