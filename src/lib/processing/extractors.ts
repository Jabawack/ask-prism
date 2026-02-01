import { definePDFJSModule, extractText as unpdfExtractText, getDocumentProxy } from 'unpdf';
import { PageText } from './chunker';

// Initialize serverless PDF.js module once
let initialized = false;
async function ensureInitialized() {
  if (!initialized) {
    await definePDFJSModule(() => import('unpdf/pdfjs'));
    initialized = true;
  }
}

export type FileType = 'pdf' | 'txt' | 'docx';

export interface ExtractionResult {
  text: string;
  pages?: PageText[];
  pageCount?: number;
  metadata?: Record<string, unknown>;
}

export function detectFileType(filename: string): FileType | null {
  const ext = filename.toLowerCase().split('.').pop();
  switch (ext) {
    case 'pdf':
      return 'pdf';
    case 'txt':
      return 'txt';
    case 'docx':
      return 'docx';
    default:
      return null;
  }
}

export async function extractPdf(buffer: Buffer): Promise<ExtractionResult> {
  await ensureInitialized();

  const data = new Uint8Array(buffer);
  const pdf = await getDocumentProxy(data);

  // Get merged text
  const { text: fullText } = await unpdfExtractText(pdf, { mergePages: true });

  // Get per-page text
  const { text: pageTexts } = await unpdfExtractText(pdf, { mergePages: false });

  const pages: PageText[] = (pageTexts as string[]).map((text, index) => ({
    pageNumber: index + 1,
    text,
  }));

  return {
    text: fullText as string,
    pages,
    pageCount: pdf.numPages,
  };
}

export async function extractDocx(buffer: Buffer): Promise<ExtractionResult> {
  const mammoth = await import('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return {
    text: result.value,
    metadata: {
      messages: result.messages,
    },
  };
}

export async function extractTxt(buffer: Buffer): Promise<ExtractionResult> {
  const text = buffer.toString('utf-8');
  return { text };
}

export async function extractText(
  buffer: Buffer,
  fileType: FileType
): Promise<ExtractionResult> {
  switch (fileType) {
    case 'pdf':
      return extractPdf(buffer);
    case 'docx':
      return extractDocx(buffer);
    case 'txt':
      return extractTxt(buffer);
    default:
      throw new Error(`Unsupported file type: ${fileType}`);
  }
}
