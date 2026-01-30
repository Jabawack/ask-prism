'use client';

import { Citation as CitationType } from '@/lib/supabase/types';

interface CitationProps {
  citation: CitationType;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
}

export function Citation({ citation, index, isActive, onClick }: CitationProps) {
  const hasBbox = !!citation.bbox;

  return (
    <div
      onClick={onClick}
      className={`
        bg-gray-50 border rounded-lg p-3 text-sm transition-all
        ${hasBbox ? 'cursor-pointer hover:bg-gray-100' : ''}
        ${isActive
          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
          : 'border-gray-200'
        }
      `}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className={`
          text-xs font-medium px-2 py-0.5 rounded
          ${isActive
            ? 'bg-blue-500 text-white'
            : 'bg-blue-100 text-blue-800'
          }
        `}>
          [{index + 1}]
        </span>
        <span className="font-medium text-gray-900">{citation.document_name}</span>
        {citation.page_number && (
          <span className="text-gray-500">p. {citation.page_number}</span>
        )}
        {hasBbox && (
          <span className="text-xs text-blue-600 ml-auto">
            Click to highlight
          </span>
        )}
      </div>
      <p className="text-gray-600 line-clamp-2">{citation.excerpt}</p>
    </div>
  );
}

interface CitationListProps {
  citations: CitationType[];
  activeCitationId?: string | null;
  onCitationClick?: (citation: CitationType) => void;
}

export function CitationList({
  citations,
  activeCitationId,
  onCitationClick,
}: CitationListProps) {
  if (citations.length === 0) return null;

  return (
    <div className="mt-4 space-y-2">
      <h4 className="text-sm font-medium text-gray-700">
        Sources
        {citations.some(c => c.bbox) && (
          <span className="font-normal text-gray-500 ml-2">
            (click to highlight in PDF)
          </span>
        )}
      </h4>
      <div className="space-y-2">
        {citations.map((citation, index) => (
          <Citation
            key={citation.chunk_id}
            citation={citation}
            index={index}
            isActive={activeCitationId === citation.chunk_id}
            onClick={() => onCitationClick?.(citation)}
          />
        ))}
      </div>
    </div>
  );
}
