'use client';

import { useState, useEffect, useRef } from 'react';
import type { ProcessingEvent, ProcessingEventType } from '@/lib/processing/types';

export interface DocumentProgress {
  status: ProcessingEventType | null;
  message: string;
  progress: number;
  details?: ProcessingEvent['details'];
  isComplete: boolean;
  isError: boolean;
}

interface UseDocumentProgressOptions {
  enabled?: boolean;
  onComplete?: (details?: ProcessingEvent['details']) => void;
  onError?: (error: string) => void;
}

const INITIAL_PROGRESS: DocumentProgress = {
  status: null,
  message: '',
  progress: 0,
  isComplete: false,
  isError: false,
};

export function useDocumentProgress(
  documentId: string | null,
  options: UseDocumentProgressOptions = {}
): DocumentProgress {
  const { enabled = true, onComplete, onError } = options;
  const [progress, setProgress] = useState<DocumentProgress>(INITIAL_PROGRESS);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const isTerminalRef = useRef(false);

  // Store callbacks in refs to avoid dependency issues
  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

  // Update refs in a separate effect
  useEffect(() => {
    onCompleteRef.current = onComplete;
    onErrorRef.current = onError;
  }, [onComplete, onError]);

  useEffect(() => {
    if (!documentId || !enabled) {
      setProgress(INITIAL_PROGRESS);
      isTerminalRef.current = false;
      return;
    }

    const connect = () => {
      if (isTerminalRef.current) return;

      // Clean up existing connection
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource(`/api/documents/${documentId}/progress`);
      eventSourceRef.current = eventSource;

      eventSource.onmessage = (event) => {
        try {
          const data: ProcessingEvent = JSON.parse(event.data);
          reconnectAttemptsRef.current = 0; // Reset on successful message

          const isComplete = data.type === 'complete';
          const isError = data.type === 'error';

          setProgress({
            status: data.type,
            message: data.message,
            progress: data.progress ?? 0,
            details: data.details,
            isComplete,
            isError,
          });

          if (isComplete) {
            isTerminalRef.current = true;
            onCompleteRef.current?.(data.details);
            eventSource.close();
          } else if (isError) {
            isTerminalRef.current = true;
            onErrorRef.current?.(data.details?.error ?? 'Unknown error');
            eventSource.close();
          }
        } catch (err) {
          console.error('[useDocumentProgress] Failed to parse event:', err);
        }
      };

      eventSource.onerror = () => {
        eventSource.close();

        // Attempt reconnection with exponential backoff (max 5 attempts)
        if (reconnectAttemptsRef.current < 5 && !isTerminalRef.current) {
          const delay = Math.min(1000 * Math.pow(2, reconnectAttemptsRef.current), 10000);
          reconnectAttemptsRef.current++;

          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, delay);
        }
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
    };
  }, [documentId, enabled]);

  return progress;
}
