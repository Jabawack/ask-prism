// Processing types for the dual parser architecture

export type ProcessingMode = 'basic' | 'standard' | 'advanced';

export interface BoundingBox {
  x: number;      // % from left edge (0-100)
  y: number;      // % from top edge (0-100)
  width: number;  // % of page width
  height: number; // % of page height
  page: number;   // 1-indexed page number
}

export interface TextBlock {
  text: string;
  bbox?: BoundingBox;
  confidence?: number;
}

export interface PageResult {
  pageNumber: number;
  width: number;   // Original page width in points
  height: number;  // Original page height in points
  blocks: TextBlock[];
  fullText: string;
}

export interface ParseResult {
  pages: PageResult[];
  fullText: string;
  pageCount: number;
  metadata?: Record<string, unknown>;
  parser: 'pdfjs' | 'reducto';
  processingMode: ProcessingMode;
}

export interface ChunkWithBbox {
  content: string;
  chunkIndex: number;
  pageNumber?: number;
  startChar: number;
  endChar: number;
  bbox?: BoundingBox;
}

export interface ParseComparison {
  agreementScore: number;  // 0-1, how similar the parses are
  differences: ParseDifference[];
  recommendation: 'use_basic' | 'use_standard' | 'needs_review';
}

export interface ParseDifference {
  type: 'missing_text' | 'extra_text' | 'different_value' | 'formatting';
  page: number;
  description: string;
  parserA?: string;
  parserB?: string;
  bbox?: BoundingBox;
}
