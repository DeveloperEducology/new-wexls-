import { NextResponse } from 'next/server';
import { getSession, appendResponse, completeSession } from '../../../../lib/exam/session-store.js';
import { getQuestion, getAdaptiveCandidates, generateFromTemplates } from '../../../../lib/exam/question-store.js';
import { updateTheta, selectNextQuestion, updateTopicMastery, computeSessionReport } from '../../../../lib/exam/adaptive-engine.js';
import { updateProfileAfterSession } from '../../../../lib/exam/profile-store.js';
import { isAnswerCorrect, normalizeQuestion } from '../../../../lib/exam/question-schema.js';

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

    // Evaluate answer — handles MCQ, MSQ, fill_blank, categorizationv2, sentence_ordering
    const normalizedQ = normalizeQuestion(question);
    const isCorrect = isAnswerCorrect(normalizedQ, selectedOption);
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
      let candidates = await getAdaptiveCandidates({
        examId: session.examId,
        section: session.section,
        topic: session.topic || null,
        templateId: session.templateId || null,
        theta: newTheta,
        usedIds,
        limit: 30,
      });

      // If bank is thin or template-based drill (On-The-Fly Mode), generate next candidate variations!
      if (candidates.length < 3 && session.templateId) {
        const generated = await generateFromTemplates({
          examId: session.examId,
          section: session.section,
          topic: session.topic || null,
          templateId: session.templateId
        });
        const unusedGenerated = generated.filter(g => !usedIds.includes(g._id) && !usedIds.includes(g.id));
        candidates = unusedGenerated.length > 0 ? unusedGenerated : generated;
      }

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
      correctOption: normalizedQ.correctOption,
      questionMode:  normalizedQ.questionMode,
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
  const n = normalizeQuestion(q);
  return {
    id: String(n._id),
    questionText:      n.questionText,
    questionImageUrl:  n.questionImageUrl,
    questionImageCrop: n.questionImageCrop,
    options:           n.options,
    optionsImages:     n.optionsImages,
    optionsImagesCrops:n.optionsImagesCrops,
    parts:             n.parts,
    questionMode:      n.questionMode,
    topic:             n.topic,
    difficulty:        n.difficulty,
    section:           n.section,
    cognitiveLevel:    n.cognitiveLevel,
    metadata:          n.metadata,
    drillTemplateId:   n.drillTemplateId,
  };
}

