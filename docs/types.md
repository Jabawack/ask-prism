# TypeScript Types

Common TypeScript interfaces used in Ask Prism.

## Core Types

### Document

```typescript
interface Document {
  id: string;
  filename: string;
  storage_url: string;
  status: 'pending' | 'processing' | 'indexed' | 'error';
  processing_mode: 'basic' | 'standard' | 'advanced';
  doc_type?: string;
  firm_name?: string;
  page_count?: number;
  extracted_fields?: Record<string, ExtractedField>;
  extraction_issues?: Issue[];
  created_at: string;
}

interface ExtractedField {
  value: unknown;
  raw_value: string;
  bbox: BoundingBox;
  confidence: number;
  verified: boolean;
  data_type: 'string' | 'number' | 'date' | 'currency' | 'boolean';
}
```

---

### Message

```typescript
interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  trace_id?: string;
  created_at: string;
}
```

---

### Citation

```typescript
interface Citation {
  marker: string;        // "[1]"
  chunk_id: string;
  page: number;
  bbox: BoundingBox;
  text: string;
  confidence?: number;
  verified?: boolean;
}
```

---

### BoundingBox

Coordinates are percentage-based (0-100) for scale-independence.

```typescript
interface BoundingBox {
  x: number;       // % from left (0-100)
  y: number;       // % from top (0-100)
  width: number;   // % of page width
  height: number;  // % of page height
  page?: number;   // Page number (1-indexed)
}
```

---

### Conversation

```typescript
interface Conversation {
  id: string;
  user_id?: string;
  document_ids: string[];
  messages: Message[];
  created_at: string;
}
```

---

### AnswerRecord

Records each Q&A for analytics tracking.

```typescript
interface AnswerRecord {
  id: string;
  document_id: string;
  conversation_id: string;
  question: string;

  // Primary model response
  primary_answer: string;
  primary_model: string;

  // Verification (Standard/Thorough mode)
  verification_result?: VerificationResult;

  // Reconciliation (Thorough mode only)
  reconciliation_result?: ReconciliationResult;

  // User feedback
  user_feedback?: UserFeedback;

  // Final output
  final_answer: string;
  confidence: number;
  response_mode: ResponseMode;
  response_time_ms: number;
  created_at: string;
}

interface VerificationResult {
  agrees: boolean;
  confidence: number;
  notes: string;
  model: string;
}

interface ReconciliationResult {
  correct_answer: string;
  primary_was_correct: boolean;
  explanation: string;
  confidence: number;
  model: string;
}

interface UserFeedback {
  correct: boolean;
  correction?: string;
  submitted_at: string;
}
```

---

### Processing Types

```typescript
type ProcessingMode = 'basic' | 'standard' | 'advanced';

type ResponseMode = 'quick' | 'standard' | 'thorough';

interface ParseResult {
  pages: PageResult[];
  fullText: string;
  pageCount: number;
  parser: 'pdfjs' | 'reducto';
  processingMode: ProcessingMode;
}

interface PageResult {
  pageNumber: number;
  text: string;
  textBlocks: TextBlock[];
}

interface TextBlock {
  text: string;
  bbox: BoundingBox;
  confidence?: number;
}
```

---

### Chunk

Document chunks for RAG retrieval.

```typescript
interface Chunk {
  id: string;
  document_id: string;
  content: string;
  embedding?: number[];
  chunk_index: number;
  page_number: number;
  bbox: BoundingBox;

  // From Forge Prism
  verified: boolean;
  confidence: number;
  section?: string;
  chunk_type?: 'paragraph' | 'table_row' | 'heading' | 'list_item';
}
```

---

### PendingField

For dynamic field discovery.

```typescript
interface PendingField {
  id: string;
  field_name: string;
  occurrences: number;
  threshold: number;
  sample_values: string[];
  doc_types: string[];
  firm_names: string[];
  status: 'pending' | 'promoted' | 'ignored' | 'dismissed';
  promoted_at?: string;
  ignored_at?: string;
  ignore_weight: number;
  suggested_data_type: 'string' | 'number' | 'date' | 'currency';
  first_seen: string;
  last_seen: string;
}
```

---

### Issue

Problems found during extraction.

```typescript
interface Issue {
  id: string;
  type: IssueType;
  severity: 'warning' | 'error';
  description: string;
  page?: number;
  bbox?: BoundingBox;
  suggested_action?: string;
}

type IssueType =
  | 'missing_value'
  | 'calculation_error'
  | 'unclear_text'
  | 'conflicting_values'
  | 'unverified_extraction'
  | 'partial_extraction';
```

---

### Stream Events

Server-Sent Events during chat responses.

```typescript
type StreamEvent =
  | { type: 'thinking'; data: { step: string } }
  | { type: 'sources'; data: { citations: Citation[] } }
  | { type: 'content'; data: { token: string } }
  | { type: 'verification'; data: { status: 'checking' | 'verified'; confidence?: number } }
  | { type: 'done'; data: { message_id: string; trace_url?: string } }
  | { type: 'error'; data: { code: string; message: string } };
```

---

### Error Response

```typescript
interface ErrorResponse {
  error: {
    code: ErrorCode;
    message: string;
    details?: Record<string, unknown>;
  };
}

type ErrorCode =
  | 'DOCUMENT_NOT_FOUND'
  | 'CONVERSATION_NOT_FOUND'
  | 'PROCESSING_FAILED'
  | 'INVALID_MODE'
  | 'RATE_LIMITED'
  | 'UNAUTHORIZED'
  | 'INVALID_REQUEST'
  | 'INTERNAL_ERROR';
```

---

## Related Documents

- [API Reference](./api-reference.md) - Endpoints using these types
- [Architecture](./architecture.md) - System overview
- [Visual Citations](./visual-citations.md) - BoundingBox usage
