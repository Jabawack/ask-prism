import { Redis } from '@upstash/redis';
import { Citation } from '@/lib/supabase/types';
import crypto from 'crypto';

let redisClient: Redis | null = null;

function getRedisClient(): Redis | null {
  if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }

  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }

  return redisClient;
}

export interface CachedResponse {
  response: string;
  citations: Citation[];
  model_used: string;
  cached_at: string;
}

const CACHE_TTL_SECONDS = 24 * 60 * 60; // 24 hours
const CACHE_PREFIX = 'qa:';

export function generateCacheKey(
  query: string,
  documentIds: string[]
): string {
  const normalizedQuery = query.toLowerCase().trim();
  const sortedDocIds = [...documentIds].sort().join(',');
  const input = `${normalizedQuery}:${sortedDocIds}`;

  return CACHE_PREFIX + crypto.createHash('sha256').update(input).digest('hex').slice(0, 16);
}

export async function getCachedResponse(
  cacheKey: string
): Promise<CachedResponse | null> {
  const redis = getRedisClient();
  if (!redis) return null;

  try {
    const cached = await redis.get<CachedResponse>(cacheKey);
    return cached;
  } catch (error) {
    console.error('[Cache] Get error:', error);
    return null;
  }
}

export async function setCachedResponse(
  cacheKey: string,
  response: CachedResponse
): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    await redis.set(cacheKey, response, { ex: CACHE_TTL_SECONDS });
  } catch (error) {
    console.error('[Cache] Set error:', error);
  }
}

export async function invalidateDocumentCache(documentId: string): Promise<void> {
  const redis = getRedisClient();
  if (!redis) return;

  try {
    const pattern = `${CACHE_PREFIX}*`;
    const keys = await redis.keys(pattern);

    // Note: In production, you'd want a more efficient invalidation strategy
    // like storing document IDs in the cache metadata
    console.log(`[Cache] Would invalidate ${keys.length} keys for document ${documentId}`);
  } catch (error) {
    console.error('[Cache] Invalidate error:', error);
  }
}

export function isCachingEnabled(): boolean {
  return !!(
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  );
}
