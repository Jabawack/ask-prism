'use client';

import { memo, useState, useEffect, useRef } from 'react';
import { TableCell } from 'flowbite-react';
import { SkeletonCell } from './SkeletonCell';
import { cn } from '@/lib/utils';

interface GTMTableCellProps {
  rowId: string;
  columnId: string;
  value: unknown;
  isLoading: boolean;
  isNew?: boolean;
}

const GTMTableCellComponent = ({
  rowId,
  columnId,
  value,
  isLoading,
  isNew = false,
}: GTMTableCellProps) => {
  const [showHighlight, setShowHighlight] = useState(false);
  const wasLoadingRef = useRef(isLoading);

  // Highlight cell when it transitions from loading to loaded
  useEffect(() => {
    if (wasLoadingRef.current && !isLoading && isNew) {
      setShowHighlight(true);
      const timer = setTimeout(() => setShowHighlight(false), 600);
      return () => clearTimeout(timer);
    }
    wasLoadingRef.current = isLoading;
  }, [isLoading, isNew]);

  // Format the display value
  const displayValue = (() => {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  })();

  return (
    <TableCell
      className={cn(
        'whitespace-nowrap px-4 py-3 text-sm text-[var(--color-text-primary)] transition-all duration-150',
        showHighlight && 'bg-[var(--color-primary)]/10'
      )}
    >
      {isLoading ? <SkeletonCell /> : displayValue}
    </TableCell>
  );
};

export const GTMTableCell = memo(
  GTMTableCellComponent,
  (prev, next) =>
    prev.rowId === next.rowId &&
    prev.columnId === next.columnId &&
    prev.value === next.value &&
    prev.isLoading === next.isLoading &&
    prev.isNew === next.isNew
);

GTMTableCell.displayName = 'GTMTableCell';
