import { NextResponse } from 'next/server';
import { getSession } from '../../../../../lib/exam/session-store.js';
import { getMongoDb } from '../../../../../lib/db/mongo.js';
import { normalizeQuestion, isAnswerCorrect } from '../../../../../lib/exam/question-schema.js';

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
    let questions = session.questions || [];

    if ((!questions || questions.length === 0) && (!evaluatedAnswers || evaluatedAnswers.length === 0)) {
      const db = await getMongoDb();
      if (db) {
        const tId = session.templateId || '2020-jnvst-official-pyq-template';
        let template = await db.collection('dynamic_templates').findOne({ id: tId });
        if (!template) template = await db.collection('mock_tests').findOne({ id: tId });
        if (!template) template = await db.collection('templates').findOne({ id: tId });

        if (template && (template.rows || template.questions)) {
          questions = template.rows || template.questions;
        } else {
          questions = await db.collection('questions').find({ status: { $ne: 'inactive' } }).sort({ qNumber: 1 }).limit(80).toArray();
        }
      }
    }

    // Reconstruct evaluatedAnswers dynamically if missing question text or empty
    if ((!evaluatedAnswers || evaluatedAnswers.length === 0 || !evaluatedAnswers[0]?.questionText) && questions.length > 0) {
      const userAnswers = session.userAnswers || {};
      evaluatedAnswers = questions.map((q, idx) => {
        const nq = normalizeQuestion(q);
        const qNum = nq.qNumber || nq.qNum || q.qNumber || q.qNum || (idx + 1);
        const selectedOption = userAnswers[qNum] || userAnswers[String(qNum)] || null;
        const correct = isAnswerCorrect(nq, selectedOption);

        let section = nq.section || 'mat';
        if (qNum >= 41 && qNum <= 60) section = 'arithmetic';
        else if (qNum >= 61 && qNum <= 80) section = 'language';

        return {
          qNumber: qNum,
          questionId: nq._id || nq.id || qNum,
          section,
          questionText: nq.questionText || '',
          questionImage: nq.questionImageUrl || '',
          options: nq.options || {},
          optionsImages: nq.optionsImages || {},
          selectedOption,
          correctOption: nq.correctOption,
          isCorrect: correct,
          explanation: nq.explanationText || ''
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
