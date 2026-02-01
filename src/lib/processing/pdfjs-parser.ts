// PDF parsing using unpdf (serverless-optimized)

import { definePDFJSModule, getDocumentProxy } from 'unpdf';
import type { ParseResult, PageResult, TextBlock, BoundingBox } from './types';

// Initialize serverless PDF.js module once
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await definePDFJSModule(() => import('unpdf/pdfjs'));
    initialized = true;
  }
}

export async function parsePdfWithPdfjs(buffer: Buffer): Promise<ParseResult> {
  await ensureInitialized();

  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);

  const pages: PageResult[] = [];
  let fullText = '';

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const viewport = page.getViewport({ scale: 1.0 });
    const textContent = await page.getTextContent();

    const blocks: TextBlock[] = [];
    let pageText = '';

    for (const item of textContent.items) {
      // Skip non-text items
      if (!('str' in item) || !item.str || item.str.trim() === '') continue;

      const textItem = item as {
        str: string;
        transform: number[];
        width: number;
        height: number;
      };

      // Extract position from transform matrix
      // transform = [scaleX, skewX, skewY, scaleY, translateX, translateY]
      const x = textItem.transform[4];
      const y = textItem.transform[5];
      const height = Math.abs(textItem.transform[3]) || 10; // Use scaleY as height estimate

      // Convert to percentage-based coordinates
      // PDF coordinates have origin at bottom-left, convert to top-left
      const bbox: BoundingBox = {
        x: (x / viewport.width) * 100,
        y: ((viewport.height - y - height) / viewport.height) * 100,
        width: (textItem.width / viewport.width) * 100,
        height: (height / viewport.height) * 100,
        page: pageNum,
      };

      blocks.push({
        text: textItem.str,
        bbox,
        confidence: 1.0,
      });

      pageText += textItem.str + ' ';
    }

    // Merge adjacent blocks into lines
    const mergedBlocks = mergeAdjacentBlocks(blocks);

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
 * Simple text extraction without bounding boxes (faster)
 */
export async function extractPdfText(buffer: Buffer): Promise<string> {
  await ensureInitialized();

  const { extractText } = await import('unpdf');
  const data = new Uint8Array(buffer);
  const { text } = await extractText(data, { mergePages: true });
  return text as string;
}

/**
 * Merge adjacent text blocks that are on the same line.
 */
function mergeAdjacentBlocks(blocks: TextBlock[]): TextBlock[] {
  if (blocks.length === 0) return [];

  // Sort by y position (top to bottom), then x position (left to right)
  const sorted = [...blocks].sort((a, b) => {
    const yDiff = (a.bbox?.y || 0) - (b.bbox?.y || 0);
    if (Math.abs(yDiff) > 1) return yDiff;
    return (a.bbox?.x || 0) - (b.bbox?.x || 0);
  });

  const merged: TextBlock[] = [];
  let currentLine: TextBlock[] = [];
  let currentY = sorted[0].bbox?.y || 0;

  for (const block of sorted) {
    const blockY = block.bbox?.y || 0;

    if (Math.abs(blockY - currentY) > 1.5) {
      if (currentLine.length > 0) {
        merged.push(mergeLine(currentLine));
      }
      currentLine = [block];
      currentY = blockY;
    } else {
      currentLine.push(block);
    }
  }

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

  const sorted = [...blocks].sort((a, b) => (a.bbox?.x || 0) - (b.bbox?.x || 0));
  const text = sorted.map(b => b.text).join(' ');

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
