# Multi-Model Verification

Ask Prism uses multiple LLMs to verify answer accuracy and catch hallucinations.

## The Problem

Single LLMs can hallucinate, even with RAG:

```
┌─────────────────────────────────────────────────────────────────┐
│  Context: "Q3 revenue was $4.2 million"                         │
│                                                                 │
│  Question: "What was Q3 revenue?"                               │
│                                                                 │
│  LLM Output: "Q3 revenue was $4.5 million"  ← WRONG!           │
│                                                                 │
│  The answer is "grounded" in context but still wrong.           │
└─────────────────────────────────────────────────────────────────┘
```

## The Solution

Use multiple models to verify each other:

```
┌─────────────────────────────────────────────────────────────────┐
│  MULTI-MODEL VERIFICATION                                       │
│                                                                 │
│  PRIMARY (GPT-5 Mini):                                          │
│    "Q3 revenue was $4.5 million"                                │
│                                                                 │
│  VERIFIER (Claude Haiku):                                       │
│    "Checking... Context says $4.2M, not $4.5M"                  │
│    Verdict: DISAGREES                                           │
│                                                                 │
│  RECONCILER (o3):                                               │
│    "Verifier is correct. Answer should be $4.2 million."        │
│                                                                 │
│  Final: "Q3 revenue was $4.2 million" ✓                        │
└─────────────────────────────────────────────────────────────────┘
```

---

## Response Modes

Users select verification level based on their accuracy needs:

| Mode | Models | Latency | Cost | Use Case |
|------|--------|---------|------|----------|
| **Quick** | GPT-5 Mini | ~3 sec | $ | Speed over accuracy |
| **Standard** | + Claude Haiku | ~5 sec | $$ | Balanced (default) |
| **Thorough** | + o3 reconcile | ~10 sec | $$$ | Maximum accuracy |

```
┌─────────────────────────────────────────────────────────────────┐
│  Response Quality                                               │
│                                                                 │
│  ○ Quick (~3 sec)       - Single model, no verification        │
│  ● Standard (~5 sec)    - Recommended                          │
│  ○ Thorough (~10 sec)   - Best for critical decisions          │
└─────────────────────────────────────────────────────────────────┘
```

---

## Verification Flow

### Quick Mode

```
Question → GPT-5 Mini → Answer
```

No verification. Use for:
- Casual browsing
- Low-stakes questions
- Maximum speed

### Standard Mode

```
Question → GPT-5 Mini → Answer
                           │
                           ▼
                   Claude Haiku Verify
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                AGREES        DISAGREES
                    │             │
                    ▼             ▼
              Return answer   Show warning
              (high conf.)    (lower conf.)
```

### Thorough Mode

```
Question → GPT-5 Mini → Answer
                           │
                           ▼
                   Claude Haiku Verify
                           │
                    ┌──────┴──────┐
                    ▼             ▼
                AGREES        DISAGREES
                    │             │
                    ▼             │
              Return answer       │
                                  ▼
                           o3 Reconcile
                                  │
                           ┌──────┴──────┐
                           ▼             ▼
                     Corrected      Undetermined
                     Answer         (flag for review)
```

---

## Implementation

### Verify Response Node

```typescript
// src/lib/langgraph/nodes/verify-response.ts

async function verifyResponse(
  answer: string,
  chunks: Chunk[],
  question: string
): Promise<VerificationResult> {
  const response = await claude.messages.create({
    model: 'claude-haiku-4-5-20250115',
    messages: [{
      role: 'user',
      content: `
        You are a fact-checking assistant. Verify this answer against the source chunks.

        Question: ${question}
        Answer: ${answer}

        Source chunks:
        ${chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n')}

        Respond in JSON:
        {
          "agrees": true/false,
          "confidence": 0.0-1.0,
          "notes": "explanation of any issues"
        }
      `
    }]
  });

  return JSON.parse(response.content[0].text);
}
```

### Reconcile Response Node

```typescript
// src/lib/langgraph/nodes/reconcile-response.ts

async function reconcileResponse(
  primaryAnswer: string,
  verification: VerificationResult,
  chunks: Chunk[],
  question: string
): Promise<ReconciliationResult> {
  const response = await openai.chat.completions.create({
    model: 'o3',
    messages: [{
      role: 'user',
      content: `
        Two AI systems disagree. Analyze and determine the correct answer.

        Question: ${question}

        Primary Model Answer: ${primaryAnswer}

        Verifier Assessment:
        - Agrees: ${verification.agrees}
        - Confidence: ${verification.confidence}
        - Notes: ${verification.notes}

        Source chunks:
        ${chunks.map((c, i) => `[${i + 1}] ${c.content}`).join('\n')}

        Analyze both perspectives. Determine the correct answer.

        Respond in JSON:
        {
          "correct_answer": "the accurate answer",
          "primary_was_correct": true/false,
          "explanation": "why this is correct",
          "confidence": 0.0-1.0
        }
      `
    }]
  });

  return JSON.parse(response.choices[0].message.content);
}
```

---

## Verification Results

### Agreement

```typescript
{
  "agrees": true,
  "confidence": 0.95,
  "notes": "Answer accurately reflects source. $4.2M figure matches page 7."
}
```

UI shows high confidence indicator.

### Disagreement

```typescript
{
  "agrees": false,
  "confidence": 0.85,
  "notes": "Answer says $4.5M but source shows $4.2M on page 7, line 23."
}
```

Options:
- Thorough mode: Trigger reconciliation
- Standard mode: Show warning, lower confidence

### Reconciliation Output

```typescript
{
  "correct_answer": "Q3 revenue was $4.2 million, representing a 15% increase year-over-year.",
  "primary_was_correct": false,
  "explanation": "The verifier correctly identified that the source document states $4.2M, not $4.5M as the primary model claimed.",
  "confidence": 0.98
}
```

---

## Research Background

Multi-model verification is supported by research:

| Approach | Accuracy | Source |
|----------|----------|--------|
| Single LLM | ~85% | Baseline |
| Dual verification | ~96% | SAMR Framework |
| Tri-agent reconciliation | ~99% | Tri-Agent Framework |

The key insight: **different models make different mistakes**. Cross-checking catches errors that any single model would miss.

---

## Cost Considerations

| Mode | Models | Est. Cost/Query |
|------|--------|-----------------|
| Quick | GPT-5 Mini | $0.01 |
| Standard | + Haiku verify | $0.02 |
| Thorough | + o3 reconcile | $0.05 |

Most users should use Standard mode. Reserve Thorough for:
- Financial decisions
- Legal documents
- Medical information
- Any high-stakes context

---

## Analytics Integration

All verification results are stored for accuracy tracking:

```typescript
const answerRecord = {
  question,
  primary_answer: primaryAnswer,
  primary_model: 'gpt-5-mini',
  verification_result: {
    agrees: verification.agrees,
    confidence: verification.confidence,
    notes: verification.notes
  },
  reconciliation_result: reconciliation,
  response_mode: 'thorough',
  final_answer: reconciliation?.correct_answer || primaryAnswer
};

await storeAnswerRecord(answerRecord);
```

This enables:
- Tracking accuracy over time
- Identifying problematic document types
- Optimizing model selection

---

## Related Documents

- [RAG Pipeline](./rag-pipeline.md) - How verification fits in
- [Analytics](./analytics.md) - Accuracy tracking
- [Architecture](./architecture.md) - System overview
