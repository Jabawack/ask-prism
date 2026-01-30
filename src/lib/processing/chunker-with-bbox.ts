// Enhanced chunker that preserves bounding box information

import type { ParseResult, PageResult, TextBlock, BoundingBox, ChunkWithBbox } from './types';

export interface ChunkerOptions {
  chunkSize: number;
  chunkOverlap: number;
  minChunkSize: number;
}

const DEFAULT_OPTIONS: ChunkerOptions = {
  chunkSize: 1000,
  chunkOverlap: 200,
  minChunkSize: 100,
};

/**
 * Chunk a parsed document while preserving bounding box information.
 * Each chunk will have a bbox that encompasses all its source text blocks.
 */
export function chunkWithBbox(
  parseResult: ParseResult,
  options: Partial<ChunkerOptions> = {}
): ChunkWithBbox[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: ChunkWithBbox[] = [];
  let globalChunkIndex = 0;
  let globalCharOffset = 0;

  for (const page of parseResult.pages) {
    const pageChunks = chunkPage(page, opts, globalCharOffset);

    for (const chunk of pageChunks) {
      chunks.push({
        ...chunk,
        chunkIndex: globalChunkIndex++,
      });
    }

    globalCharOffset += page.fullText.length + 2; // +2 for '\n\n' between pages
  }

  return chunks;
}

/**
 * Chunk a single page while tracking which text blocks contribute to each chunk.
 */
function chunkPage(
  page: PageResult,
  options: ChunkerOptions,
  globalCharOffset: number
): Omit<ChunkWithBbox, 'chunkIndex'>[] {
  const { chunkSize, chunkOverlap, minChunkSize } = options;

  if (page.blocks.length === 0) {
    // No blocks with bbox, fall back to text-only chunking
    return chunkTextOnly(page.fullText, page.pageNumber, globalCharOffset, options);
  }

  const chunks: Omit<ChunkWithBbox, 'chunkIndex'>[] = [];
  let currentContent = '';
  let currentBlocks: TextBlock[] = [];
  let currentStartChar = globalCharOffset;

  for (const block of page.blocks) {
    const potentialContent = currentContent + (currentContent ? ' ' : '') + block.text;

    if (potentialContent.length <= chunkSize) {
      // Add block to current chunk
      currentContent = potentialContent;
      currentBlocks.push(block);
    } else {
      // Flush current chunk if it meets minimum size
      if (currentContent.length >= minChunkSize) {
        chunks.push({
          content: currentContent.trim(),
          pageNumber: page.pageNumber,
          startChar: currentStartChar,
          endChar: currentStartChar + currentContent.length,
          bbox: mergeBboxes(currentBlocks),
        });

        // Start new chunk with overlap
        const overlapBlocks = getOverlapBlocks(currentBlocks, chunkOverlap);
        currentContent = overlapBlocks.map(b => b.text).join(' ') + ' ' + block.text;
        currentBlocks = [...overlapBlocks, block];
        currentStartChar = globalCharOffset + (page.fullText.indexOf(currentBlocks[0]?.text || '') || 0);
      } else {
        // Current chunk too small, just add the block anyway
        currentContent = potentialContent;
        currentBlocks.push(block);
      }
    }
  }

  // Flush final chunk
  if (currentContent.trim().length >= minChunkSize) {
    chunks.push({
      content: currentContent.trim(),
      pageNumber: page.pageNumber,
      startChar: currentStartChar,
      endChar: currentStartChar + currentContent.length,
      bbox: mergeBboxes(currentBlocks),
    });
  }

  return chunks;
}

/**
 * Fallback chunking for pages without block-level bbox data.
 */
function chunkTextOnly(
  text: string,
  pageNumber: number,
  globalCharOffset: number,
  options: ChunkerOptions
): Omit<ChunkWithBbox, 'chunkIndex'>[] {
  const { chunkSize, chunkOverlap, minChunkSize } = options;
  const chunks: Omit<ChunkWithBbox, 'chunkIndex'>[] = [];

  // Simple recursive splitting by separators
  const separators = ['\n\n', '\n', '. ', ' ', ''];
  const rawChunks = splitRecursive(text, separators, chunkSize, chunkOverlap);

  for (const chunk of rawChunks) {
    if (chunk.text.trim().length >= minChunkSize) {
      chunks.push({
        content: chunk.text.trim(),
        pageNumber,
        startChar: globalCharOffset + chunk.start,
        endChar: globalCharOffset + chunk.end,
        // No bbox for text-only chunks
      });
    }
  }

  return chunks;
}

interface RawChunk {
  text: string;
  start: number;
  end: number;
}

function splitRecursive(
  text: string,
  separators: string[],
  chunkSize: number,
  overlap: number,
  startOffset = 0
): RawChunk[] {
  if (text.length <= chunkSize) {
    return [{ text, start: startOffset, end: startOffset + text.length }];
  }

  const separator = separators.find(sep => text.includes(sep)) || '';
  const parts = separator ? text.split(separator) : [text];

  if (parts.length === 1 && separator !== '') {
    return splitRecursive(text, separators.slice(1), chunkSize, overlap, startOffset);
  }

  const chunks: RawChunk[] = [];
  let current = '';
  let currentStart = startOffset;
  let charPos = startOffset;

  for (let i = 0; i < parts.length; i++) {
    const part = parts[i];
    const piece = part + (i < parts.length - 1 ? separator : '');

    if (current.length + piece.length <= chunkSize) {
      if (current.length === 0) currentStart = charPos;
      current += piece;
    } else {
      if (current.length > 0) {
        chunks.push({ text: current, start: currentStart, end: charPos });
        const overlapText = current.slice(-overlap);
        current = overlapText + piece;
        currentStart = charPos - overlapText.length;
      } else {
        // Piece too big, recurse with smaller separators
        const subChunks = splitRecursive(
          piece,
          separators.slice(separators.indexOf(separator) + 1),
          chunkSize,
          overlap,
          charPos
        );
        chunks.push(...subChunks);
        current = '';
      }
    }
    charPos += piece.length;
  }

  if (current.trim().length > 0) {
    chunks.push({ text: current, start: currentStart, end: charPos });
  }

  return chunks;
}

/**
 * Merge multiple bounding boxes into one that encompasses all of them.
 */
function mergeBboxes(blocks: TextBlock[]): BoundingBox | undefined {
  const bboxes = blocks.map(b => b.bbox).filter((b): b is BoundingBox => !!b);

  if (bboxes.length === 0) return undefined;

  const minX = Math.min(...bboxes.map(b => b.x));
  const minY = Math.min(...bboxes.map(b => b.y));
  const maxX = Math.max(...bboxes.map(b => b.x + b.width));
  const maxY = Math.max(...bboxes.map(b => b.y + b.height));

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
    page: bboxes[0].page,
  };
}

/**
 * Get blocks that should be included in overlap for continuity.
 */
function getOverlapBlocks(blocks: TextBlock[], overlapSize: number): TextBlock[] {
  if (blocks.length === 0) return [];

  const result: TextBlock[] = [];
  let totalLength = 0;

  // Work backwards from the end
  for (let i = blocks.length - 1; i >= 0 && totalLength < overlapSize; i--) {
    result.unshift(blocks[i]);
    totalLength += blocks[i].text.length + 1; // +1 for space
  }

  return result;
}

/**
 * Estimate token count (rough approximation: ~4 chars per token)
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
