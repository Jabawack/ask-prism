'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { BoundingBox } from '@/lib/supabase/types';

// Configure the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

interface Highlight {
  id: string;
  bbox: BoundingBox;
  color?: string;
}

interface PDFViewerProps {
  url: string;
  highlights?: Highlight[];
  activeHighlightId?: string | null;
  onHighlightClick?: (id: string) => void;
  className?: string;
}

export function PDFViewer({
  url,
  highlights = [],
  activeHighlightId,
  onHighlightClick,
  className = '',
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF');
    setIsLoading(false);
  }, []);

  // Scroll to highlight when activeHighlightId changes
  useEffect(() => {
    if (!activeHighlightId) return;

    const highlight = highlights.find(h => h.id === activeHighlightId);
    if (!highlight) return;

    const pageRef = pageRefs.current.get(highlight.bbox.page);
    if (pageRef) {
      pageRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setCurrentPage(highlight.bbox.page);
    }
  }, [activeHighlightId, highlights]);

  // Get highlights for a specific page
  const getPageHighlights = (pageNumber: number) => {
    return highlights.filter(h => h.bbox.page === pageNumber);
  };

  const handleZoomIn = () => setScale(s => Math.min(s + 0.25, 3));
  const handleZoomOut = () => setScale(s => Math.max(s - 0.25, 0.5));
  const handleZoomReset = () => setScale(1.0);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= numPages) {
      setCurrentPage(page);
      const pageRef = pageRefs.current.get(page);
      if (pageRef) {
        pageRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-100 border-b px-4 py-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-1 hover:bg-gray-200 rounded"
            title="Zoom out"
          >
            ➖
          </button>
          <span className="text-sm text-gray-600 min-w-[50px] text-center">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="p-1 hover:bg-gray-200 rounded"
            title="Zoom in"
          >
            ➕
          </button>
          <button
            onClick={handleZoomReset}
            className="p-1 hover:bg-gray-200 rounded text-xs"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            ◀
          </button>
          <span className="text-sm text-gray-600">
            Page {currentPage} of {numPages || '...'}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="p-1 hover:bg-gray-200 rounded disabled:opacity-50"
          >
            ▶
          </button>
        </div>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-200 p-4"
      >
        {error ? (
          <div className="flex items-center justify-center h-full">
            <p className="text-red-600">{error}</p>
          </div>
        ) : (
          <Document
            file={url}
            onLoadSuccess={onDocumentLoadSuccess}
            onLoadError={onDocumentLoadError}
            loading={
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin text-4xl">⏳</div>
              </div>
            }
          >
            {!isLoading && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => (
              <div
                key={pageNumber}
                ref={(el) => {
                  if (el) pageRefs.current.set(pageNumber, el);
                }}
                className="mb-4 shadow-lg relative"
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  renderTextLayer={true}
                  renderAnnotationLayer={true}
                />

                {/* Highlight overlays for this page */}
                <HighlightLayer
                  highlights={getPageHighlights(pageNumber)}
                  activeId={activeHighlightId}
                  scale={scale}
                  onClick={onHighlightClick}
                />
              </div>
            ))}
          </Document>
        )}
      </div>
    </div>
  );
}

interface HighlightLayerProps {
  highlights: Highlight[];
  activeId?: string | null;
  scale: number;
  onClick?: (id: string) => void;
}

function HighlightLayer({ highlights, activeId, scale, onClick }: HighlightLayerProps) {
  if (highlights.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {highlights.map((highlight) => {
        const { bbox } = highlight;
        const isActive = highlight.id === activeId;

        return (
          <div
            key={highlight.id}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(highlight.id);
            }}
            className={`
              absolute cursor-pointer pointer-events-auto
              transition-all duration-200
              ${isActive
                ? 'bg-yellow-300/60 ring-2 ring-yellow-500'
                : 'bg-yellow-200/40 hover:bg-yellow-300/50'
              }
            `}
            style={{
              left: `${bbox.x}%`,
              top: `${bbox.y}%`,
              width: `${bbox.width}%`,
              height: `${bbox.height}%`,
            }}
            title="Click to view citation"
          />
        );
      })}
    </div>
  );
}

export default PDFViewer;
