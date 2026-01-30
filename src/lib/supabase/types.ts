// Core entities for Document Q&A system

export type DocumentStatus = 'uploading' | 'processing' | 'indexed' | 'failed';
export type ProcessingMode = 'basic' | 'standard' | 'advanced';
export type ResponseMode = 'quick' | 'standard' | 'thorough';

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  storage_url: string;
  status: DocumentStatus;
  file_type: 'pdf' | 'txt' | 'docx';
  file_size: number;
  page_count?: number;
  chunk_count?: number;
  error_message?: string;
  processing_mode?: ProcessingMode;
  metadata?: DocumentMetadata;
  extracted_fields?: Record<string, ExtractedField>;
  created_at: string;
  updated_at: string;
}

export interface DocumentMetadata {
  processing_mode?: ProcessingMode;
  parser_used?: 'pdfjs' | 'reducto';
  processed_at?: string;
  doc_type?: string;
  firm_name?: string;
  bank_name?: string;
}

export interface ExtractedField {
  value: unknown;
  confidence: number;
  bbox?: BoundingBox;
  source: 'schema' | 'pending' | 'ignored';
}

export interface DocumentChunk {
  id: string;
  document_id: string;
  content: string;
  embedding: number[];
  chunk_index: number;
  page_number?: number;
  token_count: number;
  metadata: ChunkMetadata;
  created_at: string;
}

export interface BoundingBox {
  x: number;      // % from left edge (0-100)
  y: number;      // % from top edge (0-100)
  width: number;  // % of page width
  height: number; // % of page height
  page: number;   // 1-indexed page number
}

export interface ChunkMetadata {
  start_char?: number;
  end_char?: number;
  section_title?: string;
  bbox?: BoundingBox;
}

export interface Conversation {
  id: string;
  user_id: string;
  document_ids: string[];
  title?: string;
  created_at: string;
  updated_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations: Citation[];
  trace_id?: string;
  model_used?: string;
  token_usage?: TokenUsage;
  latency_ms?: number;
  cache_hit?: boolean;
  created_at: string;
}

export interface Citation {
  document_id: string;
  document_name: string;
  chunk_id: string;
  chunk_index: number;
  page_number?: number;
  excerpt: string;
  relevance_score: number;
  bbox?: BoundingBox;  // For visual highlighting in PDF viewer
}

// Answer record for multi-model verification tracking
export interface AnswerRecord {
  id: string;
  message_id?: string;
  document_id: string;
  question: string;
  primary_answer: ModelAnswer;
  verification?: VerificationResult;
  reconciliation?: ReconciliationResult;
  user_feedback?: UserFeedback;
  final_answer: string;
  confidence: number;
  response_mode: ResponseMode;
  response_time_ms?: number;
  created_at: string;
}

export interface ModelAnswer {
  model: string;
  answer: string;
  citations?: Citation[];
}

export interface VerificationResult {
  model: string;
  agrees: boolean;
  notes: string;
  citations?: Citation[];
}

export interface ReconciliationResult {
  model: string;
  resolution: string;
  chosen: 'primary' | 'verification' | 'synthesized';
}

export interface UserFeedback {
  correct: boolean;
  correction?: string;
  submitted_at: string;
}

// Pending field for dynamic field discovery
export interface PendingField {
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
  suggested_data_type?: 'string' | 'number' | 'date' | 'currency';
  first_seen: string;
  last_seen: string;
  created_at: string;
}

export interface TokenUsage {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

// API request/response types

export interface UploadDocumentRequest {
  file: File;
}

export interface UploadDocumentResponse {
  document: Document;
}

export interface CreateConversationRequest {
  document_ids: string[];
  title?: string;
}

export interface CreateConversationResponse {
  conversation: Conversation;
}

export interface SendMessageRequest {
  content: string;
}

// SSE streaming event types
export type StreamEventType = 'thinking' | 'sources' | 'content' | 'done' | 'error';

export interface ThinkingEvent {
  type: 'thinking';
  data: { step: string };
}

export interface SourcesEvent {
  type: 'sources';
  data: { citations: Citation[] };
}

export interface ContentEvent {
  type: 'content';
  data: { token: string };
}

export interface DoneEvent {
  type: 'done';
  data: {
    trace_url?: string;
    token_usage?: TokenUsage;
    latency_ms: number;
  };
}

export interface ErrorEvent {
  type: 'error';
  data: { message: string; code?: string };
}

export type StreamEvent = ThinkingEvent | SourcesEvent | ContentEvent | DoneEvent | ErrorEvent;

// LangGraph state types

export type QueryIntent = 'needs_retrieval' | 'conversational' | 'out_of_scope';

export interface GraphState {
  query: string;
  conversation_id: string;
  document_ids: string[];
  chat_history: Array<{ role: 'user' | 'assistant'; content: string }>;
  intent: QueryIntent;
  retrieved_chunks: RetrievedChunk[];
  reranked_chunks: RetrievedChunk[];
  response: string;
  citations: Citation[];
  model_used?: string;
  cache_key?: string;
  trace_id?: string;
}

export interface RetrievedChunk {
  chunk: DocumentChunk;
  document: Document;
  similarity_score: number;
  rerank_score?: number;
}
