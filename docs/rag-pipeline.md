# RAG Pipeline

The core of Ask Prism is a Retrieval Augmented Generation (RAG) pipeline built with LangGraph.

## What is RAG?

**RAG = Retrieval Augmented Generation**

Instead of asking an LLM to answer from its training data (which may be outdated or wrong), RAG:

1. **Retrieves** relevant context from your documents
2. **Augments** the LLM prompt with that context
3. **Generates** an answer grounded in the retrieved content

```
┌─────────────────────────────────────────────────────────────────┐
│                    WITHOUT RAG                                  │
│                                                                 │
│  User: "What was Q3 revenue?"                                   │
│                                                                 │
│  LLM: "I don't have access to your company's financial data."   │
│       (or worse: makes up a number)                             │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                      WITH RAG                                   │
│                                                                 │
│  User: "What was Q3 revenue?"                                   │
│                                                                 │
│  RAG: 1. Search documents → Find chunk about Q3 revenue         │
│       2. Build prompt: "Context: Q3 revenue was $4.2M..."       │
│       3. LLM generates: "Q3 revenue was $4.2 million [1]"       │
│                                                                 │
│  Grounded, accurate, with citation!                             │
└─────────────────────────────────────────────────────────────────┘
```

---

## Pipeline Stages

### Stage 1: Route Query

Classify the user's intent before doing expensive retrieval.

```
┌─────────────────────────────────────────────────────────────────┐
│  ROUTE QUERY                                                    │
│                                                                 │
│  Input: "What was Q3 revenue?"                                  │
│                                                                 │
│  Classification:                                                │
│  ├── needs_retrieval → Continue to vector search               │
│  ├── conversational  → Simple response, no retrieval           │
│  └── out_of_scope    → Politely decline                        │
│                                                                 │
│  Output: "needs_retrieval"                                      │
└─────────────────────────────────────────────────────────────────┘
```

**Why route?**
- Saves cost (no embedding/search for "hello")
- Faster responses for simple queries
- Better UX for off-topic questions

---

### Stage 2: Retrieve Documents

Find relevant chunks using vector similarity search.

```
┌─────────────────────────────────────────────────────────────────┐
│  RETRIEVE                                                       │
│                                                                 │
│  1. Embed the question                                          │
│     "What was Q3 revenue?" → [0.12, -0.34, 0.56, ...]          │
│                                                                 │
│  2. Vector similarity search (pgvector)                         │
│     SELECT * FROM document_chunks                               │
│     ORDER BY embedding <=> $question_embedding                  │
│     LIMIT 20                                                    │
│                                                                 │
│  3. Return top 20 candidate chunks                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Vector similarity**: Finds semantically similar text, not just keyword matches.
- "Q3 revenue" matches "third quarter earnings"
- "total assets" matches "net worth summary"

---

### Stage 3: Rerank Results

Filter 20 candidates down to the 5 most relevant.

```
┌─────────────────────────────────────────────────────────────────┐
│  RERANK                                                         │
│                                                                 │
│  20 chunks from vector search                                   │
│        │                                                        │
│        ▼                                                        │
│  Cross-encoder reranking                                        │
│  - Score each (question, chunk) pair                            │
│  - More accurate than embedding similarity alone                │
│        │                                                        │
│        ▼                                                        │
│  Top 5 chunks with relevance scores                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Why rerank?**
- Vector search is fast but imprecise
- Cross-encoder is slower but more accurate
- Two-stage approach balances speed + quality

---

### Stage 4: Generate Response

Build prompt with context and stream the answer.

```
┌─────────────────────────────────────────────────────────────────┐
│  GENERATE                                                       │
│                                                                 │
│  Prompt construction:                                           │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  System: You are a helpful assistant answering questions │   │
│  │  about documents. Use only the provided context.         │   │
│  │                                                          │   │
│  │  Context:                                                │   │
│  │  [1] Page 7: "Q3 revenue was $4.2 million, up 15%..."    │   │
│  │  [2] Page 3: "Third quarter highlights include..."       │   │
│  │  [3] Page 12: "Full year revenue guidance remains..."    │   │
│  │                                                          │   │
│  │  User question: What was Q3 revenue?                     │   │
│  │                                                          │   │
│  │  Instructions: Answer based only on the context.         │   │
│  │  Cite sources using [1], [2], etc.                       │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  Output (streamed):                                             │
│  "Q3 revenue was $4.2 million, representing a 15%              │
│   year-over-year increase [1]."                                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

### Stage 5: Extract Citations

Map citation markers to source chunks with bounding boxes.

```
┌─────────────────────────────────────────────────────────────────┐
│  EXTRACT CITATIONS                                              │
│                                                                 │
│  Response: "Q3 revenue was $4.2 million [1]"                    │
│                                                                 │
│  Parse [1] → chunk_id, page, bbox                               │
│                                                                 │
│  Citation:                                                      │
│  {                                                              │
│    "marker": "[1]",                                             │
│    "chunk_id": "chunk_abc123",                                  │
│    "page": 7,                                                   │
│    "bbox": { "x": 10, "y": 45, "width": 80, "height": 8 },     │
│    "text": "Q3 revenue was $4.2 million, up 15%..."            │
│  }                                                              │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## LangGraph Implementation

```typescript
// Simplified workflow
const documentQAGraph = new StateGraph({
  channels: {
    question: null,
    chunks: [],
    answer: null,
    citations: [],
    responseMode: 'standard'
  }
})
  .addNode('route', routeQueryNode)
  .addNode('retrieve', retrieveDocumentsNode)
  .addNode('rerank', rerankResultsNode)
  .addNode('generate', generateResponseNode)
  .addNode('verify', verifyResponseNode)       // Optional
  .addNode('reconcile', reconcileResponseNode) // Optional

  .addEdge(START, 'route')
  .addConditionalEdges('route', routeDecision)
  .addEdge('retrieve', 'rerank')
  .addEdge('rerank', 'generate')
  .addConditionalEdges('generate', verificationDecision)
  .addEdge(END);
```

---

## Streaming

Responses are streamed via Server-Sent Events (SSE).

```typescript
// Stream event types
type StreamEvent =
  | { type: 'thinking', data: { step: string } }
  | { type: 'sources', data: { citations: Citation[] } }
  | { type: 'content', data: { token: string } }
  | { type: 'verification', data: { status: 'checking' | 'verified' } }
  | { type: 'done', data: { traceUrl?: string } };
```

Frontend receives tokens as they're generated for real-time UX.

---

## Caching

Responses are cached in Upstash Redis.

```
┌─────────────────────────────────────────────────────────────────┐
│  CACHE STRATEGY                                                 │
│                                                                 │
│  Key: hash(question + document_ids + response_mode)             │
│  TTL: 24 hours                                                  │
│                                                                 │
│  Cache hit → Return immediately (<500ms)                        │
│  Cache miss → Run full pipeline, cache result                   │
│                                                                 │
│  Savings: 60-70% of queries are repeat/similar                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Cost Optimization

| Strategy | Savings |
|----------|---------|
| Query routing | Skip retrieval for simple questions |
| Caching | 60-70% of queries |
| Tiered models | GPT-5 Mini for most, o3 only when needed |
| Batch embeddings | Reduced API overhead |

**Target: < $0.05 per query average**

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [Verification](./verification.md) - Multi-model checking
- [Visual Citations](./visual-citations.md) - How highlighting works
