'use client';

import { useState, useCallback } from 'react';
import { ChatContainer } from './ChatContainer';
import { PDFViewer } from '@/components/pdf/PDFViewer';
import { QueryModeSelector, ResponseMode } from './QueryModeSelector';
import type { Citation, BoundingBox, Document } from '@/lib/supabase/types';

interface ChatWithPDFViewProps {
  conversationId: string;
  documents: Document[];
  onBack: () => void;
}

interface Highlight {
  id: string;
  bbox: BoundingBox;
}

export function ChatWithPDFView({
  conversationId,
  documents,
  onBack,
}: ChatWithPDFViewProps) {
  const [responseMode, setResponseMode] = useState<ResponseMode>('standard');
  const [activeCitationId, setActiveCitationId] = useState<string | null>(null);
  const [activeDocumentId, setActiveDocumentId] = useState<string | null>(
    documents[0]?.id || null
  );
  const [highlights, setHighlights] = useState<Highlight[]>([]);

  // Get the currently selected document
  const activeDocument = documents.find(d => d.id === activeDocumentId);

  // Handle citation click - update highlights and scroll to citation
  const handleCitationClick = useCallback((citation: Citation) => {
    if (!citation.bbox) return;

    // Set the active document if it's different
    if (citation.document_id !== activeDocumentId) {
      setActiveDocumentId(citation.document_id);
    }

    // Create a highlight for this citation
    const highlight: Highlight = {
      id: citation.chunk_id,
      bbox: citation.bbox,
    };

    // Add to highlights if not already present
    setHighlights(prev => {
      const exists = prev.some(h => h.id === highlight.id);
      if (exists) return prev;
      return [...prev, highlight];
    });

    // Set as active to scroll to it
    setActiveCitationId(citation.chunk_id);
  }, [activeDocumentId]);

  // Handle highlight click in PDF viewer
  const handleHighlightClick = useCallback((id: string) => {
    setActiveCitationId(id);
  }, []);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between bg-white border-b px-4 py-3">
        <div className="flex items-center space-x-4">
          <button
            onClick={onBack}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back
          </button>
          <h2 className="text-lg font-semibold">
            Chat ({documents.length} document{documents.length > 1 ? 's' : ''})
          </h2>
        </div>

        <QueryModeSelector
          value={responseMode}
          onChange={setResponseMode}
          compact
        />
      </div>

      {/* Main content area - split view */}
      <div className="flex-1 flex overflow-hidden">
        {/* Chat Panel */}
        <div className="w-1/2 border-r flex flex-col">
          <ChatContainer
            conversationId={conversationId}
            responseMode={responseMode}
            onCitationClick={handleCitationClick}
            activeCitationId={activeCitationId}
          />
        </div>

        {/* PDF Panel */}
        <div className="w-1/2 flex flex-col bg-gray-100">
          {/* Document tabs if multiple documents */}
          {documents.length > 1 && (
            <div className="flex bg-white border-b overflow-x-auto">
              {documents.map((doc) => (
                <button
                  key={doc.id}
                  onClick={() => setActiveDocumentId(doc.id)}
                  className={`
                    px-4 py-2 text-sm whitespace-nowrap border-b-2 transition-colors
                    ${doc.id === activeDocumentId
                      ? 'border-blue-500 text-blue-600 bg-blue-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900'
                    }
                  `}
                >
                  {doc.filename}
                </button>
              ))}
            </div>
          )}

          {/* PDF Viewer */}
          {activeDocument ? (
            <PDFViewer
              url={activeDocument.storage_url}
              highlights={highlights.filter(h =>
                // Only show highlights for current document
                documents.find(d => d.id === activeDocumentId)
              )}
              activeHighlightId={activeCitationId}
              onHighlightClick={handleHighlightClick}
              className="flex-1"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              No document selected
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
