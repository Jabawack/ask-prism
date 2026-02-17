// Enhanced document processor with dual parser support and bounding boxes

import { Document, DocumentChunk, BoundingBox } from '@/lib/supabase/types';
import { updateDocumentStatus, updateProcessingStep, insertChunks } from '@/lib/supabase/client';
import { parseDocument, getAvailableModes } from './parser-factory';
import { chunkWithBbox, estimateTokenCount } from './chunker-with-bbox';
import { embedLargeBatch } from './embeddings';
import { processingEventBus } from './event-bus';
import type { ProcessingMode, ParseResult, ProcessingEvent } from './types';

import type { ChunkingStrategy } from './chunker-with-bbox';

export interface ProcessingOptions {
  mode?: ProcessingMode;
  chunkStrategy?: ChunkingStrategy;
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  mode: 'basic',
  chunkStrategy: 'per-block',  // Precise bbox per text block
  chunkSize: 1000,
  chunkOverlap: 200,
};

// Steps that should be persisted to DB for serverless progress tracking
const DB_PERSISTED_STEPS = new Set<ProcessingEvent['type']>([
  'started', 'parsing', 'chunking', 'embedding', 'storing', 'complete', 'error',
]);

/**
 * Helper to emit progress events.
 * Emits to in-memory bus (works in dev) and persists major steps to DB (works on Vercel).
 */
async function emitProgress(
  documentId: string,
  type: ProcessingEvent['type'],
  message: string,
  progress?: number,
  details?: ProcessingEvent['details']
): Promise<void> {
  processingEventBus.emitProgress(documentId, {
    type,
    documentId,
    timestamp: Date.now(),
    message,
    progress,
    details,
  });

  // Persist major steps to DB so polling-based clients can track progress
  if (DB_PERSISTED_STEPS.has(type)) {
    try {
      await updateProcessingStep(documentId, {
        type,
        message,
        progress: progress ?? 0,
        details: details as Record<string, unknown>,
      });
    } catch (err) {
      console.error('[ProcessorV2] Failed to persist processing step:', err);
    }
  }
}

export interface ProcessingResult {
  success: boolean;
  parseResult?: ParseResult;
  chunkCount: number;
  actualMode: ProcessingMode;
  error?: string;
}

/**
 * Process a document with the specified processing mode.
 * Supports bbox extraction for visual citations.
 */
export async function processDocumentV2(
  document: Document,
  fileBuffer: Buffer,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    await updateDocumentStatus(document.id, 'processing');
    await emitProgress(document.id, 'started', 'Starting document processing...', 0);

    // Parse the document
    console.log(`[ProcessorV2] Parsing ${document.filename} with mode: ${opts.mode}`);
    await emitProgress(document.id, 'parsing', 'Parsing PDF...', 10);

    const parseResult = await parseDocument(fileBuffer, {
      mode: opts.mode!,
      fallbackOnError: true,
    });

    if (!parseResult.fullText || parseResult.fullText.trim().length === 0) {
      throw new Error('No text content extracted from document');
    }

    console.log(`[ProcessorV2] Extracted ${parseResult.pageCount} pages, ${parseResult.fullText.length} chars`);
    console.log(`[ProcessorV2] Actual parser used: ${parseResult.parser}`);
    emitProgress(document.id, 'parsing_complete', `Parsed ${parseResult.pageCount} pages`, 20, {
      pageCount: parseResult.pageCount,
    });

    // Chunk with bounding boxes
    console.log(`[ProcessorV2] Chunking document with strategy: ${opts.chunkStrategy}`);
    await emitProgress(document.id, 'chunking', 'Creating chunks...', 30);

    const chunks = chunkWithBbox(parseResult, {
      strategy: opts.chunkStrategy,
      chunkSize: opts.chunkSize,
      chunkOverlap: opts.chunkOverlap,
    });

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document');
    }

    console.log(`[ProcessorV2] Generated ${chunks.length} chunks`);
    emitProgress(document.id, 'chunking_complete', `Created ${chunks.length} chunks`, 40, {
      chunkCount: chunks.length,
    });

    // Generate embeddings
    console.log(`[ProcessorV2] Generating embeddings`);
    await emitProgress(document.id, 'embedding', 'Generating embeddings...', 40);

    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await embedLargeBatch(chunkTexts, (completed, total) => {
      console.log(`[ProcessorV2] Embedded ${completed}/${total} chunks`);
      // Map embedding progress from 40% to 90%
      const embeddingProgress = 40 + Math.round((completed / total) * 50);
      emitProgress(
        document.id,
        'embedding_progress',
        `Embedding chunks (${completed}/${total})...`,
        embeddingProgress,
        { embeddedCount: completed, totalChunks: total }
      );
    });

    // Prepare chunk records with bbox
    const chunkRecords: Omit<DocumentChunk, 'id' | 'created_at'>[] = chunks.map(
      (chunk, index) => {
        const metadata: {
          start_char: number;
          end_char: number;
          bbox?: BoundingBox;
        } = {
          start_char: chunk.startChar,
          end_char: chunk.endChar,
        };

        if (chunk.bbox) {
          metadata.bbox = {
            x: Math.round(chunk.bbox.x * 100) / 100,
            y: Math.round(chunk.bbox.y * 100) / 100,
            width: Math.round(chunk.bbox.width * 100) / 100,
            height: Math.round(chunk.bbox.height * 100) / 100,
            page: chunk.bbox.page,
          };
        }

        return {
          document_id: document.id,
          content: chunk.content,
          embedding: embeddings[index],
          chunk_index: chunk.chunkIndex,
          page_number: chunk.pageNumber,
          token_count: estimateTokenCount(chunk.content),
          metadata,
        };
      }
    );

    // Insert chunks
    console.log(`[ProcessorV2] Inserting chunks into database`);
    await emitProgress(document.id, 'storing', 'Saving to database...', 95);
    await insertChunks(chunkRecords);

    // Update document status with parse info
    await updateDocumentStatus(document.id, 'indexed', {
      page_count: parseResult.pageCount,
      chunk_count: chunks.length,
      // Store processing metadata
      metadata: {
        processing_mode: parseResult.processingMode,
        parser_used: parseResult.parser,
        processed_at: new Date().toISOString(),
      },
    });

    console.log(`[ProcessorV2] Document ${document.id} processed successfully`);
    emitProgress(document.id, 'complete', 'Ready', 100, {
      pageCount: parseResult.pageCount,
      chunkCount: chunks.length,
    });

    return {
      success: true,
      parseResult,
      chunkCount: chunks.length,
      actualMode: parseResult.processingMode,
    };
  } catch (error) {
    console.error(`[ProcessorV2] Error processing document:`, error);

    const errorMessage = error instanceof Error ? error.message : 'Unknown processing error';

    await updateDocumentStatus(document.id, 'failed', {
      error_message: errorMessage,
    });

    emitProgress(document.id, 'error', `Failed: ${errorMessage}`, undefined, {
      error: errorMessage,
    });

    return {
      success: false,
      chunkCount: 0,
      actualMode: opts.mode!,
      error: errorMessage,
    };
  }
}


/**
 * Get available processing modes and their status.
 */
export function getProcessingModes() {
  return getAvailableModes();
}

/**
 * Re-export types for convenience
 */
export type { ProcessingMode, ParseResult, BoundingBox } from './types';
