import type { GraphState, RetrievedChunk } from '../types';
import { searchChunks } from '@/lib/supabase/client';
import { embedText } from '@/lib/processing/embeddings';

const RETRIEVAL_LIMIT = 20;

export async function retrieveDocuments(state: GraphState): Promise<Partial<GraphState>> {
  const { query, document_ids } = state;

  if (document_ids.length === 0) {
    return { retrieved_chunks: [] };
  }

  const queryEmbedding = await embedText(query);

  const results = await searchChunks(queryEmbedding, document_ids, RETRIEVAL_LIMIT);

  const retrievedChunks: RetrievedChunk[] = results.map((r) => ({
    chunk: r.chunk,
    document: r.document,
    similarity_score: r.similarity,
  }));

  return { retrieved_chunks: retrievedChunks };
}
