import { NextResponse } from 'next/server';
import { saveStoredPracticeQuestion } from '../../../lib/practice/questionBank/questionRepository.js';

export async function POST(request) {
  try {
    const body = await request.json();
    const mode = body?.mode === 'insert' ? 'insert' : 'upsert';
    const payload = body?.question || body;

    if (Array.isArray(payload)) {
      const results = [];
      for (const q of payload) {
        const res = await saveStoredPracticeQuestion(q, { mode });
        results.push(res);
      }
      return NextResponse.json({
        success: true,
        result: {
          mode: 'bulk',
          count: results.length,
          inserted: results.filter(r => r.mode === 'insert').length,
          updated: results.filter(r => r.mode === 'update').length,
          ids: results.map(r => r.id)
        }
      });
    }

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
