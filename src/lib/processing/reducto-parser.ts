// PDF parsing using Reducto API with native bounding box support
// Note: This module requires REDUCTO_API_KEY to be set

import type { ParseResult, PageResult, TextBlock, BoundingBox, ProcessingMode } from './types';

const REDUCTO_API_KEY = process.env.REDUCTO_API_KEY;

interface ReductoBlock {
  id: string;
  type: string;
  content: string;
  bbox: {
    left: number;
    top: number;
    width: number;
    height: number;
    page: number;
  };
}

interface ReductoChunk {
  content: string;
  embed_metadata?: string;
  enriched_content?: string;
  blocks: ReductoBlock[];
}

export function isReductoAvailable(): boolean {
  return !!REDUCTO_API_KEY;
}

export async function parsePdfWithReducto(
  buffer: Buffer,
  options: { agentic?: boolean } = {}
): Promise<ParseResult> {
  if (!REDUCTO_API_KEY) {
    throw new Error('REDUCTO_API_KEY not configured. Use basic mode (pdfjs-dist) instead.');
  }

  // Dynamic import to avoid issues when REDUCTO_API_KEY is not set
  const { default: Reducto } = await import('reductoai');
  const client = new Reducto({ apiKey: REDUCTO_API_KEY });

  // Upload the buffer as a file
  const uint8Array = new Uint8Array(buffer);
  const blob = new Blob([uint8Array], { type: 'application/pdf' });
  const file = new File([blob], 'document.pdf', { type: 'application/pdf' });

  // Use Reducto's upload then parse flow
  const upload = await client.upload({ file });

  if (!upload.presigned_url) {
    throw new Error('Failed to get presigned URL from Reducto upload');
  }

  // Parse with basic options - the SDK types are strict so we keep it simple
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const result = await client.parse.run({
    input: upload.presigned_url,
  } as any) as any;

  // Convert Reducto format to our standard format
  const pageMap = new Map<number, PageResult>();
  const chunks: ReductoChunk[] = result?.result?.chunks || result?.chunks || [];

  for (const chunk of chunks) {
    const blocks: ReductoBlock[] = chunk?.blocks || [];
    for (const block of blocks) {
      const pageNum = block.bbox.page;

      if (!pageMap.has(pageNum)) {
        pageMap.set(pageNum, {
          pageNumber: pageNum,
          width: 100,  // Reducto returns percentage-based coords
          height: 100,
          blocks: [],
          fullText: '',
        });
      }

      const page = pageMap.get(pageNum)!;

      // Convert Reducto bbox format to our format
      const bbox: BoundingBox = {
        x: block.bbox.left,
        y: block.bbox.top,
        width: block.bbox.width,
        height: block.bbox.height,
        page: pageNum,
      };

      const textBlock: TextBlock = {
        text: block.content,
        bbox,
        confidence: 0.95,  // Reducto generally has high confidence
      };

      page.blocks.push(textBlock);
      page.fullText += block.content + ' ';
    }
  }

  // Sort pages and build full text
  const pages = Array.from(pageMap.values())
    .sort((a, b) => a.pageNumber - b.pageNumber)
    .map(page => ({
      ...page,
      fullText: page.fullText.trim(),
    }));

  const fullText = pages.map(p => p.fullText).join('\n\n');

  const processingMode: ProcessingMode = options.agentic ? 'advanced' : 'standard';
  const pageCount = result?.result?.metadata?.page_count || result?.metadata?.page_count || pages.length;

  return {
    pages,
    fullText,
    pageCount,
    parser: 'reducto',
    processingMode,
    metadata: {
      chunksProcessed: chunks.length,
    },
  };
}
