import { NextResponse } from 'next/server';
import { createSession } from '../../../../lib/exam/session-store.js';
import { getAdaptiveCandidates, insertQuestions, generateFromTemplates } from '../../../../lib/exam/question-store.js';
import { selectNextQuestion } from '../../../../lib/exam/adaptive-engine.js';
import { getOrCreateProfile } from '../../../../lib/exam/profile-store.js';
import { getMongoDb } from '../../../../lib/db/mongo.js';

const INITIAL_THETA = 0.5;
const DEFAULT_SESSION_LENGTH = 15;
const MIN_QUESTIONS_NEEDED = 5;

export async function POST(req) {
  try {
    const { examId, section, userId, topic = null, templateId = null } = await req.json();

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
        
        const tpl = await db.collection('templates').findOne({
          $or: [
            { id: lookupId },
            { _id: lookupId },
            ...(objectId ? [{ _id: objectId }] : [])
          ]
        });
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

    // ── AUTO-GENERATE from templates if bank is empty/thin ─────────────
    if ((!isPyq || templateId) && candidates.length < MIN_QUESTIONS_NEEDED) {
      const generated = await generateFromTemplates({ examId, section: targetSection, topic, templateId });
      if (generated.length > 0) {
        await insertQuestions(generated);
        candidates = await getAdaptiveCandidates({ examId, section: targetSection, topic, templateId, theta, usedIds: [], limit: 30 });
      }
    }

    // Dynamic session length: PYQs use all available questions, adaptive uses default
    const sessionLength = isPyq ? (candidates.length || DEFAULT_SESSION_LENGTH) : DEFAULT_SESSION_LENGTH;

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

    const firstQuestion = selectNextQuestion(theta, profile?.topicMastery || {}, candidates);

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
    drillTemplateId: q.drillTemplateId || null,
  };
}

