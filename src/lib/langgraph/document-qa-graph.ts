import { StateGraph, END } from '@langchain/langgraph';
import { GraphStateAnnotation } from './state';
import type { GraphState, ChatMessage } from './types';
import { routeQuery, routeDecision } from './nodes/route-query';
import { retrieveDocuments } from './nodes/retrieve-documents';
import { rerankResults } from './nodes/rerank-results';
import { generateResponse, generateResponseStreaming } from './nodes/generate-response';
import { Citation } from '@/lib/supabase/types';

async function handleOutOfScope(state: GraphState): Promise<Partial<GraphState>> {
  return generateResponse({ ...state, intent: 'out_of_scope' });
}

function createGraph() {
  const workflow = new StateGraph(GraphStateAnnotation)
    .addNode('route_query', routeQuery)
    .addNode('retrieve_documents', retrieveDocuments)
    .addNode('rerank_results', rerankResults)
    .addNode('generate_response', generateResponse)
    .addNode('handle_out_of_scope', handleOutOfScope)
    .addEdge('__start__', 'route_query')
    .addConditionalEdges('route_query', routeDecision, {
      retrieve_documents: 'retrieve_documents',
      generate_response: 'generate_response',
      handle_out_of_scope: 'handle_out_of_scope',
    })
    .addEdge('retrieve_documents', 'rerank_results')
    .addEdge('rerank_results', 'generate_response')
    .addEdge('generate_response', END)
    .addEdge('handle_out_of_scope', END);

  return workflow.compile();
}

const compiledGraph = createGraph();

export interface InvokeOptions {
  query: string;
  conversationId: string;
  documentIds: string[];
  chatHistory?: ChatMessage[];
}

export interface InvokeResult {
  response: string;
  citations: Citation[];
  intent: string;
  modelUsed?: string;
}

export async function invokeDocumentQA(options: InvokeOptions): Promise<InvokeResult> {
  const { query, conversationId, documentIds, chatHistory = [] } = options;

  const initialState: Partial<GraphState> = {
    query,
    conversation_id: conversationId,
    document_ids: documentIds,
    chat_history: chatHistory,
    retrieved_chunks: [],
    reranked_chunks: [],
    citations: [],
    response: '',
  };

  const result = await compiledGraph.invoke(initialState);

  return {
    response: result.response,
    citations: result.citations,
    intent: result.intent,
    modelUsed: result.model_used,
  };
}

export interface StreamEvent {
  type: 'thinking' | 'sources' | 'token' | 'done';
  data: unknown;
}

export async function* streamDocumentQA(
  options: InvokeOptions
): AsyncGenerator<StreamEvent> {
  const { query, conversationId, documentIds, chatHistory = [] } = options;

  yield { type: 'thinking', data: { step: 'Analyzing query...' } };

  const routeResult = await routeQuery({
    query,
    conversation_id: conversationId,
    document_ids: documentIds,
    chat_history: chatHistory,
    intent: 'needs_retrieval',
    retrieved_chunks: [],
    reranked_chunks: [],
    response: '',
    citations: [],
  });

  const intent = routeResult.intent || 'needs_retrieval';

  let rerankedChunks: GraphState['reranked_chunks'] = [];
  let citations: Citation[] = [];

  if (intent === 'needs_retrieval') {
    yield { type: 'thinking', data: { step: 'Searching documents...' } };

    const retrieveResult = await retrieveDocuments({
      query,
      conversation_id: conversationId,
      document_ids: documentIds,
      chat_history: chatHistory,
      intent,
      retrieved_chunks: [],
      reranked_chunks: [],
      response: '',
      citations: [],
    });

    yield { type: 'thinking', data: { step: 'Ranking results...' } };

    const rerankResult = await rerankResults({
      query,
      conversation_id: conversationId,
      document_ids: documentIds,
      chat_history: chatHistory,
      intent,
      retrieved_chunks: retrieveResult.retrieved_chunks || [],
      reranked_chunks: [],
      response: '',
      citations: [],
    });

    rerankedChunks = rerankResult.reranked_chunks || [];

    citations = rerankedChunks.map((rc, idx) => ({
      document_id: rc.document.id,
      document_name: rc.document.filename,
      chunk_id: rc.chunk.id,
      chunk_index: rc.chunk.chunk_index,
      page_number: rc.chunk.page_number,
      excerpt: rc.chunk.content.slice(0, 200) + '...',
      relevance_score: rc.rerank_score || rc.similarity_score,
    }));

    if (citations.length > 0) {
      yield { type: 'sources', data: { citations } };
    }
  }

  yield { type: 'thinking', data: { step: 'Generating response...' } };

  const responseGen = generateResponseStreaming({
    query,
    conversation_id: conversationId,
    document_ids: documentIds,
    chat_history: chatHistory,
    intent,
    retrieved_chunks: [],
    reranked_chunks: rerankedChunks,
    response: '',
    citations: [],
  });

  let finalResponse = '';

  for await (const event of responseGen) {
    if (event.type === 'token') {
      yield { type: 'token', data: { token: event.content } };
      finalResponse += event.content;
    }
  }

  yield {
    type: 'done',
    data: {
      response: finalResponse,
      citations,
      intent,
      model_used: 'gpt-4o-mini',
    },
  };
}

export { GraphState, ChatMessage };
