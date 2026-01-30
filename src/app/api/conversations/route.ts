import { NextRequest, NextResponse } from 'next/server';
import { createConversation, listConversations } from '@/lib/supabase/client';

const DEMO_USER_ID = 'demo-user';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { document_ids, title } = body;

    if (!document_ids || !Array.isArray(document_ids) || document_ids.length === 0) {
      return NextResponse.json(
        { error: 'At least one document_id is required' },
        { status: 400 }
      );
    }

    const conversation = await createConversation({
      user_id: DEMO_USER_ID,
      document_ids,
      title,
    });

    return NextResponse.json({ conversation }, { status: 201 });
  } catch (error) {
    console.error('[API] Create conversation error:', error);
    return NextResponse.json(
      { error: 'Failed to create conversation' },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const conversations = await listConversations(DEMO_USER_ID);
    return NextResponse.json({ conversations });
  } catch (error) {
    console.error('[API] List conversations error:', error);
    return NextResponse.json(
      { error: 'Failed to list conversations' },
      { status: 500 }
    );
  }
}
