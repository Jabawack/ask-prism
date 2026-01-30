import { NextRequest, NextResponse } from 'next/server';
import { getConversation, getConversationMessages } from '@/lib/supabase/client';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const conversation = await getConversation(id);

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    const messages = await getConversationMessages(id);

    return NextResponse.json({ conversation, messages });
  } catch (error) {
    console.error('[API] Get conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to get conversation' },
      { status: 500 }
    );
  }
}
