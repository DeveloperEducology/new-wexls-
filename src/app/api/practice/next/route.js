import { NextResponse } from 'next/server';
import { getSession } from '../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, generateFromTemplates } from '../../../../lib/exam/question-store.js';
import { selectNextQuestion } from '../../../../lib/exam/adaptive-engine.js';
import { normalizeQuestion } from '../../../../lib/exam/question-schema.js';
import { sanitizeLatexMathText } from '../../../../lib/practice/generators/latexSanitizer.js';

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get('sessionId');

    if (!sessionId) {
      return NextResponse.json({ success: false, error: 'Missing sessionId' }, { status: 400 });
    }

    const session = await getSession(sessionId);
    if (!session) {
      return NextResponse.json({ success: false, error: 'Session not found' }, { status: 404 });
    }

    const maxLen = session.sessionLength || 15;
    const answeredCount = session.responses ? session.responses.length : 0;
    if (answeredCount >= maxLen) {
      return NextResponse.json({ success: false, finished: true, message: 'Session complete' });
    }

    const usedIds = (session.responses || []).map(r => String(r.questionId));

    let candidates = await getAdaptiveCandidates({
      examId: session.examId,
      section: session.section,
      topic: session.topic,
      templateId: session.templateId,
      theta: session.currentTheta || 0.5,
      usedIds,
      limit: 30
    });

    if ((!candidates || candidates.length === 0) && session.templateId) {
      const generated = await generateFromTemplates({
        examId: session.examId,
        section: session.section,
        topic: session.topic,
        templateId: session.templateId
      });
      if (generated && generated.length > 0) {
        candidates = generated.filter(q => !usedIds.includes(String(q._id || q.id)));
        if (candidates.length === 0) candidates = generated;
      }
    }

    let nextQ = null;
    if (candidates && candidates.length > 0) {
      if (session.templateId) {
        nextQ = candidates[0];
      } else {
        nextQ = selectNextQuestion(session.currentTheta || 0.5, session.topicMastery || {}, candidates);
      }
    }

    if (!nextQ) {
      return NextResponse.json({ success: false, finished: true, message: 'No more questions available' });
    }

    const sanitized = sanitizeQuestionPayload(nextQ);
    return NextResponse.json({ success: true, question: sanitized });
  } catch (err) {
    console.error('[api/practice/next]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

function sanitizeQuestionPayload(q) {
  const n = normalizeQuestion(q);
  const rawPrompt = n.questionText || n.questionPrompt || '';
  const fixedPrompt = sanitizeLatexMathText(rawPrompt);

  const rawOptions = n.options || [];
  const fixedOptions = Array.isArray(rawOptions)
    ? rawOptions.map(opt => typeof opt === 'string' ? sanitizeLatexMathText(opt) : (opt?.label ? { ...opt, label: sanitizeLatexMathText(opt.label) } : opt))
    : (typeof rawOptions === 'object' && rawOptions !== null)
    ? Object.fromEntries(Object.entries(rawOptions).map(([k, v]) => [k, typeof v === 'string' ? sanitizeLatexMathText(v) : v]))
    : rawOptions;

  const fixedExplanation = typeof n.explanation === 'string'
    ? sanitizeLatexMathText(n.explanation)
    : n.explanation;

  return {
    id: String(n._id || n.id),
    questionText: fixedPrompt,
    questionPrompt: fixedPrompt,
    questionImageUrl: n.questionImageUrl,
    questionImageCrop: n.questionImageCrop,
    options: fixedOptions,
    optionsImages: n.optionsImages,
    optionsImagesCrops: n.optionsImagesCrops,
    explanation: fixedExplanation,
    parts: n.parts,
    questionMode: n.questionMode,
    topic: n.topic,
    difficulty: q?.difficulty || n.difficulty,
    level: q?.level || n.level,
    section: n.section,
    cognitiveLevel: n.cognitiveLevel,
    metadata: n.metadata,
    drillTemplateId: n.drillTemplateId,
  };
}
