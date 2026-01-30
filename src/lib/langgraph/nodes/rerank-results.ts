import { ChatOpenAI } from '@langchain/openai';
import type { GraphState, RetrievedChunk } from '../types';

const rerankModel = new ChatOpenAI({
  modelName: 'gpt-4o-mini',
  temperature: 0,
});

const RERANK_LIMIT = 5;

const RERANK_PROMPT = `You are a relevance scorer. Given a query and a text chunk, rate how relevant the chunk is to answering the query.

Score from 0 to 10:
- 10: Directly answers the query with specific information
- 7-9: Contains highly relevant information
- 4-6: Somewhat relevant, provides context
- 1-3: Marginally relevant
- 0: Not relevant at all

Respond with ONLY a number from 0 to 10.`;

export async function rerankResults(state: GraphState): Promise<Partial<GraphState>> {
  const { query, retrieved_chunks } = state;

  if (retrieved_chunks.length === 0) {
    return { reranked_chunks: [] };
  }

  if (retrieved_chunks.length <= RERANK_LIMIT) {
    return { reranked_chunks: retrieved_chunks };
  }

  const scoredChunks = await Promise.all(
    retrieved_chunks.map(async (chunk) => {
      const score = await scoreChunk(query, chunk.chunk.content);
      return { ...chunk, rerank_score: score };
    })
  );

  const reranked = scoredChunks
    .sort((a, b) => (b.rerank_score || 0) - (a.rerank_score || 0))
    .slice(0, RERANK_LIMIT);

  return { reranked_chunks: reranked };
}

async function scoreChunk(query: string, content: string): Promise<number> {
  try {
    const truncatedContent = content.slice(0, 500);

    const response = await rerankModel.invoke([
      { role: 'system', content: RERANK_PROMPT },
      { role: 'user', content: `Query: ${query}\n\nChunk: ${truncatedContent}` },
    ]);

    const score = parseInt((response.content as string).trim(), 10);
    return isNaN(score) ? 5 : Math.min(10, Math.max(0, score));
  } catch {
    return 5;
  }
}
