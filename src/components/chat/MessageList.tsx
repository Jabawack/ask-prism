'use client';

import { Message, Citation } from '@/lib/supabase/types';
import { CitationList } from './Citation';

interface MessageListProps {
  messages: Message[];
  streamingContent?: string;
  streamingCitations?: Citation[];
  isLoading?: boolean;
  onCitationClick?: (citation: Citation) => void;
  activeCitationId?: string | null;
}

export function MessageList({
  messages,
  streamingContent,
  streamingCitations,
  isLoading,
  onCitationClick,
  activeCitationId,
}: MessageListProps) {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => (
        <MessageBubble
          key={message.id}
          message={message}
          onCitationClick={onCitationClick}
          activeCitationId={activeCitationId}
        />
      ))}

      {isLoading && streamingContent !== undefined && (
        <div className="flex justify-start">
          <div className="max-w-[80%] bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
            <p className="text-gray-900 whitespace-pre-wrap">
              {streamingContent || (
                <span className="animate-pulse">Thinking...</span>
              )}
            </p>
            {streamingCitations && streamingCitations.length > 0 && (
              <CitationList
                citations={streamingCitations}
                onCitationClick={onCitationClick}
                activeCitationId={activeCitationId}
              />
            )}
          </div>
        </div>
      )}

      {isLoading && streamingContent === undefined && (
        <div className="flex justify-start">
          <div className="bg-gray-100 rounded-2xl rounded-bl-md px-4 py-3">
            <div className="flex space-x-1">
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
              <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onCitationClick?: (citation: Citation) => void;
  activeCitationId?: string | null;
}

function MessageBubble({ message, onCitationClick, activeCitationId }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white rounded-br-md'
            : 'bg-gray-100 text-gray-900 rounded-bl-md'
        }`}
      >
        <p className="whitespace-pre-wrap">{message.content}</p>

        {!isUser && message.citations && message.citations.length > 0 && (
          <CitationList
            citations={message.citations}
            onCitationClick={onCitationClick}
            activeCitationId={activeCitationId}
          />
        )}

        {!isUser && message.latency_ms && (
          <p className="text-xs text-gray-500 mt-2">
            {(message.latency_ms / 1000).toFixed(1)}s
          </p>
        )}
      </div>
    </div>
  );
}
