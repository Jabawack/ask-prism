# AI Patterns in Powder Backend

This document explains the AI/ML patterns used in the Powder codebase, clarifying the differences between RAG, Agents, and Simple LLM Inference.

## Quick Summary

| Pattern | Used in Powder? | Examples |
|---------|-----------------|----------|
| **RAG (Retrieval Augmented Generation)** | ❌ No | - |
| **Agents (Tool-calling, multi-turn)** | ✅ Yes | Holdings Reviewer, Asset Deck Multi-Agent |
| **Simple LLM Inference** | ✅ Yes | Claude Audit, Account Type Inference, Column Mapping |

---

## 1. RAG (Retrieval Augmented Generation) - NOT USED

RAG involves:
- Vector databases (Pinecone, Chroma, FAISS, Weaviate)
- Embedding generation to convert text to vectors
- Semantic search to find relevant documents
- Injecting retrieved context into LLM prompts

**Powder does NOT use RAG.** There are no vector databases, no embedding generation, and no semantic search infrastructure in the codebase.

---

## 2. Agents - USED

Agents are LLM systems that can:
- Call tools (functions)
- Make decisions based on results
- Loop through multi-turn conversations
- Spawn sub-agents for specialized tasks

### 2.1 Holdings Reviewer Agent

**Location:** `agents/holdings_reviewer/`

**Purpose:** Automated review of financial statement holdings to identify and fix extraction errors.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                      ORCHESTRATOR                                │
│  (coordinates workflow, manages progress, calls finalize)       │
│                                                                  │
│  Tools: Task, Skill, scratchpad, get_gap, finalize              │
└──────────────────────────┬──────────────────────────────────────┘
                           │ spawns
           ┌───────────────┼───────────────┐
           ▼               ▼               ▼
    ┌──────────────┐ ┌──────────────┐ ┌──────────────────┐
    │   EXPLORER   │ │  METADATA    │ │ ACCOUNT_REVIEWER │
    │              │ │  ENRICHER    │ │                  │
    │ Maps PDF     │ │              │ │ Fixes holdings   │
    │ structure    │ │ Updates      │ │ per account      │
    │              │ │ AccountSumm. │ │                  │
    └──────────────┘ └──────────────┘ └──────────────────┘
```

**Key Components:**
- **SDK:** `claude_agent_sdk` with `ClaudeSDKClient`
- **MCP Server:** Custom tools for PDF access and holdings management
- **Subagents:** EXPLORER, METADATA_ENRICHER, ACCOUNT_REVIEWER
- **Skills:** 18 skills loaded from `.claude/skills/` directory
- **Max Turns:** 100 conversation turns

**Entry Point:** `agents/holdings_reviewer/agent.py:run_holdings_review()`

### 2.2 Asset Deck Multi-Agent

**Location:** `agents/asset_deck_multi_agent/`

**Purpose:** Extract financial metrics from investor deck PDFs using parallel agents.

**Architecture:**
```
┌─────────────────────────────────────────────────────────────────┐
│                    PYTHON ORCHESTRATOR                           │
│           coordination/orchestrator.py                           │
└─────────────────────────┬───────────────────────────────────────┘
                          │
    ┌─────────────────────┼─────────────────────┐
    │                     │                     │
    ▼                     ▼                     ▼
┌────────┐         ┌────────────┐         ┌────────────┐
│ PHASE 1│         │  PHASE 2   │         │  PHASE 3   │
│        │         │            │         │            │
│ Recon  │────────▶│ Extraction │────────▶│ Merge +    │
│ Agent  │         │ Agents     │         │ Validation │
│        │         │ (6-8 in    │         │ Agent      │
│ sonnet │         │ parallel)  │         │            │
└────────┘         └────────────┘         └────────────┘
                         │
          ┌──────────────┼──────────────┐
          ▼              ▼              ▼
    ┌──────────┐  ┌──────────┐  ┌──────────┐
    │ Revenue  │  │ Margins  │  │ Growth   │  ...
    │ Agent    │  │ Agent    │  │ Agent    │
    └──────────┘  └──────────┘  └──────────┘
```

**Key Components:**
- **Parallel Execution:** Uses `asyncio.gather()` to run 6-8 agents simultaneously
- **Gates:** Quality checkpoints between phases (`ReconnaissanceGate`, `ExtractionGate`)
- **Merge:** Python-based deterministic deduplication
- **Model:** Claude Sonnet for all agents

**Entry Point:** `agents/asset_deck_multi_agent/coordination/orchestrator.py:run_parallel_extraction()`

---

## 3. Simple LLM Inference - USED

Simple inference is a single API call to an LLM without tools or multi-turn conversation.

### 3.1 Claude Audit Service

**Location:** `navigate_core_app/service/claude_audit_service.py`

**Purpose:** Post-extraction verification using Claude Vision API to compare extracted values against the original PDF.

**How it works:**
1. Takes extracted holdings data and PDF pages (base64 encoded)
2. Sends single API call to Claude Vision
3. Claude returns verification results: VERIFIED, HEALED, or WARNING
4. No tools, no multi-turn, no looping

**Key Features:**
- Checksum validation (Value = Qty × Price)
- Bounding box extraction for highlighting
- Auto-push to production when audit passes

### 3.2 Account Type Inference

**Location:** `navigate_core_app/statement_review/account_type_inference_service.py`

**Purpose:** Classify account types (IRA, Brokerage, Trust, etc.)

**How it works:**
1. Rule-based matching first (no API call)
2. If confidence < 80%, falls back to Claude Haiku API call
3. Single API call, returns classification

### 3.3 Column Mapping

**Location:** `navigate_core_app/openai/open_ai_service.py`

**Purpose:** Map CSV/Excel column names to schema fields

**How it works:**
1. Send column headers and schema to LLM
2. Single API call returns mapping
3. No iteration or tools

### 3.4 OpenAI Extraction

**Location:** `navigate_core_app/openai/open_ai_service.py`

**Purpose:** Extract structured holdings data from parsed document text

**How it works:**
1. Reducto parses PDF to text
2. Text sent to OpenAI with schema
3. Returns structured JSON
4. Single API call

---

## 4. External Services (Not AI)

### 4.1 Reducto

**Location:** `navigate_core_app/pipeline/reducto_api/client.py`

**Purpose:** Document intelligence / OCR

**What it is:** External API service that:
- Parses PDFs to structured text
- Extracts tables
- Provides bounding box coordinates
- NOT an LLM, it's document processing

### 4.2 AWS Bedrock

**Location:** `navigate_core_app/openai/claude_client_factory.py`

**Purpose:** Alternative hosting for Claude models

**What it is:** AWS service that hosts Claude models. The `BedrockClaudeClient` wraps the Bedrock API to match Anthropic's client interface.

---

## 5. Holdings Reviewer Skills Reference

The Holdings Reviewer Agent uses 18 skills organized into 6 categories. Skills provide specialized knowledge and procedures that agents can load on-demand.

### 5.1 Workflow Skills (Core)

| Skill Path | Description |
|------------|-------------|
| `workflow/explore-pdf` | Guides PDF exploration: custodian identification, account totals, holdings pages, section boundaries |
| `workflow/fix-workflow` | Guides the DIAGNOSE → FIX → VERIFY loop with max 3 iterations and escalation strategy |

### 5.2 Detection Skills

| Skill Path | Description |
|------------|-------------|
| `detection/duplicate-detection` | Identify and remove duplicate holdings from OCR errors, page boundaries, or multiple PDF mentions |
| `detection/extra-row-detection` | Identify rows to delete: account totals, section totals, activity transactions, headers, pending trades |
| `detection/tax-lot-detection` | Tax lot summary detection for JP Morgan statements ONLY (requires `dont_parse_tax_lots=False`) |
| `detection/split-page-detection` | Investigate gaps from page boundaries causing missing rows (UNDER) or duplicated rows (OVER) |
| `detection/account-type-mismatch` | Detect holdings with incorrect `account_type` or `account_number` assignments |
| `detection/redaction-artifacts` | Detect phantom accounts from OCR artifacts on redacted account numbers (e.g., `***83` → `839`) |

### 5.3 Validation Skills

| Skill Path | Description |
|------------|-------------|
| `validation/visual-verification` | When and how to use `view_pdf_page()` to visually confirm issues before modifications |
| `validation/cash-validation` | Special handling for cash positions: SPAXX, CORE, money market identification |
| `validation/row-count-validation` | Compare holdings counts against expected PDF row counts to identify missing/extra rows |
| `validation/total-validation` | Validate value totals at section, account, and portfolio levels against PDF stated totals |

### 5.4 Enrichment Skills

| Skill Path | Description |
|------------|-------------|
| `enrichment/ticker-enrichment` | Fill in missing ticker symbols by extracting from PDF or using `lookup_ticker` |
| `enrichment/holding-field-enrichment` | Extract additional fields: CUSIP, ISIN, currency, asset manager, purchase dates, cost basis |
| `enrichment/account-metadata-enrichment` | Extract document-level metadata: entity names, statement dates, account types, custodian info |

### 5.5 Reference Skills

| Skill Path | Description |
|------------|-------------|
| `reference/common-problems` | Quick diagnostic checklist for gaps with links to detailed detection skills |
| `reference/never-add-list` | Row types that should NEVER be added: transactions, totals, headers, pending items, margin balances |

### 5.6 Custodian-Specific Skills

| Skill Path | Description |
|------------|-------------|
| `custodians/jp-morgan` | JP Morgan-specific patterns: nested subtotals, model portfolios, JPMXX money market, accrued interest |

### Skill Loading Strategy

From `agents/holdings_reviewer/skills.py`:

**Tier 1 - Core (always injected, ~680 lines):**
- `workflow/explore-pdf` → Explorer subagent
- `reference/common-problems` → Account Reviewer subagent
- `workflow/fix-workflow` → Account Reviewer subagent

**Tier 2 - Context (injected when relevant, ~400 lines):**
- `custodians/jp-morgan` → Only for JP Morgan statements
- `detection/tax-lot-detection` → Only for JP Morgan with tax lots enabled

**Tier 3 - Reference (NOT injected - loaded on-demand):**
- All other validation/detection/enrichment skills
- Agents can load these via `get_skill()` MCP tool when needed

---

## 6. Key Differences Summary

| Aspect | RAG | Agent | Simple Inference |
|--------|-----|-------|------------------|
| Vector DB | ✅ Required | ❌ Not needed | ❌ Not needed |
| Tools | ❌ No | ✅ Yes | ❌ No |
| Multi-turn | ❌ No | ✅ Yes | ❌ No |
| Looping | ❌ No | ✅ Yes | ❌ No |
| Sub-agents | ❌ No | ✅ Optional | ❌ No |
| Use Case | Knowledge retrieval | Complex tasks | Classification, extraction |

---

## 7. File Reference

| System | Key Files |
|--------|-----------|
| Holdings Reviewer Agent | `agents/holdings_reviewer/agent.py`, `subagents.py`, `skills.py`, `tools/` |
| Asset Deck Multi-Agent | `agents/asset_deck_multi_agent/coordination/orchestrator.py`, `agents/` |
| Claude Audit | `navigate_core_app/service/claude_audit_service.py` |
| Account Type Inference | `navigate_core_app/statement_review/account_type_inference_service.py` |
| Claude Client Factory | `navigate_core_app/openai/claude_client_factory.py` |
| Reducto Client | `navigate_core_app/pipeline/reducto_api/client.py` |
