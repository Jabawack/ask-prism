'use client';

import { useState, useEffect } from 'react';
import { FieldDiscoveryNotifications } from '@/components/analytics/FieldDiscoveryNotifications';
import type { PendingField } from '@/lib/supabase/types';

interface AccuracyStats {
  total: number;
  correct: number;
  accuracy: number;
  avgConfidence: number;
  avgLatencyMs: number;
}

interface VerificationStats {
  total: number;
  agreed: number;
  disagreed: number;
  agreementRate: number;
  reconciliations: number;
}

interface Stats {
  overall: AccuracyStats;
  byMode: Record<string, AccuracyStats>;
  verification: VerificationStats;
}

export default function AnalyticsPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [fields, setFields] = useState<PendingField[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [statsRes, fieldsRes] = await Promise.all([
        fetch('/api/analytics/stats'),
        fetch('/api/analytics/fields'),
      ]);

      const statsData = await statsRes.json();
      const fieldsData = await fieldsRes.json();

      setStats(statsData);
      setFields(fieldsData.fields || []);
    } catch (err) {
      setError('Failed to load analytics data');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
            <p className="text-gray-600">Accuracy tracking and field discovery</p>
          </div>
          <a
            href="/chat"
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Chat
          </a>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 space-y-8">
        {/* Overall Stats */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Overall Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Total Answers"
              value={stats?.overall.total || 0}
              icon="📊"
            />
            <StatCard
              title="Accuracy"
              value={`${((stats?.overall.accuracy || 0) * 100).toFixed(1)}%`}
              subtitle={`${stats?.overall.correct || 0} correct`}
              icon="✓"
            />
            <StatCard
              title="Avg Confidence"
              value={`${((stats?.overall.avgConfidence || 0) * 100).toFixed(1)}%`}
              icon="🎯"
            />
            <StatCard
              title="Avg Latency"
              value={`${((stats?.overall.avgLatencyMs || 0) / 1000).toFixed(1)}s`}
              icon="⚡"
            />
          </div>
        </section>

        {/* Verification Stats */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Verification Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatCard
              title="Verified"
              value={stats?.verification.total || 0}
              icon="🔍"
            />
            <StatCard
              title="Agreement Rate"
              value={`${((stats?.verification.agreementRate || 0) * 100).toFixed(1)}%`}
              subtitle={`${stats?.verification.agreed || 0} agreed`}
              icon="🤝"
            />
            <StatCard
              title="Disagreements"
              value={stats?.verification.disagreed || 0}
              icon="⚠️"
            />
            <StatCard
              title="Reconciliations"
              value={stats?.verification.reconciliations || 0}
              icon="⚖️"
            />
          </div>
        </section>

        {/* By Mode Stats */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Performance by Mode</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {['quick', 'standard', 'thorough'].map((mode) => {
              const modeStats = stats?.byMode[mode];
              return (
                <div key={mode} className="bg-white rounded-lg border p-4">
                  <h3 className="font-medium text-gray-900 capitalize mb-3">
                    {mode} Mode
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total</span>
                      <span className="font-medium">{modeStats?.total || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Accuracy</span>
                      <span className="font-medium">
                        {((modeStats?.accuracy || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Latency</span>
                      <span className="font-medium">
                        {((modeStats?.avgLatencyMs || 0) / 1000).toFixed(1)}s
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Pending Fields */}
        <section>
          <h2 className="text-xl font-semibold mb-4">
            Pending Fields ({fields.filter(f => f.status === 'pending').length})
          </h2>
          <div className="bg-white rounded-lg border overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Field</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Occurrences</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Threshold</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Status</th>
                  <th className="text-left px-4 py-3 text-sm font-medium text-gray-500">Doc Types</th>
                </tr>
              </thead>
              <tbody>
                {fields.map((field) => (
                  <tr key={field.id} className="border-t">
                    <td className="px-4 py-3 font-medium">{field.field_name}</td>
                    <td className="px-4 py-3">{field.occurrences}</td>
                    <td className="px-4 py-3">{field.threshold}</td>
                    <td className="px-4 py-3">
                      <span className={`
                        text-xs px-2 py-1 rounded-full
                        ${field.status === 'promoted' ? 'bg-green-100 text-green-700' :
                          field.status === 'ignored' ? 'bg-yellow-100 text-yellow-700' :
                          field.status === 'pending' ? 'bg-blue-100 text-blue-700' :
                          'bg-gray-100 text-gray-700'}
                      `}>
                        {field.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {field.doc_types?.join(', ') || '-'}
                    </td>
                  </tr>
                ))}
                {fields.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                      No pending fields discovered yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* Field Discovery Notifications */}
      <FieldDiscoveryNotifications onAction={() => fetchData()} />
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: string;
}

function StatCard({ title, value, subtitle, icon }: StatCardProps) {
  return (
    <div className="bg-white rounded-lg border p-4">
      <div className="flex items-center space-x-3">
        <span className="text-2xl">{icon}</span>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {subtitle && (
            <p className="text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      </div>
    </div>
  );
}
