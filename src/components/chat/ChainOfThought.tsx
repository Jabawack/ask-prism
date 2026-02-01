'use client';

import { useState, useEffect } from 'react';

export interface ThinkingStep {
  id: string;
  label: string;
  status: 'pending' | 'active' | 'complete';
  detail?: string;
}

interface ChainOfThoughtProps {
  steps: ThinkingStep[];
  isComplete: boolean;
  duration?: number;
}

/**
 * Collapsible chain of thought display - ChatGPT style.
 * Shows thinking steps during processing, auto-collapses when complete.
 */
export function ChainOfThought({ steps, isComplete, duration }: ChainOfThoughtProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  // Auto-collapse when complete
  useEffect(() => {
    if (isComplete) {
      const timer = setTimeout(() => setIsExpanded(false), 500);
      return () => clearTimeout(timer);
    }
  }, [isComplete]);

  if (steps.length === 0) return null;

  const activeStep = steps.find(s => s.status === 'active');

  return (
    <div className="mb-2">
      {/* Collapsed header - clickable */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center gap-2 text-body-sm text-secondary hover:text-[var(--color-text-primary)] transition-colors"
      >
        {isComplete ? (
          <>
            <svg className="w-4 h-4 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Processed in {duration || Math.ceil(steps.length * 2)}s</span>
          </>
        ) : (
          <>
            <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
            <span>Processing...</span>
          </>
        )}
        <svg
          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Expanded steps */}
      {isExpanded && (
        <div className="mt-2 pl-2 border-l-2 border-default space-y-1">
          {steps.map((step) => (
            <div key={step.id} className="flex items-start gap-2 text-body-sm">
              {step.status === 'complete' ? (
                <svg className="w-4 h-4 text-success mt-0.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              ) : step.status === 'active' ? (
                <div className="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin mt-0.5 shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border-2 border-default mt-0.5 shrink-0" />
              )}
              <div>
                <span className={step.status === 'complete' ? 'text-secondary' : step.status === 'active' ? '' : 'text-muted'}>
                  {step.label}
                </span>
                {step.detail && step.status === 'active' && (
                  <p className="text-body-xs text-muted mt-0.5">{step.detail}</p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
