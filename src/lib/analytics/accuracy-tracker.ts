// Accuracy tracking for parse and answer quality

import { getSupabaseClient } from '@/lib/supabase/client';
import type { AnswerRecord, UserFeedback } from '@/lib/supabase/types';

/**
 * Store an answer record for analytics tracking.
 */
export async function storeAnswerRecord(
  record: Omit<AnswerRecord, 'id' | 'created_at'>
): Promise<AnswerRecord> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('answer_records')
    .insert(record)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to store answer record: ${error.message}`);
  }

  return data;
}

/**
 * Record user feedback for an answer.
 */
export async function recordUserFeedback(
  answerRecordId: string,
  feedback: UserFeedback
): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('answer_records')
    .update({ user_feedback: feedback })
    .eq('id', answerRecordId);

  if (error) {
    throw new Error(`Failed to record feedback: ${error.message}`);
  }
}

/**
 * Get accuracy statistics by various dimensions.
 */
export interface AccuracyStats {
  total: number;
  correct: number;
  accuracy: number;
  avgConfidence: number;
  avgLatencyMs: number;
}

export async function getAccuracyStats(
  filter?: {
    docType?: string;
    firmName?: string;
    model?: string;
    responseMode?: string;
    dateFrom?: Date;
    dateTo?: Date;
  }
): Promise<AccuracyStats> {
  const client = getSupabaseClient();

  let query = client
    .from('answer_records')
    .select('confidence, response_time_ms, user_feedback');

  // Apply filters
  if (filter?.responseMode) {
    query = query.eq('response_mode', filter.responseMode);
  }
  if (filter?.dateFrom) {
    query = query.gte('created_at', filter.dateFrom.toISOString());
  }
  if (filter?.dateTo) {
    query = query.lte('created_at', filter.dateTo.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get accuracy stats: ${error.message}`);
  }

  const records = data || [];
  const total = records.length;

  if (total === 0) {
    return {
      total: 0,
      correct: 0,
      accuracy: 0,
      avgConfidence: 0,
      avgLatencyMs: 0,
    };
  }

  // Calculate stats from feedback
  const withFeedback = records.filter(r => r.user_feedback?.correct !== undefined);
  const correct = withFeedback.filter(r => r.user_feedback?.correct === true).length;

  const confidences = records
    .filter(r => r.confidence !== null)
    .map(r => r.confidence as number);

  const latencies = records
    .filter(r => r.response_time_ms !== null)
    .map(r => r.response_time_ms as number);

  return {
    total,
    correct,
    accuracy: withFeedback.length > 0 ? correct / withFeedback.length : 0,
    avgConfidence: confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0,
    avgLatencyMs: latencies.length > 0
      ? latencies.reduce((a, b) => a + b, 0) / latencies.length
      : 0,
  };
}

/**
 * Get accuracy breakdown by response mode.
 */
export async function getAccuracyByMode(): Promise<Record<string, AccuracyStats>> {
  const modes = ['quick', 'standard', 'thorough'];
  const result: Record<string, AccuracyStats> = {};

  for (const mode of modes) {
    result[mode] = await getAccuracyStats({ responseMode: mode });
  }

  return result;
}

/**
 * Get verification agreement rate.
 */
export async function getVerificationStats(): Promise<{
  total: number;
  agreed: number;
  disagreed: number;
  agreementRate: number;
  reconciliations: number;
}> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('answer_records')
    .select('verification, reconciliation')
    .not('verification', 'is', null);

  if (error) {
    throw new Error(`Failed to get verification stats: ${error.message}`);
  }

  const records = data || [];
  const total = records.length;

  if (total === 0) {
    return {
      total: 0,
      agreed: 0,
      disagreed: 0,
      agreementRate: 0,
      reconciliations: 0,
    };
  }

  const agreed = records.filter(r => r.verification?.agrees === true).length;
  const disagreed = total - agreed;
  const reconciliations = records.filter(r => r.reconciliation !== null).length;

  return {
    total,
    agreed,
    disagreed,
    agreementRate: agreed / total,
    reconciliations,
  };
}

/**
 * Get recent answer records for review.
 */
export async function getRecentAnswers(
  limit = 50,
  includeWithFeedback = true
): Promise<AnswerRecord[]> {
  const client = getSupabaseClient();

  let query = client
    .from('answer_records')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (!includeWithFeedback) {
    query = query.is('user_feedback', null);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Failed to get recent answers: ${error.message}`);
  }

  return data || [];
}

/**
 * Get answers that need review (disagreements without feedback).
 */
export async function getAnswersNeedingReview(limit = 20): Promise<AnswerRecord[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('answer_records')
    .select('*')
    .is('user_feedback', null)
    .not('reconciliation', 'is', null)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to get answers needing review: ${error.message}`);
  }

  return data || [];
}
