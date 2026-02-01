'use client';

import { useState, useRef, useEffect } from 'react';
import type { Citation } from '@/lib/supabase/types';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
  thinkingSteps?: string[];
}

interface ChatPanelProps {
  conversationId: string | null;
  onEnsureConversation: () => Promise<string>;
  selectedDocCount: number;
  compact?: boolean;
  onCitationClick?: (citation: Citation) => void;
}

function ThinkingSteps({ steps, compact }: { steps: string[]; compact?: boolean }) {
  if (!steps.length) return null;

  return (
    <div className={`${compact ? 'text-xs' : 'text-sm'} text-gray-500 mb-1`}>
      {steps.map((step, i) => (
        <div key={i} className="flex items-center gap-1">
          <span className="text-blue-500">•</span>
          <span>{step}</span>
        </div>
      ))}
    </div>
  );
}

export function ChatPanel({
  conversationId,
  onEnsureConversation,
  selectedDocCount,
  compact = false,
  onCitationClick,
}: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      const convId = await onEnsureConversation();

      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      // Handle SSE streaming
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantContent = '';
      let citations: Citation[] = [];
      let thinkingSteps: string[] = [];

      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));

              if (data.type === 'content') {
                assistantContent += data.data.token;
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastMsg = newMessages[newMessages.length - 1];
                  if (lastMsg?.role === 'assistant') {
                    lastMsg.content = assistantContent;
                    lastMsg.citations = citations;
                    lastMsg.thinkingSteps = thinkingSteps;
                  } else {
                    newMessages.push({ role: 'assistant', content: assistantContent, citations, thinkingSteps });
                  }
                  return newMessages;
                });
              } else if (data.type === 'sources') {
                citations = data.data.citations || [];
              } else if (data.type === 'thinking') {
                const step = data.data?.step;
                if (step && !thinkingSteps.includes(step)) {
                  thinkingSteps = [...thinkingSteps, step];
                  // Show thinking in progress
                  setMessages((prev) => {
                    const newMessages = [...prev];
                    const lastMsg = newMessages[newMessages.length - 1];
                    if (lastMsg?.role === 'assistant') {
                      lastMsg.thinkingSteps = thinkingSteps;
                    } else {
                      newMessages.push({ role: 'assistant', content: '', thinkingSteps });
                    }
                    return newMessages;
                  });
                }
              }
            } catch {
              // Ignore parse errors
            }
          }
        }
      }
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Sorry, something went wrong. Please try again.' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (compact) {
    return (
      <div className="space-y-2">
        {/* Recent messages (show last 2) */}
        {messages.length > 0 && (
          <div className="max-h-32 overflow-y-auto space-y-2 text-sm">
            {messages.slice(-2).map((msg, i) => (
              <div
                key={i}
                className={`p-2 rounded ${
                  msg.role === 'user'
                    ? 'bg-blue-50 text-blue-900 ml-4'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                {msg.role === 'assistant' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                  <ThinkingSteps steps={msg.thinkingSteps} compact />
                )}
                {msg.content && <p className="line-clamp-2">{msg.content}</p>}
                {msg.citations && msg.citations.length > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {msg.citations.length} citation{msg.citations.length > 1 ? 's' : ''}
                  </p>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSubmit}>
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={`Ask about ${selectedDocCount} doc${selectedDocCount !== 1 ? 's' : ''}...`}
              className="flex-1 px-3 py-2 text-sm border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={isLoading || selectedDocCount === 0}
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim() || selectedDocCount === 0}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              )}
            </button>
          </div>
        </form>
      </div>
    );
  }

  // Full chat panel (not compact)
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 py-8">
            <p>Ask a question about your documents</p>
          </div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                {msg.role === 'assistant' && msg.thinkingSteps && msg.thinkingSteps.length > 0 && (
                  <ThinkingSteps steps={msg.thinkingSteps} />
                )}
                {msg.content && <p className="whitespace-pre-wrap">{msg.content}</p>}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-gray-200/50">
                    <p className="text-xs opacity-75 mb-1">Sources:</p>
                    <div className="flex flex-wrap gap-1">
                      {msg.citations.map((citation, j) => (
                        <button
                          key={j}
                          onClick={() => onCitationClick?.(citation)}
                          className="text-xs bg-white/20 hover:bg-white/30 px-2 py-0.5 rounded"
                        >
                          p.{citation.page_number}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSubmit} className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
