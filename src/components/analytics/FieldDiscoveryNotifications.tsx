'use client';

import { useState, useEffect } from 'react';
import type { PendingField } from '@/lib/supabase/types';

interface FieldDiscoveryNotificationsProps {
  onAction?: (fieldId: string, action: 'promote' | 'ignore' | 'dismiss') => void;
}

export function FieldDiscoveryNotifications({
  onAction,
}: FieldDiscoveryNotificationsProps) {
  const [fields, setFields] = useState<PendingField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    fetchThresholdFields();
  }, []);

  const fetchThresholdFields = async () => {
    try {
      const res = await fetch('/api/analytics/fields?status=threshold');
      const data = await res.json();
      setFields(data.fields || []);
    } catch (err) {
      setError('Failed to load field notifications');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = async (
    fieldId: string,
    action: 'promote' | 'ignore' | 'dismiss'
  ) => {
    try {
      await fetch('/api/analytics/fields', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fieldId, action }),
      });

      // Remove from local state
      setFields((prev) => prev.filter((f) => f.id !== fieldId));
      onAction?.(fieldId, action);
    } catch (err) {
      console.error('Failed to update field:', err);
    }
  };

  if (isLoading || error || fields.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {/* Notification badge */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-blue-600 text-white rounded-full p-3 shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <span className="text-lg">📊</span>
          <span className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {fields.length}
          </span>
        </button>
      )}

      {/* Expanded panel */}
      {isExpanded && (
        <div className="bg-white rounded-lg shadow-xl border max-w-md max-h-96 overflow-hidden">
          <div className="flex items-center justify-between bg-gray-50 border-b px-4 py-3">
            <h3 className="font-semibold text-gray-900">
              Field Discovery ({fields.length})
            </h3>
            <button
              onClick={() => setIsExpanded(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>

          <div className="overflow-y-auto max-h-72">
            {fields.map((field) => (
              <FieldNotificationCard
                key={field.id}
                field={field}
                onAction={handleAction}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface FieldNotificationCardProps {
  field: PendingField;
  onAction: (fieldId: string, action: 'promote' | 'ignore' | 'dismiss') => void;
}

function FieldNotificationCard({ field, onAction }: FieldNotificationCardProps) {
  return (
    <div className="p-4 border-b last:border-b-0">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="text-lg">🆕</span>
            <span className="font-medium text-gray-900">{field.field_name}</span>
          </div>

          <p className="text-sm text-gray-600 mt-1">
            Found in <span className="font-medium">{field.occurrences}</span> documents
          </p>

          {field.doc_types && field.doc_types.length > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              Doc types: {field.doc_types.join(', ')}
            </p>
          )}

          {field.sample_values && field.sample_values.length > 0 && (
            <div className="mt-2">
              <p className="text-xs text-gray-500">Sample values:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {field.sample_values.slice(0, 3).map((value, i) => (
                  <span
                    key={i}
                    className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                  >
                    {value.length > 20 ? value.slice(0, 20) + '...' : value}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex space-x-2 mt-3">
        <button
          onClick={() => onAction(field.id, 'promote')}
          className="flex-1 text-sm bg-green-600 text-white px-3 py-1.5 rounded hover:bg-green-700 transition-colors"
        >
          Add to Schema
        </button>
        <button
          onClick={() => onAction(field.id, 'ignore')}
          className="flex-1 text-sm bg-gray-200 text-gray-700 px-3 py-1.5 rounded hover:bg-gray-300 transition-colors"
        >
          Ignore
        </button>
        <button
          onClick={() => onAction(field.id, 'dismiss')}
          className="text-sm text-gray-400 px-2 py-1.5 hover:text-gray-600 transition-colors"
          title="Dismiss permanently"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
