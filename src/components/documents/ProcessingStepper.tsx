'use client';

import type { DocumentProgress } from '@/hooks/useDocumentProgress';
import type { ProcessingEventType } from '@/lib/processing/types';

interface Step {
  id: ProcessingEventType;
  label: string;
  activeLabel: string;
}

const STEPS: Step[] = [
  { id: 'started', label: 'Starting', activeLabel: 'Starting...' },
  { id: 'parsing', label: 'Parse PDF', activeLabel: 'Parsing PDF...' },
  { id: 'chunking', label: 'Create chunks', activeLabel: 'Creating chunks...' },
  { id: 'embedding', label: 'Generate embeddings', activeLabel: 'Generating embeddings...' },
  { id: 'storing', label: 'Save to database', activeLabel: 'Saving to database...' },
  { id: 'complete', label: 'Ready', activeLabel: 'Complete' },
];

const STEP_ORDER: ProcessingEventType[] = [
  'started',
  'parsing',
  'parsing_complete',
  'chunking',
  'chunking_complete',
  'embedding',
  'embedding_progress',
  'storing',
  'complete',
];

function getStepIndex(eventType: ProcessingEventType | null): number {
  if (!eventType) return -1;

  // Map event types to step indices
  const mapping: Record<ProcessingEventType, number> = {
    started: 0,
    parsing: 1,
    parsing_complete: 1,
    chunking: 2,
    chunking_complete: 2,
    embedding: 3,
    embedding_progress: 3,
    storing: 4,
    complete: 5,
    error: -1,
  };

  return mapping[eventType] ?? -1;
}

interface ProcessingStepperProps {
  progress: DocumentProgress;
  filename: string;
}

export function ProcessingStepper({ progress, filename }: ProcessingStepperProps) {
  const currentStepIndex = getStepIndex(progress.status);
  const isError = progress.isError;
  const allDone = progress.isComplete;

  return (
    <div className="p-4">
      <h3 className="font-medium text-gray-900 mb-1 truncate" title={filename}>
        Processing: {filename}
      </h3>

      {progress.message && (
        <p className="text-sm text-gray-600 mb-4">{progress.message}</p>
      )}

      <div className="space-y-1">
        {STEPS.map((step, index) => {
          const isCompleted = allDone || index < currentStepIndex;
          const isCurrent = !allDone && index === currentStepIndex && !isError;
          const isPending = index > currentStepIndex;

          return (
            <div key={step.id} className="flex items-start gap-3">
              {/* Step indicator */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                    isError && isCurrent
                      ? 'bg-red-100 text-red-600 border-2 border-red-500'
                      : isCompleted
                      ? 'bg-green-500 text-white'
                      : isCurrent
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {isCompleted ? (
                    <CheckIcon />
                  ) : isCurrent && isError ? (
                    <XIcon />
                  ) : isCurrent ? (
                    <SpinnerIcon />
                  ) : (
                    index + 1
                  )}
                </div>
                {/* Connector line */}
                {index < STEPS.length - 1 && (
                  <div
                    className={`w-0.5 h-6 ${
                      isCompleted ? 'bg-green-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>

              {/* Step content */}
              <div className="flex-1 min-w-0 pb-4">
                <p
                  className={`text-sm font-medium ${
                    isError && isCurrent
                      ? 'text-red-600'
                      : isCurrent
                      ? 'text-blue-600'
                      : isCompleted
                      ? 'text-green-600'
                      : 'text-gray-500'
                  }`}
                >
                  {isCurrent ? step.activeLabel : step.label}
                </p>

                {/* Progress details for current step */}
                {isCurrent && progress.details && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {progress.details.pageCount && `${progress.details.pageCount} pages`}
                    {progress.details.chunkCount && ` • ${progress.details.chunkCount} chunks`}
                    {progress.details.embeddedCount && progress.details.totalChunks &&
                      ` • ${progress.details.embeddedCount}/${progress.details.totalChunks}`}
                  </p>
                )}

                {/* Embedding progress bar */}
                {isCurrent && step.id === 'embedding' && progress.progress > 0 && (
                  <div className="mt-2 w-full max-w-48">
                    <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 transition-all duration-300"
                        style={{ width: `${Math.min(100, Math.max(0, (progress.progress - 40) * 2))}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Error message */}
                {isError && isCurrent && progress.details?.error && (
                  <p className="text-xs text-red-500 mt-1">{progress.details.error}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CheckIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
    </svg>
  );
}

function XIcon() {
  return (
    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg className="w-3.5 h-3.5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}
