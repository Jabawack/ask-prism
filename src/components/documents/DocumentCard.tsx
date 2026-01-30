'use client';

import { Document } from '@/lib/supabase/types';

interface DocumentCardProps {
  document: Document;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function DocumentCard({ document, onDelete, isSelected, onSelect }: DocumentCardProps) {
  const statusColors = {
    uploading: 'bg-yellow-100 text-yellow-800',
    processing: 'bg-blue-100 text-blue-800',
    indexed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };

  const fileTypeIcons = {
    pdf: '📄',
    txt: '📝',
    docx: '📃',
  };

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={() => onSelect?.(document.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{fileTypeIcons[document.file_type]}</span>
          <div>
            <h3 className="font-medium text-gray-900 truncate max-w-[200px]">
              {document.filename}
            </h3>
            <p className="text-sm text-gray-500">
              {(document.file_size / 1024).toFixed(1)} KB
              {document.chunk_count && ` • ${document.chunk_count} chunks`}
            </p>
          </div>
        </div>

        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${statusColors[document.status]}`}
        >
          {document.status}
        </span>
      </div>

      {document.error_message && (
        <p className="text-sm text-red-600 mt-2">{document.error_message}</p>
      )}

      {onDelete && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete(document.id);
          }}
          className="mt-2 text-sm text-red-600 hover:text-red-800"
        >
          Delete
        </button>
      )}
    </div>
  );
}
