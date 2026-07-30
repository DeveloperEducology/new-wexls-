import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/exam/session-store.js';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing sessionId parameter' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const report = session.report || {
      sessionId,
      examId: session.examId || 'jnvst',
      totalQuestions: session.questions?.length || 80,
      totalAnswered: 0,
      totalCorrect: 0,
      totalScore: 0,
      maxScore: 100,
      accuracyPercent: 0,
      timeTakenSeconds: 0,
      passedCutoff: false,
      sections: {},
      evaluatedAnswers: []
    };

    return NextResponse.json({
      success: true,
      report,
      session
    });
  } catch (error) {
    console.error('[GET /api/practice/mock-test/report] Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
