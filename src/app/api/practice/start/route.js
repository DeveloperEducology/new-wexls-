import { NextResponse } from 'next/server';
import { createSession } from '../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, insertQuestions } from '../../../../lib/exam/question-store.js';
import { selectNextQuestion } from '../../../../lib/exam/adaptive-engine.js';
import { getOrCreateProfile } from '../../../../lib/exam/profile-store.js';
import { instantiateParameterized } from '../../../../lib/exam/template-engine.js';
import { instantiateSvgTemplate, isSvgTemplate } from '../../../../lib/exam/svg-template-engine.js';
import { instantiateVisualTransformationTemplate } from '../../../../lib/exam/visual-transformation-engine.js';
import { getMongoDb } from '../../../../lib/db/mongo.js';

const INITIAL_THETA = 0.5;
const DEFAULT_SESSION_LENGTH = 15;
const MIN_QUESTIONS_NEEDED = 5;
const GENERATE_COUNT = 30; // generate this many per template on first use

export async function POST(req) {
  try {
    const { examId, section, userId, topic = null, templateId = null } = await req.json();

    if (!examId || !section || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing examId, section, or userId' },
        { status: 400 }
      );
    }

    // Get user's existing profile for theta continuity
    const profile = await getOrCreateProfile(userId, examId);
    const theta = profile?.sectionTheta?.[section] ?? INITIAL_THETA;

    // For PYQ sections: use all available questions (no adaptive limit)
    const isPyq = section === 'previous_years';

    // Fetch candidates BEFORE creating session so we know the exact count
    let candidates = await getAdaptiveCandidates({ examId, section, topic, templateId, theta, usedIds: [], limit: isPyq ? 200 : 30 });

    // ── AUTO-GENERATE from templates if bank is empty/thin ─────────────
    if (!isPyq && candidates.length < MIN_QUESTIONS_NEEDED) {
      const generated = await generateFromTemplates({ examId, section, topic, templateId });
      if (generated.length > 0) {
        await insertQuestions(generated);
        candidates = await getAdaptiveCandidates({ examId, section, topic, templateId, theta, usedIds: [], limit: 30 });
      }
    }

    // Dynamic session length: PYQs use all available questions, adaptive uses default
    const sessionLength = isPyq ? (candidates.length || DEFAULT_SESSION_LENGTH) : DEFAULT_SESSION_LENGTH;

    // Create session (sessionLength persisted so answer API can read it)
    const session = await createSession({
      userId,
      examId,
      section,
      sessionType: templateId ? 'skill-drill' : topic ? 'topic-drill' : 'adaptive',
      initialTheta: theta,
      topic,
      templateId,
      sessionLength,
    });

    const firstQuestion = selectNextQuestion(theta, profile?.topicMastery || {}, candidates);

    if (!firstQuestion) {
      return NextResponse.json(
        {
          success: false,
          error: `No questions available for "${section}${topic ? ` › ${topic}` : ''}". Add templates in the admin panel first.`
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      sessionId: String(session._id),
      sessionLength,
      currentTheta: theta,
      question: sanitizeQuestion(firstQuestion),
    });
  } catch (err) {
    console.error('[practice/start]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── Template → Question Generator ─────────────────────────────────────
async function generateFromTemplates({ examId, section, topic, templateId = null }) {
  const db = await getMongoDb();
  if (!db) return [];

  let templateIds = null;
  let objectIds = [];
  if (templateId) {
    if (typeof templateId === 'string' && templateId.includes(',')) {
      templateIds = templateId.split(',').map(s => s.trim());
    } else if (Array.isArray(templateId)) {
      templateIds = templateId;
    } else {
      templateIds = [templateId];
    }
    const { ObjectId } = await import('mongodb');
    for (const id of templateIds) {
      try {
        objectIds.push(new ObjectId(id));
      } catch {}
    }
  }

  // Find matching templates (parameterized OR svg-figure OR visual-transformation)
  const filter = {
    examId,
    section,
    type: { $in: ['parameterized', 'svg-figure', 'visual-transformation'] },
    status: { $ne: 'inactive' },
    ...(topic ? { topic } : {}),
    ...(templateIds ? {
      $or: [
        { id: { $in: templateIds } },
        { _id: { $in: templateIds } },
        ...(objectIds.length ? [{ _id: { $in: objectIds } }] : [])
      ]
    } : {})
  };

  const templates = await db.collection('templates').find(filter).limit(10).toArray();
  if (templates.length === 0 && topic && !templateId) {
    const allSection = await db.collection('templates').find({
      examId, section,
      type: { $in: ['parameterized', 'svg-figure', 'visual-transformation'] }
    }).limit(10).toArray();
    templates.push(...allSection);
  }

  const allGenerated = [];
  for (const tpl of templates) {
    try {
      if (tpl.type === 'visual-transformation') {
        // Visual Transformation Scene template
        const questions = instantiateVisualTransformationTemplate(tpl, GENERATE_COUNT);
        allGenerated.push(...questions);
      } else if (isSvgTemplate(tpl)) {
        // SVG figure template — generate image-based questions
        const questions = instantiateSvgTemplate(tpl, GENERATE_COUNT);
        allGenerated.push(...questions);
      } else {
        // Parameterized numeric/text template
        let config = tpl.config || {};
        if (config.config && (!config.variables || Array.isArray(config.variables))) {
          config = { ...config, ...config.config };
        }
        if (!config.variables || Array.isArray(config.variables) || !config.derivations) continue;
        const normalizedTpl = { ...tpl, config };
        const questions = instantiateParameterized(normalizedTpl, GENERATE_COUNT);
        allGenerated.push(...questions);
      }
    } catch (e) {
      console.warn(`[practice/start] Failed to instantiate template ${tpl._id}:`, e.message);
    }
  }

  return allGenerated;
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
  // correctOption is intentionally excluded — sent only after answer
}
