import { NextResponse } from 'next/server';
import { createSession } from '../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, insertQuestions } from '../../../../lib/exam/question-store.js';
import { selectNextQuestion } from '../../../../lib/exam/adaptive-engine.js';
import { getOrCreateProfile } from '../../../../lib/exam/profile-store.js';
import { instantiateParameterized } from '../../../../lib/exam/template-engine.js';
import { getMongoDb } from '../../../../lib/db/mongo.js';

const INITIAL_THETA = 0.5;
const SESSION_LENGTH = 15;
const MIN_QUESTIONS_NEEDED = 5;
const GENERATE_COUNT = 30; // generate this many per template on first use

export async function POST(req) {
  try {
    const { examId, section, userId, topic = null } = await req.json();

    if (!examId || !section || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing examId, section, or userId' },
        { status: 400 }
      );
    }

    // Get user's existing profile for theta continuity
    const profile = await getOrCreateProfile(userId, examId);
    const theta = profile?.sectionTheta?.[section] ?? INITIAL_THETA;

    // Create session
    const session = await createSession({
      userId,
      examId,
      section,
      sessionType: topic ? 'topic-drill' : 'adaptive',
      initialTheta: theta,
      topic
    });

    // Try fetching from existing question bank
    let candidates = await getAdaptiveCandidates({ examId, section, topic, theta, usedIds: [], limit: 30 });

    // ── AUTO-GENERATE from templates if bank is empty/thin ─────────────
    if (candidates.length < MIN_QUESTIONS_NEEDED) {
      const generated = await generateFromTemplates({ examId, section, topic });
      if (generated.length > 0) {
        await insertQuestions(generated);
        // Re-fetch now that questions exist
        candidates = await getAdaptiveCandidates({ examId, section, topic, theta, usedIds: [], limit: 30 });
      }
    }

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
      sessionLength: SESSION_LENGTH,
      currentTheta: theta,
      question: sanitizeQuestion(firstQuestion),
    });
  } catch (err) {
    console.error('[practice/start]', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// ── Template → Question Generator ─────────────────────────────────────
async function generateFromTemplates({ examId, section, topic }) {
  const db = await getMongoDb();
  if (!db) return [];

  // Find matching parameterized templates
  const filter = {
    examId,
    section,
    type: 'parameterized',
    status: { $ne: 'inactive' },
    ...(topic ? { topic } : {})
  };

  const templates = await db.collection('templates').find(filter).limit(10).toArray();
  if (templates.length === 0) {
    // Try without topic filter (catch-all for section)
    if (topic) {
      const allSection = await db.collection('templates').find({ examId, section, type: 'parameterized' }).limit(10).toArray();
      templates.push(...allSection);
    }
  }

  const allGenerated = [];
  for (const tpl of templates) {
    let config = tpl.config || {};
    if (config.config && (!config.variables || Array.isArray(config.variables))) {
      config = { ...config, ...config.config };
    }
    if (!config.variables || Array.isArray(config.variables) || !config.derivations) continue;
    try {
      const normalizedTpl = { ...tpl, config };
      const questions = instantiateParameterized(normalizedTpl, GENERATE_COUNT);
      allGenerated.push(...questions);
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
  };
  // correctOption is intentionally excluded — sent only after answer
}
