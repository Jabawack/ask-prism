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

const POLL_INTERVAL_MS = 1500;

export function useDocumentProgress(
  documentId: string | null,
  options: UseDocumentProgressOptions = {}
): DocumentProgress {
  const { enabled = true, onComplete, onError } = options;
  const [progress, setProgress] = useState<DocumentProgress>(INITIAL_PROGRESS);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isTerminalRef = useRef(false);

  const onCompleteRef = useRef(onComplete);
  const onErrorRef = useRef(onError);

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

    const poll = async () => {
      if (isTerminalRef.current) return;

      try {
        const res = await fetch(`/api/documents/${documentId}`);
        if (!res.ok) return;

        const { document } = await res.json();
        if (!document) return;

        // Terminal: indexed
        if (document.status === 'indexed') {
          const details = {
            pageCount: document.page_count,
            chunkCount: document.chunk_count,
          };
          setProgress({
            status: 'complete',
            message: 'Ready',
            progress: 100,
            details,
            isComplete: true,
            isError: false,
          });
          isTerminalRef.current = true;
          onCompleteRef.current?.(details);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }

        // Terminal: failed
        if (document.status === 'failed') {
          const errorMsg = document.error_message || 'Processing failed';
          setProgress({
            status: 'error',
            message: `Failed: ${errorMsg}`,
            progress: 0,
            details: { error: errorMsg },
            isComplete: false,
            isError: true,
          });
          isTerminalRef.current = true;
          onErrorRef.current?.(errorMsg);
          if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
          return;
        }

        // In-progress: read processing step from metadata
        const step = document.metadata?.processing_step;
        if (step) {
          setProgress({
            status: step.type as ProcessingEventType,
            message: step.message,
            progress: step.progress ?? 0,
            details: step.details,
            isComplete: false,
            isError: false,
          });
        } else if (document.status === 'processing') {
          setProgress({
            status: 'started',
            message: 'Processing...',
            progress: 5,
            isComplete: false,
            isError: false,
          });
        }
      } catch (err) {
        console.error('[useDocumentProgress] Poll error:', err);
      }
    };

    // Initial poll immediately
    poll();

    // Then poll on interval
    pollIntervalRef.current = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [documentId, enabled]);

  return progress;
}
