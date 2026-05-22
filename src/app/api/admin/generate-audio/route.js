import { NextResponse } from 'next/server';
import { getOrGenerateR2Audio } from '../questions/route';

export async function POST(request) {
  try {
    const body = await request.json();
    const { text, voice } = body;

    if (!text) {
      return NextResponse.json({ success: false, error: 'Missing text parameter' }, { status: 400 });
    }

    const audioUrl = await getOrGenerateR2Audio(text, voice || 'Puck');

    return NextResponse.json({
      success: true,
      audioUrl
    });
  } catch (error) {
    console.error('On-demand audio generate error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
