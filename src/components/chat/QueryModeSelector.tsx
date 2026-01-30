'use client';

export type ResponseMode = 'quick' | 'standard' | 'thorough';

interface QueryModeSelectorProps {
  value: ResponseMode;
  onChange: (mode: ResponseMode) => void;
  disabled?: boolean;
  compact?: boolean;
}

const modes: Array<{
  mode: ResponseMode;
  label: string;
  description: string;
  icon: string;
}> = [
  {
    mode: 'quick',
    label: 'Quick',
    description: 'Single model, fastest response',
    icon: '⚡',
  },
  {
    mode: 'standard',
    label: 'Standard',
    description: 'Verified by a second model',
    icon: '✓',
  },
  {
    mode: 'thorough',
    label: 'Thorough',
    description: 'Multi-model with reconciliation',
    icon: '🔍',
  },
];

export function QueryModeSelector({
  value,
  onChange,
  disabled = false,
  compact = false,
}: QueryModeSelectorProps) {
  if (compact) {
    return (
      <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
        {modes.map((option) => (
          <button
            key={option.mode}
            onClick={() => onChange(option.mode)}
            disabled={disabled}
            className={`
              flex items-center px-2 py-1 rounded text-sm transition-colors
              ${value === option.mode
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            title={option.description}
          >
            <span className="mr-1">{option.icon}</span>
            <span>{option.label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Response Quality
      </label>

      <div className="flex space-x-2">
        {modes.map((option) => (
          <button
            key={option.mode}
            onClick={() => onChange(option.mode)}
            disabled={disabled}
            className={`
              flex-1 flex flex-col items-center p-3 border rounded-lg
              transition-colors
              ${value === option.mode
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300 text-gray-600'
              }
              ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            <span className="text-2xl mb-1">{option.icon}</span>
            <span className="font-medium text-sm">{option.label}</span>
            <span className="text-xs text-center mt-1 opacity-75">
              {option.description}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
