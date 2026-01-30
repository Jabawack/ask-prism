// Parser factory - routes to the appropriate PDF parser based on processing mode

import type { ParseResult, ProcessingMode } from './types';
import { parsePdfWithPdfjs } from './pdfjs-parser';
import { parsePdfWithReducto, isReductoAvailable } from './reducto-parser';

export interface ParserOptions {
  mode: ProcessingMode;
  fallbackOnError?: boolean;
}

/**
 * Parse a PDF document using the specified processing mode.
 *
 * Modes:
 * - basic: pdfjs-dist (free, local, good for clean PDFs)
 * - standard: Reducto (1 credit/page, handles tables well)
 * - advanced: Reducto with agentic OCR (2 credits/page, best for scans)
 */
export async function parseDocument(
  buffer: Buffer,
  options: ParserOptions
): Promise<ParseResult> {
  const { mode, fallbackOnError = true } = options;

  try {
    switch (mode) {
      case 'basic':
        return await parsePdfWithPdfjs(buffer);

      case 'standard':
        if (!isReductoAvailable()) {
          if (fallbackOnError) {
            console.warn('[Parser] Reducto not available, falling back to pdfjs-dist');
            const result = await parsePdfWithPdfjs(buffer);
            return { ...result, processingMode: 'basic' };
          }
          throw new Error('Reducto API key not configured');
        }
        return await parsePdfWithReducto(buffer, { agentic: false });

      case 'advanced':
        if (!isReductoAvailable()) {
          if (fallbackOnError) {
            console.warn('[Parser] Reducto not available, falling back to pdfjs-dist');
            const result = await parsePdfWithPdfjs(buffer);
            return { ...result, processingMode: 'basic' };
          }
          throw new Error('Reducto API key not configured');
        }
        return await parsePdfWithReducto(buffer, { agentic: true });

      default:
        throw new Error(`Unknown processing mode: ${mode}`);
    }
  } catch (error) {
    // If Reducto fails, try falling back to pdfjs
    if (fallbackOnError && mode !== 'basic') {
      console.error('[Parser] Error with primary parser, falling back to pdfjs:', error);
      const result = await parsePdfWithPdfjs(buffer);
      return { ...result, processingMode: 'basic' };
    }
    throw error;
  }
}

/**
 * Get information about available parsing modes.
 */
export function getAvailableModes(): Array<{
  mode: ProcessingMode;
  name: string;
  description: string;
  available: boolean;
  costPerPage: string;
}> {
  const reductoAvailable = isReductoAvailable();

  return [
    {
      mode: 'basic',
      name: 'Basic',
      description: 'Free, fast processing for clean text PDFs',
      available: true,
      costPerPage: 'Free',
    },
    {
      mode: 'standard',
      name: 'Standard',
      description: 'Better handling of tables and mixed layouts',
      available: reductoAvailable,
      costPerPage: '1 credit',
    },
    {
      mode: 'advanced',
      name: 'Advanced',
      description: 'Best for scans, handwriting, and complex documents',
      available: reductoAvailable,
      costPerPage: '2 credits',
    },
  ];
}

/**
 * Recommend a processing mode based on document characteristics.
 * This is a simple heuristic - could be enhanced with ML in the future.
 */
export async function recommendMode(
  buffer: Buffer,
  filename: string
): Promise<ProcessingMode> {
  // Try basic parsing first to assess quality
  try {
    const basicResult = await parsePdfWithPdfjs(buffer);

    // Calculate some quality metrics
    const avgBlocksPerPage = basicResult.pages.reduce(
      (sum, p) => sum + p.blocks.length, 0
    ) / basicResult.pages.length;

    const textDensity = basicResult.fullText.length / basicResult.pageCount;

    // If we got very little text, document might need OCR
    if (textDensity < 100) {
      return isReductoAvailable() ? 'advanced' : 'basic';
    }

    // If we have reasonable text density, basic is probably fine
    if (avgBlocksPerPage > 10 && textDensity > 500) {
      return 'basic';
    }

    // For moderate complexity, standard mode is a good balance
    return isReductoAvailable() ? 'standard' : 'basic';
  } catch {
    // If basic parsing fails, try advanced
    return isReductoAvailable() ? 'advanced' : 'basic';
  }
}
