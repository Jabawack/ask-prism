'use client';

import { ProcessingStepper } from './ProcessingStepper';
import type { DocumentProgress } from '@/hooks/useDocumentProgress';

interface ProcessingDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  progress: DocumentProgress | null;
  filename: string;
}

export function ProcessingDrawer({
  isOpen,
  onClose,
  progress,
  filename,
}: ProcessingDrawerProps) {
  if (!isOpen || !progress) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/20 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed right-0 top-0 h-full w-80 bg-white shadow-xl z-50 transform transition-transform duration-300 ease-out ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <h2 className="font-semibold text-gray-900">Processing Status</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded-full transition-colors"
          >
            <svg className="w-5 h-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto h-[calc(100%-56px)]">
          <ProcessingStepper progress={progress} filename={filename} />
        </div>
      </div>
    </>
  );
}
