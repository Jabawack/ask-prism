// SSE endpoint for document processing progress
import { NextRequest } from 'next/server';
import { processingEventBus } from '@/lib/processing/event-bus';
import type { ProcessingEvent } from '@/lib/processing/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: documentId } = await params;

  // Create a ReadableStream for SSE
  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      // Helper to send SSE formatted data
      const sendEvent = (event: ProcessingEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      // Send initial connection event
      sendEvent({
        type: 'started',
        documentId,
        timestamp: Date.now(),
        message: 'Connected to progress stream',
        progress: 0,
      });

      // Subscribe to progress events for this document
      const unsubscribe = processingEventBus.onProgress(documentId, (event) => {
        sendEvent(event);

        // Close the stream when processing is complete or errors
        if (event.type === 'complete' || event.type === 'error') {
          // Give client time to receive final event
          setTimeout(() => {
            try {
              controller.close();
            } catch {
              // Stream may already be closed
            }
          }, 100);
        }
      });

      // Handle client disconnect
      request.signal.addEventListener('abort', () => {
        unsubscribe();
        try {
          controller.close();
        } catch {
          // Stream may already be closed
        }
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // Disable nginx buffering
    },
  });
}
