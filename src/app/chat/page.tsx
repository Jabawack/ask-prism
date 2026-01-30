'use client';

import { useState, useEffect, useCallback } from 'react';
import { Document, Conversation } from '@/lib/supabase/types';
import { DocumentUpload } from '@/components/documents/DocumentUpload';
import { DocumentList } from '@/components/documents/DocumentList';
import { ChatContainer } from '@/components/chat/ChatContainer';

export default function ChatPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchDocuments();
  }, [fetchDocuments]);

  const handleUpload = async (file: File, mode: string = 'basic') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('processingMode', mode);

    const res = await fetch('/api/documents', {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error || 'Upload failed');
    }

    await fetchDocuments();
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/documents/${id}`, { method: 'DELETE' });
      setSelectedDocIds((prev) => prev.filter((docId) => docId !== id));
      await fetchDocuments();
    } catch (error) {
      console.error('Failed to delete document:', error);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedDocIds((prev) =>
      prev.includes(id) ? prev.filter((docId) => docId !== id) : [...prev, id]
    );
  };

  const handleStartChat = async () => {
    if (selectedDocIds.length === 0) return;

    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ document_ids: selectedDocIds }),
      });

      const data = await res.json();
      setConversation(data.conversation);
    } catch (error) {
      console.error('Failed to create conversation:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900">Ask Prism</h1>
        <p className="text-gray-600">Document Analytics with Visual Citations</p>
      </header>

      <main className="container mx-auto px-4 py-8">
        {!conversation ? (
          <div className="max-w-4xl mx-auto space-y-8">
            <section>
              <h2 className="text-xl font-semibold mb-4">Upload Documents</h2>
              <DocumentUpload onUpload={handleUpload} />
            </section>

            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Your Documents</h2>
                {selectedDocIds.length > 0 && (
                  <button
                    onClick={handleStartChat}
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Start Chat with {selectedDocIds.length} document
                    {selectedDocIds.length > 1 ? 's' : ''}
                  </button>
                )}
              </div>

              <p className="text-sm text-gray-600 mb-4">
                Select documents to chat with, then click &quot;Start Chat&quot;
              </p>

              <DocumentList
                documents={documents}
                onDelete={handleDelete}
                selectedIds={selectedDocIds}
                onSelect={handleSelect}
              />
            </section>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto h-[calc(100vh-200px)]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">
                Chat ({selectedDocIds.length} document{selectedDocIds.length > 1 ? 's' : ''})
              </h2>
              <button
                onClick={() => setConversation(null)}
                className="text-gray-600 hover:text-gray-900"
              >
                ← Back to documents
              </button>
            </div>

            <ChatContainer conversationId={conversation.id} />
          </div>
        )}
      </main>
    </div>
  );
}
