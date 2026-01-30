import { NextResponse } from 'next/server';
import {
  getAccuracyStats,
  getAccuracyByMode,
  getVerificationStats,
} from '@/lib/analytics/accuracy-tracker';

export async function GET() {
  try {
    const [overall, byMode, verification] = await Promise.all([
      getAccuracyStats(),
      getAccuracyByMode(),
      getVerificationStats(),
    ]);

    return NextResponse.json({
      overall,
      byMode,
      verification,
    });
  } catch (error) {
    console.error('[API] Get stats error:', error);
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    );
  }
}
