import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { isAnswerCorrect } from '@/lib/practice/answerValidation';
import {
  calculateSmartScore,
  createAttempt,
  updateMasteryState,
} from '@/lib/mastery';

const ATTEMPTS_COLLECTION = 'student_attempts';
const MASTERY_COLLECTION = 'student_mastery';

function normalizeStudentIdentity(body = {}) {
  const raw = body.studentId || body.userId || body.activeStudent || 'student_local';
  const studentId = String(raw).trim() || 'student_local';
  return {
    studentId,
    userId: String(body.userId || studentId),
  };
}

function getQuestionSkill(question, body = {}) {
  return body.skillId
    || body.skill
    || question?.metadata?.skillId
    || question?.metadata?.logicType
    || question?.skillId
    || body.questionId
    || 'unknown-skill';
}

function getQuestionSubject(question, body = {}) {
  return body.subject || question?.metadata?.subject || 'math';
}

function getQuestionTopic(question, body = {}) {
  return body.topic || question?.metadata?.topic || 'dynamic-templates';
}

function getQuestionSeed(question, body = {}) {
  return body.seed
    || question?.seed
    || question?.metadata?.seed
    || question?.adaptiveConfig?.variables?.seed
    || question?.variables?.seed
    || String(Date.now());
}

function buildPracticeUrl(request, {
  question,
  body,
  nextMastery,
  nextSeed,
}) {
  const url = new URL('/api/practice', request.url);
  const subject = getQuestionSubject(question, body);
  const topic = getQuestionTopic(question, body);
  
  let skillId = getQuestionSkill(question, body);
  if (nextMastery?.status === 'mastered' && nextMastery?.masteryRouteTarget) {
    skillId = nextMastery.masteryRouteTarget;
  }

  url.searchParams.set('subject', subject);
  url.searchParams.set('topic', topic);
  url.searchParams.set('skill', skillId);
  url.searchParams.set('forcedTask', skillId);
  url.searchParams.set('difficulty', nextMastery?.recommendedDifficulty || body.difficulty || 'adaptive');
  url.searchParams.set('correctStreak', String(nextMastery?.correctStreak || 0));
  url.searchParams.set('practiceLevel', String(nextMastery?.practiceLevel || 1));
  url.searchParams.set('levelStreak', String(nextMastery?.levelStreak || 0));
  url.searchParams.set('lastResult', nextMastery?.lastResult || 'none');
  url.searchParams.set('remediationActive', nextMastery?.remediationNeeded ? 'true' : 'false');
  url.searchParams.set('remediationStep', nextMastery?.remediationNeeded ? '1' : '0');
  url.searchParams.set('seed', nextSeed);

  return url;
}

async function resolveQuestionForValidation(request, body) {
  if (body.question && typeof body.question === 'object') {
    return body.question;
  }

  const subject = body.subject || 'math';
  const topic = body.topic || 'dynamic-templates';
  const skillId = body.skillId || body.skill || body.questionId;
  if (!skillId) {
    throw new Error('question or skillId is required for server validation');
  }

  const url = new URL('/api/practice', request.url);
  url.searchParams.set('subject', subject);
  url.searchParams.set('topic', topic);
  url.searchParams.set('skill', skillId);
  url.searchParams.set('forcedTask', skillId);
  url.searchParams.set('seed', body.seed || String(Date.now()));
  if (body.questionId) {
    url.searchParams.set('qn', body.questionId);
  }

  const response = await fetch(url.toString(), { cache: 'no-store' });
  const data = await response.json();
  if (!data?.success || !data?.question) {
    throw new Error(data?.error || 'Unable to resolve question for validation');
  }
  return data.question;
}

function buildMasteryQuery({ userId, attempt }) {
  return {
    userId,
    skillId: attempt.skillId,
  };
}

function normalizePreviousMastery(doc) {
  if (!doc) return null;
  return {
    ...doc,
    state: doc.masteryState || doc.state,
    smartScore: doc.smartScore ?? doc.score ?? 0,
  };
}

export async function POST(request) {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database connection failed. Set MONGODB_URI first.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { studentId, userId } = normalizeStudentIdentity(body);
    const userAnswer = body.userAnswer ?? body.answer;

    if (userAnswer === undefined || userAnswer === null) {
      return NextResponse.json(
        { success: false, error: 'userAnswer is required' },
        { status: 400 }
      );
    }

    const question = await resolveQuestionForValidation(request, body);
    const isCorrect = isAnswerCorrect(question, userAnswer);
    const skillId = getQuestionSkill(question, body);
    const subject = getQuestionSubject(question, body);
    const topic = getQuestionTopic(question, body);
    const seed = getQuestionSeed(question, body);

    const provisionalAttempt = {
      subject,
      topic,
      skillId,
      competencyId: body.competencyId || question?.metadata?.competencyId || question?.metadata?.competency?.id || null,
    };

    const existingMastery = await db.collection(MASTERY_COLLECTION).findOne(
      buildMasteryQuery({ userId, attempt: provisionalAttempt })
    );
    const previousMastery = normalizePreviousMastery(existingMastery);
    const smartScoreBefore = Number(body.smartScoreBefore ?? previousMastery?.smartScore ?? 0);
    const smartScoreAfter = calculateSmartScore(smartScoreBefore, isCorrect);

    const attempt = createAttempt({
      question: {
        ...question,
        seed,
        metadata: {
          ...(question.metadata || {}),
          subject,
          topic,
          skillId,
          competencyId: provisionalAttempt.competencyId,
          streakThreshold: body.streakThreshold || question?.metadata?.streakThreshold || question?.streakThreshold || 5,
        },
      },
      userId,
      userAnswer,
      isCorrect,
      difficulty: body.difficulty || previousMastery?.recommendedDifficulty || 'adaptive',
      practiceLevel: Number(body.practiceLevel ?? previousMastery?.practiceLevel ?? 1),
      smartScoreBefore,
      smartScoreAfter,
      startedAt: body.startedAt || body.questionStartedAt || null,
      hintUsed: Boolean(body.hintUsed),
      phase: body.phase || previousMastery?.state || 'practicing',
      errorType: body.errorType || null,
      isStatic: body.isStatic || body.mode === 'static' || body.practiceMode === 'static' || question?.isStatic || question?.metadata?.isStatic,
      mode: body.mode || body.practiceMode || (question?.isStatic ? 'static' : undefined),
    });

    const now = new Date();
    attempt.studentId = studentId;
    attempt.questionId = body.questionId || question.id || question._id || question.metadata?.questionId || null;
    attempt.seed = seed;
    attempt.createdAt = now;
    attempt.loggedAt = now;

    const nextMastery = updateMasteryState(previousMastery, attempt);

    const attemptResult = await db.collection(ATTEMPTS_COLLECTION).insertOne({
      ...attempt,
      source: 'adaptive_submit_and_next',
    });

    const masteryQuery = buildMasteryQuery({ userId, attempt });
    await db.collection(MASTERY_COLLECTION).updateOne(
      masteryQuery,
      {
        $set: {
          ...nextMastery,
          userId,
          studentId,
          subject: attempt.subject,
          topic: attempt.topic,
          competencyId: attempt.competencyId || null,
          score: nextMastery.smartScore,
          masteryState: nextMastery.state,
          state: nextMastery.status === 'mastered'
            ? 'Mastered'
            : nextMastery.status === 'proficient'
              ? 'Proficient'
              : nextMastery.status === 'needs_remediation'
                ? 'Needs Remediation'
                : 'Learning',
          lastPracticedAt: now,
          updatedAt: now,
        },
        $setOnInsert: {
          createdAt: now,
        },
      },
      { upsert: true }
    );

    // Seed repeat prevention
    let nextSeed = body.nextSeed;
    const recentSeeds = nextMastery.recentSeeds || [];
    if (!nextSeed || recentSeeds.includes(nextSeed)) {
      do {
        nextSeed = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      } while (recentSeeds.includes(nextSeed));
    }

    let nextQuestionPayload = null;
    try {
      const nextUrl = buildPracticeUrl(request, {
        question,
        body,
        nextMastery,
        nextSeed,
      });
      const nextResponse = await fetch(nextUrl.toString(), { cache: 'no-store' });
      nextQuestionPayload = await nextResponse.json();
    } catch (error) {
      nextQuestionPayload = {
        success: false,
        error: error.message,
      };
    }

    return NextResponse.json({
      success: true,
      isCorrect,
      attemptId: String(attemptResult.insertedId),
      attempt,
      mastery: nextMastery,
      nextDifficulty: nextMastery.recommendedDifficulty,
      nextSeed,
      nextQuestion: nextQuestionPayload?.question || null,
      nextPayload: nextQuestionPayload,
    });
  } catch (error) {
    console.error('Adaptive submit-and-next failed:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
