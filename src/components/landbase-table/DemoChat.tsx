'use client';

import { memo, useState, useCallback, useRef, useEffect } from 'react';
import { Button, TextInput } from 'flowbite-react';
import { SendIcon, SparklesIcon, LoaderIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { DEMO_PROMPTS } from '@/lib/landbase-table/mock-data';

interface ThoughtStep {
  text: string;
  status: 'complete' | 'active' | 'pending';
}

interface DemoChatProps {
  onAddColumn: (request: string) => Promise<void>;
  isProcessing: boolean;
  currentThoughts: ThoughtStep[];
}

const DemoChatComponent = ({
  onAddColumn,
  isProcessing,
  currentThoughts,
}: DemoChatProps) => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string }>>([
    {
      role: 'assistant',
      content: 'I can help you enrich this GTM leads table. Try asking me to add columns like funding data, tech stack, employee count, or industry classification.',
    },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, currentThoughts, scrollToBottom]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || isProcessing) return;

      const userMessage = input.trim();
      setInput('');
      setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);

      try {
        await onAddColumn(userMessage);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Done! I\'ve added the new column and populated the data.' },
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        const responseMessage = errorMessage === 'Column already exists'
          ? 'That column already exists in the table.'
          : 'Sorry, I couldn\'t understand that request. Try asking for a specific column like "funding" or "tech stack".';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: responseMessage },
        ]);
      }
    },
    [input, isProcessing, onAddColumn]
  );

  const handlePromptClick = useCallback(
    async (prompt: string) => {
      if (isProcessing) return;

      // Set input and submit directly
      setMessages((prev) => [...prev, { role: 'user', content: prompt }]);

      try {
        await onAddColumn(prompt);
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: 'Done! I\'ve added the new column and populated the data.' },
        ]);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '';
        const responseMessage = errorMessage === 'Column already exists'
          ? 'That column already exists in the table.'
          : 'Sorry, I couldn\'t understand that request. Try asking for a specific column like "funding" or "tech stack".';
        setMessages((prev) => [
          ...prev,
          { role: 'assistant', content: responseMessage },
        ]);
      }
    },
    [isProcessing, onAddColumn]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Chat header */}
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-4">
        <SparklesIcon className="h-5 w-5 text-[var(--color-primary)]" />
        <h2 className="font-semibold text-[var(--color-text-primary)]">Table Assistant</h2>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={cn(
              'max-w-[85%] rounded-lg px-4 py-2 text-sm',
              msg.role === 'user'
                ? 'ml-auto bg-[var(--color-primary)] text-white'
                : 'bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]'
            )}
          >
            {msg.content}
          </div>
        ))}

        {/* Chain of thought display */}
        {currentThoughts.length > 0 && (
          <div className="space-y-2 rounded-lg bg-[var(--color-bg-secondary)] p-4">
            {currentThoughts.map((thought, idx) => (
              <div
                key={idx}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  thought.status === 'complete' && 'text-[var(--color-text-muted)]',
                  thought.status === 'active' && 'text-[var(--color-text-primary)]',
                  thought.status === 'pending' && 'text-[var(--color-text-muted)] opacity-50'
                )}
              >
                {thought.status === 'active' ? (
                  <LoaderIcon className="h-3 w-3 animate-spin" />
                ) : thought.status === 'complete' ? (
                  <span className="h-3 w-3 text-center text-xs">&#10003;</span>
                ) : (
                  <span className="h-3 w-3" />
                )}
                <span>{thought.text}</span>
              </div>
            ))}
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested prompts */}
      <div className="border-t border-[var(--color-border)] px-4 py-3">
        <div className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">
          Try these:
        </div>
        <div className="flex flex-wrap gap-2">
          {DEMO_PROMPTS.slice(0, 3).map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handlePromptClick(prompt)}
              disabled={isProcessing}
              className="rounded-full bg-[var(--color-bg-tertiary)] px-3 py-1 text-xs text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-border)] disabled:opacity-50"
            >
              {prompt.replace('Add a column ', '').replace('showing ', '').replace('for ', '')}
            </button>
          ))}
        </div>
      </div>

      {/* Input area */}
      <form
        onSubmit={handleSubmit}
        className="flex gap-2 border-t border-[var(--color-border)] p-4"
      >
        <TextInput
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask to add a column..."
          disabled={isProcessing}
          className="flex-1"
        />
        <Button
          type="submit"
          disabled={!input.trim() || isProcessing}
          color="primary"
          size="md"
        >
          {isProcessing ? (
            <LoaderIcon className="h-4 w-4 animate-spin" />
          ) : (
            <SendIcon className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
};

export const DemoChat = memo(DemoChatComponent);
DemoChat.displayName = 'DemoChat';
