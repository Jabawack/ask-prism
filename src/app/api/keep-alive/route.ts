import { NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import { Redis } from '@upstash/redis';

export async function GET() {
  const results: Record<string, string> = {};

  // Ping Supabase
  try {
    const supabase = getSupabaseClient();
    const { count, error } = await supabase
      .from('documents')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    results.supabase = `ok (${count} documents)`;
  } catch (e) {
    results.supabase = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  // Ping Upstash Redis
  try {
    if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
      results.redis = 'skipped (not configured)';
    } else {
      const redis = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      const pong = await redis.ping();
      results.redis = `ok (${pong})`;
    }
  } catch (e) {
    results.redis = `error: ${e instanceof Error ? e.message : 'unknown'}`;
  }

  return NextResponse.json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    services: results,
  });
}
