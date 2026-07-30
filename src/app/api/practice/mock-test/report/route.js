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

    let evaluatedAnswers = report.evaluatedAnswers || [];
    const questions = session.questions || [];

    // Reconstruct evaluatedAnswers dynamically if missing question text or empty
    if ((!evaluatedAnswers || evaluatedAnswers.length === 0 || !evaluatedAnswers[0]?.questionText) && questions.length > 0) {
      const userAnswers = session.userAnswers || {};
      evaluatedAnswers = questions.map((q, idx) => {
        const qNum = q.qNumber || q.qNum || (idx + 1);
        const selectedOption = userAnswers[qNum] || userAnswers[String(qNum)] || null;
        const correctOption = q.correctOption || q.answer || 'A';
        const isCorrect = selectedOption !== null && selectedOption === correctOption;

        let section = q.section || 'mat';
        if (qNum >= 41 && qNum <= 60) section = 'arithmetic';
        else if (qNum >= 61 && qNum <= 80) section = 'language';

        return {
          qNumber: qNum,
          questionId: q._id || q.id || qNum,
          section,
          questionText: q.questionText || '',
          questionImage: q.questionImage || q.imageUrl || '',
          options: q.options || { A: q.optionA, B: q.optionB, C: q.optionC, D: q.optionD },
          optionsImages: q.optionsImages || {},
          selectedOption,
          correctOption,
          isCorrect,
          explanation: q.explanationText || q.explanation || ''
        };
      });

      report.evaluatedAnswers = evaluatedAnswers;
    }

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
