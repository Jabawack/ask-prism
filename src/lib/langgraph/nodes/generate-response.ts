import { ChatOpenAI } from '@langchain/openai';
import type { GraphState } from '../types';
import { Citation } from '@/lib/supabase/types';

const responseModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0.7,
  streaming: true,
});

const QA_SYSTEM_PROMPT = `You are a helpful assistant that answers questions based on the provided document excerpts.

Guidelines:
- Answer based ONLY on the provided context
- If the context doesn't contain the answer, say so clearly
- Cite your sources by referencing the chunk numbers in brackets like [1], [2]
- Be concise but thorough
- Maintain a professional tone`;

const CONVERSATIONAL_PROMPT = `You are a helpful assistant. The user is having a casual conversation or asking a follow-up question.
Be friendly and helpful. If they're asking for clarification about a previous response, do your best to help.`;

const OUT_OF_SCOPE_PROMPT = `You are a document Q&A assistant. The user asked something outside your scope.
Politely explain that you can only answer questions about the uploaded documents.
Suggest they ask a question related to their documents instead.`;

export async function generateResponse(state: GraphState): Promise<Partial<GraphState>> {
  const { query, intent, reranked_chunks, chat_history } = state;

  let systemPrompt: string;
  let userPrompt: string;
  const citations: Citation[] = [];

  if (intent === 'out_of_scope') {
    systemPrompt = OUT_OF_SCOPE_PROMPT;
    userPrompt = query;
  } else if (intent === 'conversational') {
    systemPrompt = CONVERSATIONAL_PROMPT;
    const historyContext = chat_history
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    userPrompt = historyContext ? `${historyContext}\n\nuser: ${query}` : query;
  } else {
    systemPrompt = QA_SYSTEM_PROMPT;

    if (reranked_chunks.length === 0) {
      userPrompt = `Question: ${query}\n\nNo relevant document excerpts were found. Please let the user know.`;
    } else {
      const contextParts = reranked_chunks.map((rc, idx) => {
        citations.push({
          document_id: rc.document.id,
          document_name: rc.document.filename,
          chunk_id: rc.chunk.id,
          chunk_index: rc.chunk.chunk_index,
          page_number: rc.chunk.page_number,
          excerpt: rc.chunk.content.slice(0, 200) + '...',
          relevance_score: rc.rerank_score || rc.similarity_score,
        });

        return `[${idx + 1}] (${rc.document.filename}${rc.chunk.page_number ? `, p.${rc.chunk.page_number}` : ''}):\n${rc.chunk.content}`;
      });

      userPrompt = `Context:\n${contextParts.join('\n\n')}\n\nQuestion: ${query}`;
    }
  }

  const response = await responseModel.invoke([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  return {
    response: response.content as string,
    citations,
    model_used: 'gpt-4o-mini',
  };
}

export async function* generateResponseStreaming(
  state: GraphState
): AsyncGenerator<{ type: 'token' | 'done'; content: string }, Partial<GraphState>> {
  const { query, intent, reranked_chunks, chat_history } = state;

  let systemPrompt: string;
  let userPrompt: string;
  const citations: Citation[] = [];

  if (intent === 'out_of_scope') {
    systemPrompt = OUT_OF_SCOPE_PROMPT;
    userPrompt = query;
  } else if (intent === 'conversational') {
    systemPrompt = CONVERSATIONAL_PROMPT;
    const historyContext = chat_history
      .slice(-6)
      .map((m) => `${m.role}: ${m.content}`)
      .join('\n');
    userPrompt = historyContext ? `${historyContext}\n\nuser: ${query}` : query;
  } else {
    systemPrompt = QA_SYSTEM_PROMPT;

    if (reranked_chunks.length === 0) {
      userPrompt = `Question: ${query}\n\nNo relevant document excerpts were found. Please let the user know.`;
    } else {
      const contextParts = reranked_chunks.map((rc, idx) => {
        citations.push({
          document_id: rc.document.id,
          document_name: rc.document.filename,
          chunk_id: rc.chunk.id,
          chunk_index: rc.chunk.chunk_index,
          page_number: rc.chunk.page_number,
          excerpt: rc.chunk.content.slice(0, 200) + '...',
          relevance_score: rc.rerank_score || rc.similarity_score,
        });

        return `[${idx + 1}] (${rc.document.filename}${rc.chunk.page_number ? `, p.${rc.chunk.page_number}` : ''}):\n${rc.chunk.content}`;
      });

      userPrompt = `Context:\n${contextParts.join('\n\n')}\n\nQuestion: ${query}`;
    }
  }

  let fullResponse = '';

  const stream = await responseModel.stream([
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userPrompt },
  ]);

  for await (const chunk of stream) {
    const token = chunk.content as string;
    if (token) {
      fullResponse += token;
      yield { type: 'token', content: token };
    }
  }

  yield { type: 'done', content: fullResponse };

  return {
    response: fullResponse,
    citations,
    model_used: 'gpt-4o-mini',
  };
}
