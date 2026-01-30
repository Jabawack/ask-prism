# Ask Prism

A Document Analytics Platform that lets users upload documents (PDF, TXT, DOCX), extract and analyze content, and ask natural language questions. The system provides accurate answers with **visual citations** - clicking a citation highlights the exact passage in the source PDF.

## Key Features

- **Dual parser architecture** (pdfjs-dist + Reducto) with comparison
- **Bounding box extraction** for precise visual citations
- **Multi-model verification** for accuracy (parsing AND answers)
- **Dynamic field discovery** with threshold-based schema evolution
- **Long-term analytics** for accuracy tracking and model optimization

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         VERCEL                                  │
│  ┌───────────────┐  ┌───────────────┐  ┌──────────────────┐    │
│  │   Next.js     │  │  API Routes   │  │   Upstash Redis  │    │
│  │   Frontend    │  │  (SSE stream) │  │   (Query Cache)  │    │
│  └───────────────┘  └───────────────┘  └──────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐       ┌─────────────────────────┐
│    LangGraph    │       │       Supabase          │
│   (Q&A Agent)   │       │  PostgreSQL + pgvector  │
│                 │       │                         │
│  routeQuery     │       │  - documents            │
│      ↓          │◄─────►│  - chunks (embeddings)  │
│  retrieve       │       │  - conversations        │
│      ↓          │       └─────────────────────────┘
│  verify         │
│      ↓          │       ┌─────────────────┐
│  generate       │──────►│   LangSmith     │
└─────────────────┘       │   (Tracing)     │
                          └─────────────────┘
```

## Tech Stack

| Component | Choice |
|-----------|--------|
| Frontend | Next.js 14 + TypeScript |
| PDF Parsing | Reducto + pdfjs-dist (dual parser) |
| PDF Viewer | react-pdf + react-pdf-highlighter-extended |
| Database | Supabase (PostgreSQL + pgvector) |
| Vector Search | pgvector with HNSW index |
| File Storage | Vercel Blob |
| Cache | Upstash Redis |
| Agent Framework | LangGraph |
| Observability | LangSmith |
| Primary LLM | GPT-5 Mini |
| Verification LLM | Claude Haiku 4.5 |
| Reconciliation LLM | o3 |
| Embeddings | text-embedding-3-small |

## Local Development

### Prerequisites

- Node.js 18+
- Supabase project with pgvector enabled
- OpenAI API key
- Anthropic API key (for verification)
- Reducto API key (optional, for advanced parsing)
- Vercel account (for Blob storage)

### Setup

1. **Clone and install**
   ```bash
   git clone https://github.com/Jabawack/ask-prism.git
   cd ask-prism
   npm install
   ```

2. **Configure environment**

   Copy `.env.example` to `.env.local` and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

3. **Set up Supabase**

   Run the schema in your Supabase SQL editor:
   ```bash
   # Copy contents of supabase/schema.sql
   # Paste into Supabase Dashboard > SQL Editor > Run
   ```

4. **Run locally**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `OPENAI_API_KEY` | OpenAI API key |
| `ANTHROPIC_API_KEY` | Anthropic API key (verification) |
| `REDUCTO_API_KEY` | Reducto API key (optional) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob token |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis URL (optional) |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis token (optional) |
| `LANGCHAIN_API_KEY` | LangSmith API key (optional) |

## How It Works

### Document Processing (Phase A)

```
Upload PDF → Select processing mode:
  - Basic (pdfjs-dist) → Free, fast, clean PDFs
  - Standard (Reducto) → Tables, mixed layouts
  - Advanced (Reducto+) → Scans, handwriting

→ Extract text + bounding boxes
→ Chunk with bbox preservation
→ Embed (OpenAI)
→ Store vectors + bbox in pgvector
```

### Question Answering (Phase B)

```
User query → Select response mode:
  - Quick (~3s) → Primary LLM only
  - Standard (~5s) → Primary + verification
  - Thorough (~10s) → Primary + verification + reconciliation

→ Retrieve relevant chunks
→ Generate answer with citations
→ Verify accuracy (optional)
→ Reconcile disagreements (optional)
→ Return answer with visual citations
```

### Visual Citations

Click any citation → PDF viewer scrolls to exact location → Bounding box highlights the source text.

## Key Design Decisions

**Why dual parsers?**
pdfjs-dist is free but struggles with complex layouts. Reducto handles tables and scans but costs credits. Users choose based on document complexity.

**Why multi-model verification?**
Single LLMs can hallucinate. Using different models (GPT-5 Mini + Claude Haiku) catches errors. Research shows dual verification achieves ~96% accuracy vs ~85% baseline.

**Why bounding boxes?**
Page-level citations aren't precise enough. Bbox extraction enables exact text highlighting, building trust and enabling quick verification.

**Why dynamic field discovery?**
Document schemas evolve. Tracking new fields as they appear (with threshold-based promotion) keeps the system adaptive without constant manual updates.

## Deploy

The app auto-deploys to Vercel on push to main. For manual deployment:

```bash
vercel deploy --prod
```

## License

MIT
