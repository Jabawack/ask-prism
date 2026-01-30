import type { Citation, DocumentChunk, Document } from '@/lib/supabase/types';

export type QueryIntent = 'needs_retrieval' | 'conversational' | 'out_of_scope';

export interface RetrievedChunk {
  chunk: DocumentChunk;
  document: Document;
  similarity_score: number;
  rerank_score?: number;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface GraphState {
  query: string;
  conversation_id: string;
  document_ids: string[];
  chat_history: ChatMessage[];
  intent: QueryIntent;
  retrieved_chunks: RetrievedChunk[];
  reranked_chunks: RetrievedChunk[];
  response: string;
  citations: Citation[];
  model_used?: string;
  cache_key?: string;
  trace_id?: string;
}
