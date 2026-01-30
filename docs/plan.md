# System Design Interview Demo: Document Q&A System (Ask Prism)

## Overview
Build a Document Q&A system that allows users to upload documents and ask natural language questions. This demonstrates RAG architecture, LLM agent orchestration, observability, and cost optimization - all key topics for system design interviews.

---

## 1. Requirements

### Functional Requirements (P0)
| FR | Description |
|----|-------------|
| FR1 | Upload documents (PDF, TXT, DOCX) |
| FR2 | Extract and index document content |
| FR3 | Ask natural language questions about documents |
| FR4 | Provide accurate answers with source citations |

### Non-Functional Requirements
| NFR | Target |
|-----|--------|
| Query latency | < 5s (P95) |
| Document processing | < 30s for 10-page PDF |
| Cost efficiency | < $0.05 per query average |
| Observability | Full trace visibility via LangSmith |

---

## 2. Core Entities

```typescript
Document { id, userId, filename, storageUrl, status, metadata }
DocumentChunk {
  id, documentId, content, embedding, chunkIndex, pageNumber,
  bbox: { x, y, width, height }  // Phase 2: bounding box for highlighting
}
Conversation { id, userId, documentIds, messages[] }
Message { id, role, content, citations[], traceId }
Citation { chunkId, documentId, pageNumber, bbox, text }
```

---

## 3. API Design

```
POST   /api/documents                    # Upload document
GET    /api/documents                    # List documents
DELETE /api/documents/:id                # Delete document

POST   /api/conversations                # Create conversation
POST   /api/conversations/:id/messages   # Ask question (SSE streaming)
GET    /api/conversations/:id            # Get conversation history
```

**Streaming Response Format:**
```typescript
type StreamEvent =
  | { type: 'thinking', data: { step: string } }
  | { type: 'sources', data: { citations: Citation[] } }
  | { type: 'content', data: { token: string } }
  | { type: 'done', data: { traceUrl: string } }
```

---

## 4. Data Flow

### Document Ingestion

**Phase 1 (Current):**
```
User → Upload PDF → Store in Vercel Blob → Trigger async job
     → Extract text (unpdf) → Chunk (recursive splitter)
     → Batch embed (text-embedding-3-small) → Store vectors (pgvector)
     → Update status = 'indexed'
```

**Phase 2 (Layout-Aware with Bbox):**
```
User → Upload PDF → Store in Vercel Blob → Trigger async job
     → Parse with Docling/LlamaParse → Extract text + bounding boxes
     → Structure-first chunking (by heading/paragraph, preserve bbox)
     → Batch embed (text-embedding-3-small)
     → Store vectors + bbox metadata (pgvector + JSONB)
     → Update status = 'indexed'
```

### Question-Answer Flow
```
User query → Check cache → [MISS] → Invoke LangGraph
  → routeQuery (classify intent)
  → retrieveDocuments (vector search, top-20)
  → rerankResults (cross-encoder, top-5)
  → generateResponse (stream LLM)
  → formatCitations (map to source docs)
  → Cache response → Return via SSE
```

---

## 5. High-Level Architecture

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
│  (Q&A Agent)    │       │  ┌─────────────────┐    │
│                 │       │  │ PostgreSQL      │    │
│  routeQuery     │       │  │ + pgvector      │    │
│      ↓          │       │  │                 │    │
│  retrieve       │◄─────►│  │ - documents     │    │
│      ↓          │       │  │ - chunks        │    │
│  rerank         │       │  │ - conversations │    │
│      ↓          │       │  └─────────────────┘    │
│  generate       │       └─────────────────────────┘
└────────┬────────┘
         │
         ▼
┌─────────────────┐       ┌─────────────────┐
│   LangSmith     │       │     OpenAI      │
│   (Tracing)     │       │  - embeddings   │
│                 │       │  - gpt-4o-mini  │
│   - Run traces  │       │  - gpt-4o       │
│   - Metrics     │       └─────────────────┘
│   - Feedback    │
└─────────────────┘
```

---

## 6. Deep Dives

### 6.1 LangGraph Workflow
```
START → routeQuery → [conditional]
                     ├─ out_of_scope → handleOutOfScope → END
                     ├─ conversational → generateResponse → END
                     └─ needs_retrieval → retrieveDocuments
                                          → rerankResults
                                          → generateResponse
                                          → formatCitations → END
```

**Key Design Decisions:**
- Router node avoids unnecessary retrieval (saves cost/latency)
- Reranking filters 20 → 5 chunks for higher precision
- Streaming via SSE for real-time UX

### 6.2 LangSmith Integration
- Wrap all LLM calls with `traceable()` decorator
- Include metadata: conversation_id, document_ids, user_id, cache_hit
- Track: latency per node, token usage, model used
- Set up alerts for P95 latency > 5s or error rate > 5%

### 6.3 Cost Optimization
| Strategy | Savings |
|----------|---------|
| Query response caching (24h TTL) | 60-70% |
| Tiered model selection (mini vs 4o) | 50% |
| text-embedding-3-small (1536 dims) | 40% |
| Batch embedding (100/batch) | API call overhead |

**Target: < $0.05/query average**

### 6.4 Scalability
- **Database**: Supabase connection pooler + read replicas
- **Vector Search**: pgvector HNSW index (O(log n))
- **Rate Limiting**: Upstash Redis sliding window (10/hr free, 100/hr pro)
- **Global**: Vercel Edge + multi-region Supabase

### 6.5 Multi-Agent Extension (Future)
```
Orchestrator Agent
    ├── Retrieval Agent (semantic search, filter, rerank)
    ├── Analysis Agent (compare docs, extract data, calculate)
    └── Writing Agent (summarize, format, structure)
```

### 6.6 Layout-Aware RAG with Bounding Boxes (Phase 2)

**Why Bbox Matters:**
> "Converting PDFs to plain Markdown with VLMs makes fine-grained citations impossible.
> You need bounding boxes to link responses back to source locations."

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────────────┐
│                         DOCUMENT INGESTION                              │
│                                                                         │
│   PDF Upload                                                            │
│       │                                                                 │
│       ▼                                                                 │
│   ┌─────────────────┐                                                   │
│   │ Docling/LlamaParse │  ◄── Handles: text PDFs, scans, rotated, tables│
│   │  (Layout Parser)   │      Returns: text + bbox per element          │
│   └────────┬───────────┘                                                │
│            │                                                            │
│            ▼                                                            │
│   ┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐  │
│   │ Structure-First │────▶│    OpenAI       │────▶│    Supabase     │  │
│   │    Chunking     │     │   Embeddings    │     │    pgvector     │  │
│   │                 │     │                 │     │                 │  │
│   │ • By heading    │     │ text-embedding  │     │ • chunk text    │  │
│   │ • By paragraph  │     │ -3-small        │     │ • embedding     │  │
│   │ • Preserve bbox │     │                 │     │ • page_num      │  │
│   └─────────────────┘     └─────────────────┘     │ • bbox (JSONB)  │  │
│                                                   └─────────────────┘  │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         CITATION HIGHLIGHTING                           │
│                                                                         │
│   ┌───────────────────────────────────────────────────────────────┐    │
│   │                      FRONTEND                                  │    │
│   │                                                                │    │
│   │   ┌─────────────────┐     ┌─────────────────────────────────┐ │    │
│   │   │  Chat Response  │     │  react-pdf-highlighter-extended │ │    │
│   │   │                 │     │                                 │ │    │
│   │   │  "Revenue grew  │     │   ┌─────────────────────────┐   │ │    │
│   │   │   15% [1]"      │────▶│   │  PDF Page Render        │   │ │    │
│   │   │                 │     │   │  ┌───────────────────┐  │   │ │    │
│   │   │  Click [1] ─────│─────│──▶│  │ ████ HIGHLIGHT ██ │  │   │ │    │
│   │   └─────────────────┘     │   │  └───────────────────┘  │   │ │    │
│   │                           │   └─────────────────────────┘   │ │    │
│   │                           └─────────────────────────────────┘ │    │
│   └───────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────┘
```

**PDF Parser Comparison:**

| Tool | Bbox Support | Rotated/Scanned | Cost | Quality |
|------|-------------|-----------------|------|---------|
| **Docling** (IBM) | ✅ Native | ✅ OCR built-in | Free | High |
| **Unstructured** Hi-Res | ✅ Native | ✅ YoloX + OCR | Free | High |
| **LlamaParse** | ✅ Built-in | ✅ VLM-powered | $0.003/pg | Best |
| **Azure Doc Intelligence** | ✅ Built-in | ✅ Enterprise OCR | ~$1.50/1K pg | Enterprise |
| unpdf/pdfjs-dist | ⚠️ Manual | ❌ Text only | Free | Basic |

**Recommendation:**
- Phase 1 MVP: Continue with unpdf (page-level citations)
- Phase 2 UX: Switch to Docling (free, native bbox, handles scans)
- Production: LlamaParse ($0.003/page - worth it for quality)

**Highlight Coordinates (react-pdf-highlighter):**
```typescript
// Uses percentage-based coords (scale-independent)
interface HighlightArea {
  pageIndex: number;
  top: number;      // % from top
  left: number;     // % from left
  width: number;    // % of page width
  height: number;   // % of page height
}
```

---

## 7. Tech Stack

| Component | Choice | Reason |
|-----------|--------|--------|
| Frontend | Next.js 14 + TypeScript | SSR, API routes, Vercel integration |
| Styling | Tailwind + shadcn/ui | Rapid prototyping |
| Database | Supabase (PostgreSQL) | Free tier, pgvector support |
| Vector Store | pgvector | Integrated with Supabase |
| File Storage | Vercel Blob | Simple, integrated |
| Cache | Upstash Redis | Low-latency key-value |
| Agent Framework | LangGraph | State management, conditional routing |
| Observability | LangSmith | LLM-specific tracing |
| LLM | OpenAI (gpt-4o-mini, gpt-4o) | Quality/cost balance |
| Embeddings | text-embedding-3-small | Cost-efficient |
| PDF Parsing (Phase 1) | unpdf | Serverless-compatible, text extraction |
| PDF Parsing (Phase 2) | Docling or LlamaParse | Bbox extraction, OCR, layout analysis |
| PDF Viewer | react-pdf-highlighter-extended | Bbox highlighting, citation clicks |

---

## 8. Implementation Phases

### Phase 1: Foundation (DONE)
- [x] Supabase database with pgvector extension
- [x] Document upload API + Vercel Blob storage
- [x] PDF text extraction (unpdf - serverless compatible)
- [x] Document chunking (recursive splitter)
- [x] Batch embedding generation
- [x] Vercel deployment
- [x] Upstash Redis setup

### Phase 2: Core RAG (IN PROGRESS)
- [x] Vector similarity search endpoint
- [x] Basic LangGraph workflow (retrieve → generate)
- [x] LangSmith tracing setup
- [x] Streaming SSE response API
- [ ] Basic chat UI component (needs testing)
- [ ] Fix any remaining PDF upload issues

### Phase 3: Optimization
- [x] Query routing node
- [x] Reranking with relevance scoring
- [ ] Query response caching (Upstash Redis) - wired up, needs testing
- [ ] Tiered model selection logic
- [ ] Rate limiting middleware

### Phase 4: Layout-Aware RAG (Bbox Citations)
- [ ] Switch PDF parser to Docling (Python) or LlamaParse (API)
- [ ] Update DB schema: add `bbox JSONB` to chunks table
- [ ] Structure-first chunking (by heading/paragraph)
- [ ] Store bbox metadata with each chunk
- [ ] Add react-pdf-highlighter-extended to frontend
- [ ] PDF viewer component with highlight overlay
- [ ] Clickable citations → jump to highlighted region

### Phase 5: Edge Cases & Production
- [ ] Handle rotated PDFs (OCRmyPDF preprocessing)
- [ ] Handle scanned/image PDFs (OCR via Docling/LlamaParse)
- [ ] Handle tables and complex layouts
- [ ] Error handling + fallbacks
- [ ] LangSmith dashboard configuration
- [ ] Demo preparation

---

## 9. Interview Talking Points

**Agent Orchestration:**
> "I chose LangGraph over simple chains because it provides explicit state management and conditional routing. The router node demonstrates intelligent query classification - avoiding unnecessary retrieval saves both latency and cost."

**Scalability:**
> "The architecture separates compute (Vercel serverless), storage (Supabase), and AI workloads (LangGraph). pgvector with HNSW indexing gives O(log n) similarity search as documents scale."

**Cost Optimization:**
> "Query caching reduces costs by 60-70% for repeated questions. Combined with tiered model selection and reduced embedding dimensions, we target under $0.05 per query."

**Observability:**
> "LangSmith provides end-to-end visibility - I can see exactly which chunks were retrieved, how the LLM reasoned, and where latency spikes occur. This enables A/B testing of prompts and models."

**Extension Path:**
> "The single-agent design mirrors the multi-agent pattern. Adding a supervisor and specialized agents is straightforward because the state schema already supports task coordination."

**Layout-Aware Citations (Phase 2):**
> "Plain text extraction loses spatial information. By using Docling for layout-aware parsing, I preserve bounding boxes for each text element. This enables clickable citations that highlight the exact passage in the source PDF - a huge UX improvement over just showing page numbers. Structure-first chunking by headings also improves retrieval quality by keeping semantic units together."

---

## 10. Verification Plan

### Functional Testing
1. Upload a 10-page PDF → verify chunks created in DB
2. Ask factual question → verify answer includes correct citations
3. Ask off-topic question → verify graceful "out of scope" response
4. Check LangSmith → verify full trace with all nodes visible

### Performance Testing
1. Measure query latency (target < 5s P95)
2. Verify cache hit returns < 500ms
3. Load test with 10 concurrent users

### Cost Monitoring
1. Check LangSmith token usage per query
2. Verify tiered model selection working (analytical → gpt-4o)
3. Calculate average cost per query

---

## 11. Critical Files

| File | Purpose |
|------|---------|
| `/src/lib/langgraph/document-qa-graph.ts` | Core agent orchestration |
| `/src/lib/langsmith/config.ts` | LangSmith tracing setup |
| `/src/app/api/conversations/[id]/messages/route.ts` | Streaming SSE endpoint |
| `/src/lib/processing/chunker.ts` | Document chunking strategy |
| `/src/lib/cache/query-cache.ts` | Response caching |

---

## 12. File Structure

```
src/
├── app/
│   ├── api/
│   │   ├── documents/
│   │   │   ├── route.ts              # POST (upload), GET (list)
│   │   │   └── [id]/
│   │   │       └── route.ts          # GET, DELETE single doc
│   │   └── conversations/
│   │       ├── route.ts              # POST (create)
│   │       └── [id]/
│   │           ├── route.ts          # GET conversation
│   │           └── messages/
│   │               └── route.ts      # POST (SSE streaming)
│   ├── chat/
│   │   └── page.tsx                  # Main chat UI
│   ├── layout.tsx
│   └── page.tsx                      # Landing/redirect
│
├── components/
│   ├── chat/
│   │   ├── ChatContainer.tsx
│   │   ├── MessageList.tsx
│   │   ├── MessageInput.tsx
│   │   └── Citation.tsx
│   └── documents/
│       ├── DocumentUpload.tsx
│       ├── DocumentList.tsx
│       └── DocumentCard.tsx
│
├── lib/
│   ├── supabase/
│   │   ├── client.ts                 # Supabase client
│   │   ├── types.ts                  # Database types
│   │   └── schema.sql                # Reference schema
│   ├── langgraph/
│   │   ├── document-qa-graph.ts      # Main workflow
│   │   ├── nodes/
│   │   │   ├── route-query.ts
│   │   │   ├── retrieve-documents.ts
│   │   │   ├── rerank-results.ts
│   │   │   └── generate-response.ts
│   │   └── state.ts                  # Graph state types
│   ├── langsmith/
│   │   └── config.ts                 # Tracing setup
│   ├── processing/
│   │   ├── chunker.ts
│   │   ├── embeddings.ts
│   │   ├── extractors.ts             # PDF, DOCX, TXT
│   │   └── processor.ts              # Main pipeline
│   └── cache/
│       └── query-cache.ts            # Upstash Redis
│
└── types/
    └── index.ts                      # Shared types
```

---

## 13. References & Research

### Layout-Aware RAG
- [Layout-Aware RAG with Evidence Pins](https://vipulmshah.medium.com/layout-aware-rag-with-evidence-pins-building-clickable-citations-for-pdfs-using-docling-neo4j-5305769759f0) - Docling + Neo4j architecture
- [Citation-Aware RAG](https://www.tensorlake.ai/blog/rag-citations) - Why bbox matters for citations
- [From PDFs to AI-ready structured data](https://explosion.ai/blog/pdfs-nlp-structured-data) - Deep dive on PDF parsing

### PDF Parser Benchmarks
- [PDF Parsing Benchmark 2025](https://www.applied-ai.com/briefings/pdf-parsing-benchmark/) - 800+ docs, 7 LLMs tested
- [Best Document Parsers 2025](https://llms.reducto.ai/best-llm-ready-document-parsers-2025) - Parser comparison
- [7 Python PDF Extractors Tested](https://onlyoneaman.medium.com/i-tested-7-python-pdf-extractors-so-you-dont-have-to-2025-edition-c88013922257)

### Tools
- [Docling](https://github.com/docling-project/docling) - IBM's layout-aware parser with bbox
- [docling-parse](https://github.com/docling-project/docling-parse) - Text + coordinates extraction
- [Unstructured](https://unstructured.io/blog/how-to-parse-a-pdf-part-1) - Hi-Res strategy with bbox
- [LlamaParse](https://www.llamaindex.ai/llamaparse) - VLM-powered parsing
- [react-pdf-highlighter-extended](https://github.com/DanielArnould/react-pdf-highlighter-extended) - PDF highlighting

### Handling Edge Cases
- [OCRmyPDF](https://github.com/ocrmypdf/OCRmyPDF) - Fix rotation, deskew scanned PDFs
- [react-pdf-viewer highlight plugin](https://react-pdf-viewer.dev/plugins/highlight/) - Bbox highlighting
