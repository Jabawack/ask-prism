// Dynamic field discovery - tracks new fields found in documents

import { getSupabaseClient } from '@/lib/supabase/client';
import type { PendingField } from '@/lib/supabase/types';

const DEFAULT_THRESHOLD = 50;
const MAX_SAMPLE_VALUES = 10;

/**
 * Track a new field occurrence in the pending_fields table.
 * Uses an upsert pattern to increment occurrences atomically.
 */
export async function trackField(
  fieldName: string,
  value: string,
  options?: {
    docType?: string;
    firmName?: string;
  }
): Promise<PendingField> {
  const client = getSupabaseClient();

  // Use the database function for atomic upsert
  const { data, error } = await client.rpc('increment_pending_field', {
    p_field_name: fieldName,
    p_sample_value: value,
    p_doc_type: options?.docType || null,
    p_firm_name: options?.firmName || null,
  });

  if (error) {
    throw new Error(`Failed to track field: ${error.message}`);
  }

  return data;
}

/**
 * Get all pending fields that have reached their threshold.
 */
export async function getFieldsAtThreshold(): Promise<PendingField[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('pending_fields')
    .select('*')
    .eq('status', 'pending')
    .gte('occurrences', DEFAULT_THRESHOLD)
    .order('occurrences', { ascending: false });

  if (error) {
    throw new Error(`Failed to get threshold fields: ${error.message}`);
  }

  return data || [];
}

/**
 * Get all pending fields with their status.
 */
export async function getAllPendingFields(): Promise<PendingField[]> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('pending_fields')
    .select('*')
    .order('occurrences', { ascending: false });

  if (error) {
    throw new Error(`Failed to get pending fields: ${error.message}`);
  }

  return data || [];
}

/**
 * Promote a pending field to the schema.
 */
export async function promoteField(fieldId: string): Promise<PendingField> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('pending_fields')
    .update({
      status: 'promoted',
      promoted_at: new Date().toISOString(),
    })
    .eq('id', fieldId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to promote field: ${error.message}`);
  }

  return data;
}

/**
 * Ignore a pending field (continues tracking at reduced weight).
 */
export async function ignoreField(
  fieldId: string,
  weight = 0.5
): Promise<PendingField> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('pending_fields')
    .update({
      status: 'ignored',
      ignored_at: new Date().toISOString(),
      ignore_weight: weight,
    })
    .eq('id', fieldId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to ignore field: ${error.message}`);
  }

  return data;
}

/**
 * Dismiss a pending field permanently (stops tracking).
 */
export async function dismissField(fieldId: string): Promise<void> {
  const client = getSupabaseClient();

  const { error } = await client
    .from('pending_fields')
    .update({ status: 'dismissed' })
    .eq('id', fieldId);

  if (error) {
    throw new Error(`Failed to dismiss field: ${error.message}`);
  }
}

/**
 * Re-promote an ignored field back to pending.
 */
export async function unpromoteField(fieldId: string): Promise<PendingField> {
  const client = getSupabaseClient();

  const { data, error } = await client
    .from('pending_fields')
    .update({
      status: 'pending',
      ignored_at: null,
      promoted_at: null,
    })
    .eq('id', fieldId)
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to unpromote field: ${error.message}`);
  }

  return data;
}

/**
 * Extract potential new fields from document content using LLM.
 * This would typically run during document processing.
 */
export async function extractFieldsFromContent(
  content: string,
  docType?: string
): Promise<Array<{ name: string; value: string }>> {
  // This is a placeholder - in production, you'd use an LLM to extract fields
  // For now, use simple regex patterns for common financial fields

  const patterns: Array<{ name: string; pattern: RegExp }> = [
    { name: 'account_number', pattern: /(?:account\s*(?:no\.?|number|#)?:?\s*)(\d{4,12})/i },
    { name: 'routing_number', pattern: /(?:routing\s*(?:no\.?|number|#)?:?\s*)(\d{9})/i },
    { name: 'swift_code', pattern: /(?:swift\s*(?:code)?:?\s*)([A-Z]{6}[A-Z0-9]{2,5})/i },
    { name: 'tax_id', pattern: /(?:tax\s*id|ein|ssn):?\s*(\d{2}-?\d{7}|\d{3}-?\d{2}-?\d{4})/i },
    { name: 'invoice_number', pattern: /(?:invoice\s*(?:no\.?|number|#)?:?\s*)([A-Z0-9-]{4,20})/i },
    { name: 'po_number', pattern: /(?:po|purchase\s*order)\s*(?:no\.?|number|#)?:?\s*([A-Z0-9-]{4,20})/i },
    { name: 'total_amount', pattern: /(?:total|amount\s*due|balance):?\s*\$?([\d,]+\.?\d{0,2})/i },
  ];

  const extracted: Array<{ name: string; value: string }> = [];

  for (const { name, pattern } of patterns) {
    const match = content.match(pattern);
    if (match && match[1]) {
      extracted.push({ name, value: match[1].trim() });
    }
  }

  return extracted;
}

/**
 * Process extracted fields - track new ones, update existing.
 */
export async function processExtractedFields(
  documentId: string,
  fields: Array<{ name: string; value: string }>,
  options?: {
    docType?: string;
    firmName?: string;
  }
): Promise<{
  tracked: string[];
  thresholdReached: PendingField[];
}> {
  const tracked: string[] = [];
  const thresholdReached: PendingField[] = [];

  for (const field of fields) {
    try {
      const result = await trackField(field.name, field.value, options);
      tracked.push(field.name);

      // Check if this field just reached threshold
      if (result.status === 'pending' && result.occurrences >= (result.threshold || DEFAULT_THRESHOLD)) {
        thresholdReached.push(result);
      }
    } catch (error) {
      console.error(`Failed to track field ${field.name}:`, error);
    }
  }

  return { tracked, thresholdReached };
}
