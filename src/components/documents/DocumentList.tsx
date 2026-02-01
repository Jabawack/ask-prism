'use client';

import { Document } from '@/lib/supabase/types';
import { DocumentCard } from './DocumentCard';
import type { DocumentProgress } from '@/hooks/useDocumentProgress';

interface DocumentListProps {
  documents: Document[];
  onDelete?: (id: string) => void;
  selectedIds?: string[];
  onSelect?: (id: string) => void;
  onView?: (doc: Document) => void;
  progressMap?: Record<string, DocumentProgress>;
}

export function DocumentList({ documents, onDelete, selectedIds = [], onSelect, onView, progressMap = {} }: DocumentListProps) {
  if (documents.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No documents uploaded yet.</p>
        <p className="text-sm">Upload a PDF, TXT, or DOCX file to get started.</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {documents.map((doc) => (
        <DocumentCard
          key={doc.id}
          document={doc}
          onDelete={onDelete}
          isSelected={selectedIds.includes(doc.id)}
          onSelect={onSelect}
          onView={onView ? () => onView(doc) : undefined}
          progress={progressMap[doc.id]}
        />
      ))}
    </div>
  );
}
