import { Document, DocumentChunk } from '@/lib/supabase/types';
import { updateDocumentStatus, insertChunks } from '@/lib/supabase/client';
import { extractText, FileType } from './extractors';
import { chunkText, chunkWithPages, estimateTokenCount } from './chunker';
import { embedLargeBatch } from './embeddings';

export interface ProcessingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
}

const DEFAULT_OPTIONS: ProcessingOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
};

export async function processDocument(
  document: Document,
  fileBuffer: Buffer,
  options: ProcessingOptions = {}
): Promise<void> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  try {
    await updateDocumentStatus(document.id, 'processing');

    console.log(`[Processor] Extracting text from ${document.filename}`);
    const extraction = await extractText(fileBuffer, document.file_type as FileType);

    if (!extraction.text || extraction.text.trim().length === 0) {
      throw new Error('No text content extracted from document');
    }

    console.log(`[Processor] Chunking document`);
    const chunks = extraction.pages
      ? chunkWithPages(extraction.pages, {
          chunkSize: opts.chunkSize,
          chunkOverlap: opts.chunkOverlap,
        })
      : chunkText(extraction.text, {
          chunkSize: opts.chunkSize,
          chunkOverlap: opts.chunkOverlap,
        });

    if (chunks.length === 0) {
      throw new Error('No chunks generated from document');
    }

    console.log(`[Processor] Generated ${chunks.length} chunks`);

    console.log(`[Processor] Generating embeddings`);
    const chunkTexts = chunks.map((c) => c.content);
    const embeddings = await embedLargeBatch(chunkTexts, (completed, total) => {
      console.log(`[Processor] Embedded ${completed}/${total} chunks`);
    });

    const chunkRecords: Omit<DocumentChunk, 'id' | 'created_at'>[] = chunks.map(
      (chunk, index) => ({
        document_id: document.id,
        content: chunk.content,
        embedding: embeddings[index],
        chunk_index: chunk.chunk_index,
        page_number: chunk.page_number,
        token_count: estimateTokenCount(chunk.content),
        metadata: {
          start_char: chunk.start_char,
          end_char: chunk.end_char,
        },
      })
    );

    console.log(`[Processor] Inserting chunks into database`);
    await insertChunks(chunkRecords);

    await updateDocumentStatus(document.id, 'indexed', {
      page_count: extraction.pageCount || 1,
      chunk_count: chunks.length,
    });

    console.log(`[Processor] Document ${document.id} processed successfully`);
  } catch (error) {
    console.error(`[Processor] Error processing document:`, error);

    const errorMessage =
      error instanceof Error ? error.message : 'Unknown processing error';

    await updateDocumentStatus(document.id, 'failed', {
      error_message: errorMessage,
    });

    throw error;
  }
}
