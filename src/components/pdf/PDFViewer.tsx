'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import type { BoundingBox } from '@/lib/supabase/types';

// Configure the worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Number of pages to render above/below viewport
const PAGE_BUFFER = 2;
// Estimated page height for placeholder (will be updated after first render)
const ESTIMATED_PAGE_HEIGHT = 800;

interface Highlight {
  id: string;
  bbox: BoundingBox;
  state?: 'selected' | 'hovered' | 'default';
}

interface PDFViewerProps {
  url: string;
  highlights?: Highlight[];
  activeHighlightId?: string | null;
  hoveredHighlightId?: string | null;
  onHighlightClick?: (id: string) => void;
  onHighlightHover?: (id: string | null) => void;
  className?: string;
}

export function PDFViewer({
  url,
  highlights = [],
  activeHighlightId,
  hoveredHighlightId,
  onHighlightClick,
  onHighlightHover,
  className = '',
}: PDFViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set([1, 2, 3]));
  const [pageHeights, setPageHeights] = useState<Map<number, number>>(new Map());
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const observerRef = useRef<IntersectionObserver | null>(null);

  const onDocumentLoadSuccess = useCallback(({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    // Initially show first few pages
    setVisiblePages(new Set([1, 2, 3].filter(p => p <= numPages)));
  }, []);

  const onDocumentLoadError = useCallback((error: Error) => {
    console.error('PDF load error:', error);
    setError('Failed to load PDF');
    setIsLoading(false);
  }, []);

  // Set up IntersectionObserver for windowing
  useEffect(() => {
    if (!containerRef.current || numPages === 0) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const newVisible = new Set(visiblePages);

        entries.forEach((entry) => {
          const pageNum = parseInt(entry.target.getAttribute('data-page') || '0', 10);
          if (pageNum === 0) return;

          if (entry.isIntersecting) {
            // Add this page and buffer pages
            for (let i = Math.max(1, pageNum - PAGE_BUFFER); i <= Math.min(numPages, pageNum + PAGE_BUFFER); i++) {
              newVisible.add(i);
            }
            // Update current page indicator
            if (entry.intersectionRatio > 0.5) {
              setCurrentPage(pageNum);
            }
          }
        });

        setVisiblePages(newVisible);
      },
      {
        root: containerRef.current,
        rootMargin: '200px 0px', // Start loading pages 200px before they're visible
        threshold: [0, 0.5, 1],
      }
    );

    return () => {
      observerRef.current?.disconnect();
    };
  }, [numPages]); // Don't include visiblePages to avoid re-creating observer

  // Observe page placeholders
  const observePage = useCallback((element: HTMLDivElement | null, pageNumber: number) => {
    if (element) {
      pageRefs.current.set(pageNumber, element);
      observerRef.current?.observe(element);
    }
  }, []);

  // Track rendered page heights for better placeholder sizing
  const onPageRenderSuccess = useCallback((pageNumber: number) => {
    const pageEl = pageRefs.current.get(pageNumber);
    if (pageEl) {
      setPageHeights(prev => new Map(prev).set(pageNumber, pageEl.offsetHeight));
    }
  }, []);

  // Scroll to highlight when activeHighlightId changes
  useEffect(() => {
    if (!activeHighlightId) return;

    const highlight = highlights.find(h => h.id === activeHighlightId);
    if (!highlight) return;

    // Ensure the page is in visible set
    setVisiblePages(prev => {
      const newSet = new Set(prev);
      for (let i = Math.max(1, highlight.bbox.page - PAGE_BUFFER); i <= Math.min(numPages, highlight.bbox.page + PAGE_BUFFER); i++) {
        newSet.add(i);
      }
      return newSet;
    });

    // Scroll after a short delay to let the page render
    setTimeout(() => {
      const pageRef = pageRefs.current.get(highlight.bbox.page);
      if (pageRef) {
        pageRef.scrollIntoView({ behavior: 'smooth', block: 'center' });
        setCurrentPage(highlight.bbox.page);
      }
    }, 100);
  }, [activeHighlightId, highlights, numPages]);

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
      // Ensure the page and nearby pages are visible
      setVisiblePages(prev => {
        const newSet = new Set(prev);
        for (let i = Math.max(1, page - PAGE_BUFFER); i <= Math.min(numPages, page + PAGE_BUFFER); i++) {
          newSet.add(i);
        }
        return newSet;
      });

      setTimeout(() => {
        const pageRef = pageRefs.current.get(page);
        if (pageRef) {
          pageRef.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
    }
  };

  // Get estimated height for a page placeholder
  const getPageHeight = (pageNumber: number) => {
    // Use actual height if we've measured it, otherwise estimate
    const measured = pageHeights.get(pageNumber);
    if (measured) return measured * scale;

    // Use average of measured heights if available
    if (pageHeights.size > 0) {
      const avgHeight = Array.from(pageHeights.values()).reduce((a, b) => a + b, 0) / pageHeights.size;
      return avgHeight * scale;
    }

    return ESTIMATED_PAGE_HEIGHT * scale;
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Compact toolbar */}
      <div className="flex items-center justify-between bg-gray-50 border-b px-3 py-1.5 text-sm">
        <div className="flex items-center gap-1">
          <button
            onClick={handleZoomOut}
            className="px-2 py-1 hover:bg-gray-200 rounded text-gray-600"
            title="Zoom out"
          >
            −
          </button>
          <span className="text-gray-500 min-w-[45px] text-center text-xs">
            {Math.round(scale * 100)}%
          </span>
          <button
            onClick={handleZoomIn}
            className="px-2 py-1 hover:bg-gray-200 rounded text-gray-600"
            title="Zoom in"
          >
            +
          </button>
          <button
            onClick={handleZoomReset}
            className="px-2 py-1 hover:bg-gray-200 rounded text-xs text-gray-500"
            title="Reset zoom"
          >
            Reset
          </button>
        </div>

        <div className="flex items-center gap-1 text-xs text-gray-500">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-2 py-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            ‹
          </button>
          <span>
            {currentPage} / {numPages || '…'}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= numPages}
            className="px-2 py-1 hover:bg-gray-200 rounded disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {/* PDF Container */}
      <div
        ref={containerRef}
        className="flex-1 overflow-auto bg-gray-100 p-4"
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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-400" />
              </div>
            }
          >
            {!isLoading && Array.from({ length: numPages }, (_, i) => i + 1).map((pageNumber) => {
              const shouldRender = visiblePages.has(pageNumber);
              const estimatedHeight = getPageHeight(pageNumber);

              return (
                <div
                  key={pageNumber}
                  ref={(el) => observePage(el, pageNumber)}
                  data-page={pageNumber}
                  className="mb-4 shadow-lg relative bg-white"
                  style={!shouldRender ? { minHeight: estimatedHeight } : undefined}
                >
                  {shouldRender ? (
                    <>
                      <Page
                        pageNumber={pageNumber}
                        scale={scale}
                        renderTextLayer={true}
                        renderAnnotationLayer={true}
                        onRenderSuccess={() => onPageRenderSuccess(pageNumber)}
                      />

                      {/* Highlight overlays for this page */}
                      <HighlightLayer
                        highlights={getPageHighlights(pageNumber)}
                        activeId={activeHighlightId}
                        hoveredId={hoveredHighlightId}
                        onClick={onHighlightClick}
                        onHover={onHighlightHover}
                      />
                    </>
                  ) : (
                    // Placeholder for unloaded pages
                    <div
                      className="flex items-center justify-center bg-gray-50"
                      style={{ height: estimatedHeight }}
                    >
                      <span className="text-gray-400 text-sm">Page {pageNumber}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </Document>
        )}
      </div>
    </div>
  );
}

interface HighlightLayerProps {
  highlights: Highlight[];
  activeId?: string | null;
  hoveredId?: string | null;
  onClick?: (id: string) => void;
  onHover?: (id: string | null) => void;
}

function HighlightLayer({ highlights, activeId, hoveredId, onClick, onHover }: HighlightLayerProps) {
  if (highlights.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none">
      {highlights.map((highlight) => {
        const { bbox } = highlight;
        const isSelected = highlight.id === activeId;
        const isHovered = highlight.id === hoveredId;

        // Visual hierarchy: selected (bright) > hovered (medium) > default (subtle)
        let bgClass = 'bg-yellow-200/20'; // default: very subtle
        let ringClass = '';

        if (isSelected) {
          bgClass = 'bg-yellow-400/50';
          ringClass = 'ring-2 ring-yellow-500 ring-offset-1';
        } else if (isHovered) {
          bgClass = 'bg-yellow-300/40';
          ringClass = 'ring-1 ring-yellow-400';
        }

        return (
          <div
            key={highlight.id}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.(highlight.id);
            }}
            onMouseEnter={() => onHover?.(highlight.id)}
            onMouseLeave={() => onHover?.(null)}
            className={`
              absolute cursor-pointer pointer-events-auto
              transition-all duration-150
              ${bgClass} ${ringClass}
            `}
            style={{
              left: `${bbox.x}%`,
              top: `${bbox.y}%`,
              width: `${bbox.width}%`,
              height: `${bbox.height}%`,
            }}
            title={isSelected ? 'Selected chunk' : 'Click to select'}
          />
        );
      })}
    </div>
  );
}

export default PDFViewer;
