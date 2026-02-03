'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Document, BoundingBox } from '@/lib/supabase/types';
import { ChatInterface } from '@/components/chat/ChatInterface';
import { useDocumentProgress, DocumentProgress } from '@/hooks/useDocumentProgress';
import { DocumentDetailView } from '@/components/documents/DocumentDetailView';
import { useConfirm } from '@/components/ui/ConfirmDialog';

// Format relative time (e.g., "2h ago", "3d ago")
function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffWeek < 4) return `${diffWeek}w ago`;
  return date.toLocaleDateString();
}

// Dynamic import for PDF viewer
const PDFViewer = dynamic(
  () => import('@/components/pdf/PDFViewer').then((mod) => mod.PDFViewer),
  { ssr: false, loading: () => <div className="flex items-center justify-center h-full surface-secondary"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" /></div> }
);

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  document_ids: string[];
}

export default function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingDocId, setProcessingDocId] = useState<string | null>(null);
  const [progressMap, setProgressMap] = useState<Record<string, DocumentProgress>>({});
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [activeDocId, setActiveDocId] = useState<string | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<{ chunkId: string; bbox: unknown } | null>(null);
  const [showChunkBrowser, setShowChunkBrowser] = useState(false);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'name'>('newest');

  const confirm = useConfirm();

  // Sort documents based on selected order
  const sortedDocuments = useMemo(() => {
    return [...documents].sort((a, b) => {
      switch (sortOrder) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'name':
          return a.filename.localeCompare(b.filename);
        default:
          return 0;
      }
    });
  }, [documents, sortOrder]);

  const fetchDocuments = useCallback(async () => {
    try {
      const res = await fetch('/api/documents');
      const data = await res.json();
      setDocuments(data.documents || []);
    } catch (error) {
      console.error('Failed to fetch documents:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetch('/api/conversations');
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchConversations();
  }, [fetchDocuments, fetchConversations]);

  // SSE progress tracking
  const progress = useDocumentProgress(processingDocId, {
    enabled: !!processingDocId,
    onComplete: () => {
      fetchDocuments();
      // Delay clearing so ChatInterface can show completion state
      setTimeout(() => setProcessingDocId(null), 1000);
    },
    onError: () => {
      fetchDocuments();
      setTimeout(() => setProcessingDocId(null), 1000);
    },
  });

  useEffect(() => {
    if (processingDocId && progress.status) {
      setProgressMap((prev) => ({ ...prev, [processingDocId]: progress }));
    }
  }, [processingDocId, progress]);

  const handleFileUpload = async (file: File, mode: string = 'basic') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processingMode', mode);
    formData.append('chunkStrategy', 'per-block');

    const res = await fetch('/api/documents', { method: 'POST', body: formData });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Upload failed');
    }

    const data = await res.json();
    if (data.document?.id) {
      setProcessingDocId(data.document.id);
    }
    await fetchDocuments();
    return data.document;
  };

  const handleDelete = async (id: string) => {
    const doc = documents.find(d => d.id === id);
    if (!doc) return;

    // Find related conversations that will be affected
    const relatedConversations = conversations.filter(c =>
      c.document_ids.includes(id)
    );

    const impacts = [];

    if (doc.chunk_count && doc.chunk_count > 0) {
      impacts.push({
        label: 'chunks',
        count: doc.chunk_count,
        description: 'text excerpts with embeddings'
      });
    }

    if (relatedConversations.length > 0) {
      impacts.push({
        label: 'conversations',
        count: relatedConversations.length,
        description: 'chat history'
      });
    }

    const confirmed = await confirm({
      title: 'Delete Document',
      message: `Are you sure you want to delete "${doc.filename}"? This action cannot be undone.`,
      confirmLabel: 'Delete',
      cancelLabel: 'Keep',
      variant: 'danger',
      impacts: impacts.length > 0 ? impacts : undefined,
    });

    if (!confirmed) return;

    // Optimistic update - remove immediately
    setDocuments(prev => prev.filter(d => d.id !== id));
    setSelectedDocIds(prev => prev.filter(docId => docId !== id));
    if (activeDocId === id) setActiveDocId(null);

    // Then delete on server
    await fetch(`/api/documents/${id}`, { method: 'DELETE' });

    // Refresh conversations since some may have been deleted
    fetchConversations();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleViewDocument = (id: string) => {
    setActiveDocId(activeDocId === id ? null : id);
    setActiveHighlight(null);
  };

  const handleCitationClick = (citation: { document_id: string; chunk_id?: string; bbox?: unknown }) => {
    // Open PDF viewer for this document
    setActiveDocId(citation.document_id);
    // Set highlight if bbox available
    if (citation.chunk_id && citation.bbox) {
      setActiveHighlight({ chunkId: citation.chunk_id, bbox: citation.bbox });
    }
  };

  const handleViewChunks = (docId: string) => {
    setActiveDocId(docId);
    setShowChunkBrowser(true);
  };

  const ensureConversation = async (): Promise<string> => {
    if (conversationId) return conversationId;

    const docIds = selectedDocIds.length > 0
      ? selectedDocIds
      : documents.filter(d => d.status === 'indexed').map(d => d.id);
    if (docIds.length === 0) throw new Error('No indexed documents');

    const res = await fetch('/api/conversations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ document_ids: docIds }),
    });
    const data = await res.json();
    setConversationId(data.conversation.id);
    fetchConversations();
    return data.conversation.id;
  };

  const handleNewChat = () => {
    setConversationId(null);
    setSelectedDocIds([]);
  };

  const handleSelectConversation = (conv: Conversation) => {
    setConversationId(conv.id);
    setSelectedDocIds(conv.document_ids);
  };

  const indexedDocs = documents.filter((d) => d.status === 'indexed');
  const filteredConversations = conversations.filter(c =>
    c.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center surface-primary">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-primary)]" />
      </div>
    );
  }

  return (
    <div className="h-screen flex surface-primary">
      {/* Left Sidebar */}
      <aside className={`${sidebarCollapsed ? 'w-0' : 'w-64'} surface-secondary border-r border-default flex flex-col transition-all overflow-hidden`}>
        {/* New Chat */}
        <div className="p-3 border-b border-default">
          <button
            onClick={handleNewChat}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-default hover:surface-tertiary transition-colors text-body-sm"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            New chat
          </button>
        </div>

        {/* Search */}
        <div className="p-3 border-b border-default">
          {showSearch ? (
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search chats..."
                className="w-full pl-8 pr-3 py-2 text-body-sm border border-default rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
                autoFocus
                onBlur={() => !searchQuery && setShowSearch(false)}
              />
              <svg className="w-4 h-4 absolute left-2.5 top-2.5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:surface-tertiary transition-colors text-body-sm"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              Search chats
            </button>
          )}
        </div>

        {/* Documents */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-3">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-label">Documents ({indexedDocs.length})</h3>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'newest' | 'oldest' | 'name')}
                className="text-body-xs border-none bg-transparent text-muted cursor-pointer focus:outline-none"
              >
                <option value="newest">Newest</option>
                <option value="oldest">Oldest</option>
                <option value="name">Name</option>
              </select>
            </div>
            {documents.length === 0 ? (
              <p className="text-body-sm text-muted px-2">
                No documents. Drag & drop a PDF to the chat.
              </p>
            ) : (
              <div className="space-y-1">
                {sortedDocuments.map((doc) => (
                  <DocumentItem
                    key={doc.id}
                    doc={doc}
                    isSelected={selectedDocIds.includes(doc.id)}
                    isActive={activeDocId === doc.id}
                    onToggleSelect={() => handleToggleSelect(doc.id)}
                    onView={() => handleViewDocument(doc.id)}
                    onViewChunks={() => handleViewChunks(doc.id)}
                    onDelete={() => handleDelete(doc.id)}
                    progress={progressMap[doc.id]}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Chat history */}
          {filteredConversations.length > 0 && (
            <div className="p-3 border-t border-default">
              <h3 className="text-label mb-2">Recent Chats ({filteredConversations.length})</h3>
              <div className="space-y-1">
                {filteredConversations.slice(0, 10).map((conv) => (
                  <button
                    key={conv.id}
                    onClick={() => handleSelectConversation(conv)}
                    className={`w-full text-left px-2 py-1.5 rounded transition-colors ${
                      conversationId === conv.id
                        ? 'surface-tertiary'
                        : 'hover:surface-tertiary'
                    }`}
                  >
                    <p className="text-body-sm truncate">{conv.title || 'Untitled chat'}</p>
                    <p className="text-body-xs text-muted">{formatRelativeTime(conv.created_at)}</p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Branding */}
        <div className="p-3 border-t border-default">
          <p className="text-heading-sm">Ask Prism</p>
          <p className="text-body-xs">Document Analytics</p>
        </div>
      </aside>

      {/* Sidebar toggle */}
      <button
        onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
        className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1 surface-tertiary hover:bg-[var(--color-border)] rounded-r border border-l-0 border-default"
        style={{ left: sidebarCollapsed ? 0 : '256px' }}
      >
        <svg className={`w-4 h-4 text-secondary transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Main content area */}
      <main className="flex-1 flex min-w-0 relative h-full overflow-hidden">
        {/* Chat */}
        <div className={`flex-1 flex flex-col min-w-0 ${activeDocId ? 'w-1/2' : 'w-full'}`}>
          <ChatInterface
            conversationId={conversationId}
            onEnsureConversation={ensureConversation}
            onFileUpload={handleFileUpload}
            onCitationClick={handleCitationClick}
            selectedDocCount={selectedDocIds.length || indexedDocs.length}
            processingProgress={processingDocId ? progressMap[processingDocId] || progress : null}
          />
        </div>

        {/* PDF Viewer */}
        {activeDocId && (
          <div className="w-1/2 h-full border-l border-default flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2 border-b border-default surface-secondary">
              <span className="text-body-sm truncate">
                {documents.find(d => d.id === activeDocId)?.filename}
              </span>
              <button
                onClick={() => setActiveDocId(null)}
                className="p-1 hover:surface-tertiary rounded"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 min-h-0 overflow-hidden">
              <PDFViewer
                url={documents.find(d => d.id === activeDocId)?.storage_url || ''}
                highlights={activeHighlight ? [{
                  id: activeHighlight.chunkId,
                  bbox: activeHighlight.bbox as BoundingBox,
                  state: 'selected' as const,
                }] : []}
                activeHighlightId={activeHighlight?.chunkId || null}
              />
            </div>
          </div>
        )}
      </main>

      {/* Chunk Browser Modal */}
      {showChunkBrowser && activeDocId && (
        <DocumentDetailView
          document={documents.find(d => d.id === activeDocId)!}
          onClose={() => setShowChunkBrowser(false)}
        />
      )}
    </div>
  );
}

interface DocumentItemProps {
  doc: Document;
  isSelected: boolean;
  isActive: boolean;
  onToggleSelect: () => void;
  onView: () => void;
  onViewChunks: () => void;
  onDelete: () => void;
  progress?: DocumentProgress;
}

function DocumentItem({ doc, isSelected, isActive, onToggleSelect, onView, onViewChunks, onDelete, progress }: DocumentItemProps) {
  const isProcessing = doc.status === 'processing' || doc.status === 'uploading';
  const isIndexed = doc.status === 'indexed';

  return (
    <div
      onClick={() => isIndexed && onView()}
      className={`group flex items-center gap-2 px-2 py-1.5 rounded transition-colors cursor-pointer ${
        isActive ? 'surface-tertiary border-l-2 border-l-[var(--color-primary)]' : 'hover:surface-tertiary'
      }`}
    >
      <input
        type="checkbox"
        checked={isSelected}
        onChange={onToggleSelect}
        onClick={(e) => e.stopPropagation()}
        className="rounded border-[var(--color-border-strong)]"
        disabled={!isIndexed}
      />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm truncate">{doc.filename}</p>
        <p className="text-body-xs">
          {isProcessing ? (
            <span className="text-link">{progress?.message || 'Processing...'}</span>
          ) : doc.status === 'failed' ? (
            <span className="text-error">Failed</span>
          ) : (
            <span className="text-muted">
              {doc.page_count || 0}p · {doc.chunk_count || 0}c
              {doc.created_at && ` · ${formatRelativeTime(doc.created_at)}`}
            </span>
          )}
        </p>
        {isProcessing && progress && progress.progress > 0 && (
          <div className="mt-1 h-1 surface-tertiary rounded-full overflow-hidden">
            <div
              className="h-full bg-[var(--color-primary)] transition-all"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
        )}
      </div>
      {/* View chunks button */}
      {isIndexed && (doc.chunk_count || 0) > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); onViewChunks(); }}
          className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-link transition-all"
          title="View chunks"
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
        </button>
      )}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 p-1 text-muted hover:text-error transition-all"
      >
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
