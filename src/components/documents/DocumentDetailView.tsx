'use client';

import { useState, useEffect, useRef, forwardRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { Document, BoundingBox } from '@/lib/supabase/types';

// Dynamic import to avoid SSR issues with pdfjs
const PDFViewer = dynamic(
  () => import('@/components/pdf/PDFViewer').then((mod) => mod.PDFViewer),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center h-full bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    ),
  }
);

interface ChunkWithoutEmbedding {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  page_number?: number;
  token_count: number;
  metadata: {
    start_char?: number;
    end_char?: number;
    section_title?: string;
    bbox?: BoundingBox;
  };
}

interface DocumentDetailViewProps {
  document: Document;
  onClose: () => void;
}

export function DocumentDetailView({ document, onClose }: DocumentDetailViewProps) {
  const [chunks, setChunks] = useState<ChunkWithoutEmbedding[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction states - separate hover from selection for focus preservation
  const [selectedChunkId, setSelectedChunkId] = useState<string | null>(null);
  const [hoveredChunkId, setHoveredChunkId] = useState<string | null>(null);

  const chunkRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  useEffect(() => {
    async function fetchChunks() {
      try {
        const res = await fetch(`/api/documents/${document.id}/chunks`);
        if (!res.ok) throw new Error('Failed to fetch chunks');
        const data = await res.json();
        setChunks(data.chunks || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load chunks');
      } finally {
        setIsLoading(false);
      }
    }
    fetchChunks();
  }, [document.id]);

  // Convert chunks to highlights with visual hierarchy
  const highlights = chunks
    .filter((c) => c.metadata?.bbox)
    .map((c) => ({
      id: c.id,
      bbox: c.metadata.bbox!,
      // Visual hierarchy: selected > hovered > default
      state: (c.id === selectedChunkId ? 'selected' : c.id === hoveredChunkId ? 'hovered' : 'default') as 'selected' | 'hovered' | 'default',
    }));

  // Bidirectional: PDF highlight click → scroll sidebar
  const handleHighlightClick = useCallback((id: string) => {
    setSelectedChunkId(id);
    const chunkEl = chunkRefs.current.get(id);
    if (chunkEl) {
      chunkEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Hover on PDF highlight → highlight corresponding chunk (no scroll)
  const handleHighlightHover = useCallback((id: string | null) => {
    setHoveredChunkId(id);
  }, []);

  // Click chunk → select and scroll PDF
  const handleChunkClick = useCallback((id: string) => {
    setSelectedChunkId(id);
  }, []);

  // Hover chunk → subtle PDF highlight (no scroll)
  const handleChunkHover = useCallback((id: string | null) => {
    setHoveredChunkId(id);
  }, []);

  const isPdf = document.file_type === 'pdf';

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Minimal header */}
      <div className="flex items-center gap-4 px-4 py-2 border-b bg-white shrink-0">
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
          title="Back to documents"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div className="min-w-0">
          <h1 className="font-medium text-gray-900 truncate">{document.filename}</h1>
          <p className="text-xs text-gray-500">
            {document.page_count} pages • {chunks.length} chunks
          </p>
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 overflow-hidden flex">
        {isLoading ? (
          <LoadingState />
        ) : error ? (
          <ErrorState message={error} />
        ) : (
          <>
            {/* Sidebar: Chunk list with scroll spy */}
            <aside className="w-80 border-r flex flex-col bg-gray-50 shrink-0">
              <div className="px-3 py-2 border-b bg-white text-xs font-medium text-gray-500 uppercase tracking-wide">
                Extracted Chunks
              </div>
              <div className="flex-1 overflow-y-auto">
                {chunks.map((chunk) => (
                  <ChunkItem
                    key={chunk.id}
                    ref={(el) => {
                      if (el) chunkRefs.current.set(chunk.id, el);
                    }}
                    chunk={chunk}
                    isSelected={chunk.id === selectedChunkId}
                    isHovered={chunk.id === hoveredChunkId}
                    onClick={() => handleChunkClick(chunk.id)}
                    onMouseEnter={() => handleChunkHover(chunk.id)}
                    onMouseLeave={() => handleChunkHover(null)}
                  />
                ))}
              </div>
            </aside>

            {/* Main: PDF viewer */}
            {isPdf && (
              <main className="flex-1 min-w-0">
                <PDFViewer
                  url={document.storage_url}
                  highlights={highlights}
                  activeHighlightId={selectedChunkId}
                  hoveredHighlightId={hoveredChunkId}
                  onHighlightClick={handleHighlightClick}
                  onHighlightHover={handleHighlightHover}
                />
              </main>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// Chunk item with hover preview tooltip
interface ChunkItemProps {
  chunk: ChunkWithoutEmbedding;
  isSelected: boolean;
  isHovered: boolean;
  onClick: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

const ChunkItem = forwardRef<HTMLDivElement, ChunkItemProps>(
  function ChunkItem({ chunk, isSelected, isHovered, onClick, onMouseEnter, onMouseLeave }, ref) {
    const hasBbox = !!chunk.metadata?.bbox;
    const pageNum = chunk.page_number;

    return (
      <div
        ref={ref}
        onClick={onClick}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        className={`
          px-3 py-2 border-b border-gray-100 cursor-pointer transition-colors
          ${isSelected
            ? 'bg-yellow-100 border-l-4 border-l-yellow-500'
            : isHovered
            ? 'bg-yellow-50 border-l-4 border-l-yellow-300'
            : 'hover:bg-gray-100 border-l-4 border-l-transparent'
          }
        `}
      >
        {/* Header row */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-mono text-gray-400">#{chunk.chunk_index + 1}</span>
            {pageNum && (
              <span className="text-gray-500">p.{pageNum}</span>
            )}
          </div>
          {hasBbox && (
            <span className="text-xs text-blue-500" title="Click to highlight in PDF">
              View
            </span>
          )}
        </div>

        {/* Content preview */}
        <p className="text-sm text-gray-700 line-clamp-2 leading-snug">
          {chunk.content}
        </p>
      </div>
    );
  }
);

function LoadingState() {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2" />
        <p className="text-sm text-gray-500">Loading chunks...</p>
      </div>
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex items-center justify-center w-full">
      <div className="text-center">
        <p className="text-red-600 mb-2">{message}</p>
        <p className="text-sm text-gray-500">Try refreshing the page</p>
      </div>
    </div>
  );
}
