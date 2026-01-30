# Analytics & Field Discovery

Ask Prism tracks accuracy and automatically discovers new fields across documents.

## Overview

```
┌─────────────────────────────────────────────────────────────────┐
│  ANALYTICS SYSTEM                                               │
│                                                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  ACCURACY       │  │  FIELD          │  │  MODEL          │ │
│  │  TRACKING       │  │  DISCOVERY      │  │  PERFORMANCE    │ │
│  │                 │  │                 │  │                 │ │
│  │  By doc type    │  │  Auto-detect    │  │  By question    │ │
│  │  By firm        │  │  new fields     │  │  type           │ │
│  │  By model       │  │  across docs    │  │                 │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Accuracy Tracking

### What We Track

Every answer is recorded with:

```typescript
interface AnswerRecord {
  id: string;
  document_id: string;
  conversation_id: string;
  question: string;

  // Model outputs
  primary_answer: string;
  primary_model: string;
  verification_result: {
    agrees: boolean;
    confidence: number;
    notes: string;
  };
  reconciliation_result?: {
    correct_answer: string;
    explanation: string;
  };

  // User feedback
  user_feedback?: {
    correct: boolean;
    correction?: string;
  };

  // Metadata
  final_answer: string;
  confidence: number;
  response_mode: 'quick' | 'standard' | 'thorough';
  response_time_ms: number;
  created_at: Date;
}
```

### Dimensions

Track accuracy across multiple dimensions:

| Dimension | Example Insight |
|-----------|-----------------|
| **Document Type** | "Tax forms have 92% accuracy, bank statements 96%" |
| **Firm/Source** | "Chase statements work well, Morgan Stanley needs Advanced parsing" |
| **Model** | "GPT-5 Mini handles numbers better than Claude for this doc type" |
| **Question Type** | "Numeric questions are 98% accurate, comparative questions 89%" |
| **Parser** | "Reducto handles tables better than pdfjs-dist" |

### Analytics Queries

```sql
-- Accuracy by document type
SELECT
  d.doc_type,
  COUNT(*) as total_questions,
  AVG(CASE WHEN ar.user_feedback->>'correct' = 'true' THEN 1 ELSE 0 END) as accuracy
FROM answer_records ar
JOIN documents d ON ar.document_id = d.id
WHERE ar.user_feedback IS NOT NULL
GROUP BY d.doc_type;

-- Model performance comparison
SELECT
  primary_model,
  response_mode,
  AVG(confidence) as avg_confidence,
  AVG(response_time_ms) as avg_response_time,
  COUNT(*) as total_queries
FROM answer_records
GROUP BY primary_model, response_mode;
```

---

## Dynamic Field Discovery

### The Problem

Documents contain fields we didn't anticipate. Rather than miss them, we track new fields as they appear.

### How It Works

```
┌─────────────────────────────────────────────────────────────────┐
│  FIELD DISCOVERY FLOW                                           │
│                                                                 │
│  Parse Document                                                 │
│       │                                                         │
│       ▼                                                         │
│  Extract fields:                                                │
│  - account_number: "1234567"     ← Known (in schema)           │
│  - routing_number: "021000021"   ← NEW!                        │
│  - balance: "$5,432.10"          ← Known                       │
│       │                                                         │
│       ▼                                                         │
│  Is "routing_number" in schema?                                 │
│       │                                                         │
│       NO → Track in pending_fields                              │
│       │                                                         │
│       ▼                                                         │
│  pending_fields["routing_number"] = {                           │
│    occurrences: 47,                                             │
│    threshold: 50,                                               │
│    status: "pending"                                            │
│  }                                                              │
│       │                                                         │
│       ▼                                                         │
│  Threshold reached (50)?                                        │
│       │                                                         │
│  YES → Notify user                                              │
│       │                                                         │
│       ▼                                                         │
│  User chooses:                                                  │
│  - Add to Schema → Field is now extracted                       │
│  - Ignore → Keep tracking at 0.5x weight                        │
│  - Dismiss → Stop tracking                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Field Status Lifecycle

```
   PENDING          PROMOTED          IGNORED           DISMISSED
      │                 │                │                  │
      │   threshold     │                │                  │
      │   met + user    │   always       │   ignored but    │   never
      │   approved      │   extracted    │   still tracked  │   track
      │                 │                │   with 0.5x      │   again
      ▼                 ▼                │   priority       │
  [tracking]  ────────► [in schema]      │                  │
                              ▲          │                  │
                              │          │                  │
                        user changes ────┘                  │
                        mind later                          │
                                                           [deleted]
```

### Database Schema

```sql
CREATE TABLE pending_fields (
  id UUID PRIMARY KEY,
  field_name TEXT UNIQUE NOT NULL,

  -- Tracking
  occurrences INT DEFAULT 1,
  threshold INT DEFAULT 50,
  sample_values JSONB DEFAULT '[]',  -- Last 10 examples

  -- Context
  doc_types TEXT[],   -- Which document types have this
  firm_names TEXT[],  -- Which firms

  -- Status
  status TEXT DEFAULT 'pending',  -- pending, promoted, ignored, dismissed
  promoted_at TIMESTAMPTZ,
  ignored_at TIMESTAMPTZ,
  ignore_weight DECIMAL DEFAULT 0.5,

  -- Metadata
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  suggested_data_type TEXT  -- string, number, date, currency
);
```

### Implementation

```typescript
// src/lib/analytics/field-discovery.ts

async function trackField(fieldName: string, value: any, docType: string) {
  // Check if field is in schema
  if (KNOWN_FIELDS.includes(fieldName)) {
    return; // Already tracked
  }

  // Update pending_fields
  await supabase.rpc('increment_pending_field', {
    p_field_name: fieldName,
    p_value: value,
    p_doc_type: docType
  });

  // Check if threshold reached
  const { data: field } = await supabase
    .from('pending_fields')
    .select('*')
    .eq('field_name', fieldName)
    .single();

  if (field.occurrences >= field.threshold && field.status === 'pending') {
    // Notify user
    await createFieldDiscoveryNotification(field);
  }
}

async function promoteField(fieldName: string) {
  await supabase
    .from('pending_fields')
    .update({ status: 'promoted', promoted_at: new Date() })
    .eq('field_name', fieldName);

  // Add to schema (implementation depends on schema storage)
  await addToFieldSchema(fieldName);
}

async function ignoreField(fieldName: string) {
  await supabase
    .from('pending_fields')
    .update({ status: 'ignored', ignored_at: new Date() })
    .eq('field_name', fieldName);
}
```

---

## User Notifications

### Field Discovery Alert

```
┌─────────────────────────────────────────────────────────────────┐
│  📊 Field Discovery Notifications                        [3]    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  🆕 "routing_number" reached threshold                  │   │
│  │                                                         │   │
│  │  Found in: 52 documents                                 │   │
│  │  Doc types: bank_statement (48), tax_form (4)           │   │
│  │  Sample values: "021000021", "026009593", "011401533"   │   │
│  │  Suggested type: string                                 │   │
│  │                                                         │   │
│  │  [Add to Schema]  [Ignore]  [Dismiss]  [View Examples]  │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Answer Feedback

After each response, users can provide feedback:

```
┌─────────────────────────────────────────────────────────────────┐
│  Was this answer accurate?                                      │
│                                                                 │
│  [👍 Yes]  [👎 No]  [🤔 Not sure]                               │
│                                                                 │
│  ─────────────────────────────────────────                     │
│  (If No selected)                                               │
│                                                                 │
│  What should the correct answer be?                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                                                         │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  [Submit Correction]                                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## Analytics Dashboard

### Key Metrics

```
┌─────────────────────────────────────────────────────────────────┐
│  Analytics Dashboard                                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐│
│  │   94.2%     │  │    1,234    │  │    3.2s     │  │  $0.03  ││
│  │  Accuracy   │  │   Queries   │  │  Avg Time   │  │ Per Q.  ││
│  │  (verified) │  │  (30 days)  │  │  (P50)      │  │         ││
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────┘│
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Accuracy by Document Type                                      │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  Bank Statements    ████████████████████████ 96.1%      │   │
│  │  Tax Forms          ███████████████████████  92.3%      │   │
│  │  Invoices           █████████████████████    89.7%      │   │
│  │  Contracts          ████████████████         85.2%      │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
│  ─────────────────────────────────────────────────────────────  │
│                                                                 │
│  Pending Fields (3)                                             │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │  routing_number    52/50  ████████████  [Promote]       │   │
│  │  swift_code        48/50  ███████████░  Pending         │   │
│  │  wire_reference    23/50  █████░░░░░░░  Tracking        │   │
│  └─────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Configuration

```typescript
interface FieldDiscoveryConfig {
  defaultThreshold: number;              // Default: 50
  thresholdByDocType: Record<string, number>;  // Override per type
  ignoreWeight: number;                  // Default: 0.5
  maxSampleValues: number;               // Default: 10
  autoPromoteHighConfidence: boolean;    // Auto-add if confidence > 95%
}

// Example config
const config: FieldDiscoveryConfig = {
  defaultThreshold: 50,
  thresholdByDocType: {
    'bank_statement': 30,  // Lower threshold for common type
    'rare_document': 100   // Higher threshold for rare types
  },
  ignoreWeight: 0.5,
  maxSampleValues: 10,
  autoPromoteHighConfidence: false
};
```

---

## Related Documents

- [Architecture](./architecture.md) - System overview
- [Verification](./verification.md) - How accuracy is measured
- [API Reference](./api-reference.md) - Analytics endpoints
