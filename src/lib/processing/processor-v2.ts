// Enhanced document processor with dual parser support and bounding boxes

import { Document, DocumentChunk, BoundingBox } from '@/lib/supabase/types';
import { updateDocumentStatus, insertChunks } from '@/lib/supabase/client';
import { parseDocument, getAvailableModes } from './parser-factory';
import { chunkWithBbox, estimateTokenCount } from './chunker-with-bbox';
import { embedLargeBatch } from './embeddings';
import type { ProcessingMode, ParseResult } from './types';

export interface ProcessingOptions {
  mode?: ProcessingMode;
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  mode: 'basic',
  chunkSize: 1000,
  chunkOverlap: 200,
};

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

    // Parse the document
    console.log(`[ProcessorV2] Parsing ${document.filename} with mode: ${opts.mode}`);
    const parseResult = await parseDocument(fileBuffer, {
      mode: opts.mode!,
      fallbackOnError: true,
    });

    if (!parseResult.fullText || parseResult.fullText.trim().length === 0) {
      throw new Error('No text content extracted from document');
    }

    console.log(`[ProcessorV2] Extracted ${parseResult.pageCount} pages, ${parseResult.fullText.length} chars`);
    console.log(`[ProcessorV2] Actual parser used: ${parseResult.parser}`);

    // Chunk with bounding boxes
    console.log(`[ProcessorV2] Chunking document with bbox preservation`);
    const chunks = chunkWithBbox(parseResult, {
      chunkSize: opts.chunkSize,
      chunkOverlap: opts.chunkOverlap,
    });

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document');
    }

    console.log(`[ProcessorV2] Generated ${chunks.length} chunks`);

    // Generate embeddings
    console.log(`[ProcessorV2] Generating embeddings`);
    const chunkTexts = chunks.map(c => c.content);
    const embeddings = await embedLargeBatch(chunkTexts, (completed, total) => {
      console.log(`[ProcessorV2] Embedded ${completed}/${total} chunks`);
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
