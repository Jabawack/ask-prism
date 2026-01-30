// Enhanced streaming with multi-model verification support

import type { GraphState, ChatMessage } from './types';
import type { Citation, ResponseMode, AnswerRecord } from '@/lib/supabase/types';
import { routeQuery } from './nodes/route-query';
import { retrieveDocuments } from './nodes/retrieve-documents';
import { rerankResults } from './nodes/rerank-results';
import { generateResponseStreaming } from './nodes/generate-response';
import { verifyResponse } from './nodes/verify-response';
import { reconcileResponse } from './nodes/reconcile-response';

export interface StreamOptions {
  query: string;
  conversationId: string;
  documentIds: string[];
  chatHistory?: ChatMessage[];
  responseMode?: ResponseMode;
}

export interface StreamEvent {
  type: 'thinking' | 'sources' | 'token' | 'verification' | 'reconciliation' | 'done' | 'error';
  data: unknown;
}

export async function* streamWithVerification(
  options: StreamOptions
): AsyncGenerator<StreamEvent> {
  const {
    query,
    conversationId,
    documentIds,
    chatHistory = [],
    responseMode = 'standard',
  } = options;

  const startTime = Date.now();

  try {
    yield { type: 'thinking', data: { step: 'Analyzing query...' } };

    // Step 1: Route the query
    const initialState: GraphState = {
      query,
      conversation_id: conversationId,
      document_ids: documentIds,
      chat_history: chatHistory,
      intent: 'needs_retrieval',
      retrieved_chunks: [],
      reranked_chunks: [],
      response: '',
      citations: [],
    };

    const routeResult = await routeQuery(initialState);
    const intent = routeResult.intent || 'needs_retrieval';

    let state: GraphState = { ...initialState, intent };
    let citations: Citation[] = [];

    // Step 2: Retrieve and rerank if needed
    if (intent === 'needs_retrieval') {
      yield { type: 'thinking', data: { step: 'Searching documents...' } };

      const retrieveResult = await retrieveDocuments(state);
      state = { ...state, retrieved_chunks: retrieveResult.retrieved_chunks || [] };

      yield { type: 'thinking', data: { step: 'Ranking results...' } };

      const rerankResult = await rerankResults(state);
      state = { ...state, reranked_chunks: rerankResult.reranked_chunks || [] };

      // Build citations with bbox if available
      citations = state.reranked_chunks.map((rc) => ({
        document_id: rc.document.id,
        document_name: rc.document.filename,
        chunk_id: rc.chunk.id,
        chunk_index: rc.chunk.chunk_index,
        page_number: rc.chunk.page_number,
        excerpt: rc.chunk.content.slice(0, 200) + '...',
        relevance_score: rc.rerank_score || rc.similarity_score,
        bbox: rc.chunk.metadata?.bbox,
      }));

      if (citations.length > 0) {
        yield { type: 'sources', data: { citations } };
      }
    }

    // Step 3: Generate primary response
    yield { type: 'thinking', data: { step: 'Generating response...' } };

    const responseGen = generateResponseStreaming(state);
    let primaryAnswer = '';

    for await (const event of responseGen) {
      if (event.type === 'token') {
        yield { type: 'token', data: { token: event.content } };
        primaryAnswer += event.content;
      }
    }

    // If quick mode, we're done
    if (responseMode === 'quick') {
      yield {
        type: 'done',
        data: {
          response: primaryAnswer,
          citations,
          intent,
          model_used: 'gpt-4o-mini',
          verification: null,
          reconciliation: null,
          latency_ms: Date.now() - startTime,
        },
      };
      return;
    }

    // Step 4: Verify with Claude Haiku (standard and thorough modes)
    yield { type: 'thinking', data: { step: 'Verifying response...' } };

    const { verification, shouldReconcile } = await verifyResponse({
      state,
      primaryAnswer,
    });

    yield {
      type: 'verification',
      data: {
        agrees: verification.agrees,
        model: verification.model,
        notes: verification.notes,
      },
    };

    // If standard mode and verification agrees, we're done
    if (responseMode === 'standard' || !shouldReconcile) {
      yield {
        type: 'done',
        data: {
          response: primaryAnswer,
          citations,
          intent,
          model_used: 'gpt-4o-mini',
          verification,
          reconciliation: null,
          confidence: verification.agrees ? 0.95 : 0.75,
          latency_ms: Date.now() - startTime,
        },
      };
      return;
    }

    // Step 5: Reconcile with reasoning model (thorough mode, disagreement)
    yield { type: 'thinking', data: { step: 'Reconciling disagreement...' } };

    const { reconciliation, finalAnswer, confidence } = await reconcileResponse({
      state,
      primaryAnswer,
      verification,
    });

    yield {
      type: 'reconciliation',
      data: {
        model: reconciliation.model,
        chosen: reconciliation.chosen,
        resolution: reconciliation.resolution,
      },
    };

    // If reconciliation chose a different answer, stream it
    if (reconciliation.chosen !== 'primary' && finalAnswer !== primaryAnswer) {
      yield { type: 'thinking', data: { step: 'Updating response...' } };

      // Clear and re-stream the corrected answer
      // In a real implementation, you might want to handle this more gracefully
      yield { type: 'token', data: { token: '\n\n---\n\n**Corrected Response:**\n\n' } };
      yield { type: 'token', data: { token: finalAnswer } };
    }

    yield {
      type: 'done',
      data: {
        response: reconciliation.chosen === 'primary' ? primaryAnswer : finalAnswer,
        citations,
        intent,
        model_used: 'gpt-4o-mini',
        verification,
        reconciliation,
        confidence,
        latency_ms: Date.now() - startTime,
      },
    };
  } catch (error) {
    console.error('[StreamWithVerification] Error:', error);
    yield {
      type: 'error',
      data: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        latency_ms: Date.now() - startTime,
      },
    };
  }
}

/**
 * Build an answer record from the stream result for analytics tracking.
 */
export function buildAnswerRecord(
  doneEvent: StreamEvent & { type: 'done' },
  question: string,
  documentId: string,
  responseMode: ResponseMode
): Omit<AnswerRecord, 'id' | 'created_at'> {
  const data = doneEvent.data as {
    response: string;
    model_used: string;
    citations: Citation[];
    verification?: { model: string; agrees: boolean; notes: string } | null;
    reconciliation?: { model: string; resolution: string; chosen: string } | null;
    confidence?: number;
    latency_ms: number;
  };

  return {
    document_id: documentId,
    question,
    primary_answer: {
      model: data.model_used,
      answer: data.response,
      citations: data.citations,
    },
    verification: data.verification || undefined,
    reconciliation: data.reconciliation
      ? {
          model: data.reconciliation.model,
          resolution: data.reconciliation.resolution,
          chosen: data.reconciliation.chosen as 'primary' | 'verification' | 'synthesized',
        }
      : undefined,
    final_answer: data.response,
    confidence: data.confidence || (data.verification?.agrees ? 0.95 : 0.75),
    response_mode: responseMode,
    response_time_ms: data.latency_ms,
  };
}
