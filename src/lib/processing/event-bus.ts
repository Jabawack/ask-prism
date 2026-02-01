// Event bus for document processing progress
// Singleton EventEmitter for processor → SSE communication
// Uses globalThis to persist across Next.js module reloads in dev

import { EventEmitter } from 'events';
import type { ProcessingEvent } from './types';

const GLOBAL_KEY = '__processingEventBus__';

class ProcessingEventBus extends EventEmitter {
  private static instance: ProcessingEventBus;

  private constructor() {
    super();
    this.setMaxListeners(100);
  }

  static getInstance(): ProcessingEventBus {
    // Use globalThis to persist across Next.js module reloads
    if (!(globalThis as Record<string, unknown>)[GLOBAL_KEY]) {
      (globalThis as Record<string, unknown>)[GLOBAL_KEY] = new ProcessingEventBus();
    }
    return (globalThis as Record<string, unknown>)[GLOBAL_KEY] as ProcessingEventBus;
  }

  emitProgress(documentId: string, event: ProcessingEvent): void {
    this.emit(`progress:${documentId}`, event);
  }

  onProgress(
    documentId: string,
    callback: (event: ProcessingEvent) => void
  ): () => void {
    const eventName = `progress:${documentId}`;
    this.on(eventName, callback);
    return () => this.off(eventName, callback);
  }
}

export const processingEventBus = ProcessingEventBus.getInstance();
