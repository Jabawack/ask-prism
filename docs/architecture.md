# Ask Prism Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                           VERCEL                                │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐    │
│  │   Next.js     │  │  API Routes   │  │   Upstash Redis  │    │
│  │   Frontend    │  │  (handlers)   │  │   (Query Cache)  │    │
│  └───────────────┘  └───────────────┘  └──────────────────┘    │
│                                                                 │
│  ┌──────────────────┐                                          │
│  │   Vercel Blob    │                                          │
│  │  (File Storage)  │                                          │
│  └──────────────────┘                                          │
└─────────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────────────┐
│  LangGraph      │       │       Supabase          │
│  (RAG Pipeline) │       │  ┌─────────────────┐    │
│                 │       │  │ PostgreSQL      │    │
│  routeQuery     │       │  │ + pgvector      │    │
│      ↓          │       │  │                 │    │
│  retrieve       │◄─────►│  │ - documents     │    │
│      ↓          │       │  │ - chunks        │    │
│  verify         │       │  │ - conversations │    │
│      ↓          │       │  │ - answer_records│    │
│  generate       │       │  └─────────────────┘    │
└────────┬────────┘       └─────────────────────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│   LangSmith     │       │     OpenAI      │
│   (Tracing)     │       │  - embeddings   │
│                 │       │  - gpt-5-mini   │
│   - Run traces  │       │  - o3           │
│   - Metrics     │       └─────────────────┘
│   - Feedback    │
└─────────────────┘       ┌─────────────────┐
                          │   Anthropic     │
                          │  - claude-haiku │
                          └─────────────────┘
```

---

## Data Flow

### Document Ingestion (from Forge Prism)

```
┌─────────────────────────────────────────────────────────────────┐
│  FORGE PRISM OUTPUT                                             │
│                                                                 │
│  {                                                              │
│    chunks: [{ content, bbox, page, verified }],                 │
│    fields: { name: { value, bbox, confidence } },               │
│    metadata: { doc_type, page_count, ... }                      │
│  }                                                              │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  ASK PRISM INGESTION                                            │
│                                                                 │
│  1. Store document metadata → documents table                   │
│  2. Generate embeddings for each chunk                          │
│  3. Store chunks + embeddings → document_chunks table           │
│  4. Store extracted fields → documents.extracted_fields         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Question-Answer Flow

```
┌─────────────────────────────────────────────────────────────────┐
│  USER QUESTION                                                  │
│  "What was Q3 revenue?"                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. CACHE CHECK (Upstash Redis)                                 │
│     └── HIT? Return cached response                             │
│     └── MISS? Continue to RAG pipeline                          │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. ROUTE QUERY (LangGraph node)                                │
│     Classify: needs_retrieval | conversational | out_of_scope   │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. RETRIEVE (vector search)                                    │
│     - Embed question                                            │
│     - Search pgvector (top 20 chunks)                           │
│     - Rerank to top 5                                           │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. GENERATE (primary LLM)                                      │
│     - Build prompt with retrieved chunks                        │
│     - Stream response via SSE                                   │
│     - Extract citations                                         │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼  (if Standard/Thorough mode)
┌─────────────────────────────────────────────────────────────────┐
│  5. VERIFY (Claude Haiku)                                       │
│     - Check answer against source chunks                        │
│     - Return: agrees | disagrees                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼  (if Thorough mode + disagree)
┌─────────────────────────────────────────────────────────────────┐
│  6. RECONCILE (o3)                                              │
│     - Analyze both perspectives                                 │
│     - Determine correct answer                                  │
│     - Return reconciled response                                │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│  7. RESPOND                                                     │
│     - Cache response                                            │
│     - Store answer_record                                       │
│     - Return to user with citations                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Database Schema

### Core Tables

```sql
-- Documents
CREATE TABLE documents (
  id UUID PRIMARY KEY,
  filename TEXT NOT NULL,
  storage_url TEXT NOT NULL,
  processing_mode TEXT DEFAULT 'basic',  -- basic, standard, advanced
  status TEXT DEFAULT 'pending',          -- pending, processing, indexed, error

  -- Metadata from Forge Prism
  doc_type TEXT,
  page_count INT,
  extracted_fields JSONB DEFAULT '{}',
  extraction_issues JSONB DEFAULT '[]',

  -- Tracking
  uploaded_by TEXT,
  firm_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Document chunks (for RAG)
CREATE TABLE document_chunks (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  content TEXT NOT NULL,
  embedding vector(1536),  -- text-embedding-3-small
  chunk_index INT,
  page_number INT,

  -- Bounding box for citations
  bbox JSONB,  -- { x, y, width, height, page }

  -- From Forge Prism
  verified BOOLEAN DEFAULT FALSE,
  confidence FLOAT,
  section TEXT,
  chunk_type TEXT
);

-- Conversations
CREATE TABLE conversations (
  id UUID PRIMARY KEY,
  user_id TEXT,
  document_ids UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Messages
CREATE TABLE messages (
  id UUID PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id),
  role TEXT NOT NULL,  -- user, assistant
  content TEXT NOT NULL,
  citations JSONB,     -- [{ chunk_id, page, bbox, text }]
  trace_id TEXT,       -- LangSmith trace
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Analytics Tables

```sql
-- Answer tracking
CREATE TABLE answer_records (
  id UUID PRIMARY KEY,
  document_id UUID REFERENCES documents(id),
  conversation_id UUID REFERENCES conversations(id),
  question TEXT NOT NULL,

  -- Multi-model tracking
  primary_answer TEXT,
  primary_model TEXT,
  verification_result JSONB,  -- { agrees, confidence, notes }
  reconciliation_result JSONB,

  -- User feedback
  user_feedback JSONB,  -- { correct, correction }

  -- Final answer
  final_answer TEXT,
  confidence FLOAT,
  response_mode TEXT,  -- quick, standard, thorough
  response_time_ms INT,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Field discovery
CREATE TABLE pending_fields (
  id UUID PRIMARY KEY,
  field_name TEXT UNIQUE NOT NULL,
  occurrences INT DEFAULT 1,
  threshold INT DEFAULT 50,
  sample_values JSONB DEFAULT '[]',
  doc_types TEXT[],
  status TEXT DEFAULT 'pending',  -- pending, promoted, ignored, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Component Architecture

### Frontend Components

```
src/components/
├── chat/
│   ├── ChatContainer.tsx      # Main chat wrapper
│   ├── MessageList.tsx        # Scrolling message history
│   ├── MessageInput.tsx       # User input + mode selector
│   ├── Citation.tsx           # Clickable citation badge
│   └── QueryModeSelector.tsx  # Quick/Standard/Thorough
│
├── documents/
│   ├── DocumentUpload.tsx     # File upload dropzone
│   ├── DocumentList.tsx       # Document browser
│   ├── DocumentCard.tsx       # Single document preview
│   └── ProcessingModeSelector.tsx  # Basic/Standard/Advanced
│
├── pdf/
│   ├── PDFViewer.tsx          # PDF rendering with highlights
│   ├── HighlightLayer.tsx     # Bbox overlay
│   └── PageNavigator.tsx      # Page controls
│
└── analytics/
    ├── AccuracyChart.tsx      # Accuracy over time
    ├── FieldDiscoveryCard.tsx # Pending field notifications
    └── StatsCards.tsx         # Summary metrics
```

### Backend Modules

```
src/lib/
├── langgraph/
│   ├── document-qa-graph.ts   # Main RAG workflow
│   ├── stream-with-verification.ts  # Streaming + verification
│   ├── state.ts               # Graph state types
│   └── nodes/
│       ├── route-query.ts     # Intent classification
│       ├── retrieve-documents.ts  # Vector search
│       ├── rerank-results.ts  # Cross-encoder reranking
│       ├── generate-response.ts   # Primary LLM
│       ├── verify-response.ts     # Claude Haiku
│       └── reconcile-response.ts  # o3 reconciliation
│
├── processing/
│   ├── parser-factory.ts      # Parser selection
│   ├── pdfjs-parser.ts        # Free local parsing
│   ├── reducto-parser.ts      # Reducto API
│   ├── chunker-with-bbox.ts   # Chunking with bbox
│   └── processor-v2.ts        # Main processing pipeline
│
├── analytics/
│   ├── field-discovery.ts     # Field tracking logic
│   └── accuracy-tracker.ts    # Answer tracking
│
├── supabase/
│   ├── client.ts              # Database client
│   └── types.ts               # TypeScript types
│
└── cache/
    └── query-cache.ts         # Upstash Redis caching
```

---

## Related Documents

- [RAG Pipeline](./rag-pipeline.md) - Detailed RAG workflow
- [Visual Citations](./visual-citations.md) - How highlighting works
- [Verification](./verification.md) - Multi-model checking
- [Analytics](./analytics.md) - Accuracy tracking
- [API Reference](./api-reference.md) - Endpoints
