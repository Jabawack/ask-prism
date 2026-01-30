import { NextRequest } from 'next/server';
import { getConversation, getConversationMessages, createMessage } from '@/lib/supabase/client';
import { streamWithVerification, StreamEvent as LangGraphEvent } from '@/lib/langgraph/stream-with-verification';
import { ChatMessage } from '@/lib/langgraph/types';
import { Citation, StreamEvent, ResponseMode } from '@/lib/supabase/types';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: conversationId } = await params;

  try {
    const conversation = await getConversation(conversationId);

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { content, responseMode = 'standard' } = body;

    if (!content || typeof content !== 'string') {
      return new Response(JSON.stringify({ error: 'Message content is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Validate response mode
    const validModes: ResponseMode[] = ['quick', 'standard', 'thorough'];
    const mode: ResponseMode = validModes.includes(responseMode) ? responseMode : 'standard';

    await createMessage({
      conversation_id: conversationId,
      role: 'user',
      content,
      citations: [],
    });

    const existingMessages = await getConversationMessages(conversationId, 20);
    const chatHistory: ChatMessage[] = existingMessages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));

    const startTime = Date.now();

    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          let citations: Citation[] = [];

          const eventStream = streamWithVerification({
            query: content,
            conversationId,
            documentIds: conversation.document_ids,
            chatHistory,
            responseMode: mode,
          });

          for await (const event of eventStream) {
            // Convert LangGraph events to SSE events
            const sseEvent = formatSSEEvent(convertEvent(event));
            controller.enqueue(encoder.encode(sseEvent));

            if (event.type === 'token') {
              fullResponse += (event.data as { token: string }).token;
            } else if (event.type === 'sources') {
              citations = (event.data as { citations: Citation[] }).citations;
            } else if (event.type === 'done') {
              const doneData = event.data as { response: string; citations: Citation[] };
              fullResponse = doneData.response || fullResponse;
              citations = doneData.citations || citations;
            }
          }

          const latencyMs = Date.now() - startTime;

          await createMessage({
            conversation_id: conversationId,
            role: 'assistant',
            content: fullResponse,
            citations,
            latency_ms: latencyMs,
            model_used: 'gpt-4o-mini',
          });

          const finalEvent: StreamEvent = {
            type: 'done',
            data: { latency_ms: latencyMs },
          };
          controller.enqueue(encoder.encode(formatSSEEvent(finalEvent)));

          controller.close();
        } catch (error) {
          console.error('[SSE] Stream error:', error);
          const errorEvent: StreamEvent = {
            type: 'error',
            data: {
              message: error instanceof Error ? error.message : 'Stream failed',
            },
          };
          controller.enqueue(encoder.encode(formatSSEEvent(errorEvent)));
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    console.error('[API] Message error:', error);
    return new Response(JSON.stringify({ error: 'Failed to process message' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

function formatSSEEvent(event: { type: string; data: unknown }): string {
  return `event: ${event.type}\ndata: ${JSON.stringify(event.data)}\n\n`;
}

// Convert LangGraph events to SSE events
function convertEvent(event: LangGraphEvent): StreamEvent {
  switch (event.type) {
    case 'thinking':
      return { type: 'thinking', data: event.data as { step: string } };
    case 'sources':
      return { type: 'sources', data: event.data as { citations: Citation[] } };
    case 'token':
      return { type: 'content', data: event.data as { token: string } };
    case 'verification':
      // Include verification status in thinking event
      return { type: 'thinking', data: { step: `Verification: ${(event.data as { agrees: boolean }).agrees ? 'Agreed' : 'Disagreed'}` } };
    case 'reconciliation':
      return { type: 'thinking', data: { step: `Reconciled: ${(event.data as { chosen: string }).chosen}` } };
    case 'done':
      return {
        type: 'done',
        data: {
          trace_url: undefined,
          token_usage: undefined,
          latency_ms: (event.data as { latency_ms: number }).latency_ms,
        },
      };
    case 'error':
      return { type: 'error', data: event.data as { message: string } };
    default:
      return { type: 'thinking', data: { step: 'Processing...' } };
  }
}
