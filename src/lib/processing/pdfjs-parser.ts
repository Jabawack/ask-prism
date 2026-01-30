// PDF parsing using pdfjs-dist with manual bounding box extraction

import type { ParseResult, PageResult, TextBlock, BoundingBox } from './types';

interface TextItem {
  str: string;
  transform: number[];  // [scaleX, skewX, skewY, scaleY, translateX, translateY]
  width: number;
  height: number;
  dir: string;
  fontName: string;
}

interface TextContent {
  items: (TextItem | { type: string })[];
  styles: Record<string, unknown>;
}

export async function parsePdfWithPdfjs(buffer: Buffer): Promise<ParseResult> {
  // Dynamic import to avoid SSR issues
  const pdfjs = await import('pdfjs-dist');

  // Set up the worker - use bundled version for server-side
  if (typeof window === 'undefined') {
    // Server-side: disable worker
    pdfjs.GlobalWorkerOptions.workerSrc = '';
  }

  const data = new Uint8Array(buffer);
  const loadingTask = pdfjs.getDocument({ data, useWorkerFetch: false, isEvalSupported: false });
  const pdf = await loadingTask.promise;

  const pages: PageResult[] = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent() as TextContent;

    const blocks: TextBlock[] = [];
    let pageText = '';

    for (const item of textContent.items) {
      // Skip non-text items (like marked content)
      if ('type' in item) continue;

      const textItem = item as TextItem;
      if (!textItem.str || textItem.str.trim() === '') continue;

      // Extract position from transform matrix
      // transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const x = textItem.transform[4];
      const y = textItem.transform[5];

      // Convert to percentage-based coordinates
      // Note: PDF coordinates have origin at bottom-left, we need top-left
      const bbox: BoundingBox = {
        x: (x / viewport.width) * 100,
        y: ((viewport.height - y - textItem.height) / viewport.height) * 100,
        width: (textItem.width / viewport.width) * 100,
        height: (textItem.height / viewport.height) * 100,
        page: pageNum,
      };

      blocks.push({
        text: textItem.str,
        bbox,
        confidence: 1.0, // pdfjs-dist doesn't provide confidence scores
      });

      pageText += textItem.str + ' ';
    }

    // Merge adjacent blocks into lines for better readability
    const mergedBlocks = mergeAdjacentBlocks(blocks, viewport.height);

    pages.push({
      pageNumber: pageNum,
      width: viewport.width,
      height: viewport.height,
      blocks: mergedBlocks,
      fullText: pageText.trim(),
    });

    fullText += pageText.trim() + '\n\n';
  }

  return {
    pages,
    fullText: fullText.trim(),
    pageCount: pdf.numPages,
    parser: 'pdfjs',
    processingMode: 'basic',
  };
}

/**
 * Merge adjacent text blocks that are on the same line into single blocks.
 * This creates more meaningful chunks with better bounding boxes.
 */
function mergeAdjacentBlocks(blocks: TextBlock[], pageHeight: number): TextBlock[] {
  if (blocks.length === 0) return [];

  // Sort blocks by y position (top to bottom), then x position (left to right)
  const sorted = [...blocks].sort((a, b) => {
    const yDiff = (a.bbox?.y || 0) - (b.bbox?.y || 0);
    if (Math.abs(yDiff) > 1) return yDiff; // Different lines
    return (a.bbox?.x || 0) - (b.bbox?.x || 0); // Same line, sort by x
  });

  const merged: TextBlock[] = [];
  let currentLine: TextBlock[] = [];
  let currentY = sorted[0].bbox?.y || 0;

  for (const block of sorted) {
    const blockY = block.bbox?.y || 0;

    // Check if this block is on a new line (more than 1.5% height difference)
    if (Math.abs(blockY - currentY) > 1.5) {
      // Flush current line
      if (currentLine.length > 0) {
        merged.push(mergeLine(currentLine));
      }
      currentLine = [block];
      currentY = blockY;
    } else {
      currentLine.push(block);
    }
  }

  // Flush final line
  if (currentLine.length > 0) {
    merged.push(mergeLine(currentLine));
  }

  return merged;
}

/**
 * Merge multiple text blocks on the same line into a single block.
 */
function mergeLine(blocks: TextBlock[]): TextBlock {
  if (blocks.length === 1) return blocks[0];

  // Sort by x position
  const sorted = [...blocks].sort((a, b) => (a.bbox?.x || 0) - (b.bbox?.x || 0));

  // Combine text with spaces
  const text = sorted.map(b => b.text).join(' ');

  // Calculate merged bounding box
  const firstBbox = sorted[0].bbox;
  const lastBbox = sorted[sorted.length - 1].bbox;

  if (!firstBbox || !lastBbox) {
    return { text, confidence: 1.0 };
  }

  const minY = Math.min(...sorted.map(b => b.bbox?.y || 0));
  const maxY = Math.max(...sorted.map(b => (b.bbox?.y || 0) + (b.bbox?.height || 0)));

  const bbox: BoundingBox = {
    x: firstBbox.x,
    y: minY,
    width: (lastBbox.x + lastBbox.width) - firstBbox.x,
    height: maxY - minY,
    page: firstBbox.page,
  };

  return { text, bbox, confidence: 1.0 };
}
