import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseClient } from '@/lib/supabase/client';
import type { DocumentChunk } from '@/lib/supabase/types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;
    const client = getSupabaseClient();

    const { data, error } = await client
      .from('document_chunks')
      .select('id, document_id, content, chunk_index, page_number, token_count, metadata')
      .eq('document_id', id)
      .order('chunk_index', { ascending: true });

    if (error) {
      console.error('[API] Get chunks error:', error);
      return NextResponse.json(
        { error: 'Failed to get document chunks' },
        { status: 500 }
      );
    }

    // Don't return embeddings in the API response (too large)
    const chunks: Omit<DocumentChunk, 'embedding' | 'created_at'>[] = data || [];

    return NextResponse.json({ chunks });
  } catch (error) {
    console.error('[API] Get chunks error:', error);
    return NextResponse.json(
      { error: 'Failed to get document chunks' },
      { status: 500 }
    );
  }
}
