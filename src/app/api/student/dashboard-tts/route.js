import { NextResponse } from 'next/server';
import { getOrGenerateR2Audio } from '@/app/api/admin/questions/route';

const MAX_TTS_TEXT_LENGTH = 280;

export async function POST(request) {
  try {
    const body = await request.json();
    const text = String(body?.text || '').trim();
    const voice = String(body?.voice || 'gemini:Puck').trim();

    if (!text) {
      return NextResponse.json({ success: false, error: 'Missing text.' }, { status: 400 });
    }

    if (text.length > MAX_TTS_TEXT_LENGTH) {
      return NextResponse.json(
        { success: false, error: `Text is too long. Keep dashboard prompts under ${MAX_TTS_TEXT_LENGTH} characters.` },
        { status: 400 }
      );
    }

    const audioUrl = await getOrGenerateR2Audio(text, voice);
    if (!audioUrl) {
      return NextResponse.json(
        { success: false, error: 'Gemini TTS could not generate audio. Check Gemini auth, billing, quota, and R2/database config.' },
        { status: 503 }
      );
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      provider: 'gemini',
      cached: true,
    });
  } catch (error) {
    console.error('Student dashboard TTS error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
