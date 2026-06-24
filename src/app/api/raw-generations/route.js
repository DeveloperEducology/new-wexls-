import { NextResponse } from 'next/server';
import { listRawGeminiGenerations } from '@/lib/lessons/store';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const list = await listRawGeminiGenerations({ limit: 30 });
    return NextResponse.json({
      success: true,
      generations: list,
    });
  } catch (err) {
    console.error('[Raw Generations API] Error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err.message || 'Failed to retrieve raw generations.',
      },
      { status: 500 }
    );
  }
}
