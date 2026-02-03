'use client';

import { useState, useCallback, useMemo } from 'react';
import { GTMTable } from '@/components/landbase-table/GTMTable';
import { DemoChat } from '@/components/landbase-table/DemoChat';
import {
  MOCK_LEADS,
  INITIAL_COLUMNS,
  parseColumnRequest,
  fetchCellValue,
  getChainOfThoughtSteps,
  type GTMLead,
  type ColumnDefinition,
} from '@/lib/landbase-table/mock-data';

interface ThoughtStep {
  text: string;
  status: 'complete' | 'active' | 'pending';
}

export default function GTMDemoPage() {
  // Table data state
  const [columns, setColumns] = useState<ColumnDefinition[]>(INITIAL_COLUMNS);
  const [data, setData] = useState<GTMLead[]>(MOCK_LEADS);
  const [cellLoadingState, setCellLoadingState] = useState<Record<string, boolean>>({});
  const [newColumns, setNewColumns] = useState<Set<string>>(new Set());

  // Chat state
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentThoughts, setCurrentThoughts] = useState<ThoughtStep[]>([]);

  // Track added columns to prevent duplicates
  const addedColumnIds = useMemo(() => new Set(columns.map((c) => c.id)), [columns]);

  // Animate through chain of thought steps
  const animateThoughts = useCallback(async (steps: string[]) => {
    // Initialize all steps as pending
    setCurrentThoughts(steps.map((text) => ({ text, status: 'pending' })));

    for (let i = 0; i < steps.length; i++) {
      // Mark current step as active
      setCurrentThoughts((prev) =>
        prev.map((step, idx) => ({
          ...step,
          status: idx < i ? 'complete' : idx === i ? 'active' : 'pending',
        }))
      );

      // Wait before moving to next step
      await new Promise((resolve) => setTimeout(resolve, 600));
    }

    // Mark all as complete
    setCurrentThoughts((prev) => prev.map((step) => ({ ...step, status: 'complete' })));
  }, []);

  // Handle adding a new column
  const handleAddColumn = useCallback(
    async (request: string) => {
      const columnInfo = parseColumnRequest(request);

      if (!columnInfo) {
        throw new Error('Could not parse column request');
      }

      if (addedColumnIds.has(columnInfo.id)) {
        throw new Error('Column already exists');
      }

      setIsProcessing(true);

      try {
        // Start chain of thought animation
        const thoughtSteps = getChainOfThoughtSteps(columnInfo.label);
        const thoughtPromise = animateThoughts(thoughtSteps);

        // Add the new column immediately
        const newColumn: ColumnDefinition = {
          id: columnInfo.id,
          label: columnInfo.label,
          accessor: columnInfo.id,
        };

        setColumns((prev) => [...prev, newColumn]);
        setNewColumns((prev) => new Set(prev).add(columnInfo.id));

        // Set all cells in the new column to loading
        const loadingState: Record<string, boolean> = {};
        MOCK_LEADS.forEach((lead) => {
          loadingState[`${lead.id}-${columnInfo.id}`] = true;
        });
        setCellLoadingState((prev) => ({ ...prev, ...loadingState }));

        // Wait for thought animation to reach "Populating cells" step
        await thoughtPromise;

        // Populate cells one by one with staggered timing
        for (let i = 0; i < MOCK_LEADS.length; i++) {
          const lead = MOCK_LEADS[i];
          const cellKey = `${lead.id}-${columnInfo.id}`;

          // Fetch the value with small delay
          const value = await fetchCellValue(lead.id, columnInfo.id, 150 + Math.random() * 150);

          // Update the data with the new value
          setData((prevData) =>
            prevData.map((d) =>
              d.id === lead.id ? { ...d, [columnInfo.id]: value } : d
            )
          );

          // Remove loading state for this cell
          setCellLoadingState((prev) => {
            const next = { ...prev };
            delete next[cellKey];
            return next;
          });
        }

        // Clear thoughts after a short delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setCurrentThoughts([]);

        // Remove from newColumns after animation completes
        setTimeout(() => {
          setNewColumns((prev) => {
            const next = new Set(prev);
            next.delete(columnInfo.id);
            return next;
          });
        }, 1000);
      } finally {
        setIsProcessing(false);
      }
    },
    [addedColumnIds, animateThoughts]
  );

  return (
    <div className="flex h-screen bg-[var(--color-bg-primary)]">
      {/* Chat panel - left side */}
      <div className="w-[400px] flex-shrink-0 border-r border-[var(--color-border)] bg-[var(--color-bg-primary)]">
        <DemoChat
          onAddColumn={handleAddColumn}
          isProcessing={isProcessing}
          currentThoughts={currentThoughts}
        />
      </div>

      {/* Table panel - right side */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Header */}
        <div className="border-b border-[var(--color-border)] p-4">
          <h1 className="text-xl font-semibold text-[var(--color-text-primary)]">
            Leads
          </h1>
          <p className="text-sm text-[var(--color-text-muted)]">
            {data.length} leads &bull; {columns.length} columns
          </p>
        </div>

        {/* Table container */}
        <div className="flex-1 overflow-auto p-4">
          <GTMTable
            columns={columns}
            data={data}
            cellLoadingState={cellLoadingState}
            newColumns={newColumns}
          />
        </div>
      </div>
    </div>
  );
}
