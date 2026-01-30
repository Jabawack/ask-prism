'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Message, Citation, ResponseMode } from '@/lib/supabase/types';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';

interface ChatContainerProps {
  conversationId: string;
  initialMessages?: Message[];
  responseMode?: ResponseMode;
  onCitationClick?: (citation: Citation) => void;
  activeCitationId?: string | null;
}

export function ChatContainer({
  conversationId,
  initialMessages = [],
  responseMode = 'standard',
  onCitationClick,
  activeCitationId,
}: ChatContainerProps) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [isLoading, setIsLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [streamingCitations, setStreamingCitations] = useState<Citation[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = useCallback(async (content: string) => {
    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId,
      role: 'user',
      content,
      citations: [],
      created_at: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setStreamingContent('');
    setStreamingCitations([]);

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, responseMode }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new Error('No response body');
      }

      let fullContent = '';
      let citations: Citation[] = [];
      let latencyMs = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            const eventType = line.slice(7);
            continue;
          }

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.token) {
                fullContent += data.token;
                setStreamingContent(fullContent);
              } else if (data.citations) {
                citations = data.citations;
                setStreamingCitations(citations);
              } else if (data.latency_ms !== undefined) {
                latencyMs = data.latency_ms;
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: `msg-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: fullContent,
        citations,
        latency_ms: latencyMs,
        created_at: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      if ((error as Error).name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Send message error:', error);
        const errorMessage: Message = {
          id: `error-${Date.now()}`,
          conversation_id: conversationId,
          role: 'assistant',
          content: 'Sorry, an error occurred. Please try again.',
          citations: [],
          created_at: new Date().toISOString(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      }
    } finally {
      setIsLoading(false);
      setStreamingContent('');
      setStreamingCitations([]);
      abortControllerRef.current = null;
    }
  }, [conversationId, responseMode]);

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border">
      <MessageList
        messages={messages}
        streamingContent={isLoading ? streamingContent : undefined}
        streamingCitations={isLoading ? streamingCitations : undefined}
        isLoading={isLoading}
        onCitationClick={onCitationClick}
        activeCitationId={activeCitationId}
      />
      <div ref={messagesEndRef} />
      <MessageInput onSend={handleSend} disabled={isLoading} />
    </div>
  );
}
