-- Migration: Add bounding box support and processing mode tracking
-- Run this after the initial schema is set up

-- Add processing_mode column to documents
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS processing_mode TEXT DEFAULT 'basic'
CHECK (processing_mode IN ('basic', 'standard', 'advanced'));

-- Add metadata column to documents for storing parse results
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';

-- The document_chunks.metadata column already exists and supports bbox storage
-- Bbox is stored as: { "bbox": { "x": 10, "y": 20, "width": 50, "height": 10, "page": 1 } }

-- Add index on metadata for efficient bbox queries
CREATE INDEX IF NOT EXISTS idx_chunks_metadata ON document_chunks USING GIN (metadata);

-- Add processing_mode index for filtering
CREATE INDEX IF NOT EXISTS idx_documents_processing_mode ON documents(processing_mode);

-- Create answer_records table for multi-model verification tracking
CREATE TABLE IF NOT EXISTS answer_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE,
  document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
  question TEXT NOT NULL,

  -- Primary answer
  primary_answer JSONB NOT NULL,
  -- { "model": "gpt-5-mini", "answer": "...", "citations": [...] }

  -- Verification (Claude Haiku)
  verification JSONB,
  -- { "model": "claude-haiku-4.5", "agrees": true, "notes": "...", "citations": [...] }

  -- Reconciliation (o3, only if verification disagrees)
  reconciliation JSONB,
  -- { "model": "o3", "resolution": "...", "chosen": "primary" | "verification" | "synthesized" }

  -- User feedback
  user_feedback JSONB,
  -- { "correct": true, "correction": "...", "submitted_at": "..." }

  -- Final result
  final_answer TEXT NOT NULL,
  confidence DECIMAL(3,2),  -- 0.00 to 1.00
  response_mode TEXT NOT NULL CHECK (response_mode IN ('quick', 'standard', 'thorough')),
  response_time_ms INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for answer_records
CREATE INDEX IF NOT EXISTS idx_answer_records_message ON answer_records(message_id);
CREATE INDEX IF NOT EXISTS idx_answer_records_document ON answer_records(document_id);
CREATE INDEX IF NOT EXISTS idx_answer_records_confidence ON answer_records(confidence);

-- Create pending_fields table for dynamic field discovery
CREATE TABLE IF NOT EXISTS pending_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  field_name TEXT NOT NULL UNIQUE,

  -- Tracking
  occurrences INTEGER DEFAULT 1,
  threshold INTEGER DEFAULT 50,
  sample_values JSONB DEFAULT '[]',

  -- Context
  doc_types TEXT[] DEFAULT '{}',
  firm_names TEXT[] DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'promoted', 'ignored', 'dismissed')),
  promoted_at TIMESTAMPTZ,
  ignored_at TIMESTAMPTZ,
  ignore_weight DECIMAL(3,2) DEFAULT 0.5,

  -- Metadata
  suggested_data_type TEXT CHECK (suggested_data_type IN ('string', 'number', 'date', 'currency')),
  first_seen TIMESTAMPTZ DEFAULT NOW(),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for pending_fields queries
CREATE INDEX IF NOT EXISTS idx_pending_fields_status ON pending_fields(status);
CREATE INDEX IF NOT EXISTS idx_pending_fields_occurrences ON pending_fields(occurrences);

-- Add extracted_fields column to documents for dynamic field storage
ALTER TABLE documents
ADD COLUMN IF NOT EXISTS extracted_fields JSONB DEFAULT '{}';

-- Index for extracted_fields queries
CREATE INDEX IF NOT EXISTS idx_documents_extracted_fields ON documents USING GIN (extracted_fields);

-- Function to increment pending field occurrences
CREATE OR REPLACE FUNCTION increment_pending_field(
  p_field_name TEXT,
  p_sample_value TEXT,
  p_doc_type TEXT DEFAULT NULL,
  p_firm_name TEXT DEFAULT NULL
)
RETURNS pending_fields
LANGUAGE plpgsql
AS $$
DECLARE
  result pending_fields;
BEGIN
  INSERT INTO pending_fields (field_name, sample_values, doc_types, firm_names)
  VALUES (
    p_field_name,
    jsonb_build_array(p_sample_value),
    CASE WHEN p_doc_type IS NOT NULL THEN ARRAY[p_doc_type] ELSE '{}' END,
    CASE WHEN p_firm_name IS NOT NULL THEN ARRAY[p_firm_name] ELSE '{}' END
  )
  ON CONFLICT (field_name) DO UPDATE SET
    occurrences = pending_fields.occurrences + 1,
    last_seen = NOW(),
    sample_values = (
      SELECT jsonb_agg(DISTINCT v)
      FROM (
        SELECT jsonb_array_elements_text(pending_fields.sample_values) AS v
        UNION
        SELECT p_sample_value
        LIMIT 10
      ) sub
    ),
    doc_types = (
      SELECT array_agg(DISTINCT d)
      FROM (
        SELECT unnest(pending_fields.doc_types) AS d
        UNION
        SELECT p_doc_type WHERE p_doc_type IS NOT NULL
      ) sub
    ),
    firm_names = (
      SELECT array_agg(DISTINCT f)
      FROM (
        SELECT unnest(pending_fields.firm_names) AS f
        UNION
        SELECT p_firm_name WHERE p_firm_name IS NOT NULL
      ) sub
    )
  RETURNING * INTO result;

  RETURN result;
END;
$$;

-- Comment documenting the bbox storage format
COMMENT ON COLUMN document_chunks.metadata IS 'JSON metadata including bbox for visual citations. Format: { "start_char": int, "end_char": int, "bbox": { "x": %, "y": %, "width": %, "height": %, "page": int } }';
