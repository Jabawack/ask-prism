'use client';

import { Document } from '@/lib/supabase/types';
import type { DocumentProgress } from '@/hooks/useDocumentProgress';

interface DocumentCardProps {
  document: Document;
  onDelete?: (id: string) => void;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
  onView?: () => void;
  progress?: DocumentProgress | null;
}

const statusColors: Record<string, string> = {
  uploading: 'bg-yellow-100 text-yellow-800',
  processing: 'bg-blue-100 text-blue-800',
  indexed: 'bg-green-100 text-green-800',
  failed: 'bg-red-100 text-red-800',
};

const fileTypeIcons: Record<string, string> = {
  pdf: '📄',
  txt: '📝',
  docx: '📃',
};

export function DocumentCard({
  document,
  onDelete,
  isSelected,
  onSelect,
  onView,
  progress,
}: DocumentCardProps) {
  const isProcessing = document.status === 'processing' || document.status === 'uploading';
  const showProgress = isProcessing && progress && progress.progress > 0;

  // Use progress message if available, otherwise fall back to status
  const displayStatus = isProcessing && progress?.message
    ? progress.message
    : document.status;

  return (
    <div
      className={`border rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer overflow-hidden ${
        isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
      }`}
      onClick={() => onSelect?.(document.id)}
    >
      {/* Header row: icon, filename, status */}
      <div className="flex items-center gap-3">
        <span className="text-2xl flex-shrink-0">{fileTypeIcons[document.file_type]}</span>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-900 truncate">
              {document.filename}
            </h3>
            <span
              className={`text-xs font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${statusColors[document.status]}`}
            >
              {displayStatus}
            </span>
          </div>
          <p className="text-sm text-gray-500">
            {(document.file_size / 1024).toFixed(1)} KB
            {document.chunk_count && ` • ${document.chunk_count} chunks`}
          </p>
        </div>
      </div>

      {/* Progress bar for processing documents */}
      {showProgress && (
        <div className="mt-3">
          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress.progress}%` }}
            />
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {progress.progress}% complete
          </p>
        </div>
      )}

      {/* Error message */}
      {document.error_message && (
        <p className="text-sm text-red-600 mt-2 truncate" title={document.error_message}>
          {document.error_message}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-3 mt-2">
        {onView && document.status === 'indexed' && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onView();
            }}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            View
          </button>
        )}
        {onDelete && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(document.id);
            }}
            className="text-sm text-red-600 hover:text-red-800"
          >
            Delete
          </button>
        )}
      </div>
    </div>
  );
}
