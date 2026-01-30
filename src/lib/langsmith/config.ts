import { Client } from 'langsmith';
import { traceable } from 'langsmith/traceable';
import { wrapOpenAI } from 'langsmith/wrappers';
import OpenAI from 'openai';

let langsmithClient: Client | null = null;

export function getLangSmithClient(): Client | null {
  if (!process.env.LANGCHAIN_API_KEY) {
    return null;
  }

  if (!langsmithClient) {
    langsmithClient = new Client({
      apiKey: process.env.LANGCHAIN_API_KEY,
    });
  }

  return langsmithClient;
}

export function getTracedOpenAI(): OpenAI {
  const openai = new OpenAI();
  return wrapOpenAI(openai);
}

export function isTracingEnabled(): boolean {
  return (
    process.env.LANGCHAIN_TRACING_V2 === 'true' &&
    !!process.env.LANGCHAIN_API_KEY
  );
}

export interface TraceMetadata {
  conversation_id?: string;
  document_ids?: string[];
  user_id?: string;
  cache_hit?: boolean;
  query_intent?: string;
}

export function createTraceable<T extends (...args: unknown[]) => unknown>(
  fn: T,
  name: string,
  metadata?: TraceMetadata
): T {
  if (!isTracingEnabled()) {
    return fn;
  }

  return traceable(fn, {
    name,
    metadata,
  }) as T;
}

export async function logFeedback(
  runId: string,
  score: number,
  comment?: string
): Promise<void> {
  const client = getLangSmithClient();
  if (!client) return;

  try {
    await client.createFeedback(runId, 'user_rating', {
      score,
      comment,
    });
  } catch (error) {
    console.error('[LangSmith] Failed to log feedback:', error);
  }
}

export async function getRunUrl(runId: string): Promise<string | null> {
  const projectName = process.env.LANGCHAIN_PROJECT || 'ask-prism';

  if (!process.env.LANGCHAIN_API_KEY) {
    return null;
  }

  return `https://smith.langchain.com/o/default/projects/p/${projectName}/runs/${runId}`;
}
