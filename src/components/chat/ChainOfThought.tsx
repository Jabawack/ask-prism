'use client';

import { useState, useEffect } from 'react';
import {
  ChainOfThought as AIChainOfThought,
  ChainOfThoughtHeader,
  ChainOfThoughtContent,
  ChainOfThoughtStep,
} from '@/components/ai-elements/chain-of-thought';
import { CheckCircle2Icon, CircleDotIcon, CircleIcon, Loader2Icon } from 'lucide-react';

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
 * Uses AI Elements components under the hood.
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

  const displayDuration = duration && duration > 0 ? duration : Math.ceil(steps.length * 2);

  const getStepIcon = (status: ThinkingStep['status']) => {
    switch (status) {
      case 'complete':
        return CheckCircle2Icon;
      case 'active':
        return Loader2Icon;
      default:
        return CircleIcon;
    }
  };

  return (
    <AIChainOfThought
      open={isExpanded}
      onOpenChange={setIsExpanded}
      className="mb-2"
    >
      <ChainOfThoughtHeader>
        {isComplete ? `Processed in ${displayDuration}s` : 'Processing...'}
      </ChainOfThoughtHeader>
      <ChainOfThoughtContent>
        {steps.map((step) => (
          <ChainOfThoughtStep
            key={step.id}
            icon={getStepIcon(step.status)}
            label={step.label}
            description={step.detail}
            status={step.status}
          />
        ))}
      </ChainOfThoughtContent>
    </AIChainOfThought>
  );
}
