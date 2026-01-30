# Ask Prism Documentation

> RAG-based document Q&A with visual citations

## Quick Links

| Document | Description |
|----------|-------------|
| [Architecture](./architecture.md) | System design, data flow, components |
| [RAG Pipeline](./rag-pipeline.md) | Retrieve → Augment → Generate flow |
| [Visual Citations](./visual-citations.md) | How bbox highlighting works |
| [Multi-Model Verification](./verification.md) | Answer accuracy checking |
| [Analytics](./analytics.md) | Accuracy tracking, field discovery |
| [API Reference](./api-reference.md) | Endpoints and data types |

## The Big Picture

```
┌────────────────────────────────────────────────────────────────────┐
│                    DOCUMENT ANALYTICS ECOSYSTEM                     │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│   ┌──────────────────┐              ┌──────────────────┐          │
│   │   FORGE PRISM    │              │    ASK PRISM     │          │
│   │                  │              │                  │          │
│   │  AGENTS parse    │─────────────▶│  RAG answers     │          │
│   │  documents       │   chunks +   │  questions       │          │
│   │                  │   bbox       │                  │          │
│   │  Runs ONCE       │              │  Runs EVERY      │          │
│   │  per document    │              │  question        │          │
│   └──────────────────┘              └──────────────────┘          │
│                                                                    │
│   /Users/tk/code/forge-prism        /Users/tk/code/ask-prism      │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

## What is RAG?

**RAG = Retrieval Augmented Generation**

```
┌─────────────────────────────────────────────────────────────────┐
│                         RAG PATTERN                             │
│                                                                 │
│   1. RETRIEVE           2. AUGMENT            3. GENERATE       │
│   ───────────           ─────────             ──────────        │
│   Find relevant         Add chunks            LLM creates       │
│   document chunks       to LLM prompt         answer from       │
│   via vector search                           context           │
│                                                                 │
│   Question: "What was Q3 revenue?"                              │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────┐         ┌──────────────────┐        ┌─────────┐  │
│   │ Vector  │────────►│ "Context: Q3     │───────►│ "Q3 was │  │
│   │ Search  │ chunks  │ revenue was $4.2M│ LLM    │ $4.2M"  │  │
│   └─────────┘         │ Question: ..."   │        └─────────┘  │
│                       └──────────────────┘                      │
└─────────────────────────────────────────────────────────────────┘
```

## Key Features

### 1. Visual Citations
Click a citation → PDF scrolls to exact location with highlight.

```
┌─────────────────────┐     ┌─────────────────────────────────┐
│  Chat Response      │     │  PDF Viewer                     │
│                     │     │                                 │
│  "Q3 revenue was    │     │  Page 7                         │
│   $4.2M [1]"        │────▶│  ┌─────────────────────────┐    │
│                     │     │  │ ████ Q3: $4.2M ████████ │    │
│                     │     │  └─────────────────────────┘    │
└─────────────────────┘     └─────────────────────────────────┘
```

### 2. Multi-Model Verification
Catch errors with multiple perspectives:

| Mode | Models | Use Case |
|------|--------|----------|
| **Quick** | GPT-5 Mini only | Speed over accuracy |
| **Standard** | + Claude Haiku verify | Balanced |
| **Thorough** | + o3 reconciliation | Maximum accuracy |

### 3. Dynamic Field Discovery
Automatically discover and track new fields across documents.

### 4. Accuracy Analytics
Track accuracy by document type, firm, and model over time.

## Project Structure

```
ask-prism/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── documents/        # Upload, list, delete
│   │   │   └── conversations/    # Chat + streaming
│   │   ├── chat/                 # Main chat UI
│   │   └── analytics/            # Analytics dashboard
│   ├── components/
│   │   ├── chat/                 # Chat UI components
│   │   ├── documents/            # Upload components
│   │   └── pdf/                  # PDF viewer + highlights
│   └── lib/
│       ├── langgraph/            # RAG pipeline
│       ├── processing/           # Document processing
│       ├── analytics/            # Accuracy tracking
│       └── supabase/             # Database client
├── docs/                         # This documentation
└── supabase/
    └── migrations/               # Database schema
```

## Tech Stack

| Component | Technology |
|-----------|------------|
| Frontend | Next.js 14 + TypeScript |
| PDF Viewer | react-pdf + react-pdf-highlighter-extended |
| RAG Pipeline | LangGraph |
| Primary LLM | GPT-5 Mini |
| Verification | Claude Haiku |
| Reconciliation | o3 |
| Embeddings | text-embedding-3-small |
| Vector DB | Supabase pgvector |
| File Storage | Vercel Blob |
| Cache | Upstash Redis |

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local
# Add your API keys

# Run migrations
npx supabase db push

# Start development
npm run dev
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| `OPENAI_API_KEY` | GPT models + embeddings |
| `ANTHROPIC_API_KEY` | Claude verification |
| `SUPABASE_URL` | Database URL |
| `SUPABASE_ANON_KEY` | Database key |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage |
| `UPSTASH_REDIS_*` | Query caching |
| `REDUCTO_API_KEY` | Optional: advanced PDF parsing |

## Relationship to Forge Prism

| Aspect | Forge Prism | Ask Prism |
|--------|-------------|-----------|
| **Purpose** | Parse documents | Answer questions |
| **Pattern** | Agents with tools | RAG pipeline |
| **When runs** | Once per upload | Every question |
| **Latency** | 30-120 seconds | 2-5 seconds |
| **Output** | Chunks + fields | Answers + citations |

**Forge Prism produces high-quality chunks → Ask Prism retrieves them for Q&A**
