'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChainOfThought, ThinkingStep } from './ChainOfThought';
import type { Citation } from '@/lib/supabase/types';
import type { DocumentProgress } from '@/hooks/useDocumentProgress';

type ProcessingMode = 'basic' | 'standard' | 'advanced';

interface PendingUpload {
  file: File;
  mode: ProcessingMode;
}

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: Citation[];
  thinkingSteps?: ThinkingStep[];
  thinkingComplete?: boolean;
  thinkingDuration?: number;
  attachments?: { type: 'file'; name: string; id?: string }[];
  pendingUpload?: PendingUpload;
  timestamp: Date;
}

// Convert processing progress to thinking steps
function getProcessingSteps(progress: DocumentProgress): ThinkingStep[] {
  const allSteps = [
    { id: 'parsing', label: 'Parsing PDF...' },
    { id: 'chunking', label: 'Creating chunks...' },
    { id: 'embedding', label: `Generating embeddings${progress.details?.embeddedCount ? ` (${progress.details.embeddedCount}/${progress.details.totalChunks})` : ''}...` },
    { id: 'storing', label: 'Saving to database...' },
    { id: 'complete', label: 'Ready' },
  ];

  const statusToStep: Record<string, number> = {
    'started': 0,
    'parsing': 0,
    'parsing_complete': 1,
    'chunking': 1,
    'chunking_complete': 2,
    'embedding': 2,
    'embedding_progress': 2,
    'storing': 3,
    'complete': 4,
  };

  const currentStepIndex = progress.status ? (statusToStep[progress.status] ?? 0) : 0;

  return allSteps.map((step, index) => ({
    ...step,
    status: index < currentStepIndex ? 'complete' as const
      : index === currentStepIndex ? 'active' as const
      : 'pending' as const,
  }));
}

interface ChatInterfaceProps {
  conversationId: string | null;
  onEnsureConversation: () => Promise<string>;
  onFileUpload: (file: File, mode: ProcessingMode) => Promise<unknown>;
  onCitationClick?: (citation: Citation) => void;
  selectedDocCount: number;
  processingProgress?: DocumentProgress | null;
}

export function ChatInterface({
  conversationId,
  onEnsureConversation,
  onFileUpload,
  onCitationClick,
  selectedDocCount,
  processingProgress,
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [processingMsgId, setProcessingMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Update processing message when progress changes
  useEffect(() => {
    if (processingMsgId && processingProgress) {
      const steps = getProcessingSteps(processingProgress);
      const isComplete = processingProgress.status === 'complete';

      setMessages(prev => prev.map(m =>
        m.id === processingMsgId
          ? {
              ...m,
              content: isComplete ? 'Document processed and ready!' : '',
              thinkingSteps: steps,
              thinkingComplete: isComplete,
            }
          : m
      ));

      if (isComplete) {
        setProcessingMsgId(null);
      }
    }
  }, [processingMsgId, processingProgress]);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      // Show pending upload card for user to select processing mode
      const pendingMsg: Message = {
        id: `pending-${Date.now()}`,
        role: 'user',
        content: '',
        pendingUpload: { file, mode: 'basic' },
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, pendingMsg]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Show pending upload card for user to select processing mode
      const pendingMsg: Message = {
        id: `pending-${Date.now()}`,
        role: 'user',
        content: '',
        pendingUpload: { file, mode: 'basic' },
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, pendingMsg]);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleUpdatePendingMode = useCallback((msgId: string, mode: ProcessingMode) => {
    setMessages(prev => prev.map(m =>
      m.id === msgId && m.pendingUpload
        ? { ...m, pendingUpload: { ...m.pendingUpload, mode } }
        : m
    ));
  }, []);

  const handleConfirmUpload = useCallback(async (msgId: string) => {
    const msg = messages.find(m => m.id === msgId);
    if (!msg?.pendingUpload) return;

    const { file, mode } = msg.pendingUpload;

    // Convert pending to confirmed upload
    setMessages(prev => prev.map(m =>
      m.id === msgId
        ? { ...m, pendingUpload: undefined, attachments: [{ type: 'file' as const, name: file.name }] }
        : m
    ));

    // Add processing message
    const processingMsg: Message = {
      id: `processing-${Date.now()}`,
      role: 'assistant',
      content: '',
      thinkingSteps: [{ id: 'start', label: 'Starting...', status: 'active' }],
      thinkingComplete: false,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, processingMsg]);
    setProcessingMsgId(processingMsg.id);

    try {
      await onFileUpload(file, mode);
    } catch (err) {
      setMessages(prev => prev.map(m =>
        m.id === processingMsg.id
          ? { ...m, content: `Failed to process: ${file.name}`, thinkingSteps: [], thinkingComplete: true }
          : m
      ));
      setProcessingMsgId(null);
    }
  }, [messages, onFileUpload]);

  const handleCancelUpload = useCallback((msgId: string) => {
    setMessages(prev => prev.filter(m => m.id !== msgId));
  }, []);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    const userMsgId = `user-${Date.now()}`;
    const assistantMsgId = `assistant-${Date.now()}`;

    setInput('');
    setMessages(prev => [...prev, {
      id: userMsgId,
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    }]);
    setIsLoading(true);

    const startTime = Date.now();

    try {
      const convId = await onEnsureConversation();

      setMessages(prev => [...prev, {
        id: assistantMsgId,
        role: 'assistant',
        content: '',
        thinkingSteps: [],
        thinkingComplete: false,
        timestamp: new Date(),
      }]);

      const response = await fetch(`/api/conversations/${convId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response body');

      let assistantContent = '';
      let citations: Citation[] = [];
      let thinkingSteps: ThinkingStep[] = [];
      let stepIndex = 0;

      const decoder = new TextDecoder();
      let currentEventType = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('event: ')) {
            currentEventType = line.slice(7).trim();
          } else if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));

              if (currentEventType === 'thinking') {
                const stepLabel = eventData?.step;
                if (stepLabel) {
                  thinkingSteps = thinkingSteps.map(s =>
                    s.status === 'active' ? { ...s, status: 'complete' as const } : s
                  );
                  thinkingSteps = [...thinkingSteps, {
                    id: `step-${stepIndex++}`,
                    label: stepLabel,
                    status: 'active' as const,
                  }];

                  setMessages(prev => prev.map(m =>
                    m.id === assistantMsgId
                      ? { ...m, thinkingSteps: [...thinkingSteps] }
                      : m
                  ));
                }
              } else if (currentEventType === 'sources') {
                citations = eventData.citations || [];
              } else if (currentEventType === 'content') {
                assistantContent += eventData.token;
                thinkingSteps = thinkingSteps.map(s => ({ ...s, status: 'complete' as const }));

                setMessages(prev => prev.map(m =>
                  m.id === assistantMsgId
                    ? {
                        ...m,
                        content: assistantContent,
                        citations,
                        thinkingSteps: [...thinkingSteps],
                        thinkingComplete: true,
                        thinkingDuration: Math.round((Date.now() - startTime) / 1000),
                      }
                    : m
                ));
              }

              currentEventType = ''; // Reset after processing
            } catch {
              // Ignore parse errors
            }
          }
        }
      }

      setMessages(prev => prev.map(m =>
        m.id === assistantMsgId
          ? {
              ...m,
              content: assistantContent,
              citations,
              thinkingSteps: thinkingSteps.map(s => ({ ...s, status: 'complete' as const })),
              thinkingComplete: true,
              thinkingDuration: Math.round((Date.now() - startTime) / 1000),
            }
          : m
      ));

    } catch (error) {
      console.error('Chat error:', error);
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: 'Sorry, something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div
      className="flex flex-col h-full"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 bg-[var(--color-primary)]/10 border-2 border-dashed border-[var(--color-primary)] rounded-lg z-50 flex items-center justify-center">
          <p className="text-heading text-link">Drop PDF to upload and parse</p>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center max-w-md">
              <h2 className="text-heading-xl mb-2">Ask Prism</h2>
              <p className="text-body text-secondary mb-4">
                Upload documents and ask questions with visual citations
              </p>
              <p className="text-body-sm text-muted">
                Drag & drop a PDF or type a question below
              </p>
            </div>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onCitationClick={onCitationClick}
                onUpdatePendingMode={handleUpdatePendingMode}
                onConfirmUpload={handleConfirmUpload}
                onCancelUpload={handleCancelUpload}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-default surface-primary p-4">
        <div className="max-w-3xl mx-auto">
          <div className="relative surface-tertiary rounded-2xl flex items-end">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf"
              className="hidden"
            />

            {/* + button for file upload */}
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="p-3 text-secondary hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
              title="Upload PDF"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={selectedDocCount > 0
                ? `Ask about ${selectedDocCount} document${selectedDocCount > 1 ? 's' : ''}...`
                : "Upload a document or ask anything..."}
              className="flex-1 bg-transparent py-3 pr-12 resize-none focus:outline-none text-body"
              rows={1}
              disabled={isLoading}
            />

            <button
              onClick={() => handleSubmit()}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 bottom-2 p-2 rounded-lg bg-[var(--color-text-primary)] text-[var(--color-text-inverse)] disabled:opacity-30 disabled:cursor-not-allowed hover:opacity-80 transition-opacity"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                </svg>
              )}
            </button>
          </div>

          <p className="text-body-xs text-muted text-center mt-2">
            Drop PDF files here to upload and parse
          </p>
        </div>
      </div>
    </div>
  );
}

interface MessageBubbleProps {
  message: Message;
  onCitationClick?: (citation: Citation) => void;
  onUpdatePendingMode?: (msgId: string, mode: ProcessingMode) => void;
  onConfirmUpload?: (msgId: string) => void;
  onCancelUpload?: (msgId: string) => void;
}

function MessageBubble({ message, onCitationClick, onUpdatePendingMode, onConfirmUpload, onCancelUpload }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${isUser ? '' : 'w-full'}`}>
        {/* Pending upload card with processing options */}
        {message.pendingUpload && (
          <div className="mb-2 max-w-sm ml-auto">
            <div className="border-2 border-dashed border-[var(--color-success)] surface-secondary rounded-lg p-4">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-body-sm truncate">{message.pendingUpload.file.name}</p>
                  <p className="text-body-xs text-muted">{(message.pendingUpload.file.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={() => onCancelUpload?.(message.id)}
                  className="p-1 text-muted hover:text-error"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-3">
                <p className="text-body-xs text-muted mb-2">Processing Quality</p>
                <div className="space-y-2">
                  {[
                    { value: 'basic', label: 'Basic', desc: 'Fast, free processing', tag: 'Free' },
                    { value: 'standard', label: 'Standard', desc: 'Better tables & layouts', tag: '1 credit' },
                    { value: 'advanced', label: 'Advanced', desc: 'Scans & complex docs', tag: '2 credits' },
                  ].map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-colors ${
                        message.pendingUpload?.mode === opt.value
                          ? 'border-[var(--color-primary)] surface-tertiary'
                          : 'border-default hover:surface-tertiary'
                      }`}
                    >
                      <input
                        type="radio"
                        name={`mode-${message.id}`}
                        value={opt.value}
                        checked={message.pendingUpload?.mode === opt.value}
                        onChange={() => onUpdatePendingMode?.(message.id, opt.value as ProcessingMode)}
                        className="sr-only"
                      />
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        message.pendingUpload?.mode === opt.value
                          ? 'border-[var(--color-primary)]'
                          : 'border-[var(--color-border-strong)]'
                      }`}>
                        {message.pendingUpload?.mode === opt.value && (
                          <div className="w-2 h-2 rounded-full bg-[var(--color-primary)]" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-body-sm">{opt.label}</p>
                        <p className="text-body-xs text-muted">{opt.desc}</p>
                      </div>
                      <span className="text-body-xs text-muted">{opt.tag}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={() => onConfirmUpload?.(message.id)}
                className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-text-inverse)] rounded-lg text-body-sm font-medium hover:opacity-90 transition-opacity"
              >
                Upload Document
              </button>
            </div>
          </div>
        )}

        {/* File attachments (confirmed) */}
        {message.attachments?.map((att, i) => (
          <div key={i} className={`mb-2 ${isUser ? 'ml-auto' : ''} max-w-xs`}>
            <div className="flex items-center gap-2 surface-tertiary rounded-lg px-3 py-2">
              <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center">
                <svg className="w-5 h-5 text-error" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-body-sm truncate">{att.name}</p>
                <p className="text-body-xs text-muted">PDF</p>
              </div>
            </div>
          </div>
        ))}

        {/* Message content */}
        {(message.content || (message.thinkingSteps?.length ?? 0) > 0) && (
          <div className={`rounded-2xl px-4 py-3 ${
            isUser
              ? 'bg-[var(--color-text-primary)] text-[var(--color-text-inverse)]'
              : 'surface-tertiary'
          }`}>
            {/* Chain of thought */}
            {!isUser && message.thinkingSteps && message.thinkingSteps.length > 0 && (
              <ChainOfThought
                steps={message.thinkingSteps}
                isComplete={message.thinkingComplete || false}
                duration={message.thinkingDuration}
              />
            )}

            {/* Text content */}
            {message.content && (
              <p className={`whitespace-pre-wrap ${isUser ? 'text-base' : 'text-body'}`}>{message.content}</p>
            )}

            {/* Citations */}
            {!isUser && message.citations && message.citations.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
                <button className="flex items-center gap-1 text-body-sm text-secondary">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{message.citations.length} source{message.citations.length > 1 ? 's' : ''}</span>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  {message.citations.map((citation, j) => (
                    <button
                      key={j}
                      onClick={() => onCitationClick?.(citation)}
                      className="text-body-xs surface-primary border border-default hover:border-strong px-2 py-1 rounded-full transition-colors"
                    >
                      {citation.document_name?.replace('.pdf', '')} p.{citation.page_number}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
