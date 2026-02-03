'use client';

import { memo } from 'react';
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
  value,
  isLoading,
  isNew = false,
}: GTMTableCellProps) => {
  // Format the display value
  const displayValue = (() => {
    if (value === undefined || value === null) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  })();

  return (
    <TableCell
      className={cn(
        'whitespace-nowrap px-4 py-3 text-sm text-[var(--color-text-primary)]',
        isNew && !isLoading && 'animate-in fade-in-0 duration-300'
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
