'use client';

import { memo } from 'react';
import { cn } from '@/lib/utils';

interface SkeletonCellProps {
  className?: string;
}

const SkeletonCellComponent = ({ className }: SkeletonCellProps) => {
  return (
    <div
      className={cn(
        'h-4 w-20 rounded bg-[var(--color-bg-tertiary)] animate-pulse',
        className
      )}
    />
  );
};

export const SkeletonCell = memo(SkeletonCellComponent);
SkeletonCell.displayName = 'SkeletonCell';
