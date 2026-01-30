import { NextResponse } from 'next/server';
import { getAvailableModes } from '@/lib/processing/parser-factory';

export async function GET() {
  try {
    const modes = getAvailableModes();
    return NextResponse.json({ modes });
  } catch (error) {
    console.error('Error getting processing modes:', error);
    return NextResponse.json(
      { error: 'Failed to get processing modes' },
      { status: 500 }
    );
  }
}
