import { NextResponse } from 'next/server';
import { getSession, appendResponse, completeSession } from '../../../../lib/exam/session-store.js';
import { getQuestion, getAdaptiveCandidates } from '../../../../lib/exam/question-store.js';
import { updateTheta, selectNextQuestion, updateTopicMastery, computeSessionReport } from '../../../../lib/exam/adaptive-engine.js';
import { updateProfileAfterSession } from '../../../../lib/exam/profile-store.js';

const DEFAULT_SESSION_LENGTH = 15;

export async function POST(req) {
  try {
    const { sessionId, questionId, selectedOption, timeTakenMs } = await req.json();

    if (!sessionId || !questionId) {
      return NextResponse.json({ success: false, error: 'Missing sessionId or questionId' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    if (session.status !== 'active') return NextResponse.json({ success: false, error: 'Session already completed' }, { status: 400 });

    const question = await getQuestion(questionId);
    if (!question) return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });

    // Evaluate answer
    const isCorrect = selectedOption !== null && selectedOption === question.correctOption;
    const newTheta = updateTheta(session.currentTheta, isCorrect, question.difficulty);
    const newTopicMastery = updateTopicMastery(session.topicMastery, question.topic, isCorrect);

    // Persist response
    await appendResponse(sessionId, {
      questionId,
      topic: question.topic,
      difficulty: question.difficulty,
      selectedOption,
      isCorrect,
      timeTakenMs: timeTakenMs || 0,
      thetaAfter: newTheta,
      topicMastery: newTopicMastery,
    });

    const answeredCount = session.responses.length + 1;
    // Use session's own length (set at start — dynamic for PYQs, 15 for adaptive)
    const sessionLength = session.sessionLength || DEFAULT_SESSION_LENGTH;
    const isSessionComplete = answeredCount >= sessionLength;

    let nextQuestion = null;
    let report = null;

    if (!isSessionComplete) {
      // Get used question IDs (including current)
      const usedIds = [...session.responses.map(r => r.questionId), questionId];
      const candidates = await getAdaptiveCandidates({
        examId: session.examId,
        section: session.section,
        topic: session.topic || null,
        templateId: session.templateId || null,
        theta: newTheta,
        usedIds,
        limit: 30,
      });
      const next = selectNextQuestion(newTheta, newTopicMastery, candidates);
      if (next) nextQuestion = sanitizeQuestion(next);
    } else {
      // Build report
      const allResponses = [
        ...session.responses,
        { topic: question.topic, difficulty: question.difficulty, selectedOption, isCorrect, timeTakenMs: timeTakenMs || 0 },
      ];
      report = computeSessionReport(allResponses, newTheta);
      await completeSession(sessionId, report);
      await updateProfileAfterSession(session.userId, session.examId, {
        section: session.section,
        finalTheta: newTheta,
        topicMastery: newTopicMastery,
        weakTopics: report.weakTopics,
        strongTopics: report.strongTopics,
        report,
      });
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      correctOption: question.correctOption,
      explanationText: question.explanationText,
      explanationMath: question.explanationMath || null,
      updatedTheta: newTheta,
      answeredCount,
      sessionLength,
      sessionComplete: isSessionComplete,
      nextQuestion,
      report,
    });
  } catch (err) {
    console.error('practice/answer error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function sanitizeQuestion(q) {
  return {
    id: String(q._id),
    questionText: q.questionText,
    questionImageUrl: q.questionImageUrl || null,
    options: q.options,
    topic: q.topic,
    difficulty: q.difficulty,
    section: q.section,
    cognitiveLevel: q.cognitiveLevel || null,
    metadata: q.metadata || null,
  };
}
