'use client';

import { memo, useMemo, useCallback } from 'react';
import { Table, TableBody, TableHead, TableHeadCell, TableRow } from 'flowbite-react';
import { GTMTableCell } from './GTMTableCell';
import type { GTMLead, ColumnDefinition } from '@/lib/landbase-table/mock-data';

interface GTMTableProps {
  columns: ColumnDefinition[];
  data: GTMLead[];
  cellLoadingState: Record<string, boolean>;
  newColumns: Set<string>;
}

interface MemoizedRowProps {
  row: GTMLead;
  columns: ColumnDefinition[];
  cellLoadingState: Record<string, boolean>;
  newColumns: Set<string>;
}

const MemoizedRow = memo(
  function MemoizedRow({ row, columns, cellLoadingState, newColumns }: MemoizedRowProps) {
    return (
      <TableRow className="border-b border-[var(--color-border)] bg-[var(--color-bg-primary)] hover:bg-[var(--color-bg-secondary)]">
        {columns.map((col) => {
          const cellKey = `${row.id}-${col.id}`;
          const isLoading = cellLoadingState[cellKey] ?? false;
          const isNew = newColumns.has(col.id);
          const value = row[col.accessor];

          return (
            <GTMTableCell
              key={cellKey}
              rowId={row.id}
              columnId={col.id}
              value={value}
              isLoading={isLoading}
              isNew={isNew}
            />
          );
        })}
      </TableRow>
    );
  },
  (prev, next) => {
    // Check if row data changed
    if (prev.row !== next.row) return false;
    // Check if columns changed
    if (prev.columns !== next.columns) return false;
    // Check if newColumns changed
    if (prev.newColumns !== next.newColumns) return false;
    // Check if any cell loading state changed for this row
    for (const col of prev.columns) {
      const prevKey = `${prev.row.id}-${col.id}`;
      const nextKey = `${next.row.id}-${col.id}`;
      if (prev.cellLoadingState[prevKey] !== next.cellLoadingState[nextKey]) {
        return false;
      }
    }
    return true;
  }
);

const GTMTableComponent = ({
  columns,
  data,
  cellLoadingState,
  newColumns,
}: GTMTableProps) => {
  // Memoize the header
  const tableHeader = useMemo(
    () => (
      <TableHead className="bg-[var(--color-bg-secondary)]">
        <TableRow>
          {columns.map((col) => (
            <TableHeadCell
              key={col.id}
              className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-secondary)]"
            >
              {col.label}
            </TableHeadCell>
          ))}
        </TableRow>
      </TableHead>
    ),
    [columns]
  );

  // Memoize row renderer
  const renderRows = useCallback(
    () =>
      data.map((row) => (
        <MemoizedRow
          key={row.id}
          row={row}
          columns={columns}
          cellLoadingState={cellLoadingState}
          newColumns={newColumns}
        />
      )),
    [data, columns, cellLoadingState, newColumns]
  );

  return (
    <div className="overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <Table className="min-w-full">
        {tableHeader}
        <TableBody className="divide-y divide-[var(--color-border)]">
          {renderRows()}
        </TableBody>
      </Table>
    </div>
  );
};

export const GTMTable = memo(GTMTableComponent);
GTMTable.displayName = 'GTMTable';
