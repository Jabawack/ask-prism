import { PageText } from './chunker';

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
  const { extractText, getDocumentProxy } = await import('unpdf');

  const pdf = await getDocumentProxy(new Uint8Array(buffer));
  const { text: fullText, totalPages } = await extractText(pdf, { mergePages: true });

  // Extract text per page for better citations
  const pages: PageText[] = [];
  for (let i = 1; i <= totalPages; i++) {
    const pageResult = await extractText(pdf, { mergePages: false });
    if (pageResult.text && Array.isArray(pageResult.text)) {
      pages.push({
        pageNumber: i,
        text: pageResult.text[i - 1] || '',
      });
    }
  }

  // If per-page extraction didn't work, use full text
  if (pages.length === 0 || pages.every(p => !p.text)) {
    pages.push({ pageNumber: 1, text: fullText as string });
  }

  return {
    text: fullText as string,
    pages,
    pageCount: totalPages,
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
