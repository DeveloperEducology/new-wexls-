import { NextResponse } from 'next/server';
import { getMongoDb } from '../../../../../lib/db/mongo.js';
import { getSession, completeSession } from '../../../../../lib/exam/session-store.js';
import { normalizeQuestion, isAnswerCorrect } from '../../../../../lib/exam/question-schema.js';

export async function POST(req) {
  try {
    const { sessionId, userAnswers = {}, markedForReview = [], timeTakenSeconds = 0 } = await req.json();

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const db = await getMongoDb();
    const storedQuestions = session.questions || [];

    let matCorrect = 0;
    let arithmeticCorrect = 0;
    let languageCorrect = 0;

    let matTotal = 0;
    let arithmeticTotal = 0;
    let languageTotal = 0;

    const evaluatedAnswers = storedQuestions.map(q => {
      const nq = normalizeQuestion(q);
      const qNum = nq.qNumber || q.qNumber;
      const selectedOption = userAnswers[qNum] || null;
      const isCorrect = isAnswerCorrect(nq, selectedOption);

      if (nq.section === 'mat') {
        matTotal++;
        if (isCorrect) matCorrect++;
      } else if (nq.section === 'arithmetic') {
        arithmeticTotal++;
        if (isCorrect) arithmeticCorrect++;
      } else if (nq.section === 'language') {
        languageTotal++;
        if (isCorrect) languageCorrect++;
      }

      return {
        qNumber: qNum,
        questionId: nq.id || nq._id,
        section: nq.section,
        questionText: nq.questionText,
        questionImage: nq.questionImageUrl || '',
        options: nq.options || {},
        optionsImages: nq.optionsImages || {},
        selectedOption,
        correctOption: nq.correctOption,
        isCorrect,
        explanation: nq.explanationText || '',
        markedForReview: markedForReview.includes(qNum)
      };
    });

    const totalAnswered = evaluatedAnswers.filter(a => a.selectedOption !== null).length;
    const totalCorrect = matCorrect + arithmeticCorrect + languageCorrect;

    // Marks calculation (Each question = 1.25 marks; Total 80 Qs = 100 Marks)
    const matScore = Math.round(matCorrect * 1.25 * 100) / 100;
    const arithmeticScore = Math.round(arithmeticCorrect * 1.25 * 100) / 100;
    const languageScore = Math.round(languageCorrect * 1.25 * 100) / 100;
    const totalScore = Math.round(totalCorrect * 1.25 * 100) / 100;

    const accuracyPercent = totalAnswered > 0 ? Math.round((totalCorrect / totalAnswered) * 100) : 0;
    const passedCutoff = totalScore >= 65;

    const report = {
      sessionId,
      examId: session.examId || 'jnvst',
      totalQuestions: 80,
      totalAnswered,
      totalCorrect,
      totalScore,
      maxScore: 100,
      accuracyPercent,
      timeTakenSeconds,
      passedCutoff,
      cutoffScore: 65,
      sections: {
        mat: {
          name: 'Mental Ability (MAT)',
          correct: matCorrect,
          total: matTotal || 40,
          score: matScore,
          maxScore: 50,
          accuracy: matTotal > 0 ? Math.round((matCorrect / matTotal) * 100) : 0
        },
        arithmetic: {
          name: 'Arithmetic Test',
          correct: arithmeticCorrect,
          total: arithmeticTotal || 20,
          score: arithmeticScore,
          maxScore: 25,
          accuracy: arithmeticTotal > 0 ? Math.round((arithmeticCorrect / arithmeticTotal) * 100) : 0
        },
        language: {
          name: 'Language Test',
          correct: languageCorrect,
          total: languageTotal || 20,
          score: languageScore,
          maxScore: 25,
          accuracy: languageTotal > 0 ? Math.round((languageCorrect / languageTotal) * 100) : 0
        }
      },
      evaluatedAnswers
    };

    await completeSession(sessionId, report);

    return NextResponse.json({
      success: true,
      report
    });
  } catch (err) {
    console.error('[api/practice/mock-test/submit]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
