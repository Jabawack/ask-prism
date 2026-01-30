'use client';

import { useState, useEffect } from 'react';

export type ProcessingMode = 'basic' | 'standard' | 'advanced';

interface ProcessingModeOption {
  mode: ProcessingMode;
  name: string;
  description: string;
  available: boolean;
  costPerPage: string;
}

interface ProcessingModeSelectorProps {
  value: ProcessingMode;
  onChange: (mode: ProcessingMode) => void;
  disabled?: boolean;
}

export function ProcessingModeSelector({
  value,
  onChange,
  disabled = false,
}: ProcessingModeSelectorProps) {
  const [modes, setModes] = useState<ProcessingModeOption[]>([
    {
      mode: 'basic',
      name: 'Basic',
      description: 'Free, fast processing for clean text PDFs',
      available: true,
      costPerPage: 'Free',
    },
    {
      mode: 'standard',
      name: 'Standard',
      description: 'Better handling of tables and mixed layouts',
      available: false,
      costPerPage: '1 credit',
    },
    {
      mode: 'advanced',
      name: 'Advanced',
      description: 'Best for scans, handwriting, and complex documents',
      available: false,
      costPerPage: '2 credits',
    },
  ]);

  useEffect(() => {
    // Fetch available modes from the API
    fetch('/api/processing-modes')
      .then(res => res.json())
      .then(data => {
        if (data.modes) {
          setModes(data.modes);
        }
      })
      .catch(console.error);
  }, []);

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Processing Quality
      </label>

      <div className="space-y-2">
        {modes.map((option) => (
          <label
            key={option.mode}
            className={`
              flex items-start p-3 border rounded-lg cursor-pointer
              transition-colors
              ${value === option.mode
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
              }
              ${!option.available || disabled
                ? 'opacity-50 cursor-not-allowed'
                : ''
              }
            `}
          >
            <input
              type="radio"
              name="processingMode"
              value={option.mode}
              checked={value === option.mode}
              onChange={() => onChange(option.mode)}
              disabled={!option.available || disabled}
              className="mt-1 h-4 w-4 text-blue-600 border-gray-300 focus:ring-blue-500"
            />

            <div className="ml-3 flex-1">
              <div className="flex items-center justify-between">
                <span className="font-medium text-gray-900">
                  {option.name}
                </span>
                <span className={`
                  text-xs px-2 py-0.5 rounded-full
                  ${option.costPerPage === 'Free'
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-600'
                  }
                `}>
                  {option.costPerPage}
                </span>
              </div>

              <p className="text-sm text-gray-500 mt-0.5">
                {option.description}
              </p>

              {!option.available && option.mode !== 'basic' && (
                <p className="text-xs text-amber-600 mt-1">
                  Requires REDUCTO_API_KEY
                </p>
              )}
            </div>
          </label>
        ))}
      </div>

      <p className="text-xs text-gray-500">
        Basic mode uses local processing. Standard and Advanced modes use
        Reducto for better table and scan handling.
      </p>
    </div>
  );
}
