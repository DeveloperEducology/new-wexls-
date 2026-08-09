import { NextResponse } from 'next/server';
import { createSession } from '../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, insertQuestions, generateFromTemplates } from '../../../../lib/exam/question-store.js';
import { selectNextQuestion } from '../../../../lib/exam/adaptive-engine.js';
import { getOrCreateProfile } from '../../../../lib/exam/profile-store.js';
import { getMongoDb } from '../../../../lib/db/mongo.js';
import { resolveUserId } from '../../../../lib/auth/getAuthUser.js';
import { normalizeQuestion } from '../../../../lib/exam/question-schema.js';
import { sanitizeLatexMathText } from '../../../../lib/practice/generators/latexSanitizer.js';

const INITIAL_THETA = 0.5;
const DEFAULT_SESSION_LENGTH = 15;
const MIN_QUESTIONS_NEEDED = 5;

export async function POST(req) {
  try {
    const { examId, section, userId: providedUserId, topic = null, templateId = null } = await req.json();
    const userId = resolveUserId(req, providedUserId);

    if (!examId || !section || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing examId, section, or userId' },
        { status: 400 }
      );
    }

    // Resolve the actual target section of the drill template, if specified
    let targetSection = section;
    if (templateId) {
      const db = await getMongoDb();
      if (db) {
        let lookupId = templateId;
        if (typeof templateId === 'string' && templateId.includes(',')) {
          lookupId = templateId.split(',')[0].trim();
        } else if (Array.isArray(templateId) && templateId.length > 0) {
          lookupId = templateId[0];
        }
        const { ObjectId } = await import('mongodb');
        let objectId = null;
        try { objectId = new ObjectId(lookupId); } catch {}
        
        let tpl = await db.collection('templates').findOne({
          $or: [
            { id: lookupId },
            { _id: lookupId },
            ...(objectId ? [{ _id: objectId }] : [])
          ]
        });
        if (!tpl) {
          tpl = await db.collection('dynamic_templates').findOne({
            $or: [
              { id: lookupId },
              { _id: lookupId },
              ...(objectId ? [{ _id: objectId }] : [])
            ]
          });
        }
        if (tpl && tpl.section) {
          targetSection = tpl.section;
        }
      }
    }

    // Get user's existing profile for theta continuity
    const profile = await getOrCreateProfile(userId, examId);
    const theta = profile?.sectionTheta?.[targetSection] ?? INITIAL_THETA;

    // For PYQ sections: use all available questions (no adaptive limit)
    const isPyq = targetSection === 'previous_years';

    // Fetch candidates BEFORE creating session so we know the exact count
    let candidates = await getAdaptiveCandidates({ examId, section: targetSection, topic, templateId, theta, usedIds: [], limit: isPyq ? 200 : 30 });

    // Determine tier (Free Tier vs Premium Tier)
    const isPremium = profile?.isPremium === true || profile?.plan === 'premium' || profile?.plan === 'pro';

    // ── AUTO-GENERATE / FETCH candidates ─────────────
    if (templateId) {
      const generated = await generateFromTemplates({ examId, section: targetSection, topic, templateId });
      if (generated.length > 0) candidates = generated;
    } else if (!isPyq && candidates.length < MIN_QUESTIONS_NEEDED) {
      const generated = await generateFromTemplates({ examId, section: targetSection, topic, templateId });
      if (generated.length > 0) {
        if (isPremium) {
          // Premium Tier: Persist question instances to DB for deep IRT analytics & item response tracking
          await insertQuestions(generated);
          candidates = await getAdaptiveCandidates({ examId, section: targetSection, topic, templateId, theta, usedIds: [], limit: 30 });
        } else {
          // Free Tier / Guests: Pure On-The-Fly Mode (0 DB writes, 100% in-memory execution)
          candidates = generated;
        }
      }
    }

    // Dynamic session length: Template drills use at least 10 questions, PYQs use total candidates length
    const sessionLength = isPyq
      ? (candidates.length || DEFAULT_SESSION_LENGTH)
      : templateId
      ? Math.max(candidates.length || 0, 10)
      : DEFAULT_SESSION_LENGTH;

    // Create session (sessionLength persisted so answer API can read it)
    const session = await createSession({
      userId,
      examId,
      section: targetSection,
      sessionType: templateId ? 'skill-drill' : topic ? 'topic-drill' : 'adaptive',
      initialTheta: theta,
      topic,
      templateId,
      sessionLength,
    });

    const firstQuestion = (templateId && candidates.length > 0) ? candidates[0] : selectNextQuestion(theta, profile?.topicMastery || {}, candidates);

    if (!firstQuestion) {
      return NextResponse.json(
        {
          success: false,
          error: `No questions available for "${targetSection}${topic ? ` › ${topic}` : ''}". Add templates in the admin panel first.`
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

// generateFromTemplates is exported from question-store.js

function sanitizeQuestion(q) {
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

