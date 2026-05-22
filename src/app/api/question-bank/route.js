import { NextResponse } from 'next/server';
import { saveStoredPracticeQuestion } from '../../../lib/practice/questionBank/questionRepository.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const mode = body?.mode === 'insert' ? 'insert' : 'upsert';
    const payload = body?.question || body;

    const result = await saveStoredPracticeQuestion(payload, { mode });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Unable to save question.',
      },
      { status: 400 }
    );
  }
}
