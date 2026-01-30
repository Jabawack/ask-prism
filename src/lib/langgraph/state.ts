import { Annotation } from '@langchain/langgraph';
import type { Citation } from '@/lib/supabase/types';
import type { ChatMessage, QueryIntent, RetrievedChunk } from './types';

export const GraphStateAnnotation = Annotation.Root({
  query: Annotation<string>,
  conversation_id: Annotation<string>,
  document_ids: Annotation<string[]>,
  chat_history: Annotation<ChatMessage[]>,
  intent: Annotation<QueryIntent>,
  retrieved_chunks: Annotation<RetrievedChunk[]>,
  reranked_chunks: Annotation<RetrievedChunk[]>,
  response: Annotation<string>,
  citations: Annotation<Citation[]>,
  model_used: Annotation<string | undefined>,
  cache_key: Annotation<string | undefined>,
  trace_id: Annotation<string | undefined>,
});
