// Recursive text splitter for document chunking

export interface ChunkResult {
  content: string;
  chunk_index: number;
  page_number?: number;
  start_char: number;
  end_char: number;
}

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

const SEPARATORS = [
  '\n\n\n',
  '\n\n',
  '\n',
  '. ',
  '? ',
  '! ',
  '; ',
  ', ',
  ' ',
  '',
];

export function chunkText(
  text: string,
  options: Partial<ChunkerOptions> = {}
): ChunkResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: ChunkResult[] = [];
  const rawChunks = recursiveSplit(text, SEPARATORS, opts);

  let chunkIndex = 0;
  for (const chunk of rawChunks) {
    if (chunk.content.trim().length >= opts.minChunkSize) {
      chunks.push({
        content: chunk.content.trim(),
        chunk_index: chunkIndex++,
        start_char: chunk.startChar,
        end_char: chunk.endChar,
      });
    }
  }

  return chunks;
}

interface RawChunk {
  content: string;
  startChar: number;
  endChar: number;
}

function recursiveSplit(
  text: string,
  separators: string[],
  options: ChunkerOptions,
  startOffset: number = 0
): RawChunk[] {
  const { chunkSize, chunkOverlap } = options;

  if (text.length <= chunkSize) {
    return [{
      content: text,
      startChar: startOffset,
      endChar: startOffset + text.length,
    }];
  }

  const separator = separators.find((sep) => text.includes(sep)) || '';
  const splits = separator ? text.split(separator) : [text];

  if (splits.length === 1 && separator !== '') {
    return recursiveSplit(text, separators.slice(1), options, startOffset);
  }

  const chunks: RawChunk[] = [];
  let currentChunk = '';
  let currentStart = startOffset;
  let charOffset = startOffset;

  for (let i = 0; i < splits.length; i++) {
    const split = splits[i];
    const piece = split + (i < splits.length - 1 ? separator : '');

    if (currentChunk.length + piece.length <= chunkSize) {
      if (currentChunk.length === 0) {
        currentStart = charOffset;
      }
      currentChunk += piece;
    } else {
      if (currentChunk.length > 0) {
        chunks.push({
          content: currentChunk,
          startChar: currentStart,
          endChar: currentStart + currentChunk.length,
        });

        const overlapText = getOverlapText(currentChunk, chunkOverlap);
        currentChunk = overlapText + piece;
        currentStart = charOffset - overlapText.length;
      } else {
        const subChunks = recursiveSplit(
          piece,
          separators.slice(separators.indexOf(separator) + 1),
          options,
          charOffset
        );
        chunks.push(...subChunks);
        currentChunk = '';
      }
    }

    charOffset += piece.length;
  }

  if (currentChunk.trim().length > 0) {
    chunks.push({
      content: currentChunk,
      startChar: currentStart,
      endChar: currentStart + currentChunk.length,
    });
  }

  return chunks;
}

function getOverlapText(text: string, overlapSize: number): string {
  if (text.length <= overlapSize) {
    return text;
  }

  const tail = text.slice(-overlapSize);
  const spaceIndex = tail.indexOf(' ');

  if (spaceIndex > 0 && spaceIndex < overlapSize / 2) {
    return tail.slice(spaceIndex + 1);
  }

  return tail;
}

export interface PageText {
  pageNumber: number;
  text: string;
}

export function chunkWithPages(
  pages: PageText[],
  options: Partial<ChunkerOptions> = {}
): ChunkResult[] {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const chunks: ChunkResult[] = [];

  let globalCharOffset = 0;
  let chunkIndex = 0;

  for (const page of pages) {
    const pageChunks = chunkText(page.text, opts);

    for (const chunk of pageChunks) {
      chunks.push({
        content: chunk.content,
        chunk_index: chunkIndex++,
        page_number: page.pageNumber,
        start_char: globalCharOffset + chunk.start_char,
        end_char: globalCharOffset + chunk.end_char,
      });
    }

    globalCharOffset += page.text.length;
  }

  return chunks;
}

export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / 4);
}
