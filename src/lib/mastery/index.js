import { getNextUnlockingSkills, getPrerequisiteFallback } from '../competency/index.js';

const STORAGE_KEY = 'wexls.mastery.v1';
const ATTEMPTS_KEY = 'wexls.attempts.v1';

function canUseStorage() {
  return typeof window !== 'undefined' && Boolean(window.localStorage);
}

function safeParse(value, fallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function calculateSmartScore(currentScore, correct) {
  const score = Number(currentScore || 0);

  if (correct) {
    if (score < 40) return Math.min(score + 15, 40);
    if (score < 70) return Math.min(score + 10, 70);
    if (score < 80) return Math.min(score + 6, 80);
    if (score < 90) return Math.min(score + 4, 90);
    if (score < 99) return Math.min(score + 2, 99);
    return 100;
  }

  if (score < 40) return Math.max(score - 4, 0);
  if (score < 70) return Math.max(score - 8, 30);
  if (score < 80) return Math.max(score - 12, 45);
  if (score < 90) return Math.max(score - 16, 60);
  return Math.max(score - 22, 70);
}

export function getMasteryPhase(smartScore = 0) {
  const score = Number(smartScore || 0);
  if (score >= 100) return 'mastery';
  if (score >= 80) return 'proficiency';
  if (score >= 40) return 'growth';
  return 'foundation';
}

export function recommendDifficulty({ smartScore = 0, practiceLevel = 1, wrongStreak = 0 } = {}) {
  if (wrongStreak >= 2) return 'easy';
  if (practiceLevel >= 5 || smartScore >= 90) return 'hard';
  if (practiceLevel >= 3 || smartScore >= 70) return 'medium';
  return 'easy';
}

export function getMasteryKey(identity) {
  const { subject, topic, skillId, competencyId, userId } = identity || {};
  const userPrefix = userId ? `${userId}:` : '';
  return userPrefix + [subject || 'math', topic || 'addition', skillId || 'unknown-skill', competencyId || 'unmapped'].join('/');
}

export function loadAllMastery() {
  if (!canUseStorage()) return {};
  return safeParse(window.localStorage.getItem(STORAGE_KEY), {});
}

export function saveAllMastery(next) {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next || {}));
}

export function loadMasteryState(identity) {
  const key = getMasteryKey(identity);
  return loadAllMastery()[key] || null;
}

export function saveMasteryState(identity, state) {
  const key = getMasteryKey(identity);
  const allMastery = loadAllMastery();
  const next = {
    ...allMastery,
    [key]: {
      ...state,
      key,
      updatedAt: new Date().toISOString(),
    },
  };
  saveAllMastery(next);
  return next[key];
}

function getCorrectAnswer(question) {
  return question?.answer
    ?? question?.correctAnswer
    ?? question?.correctAnswerText
    ?? question?.correct_answer
    ?? question?.correct_answer_text
    ?? null;
}

export function createAttempt({
  question,
  userAnswer,
  isCorrect,
  difficulty,
  practiceLevel,
  smartScoreBefore,
  smartScoreAfter,
  startedAt,
  userId = 'student_local',
  hintUsed = false,
  phase = 'practicing',
  errorType = null,
  nextAction = 'stay',
}) {
  const metadata = question?.metadata || {};
  const createdAt = new Date().toISOString();
  const seed = question?.seed || metadata.seed || question?.adaptiveConfig?.variables?.seed || question?.variables?.seed || metadata.variables?.seed || null;

  return {
    subject: metadata.subject || 'math',
    topic: metadata.topic || 'addition',
    skillId: metadata.skillId || metadata.microSkillId || metadata.logicType || 'unknown-skill',
    competencyId: metadata.competencyId || metadata.competency?.id || null,
    templateId: metadata.templateId || metadata.task || null,
    engine: metadata.engine || null,
    isCorrect: Boolean(isCorrect),
    userAnswer,
    correctAnswer: getCorrectAnswer(question),
    difficulty,
    practiceLevel,
    smartScoreBefore: Number(smartScoreBefore || 0),
    smartScoreAfter: Number(smartScoreAfter || 0),
    timeSpentMs: startedAt ? Math.max(0, Date.now() - startedAt) : null,
    createdAt,
    streakThreshold: Number(metadata.streakThreshold || question?.streakThreshold || 5),
    seed,
    userId,
    hintUsed,
    phase,
    errorType,
    nextAction,
    adaptiveRules: question?.adaptiveRules || question?.metadata?.adaptiveRules || null,
  };
}

export function appendAttempt(attempt) {
  if (!canUseStorage()) return [];
  const attempts = safeParse(window.localStorage.getItem(ATTEMPTS_KEY), []);
  const next = [attempt, ...attempts].slice(0, 500);
  window.localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(next));
  return next;
}

export function updateMasteryState(previousState, attempt) {
  const previous = previousState || {};
  const streakThreshold = Number(attempt.streakThreshold || 5);
  const smartScoreBefore = Number(previous.smartScore ?? attempt.smartScoreBefore ?? 0);
  const smartScore = Number(attempt.smartScoreAfter ?? calculateSmartScore(smartScoreBefore, attempt.isCorrect));
  const correctStreak = attempt.isCorrect ? Number(previous.correctStreak || 0) + 1 : 0;
  const wrongStreak = attempt.isCorrect ? 0 : Number(previous.wrongStreak || 0) + 1;
  const nextLevelStreak = attempt.isCorrect ? Number(previous.levelStreak || 0) + 1 : 0;
  const didLevelUp = attempt.isCorrect && nextLevelStreak >= streakThreshold;
  const practiceLevel = didLevelUp
    ? Math.min(Number(previous.practiceLevel || attempt.practiceLevel || 1) + 1, 5)
    : Number(previous.practiceLevel || attempt.practiceLevel || 1);
  const levelStreak = didLevelUp ? 0 : nextLevelStreak;
  const attempts = Number(previous.attempts || 0) + 1;
  const sameSkillAttempts = Number(previous.sameSkillAttempts || 0) + 1;
  const fallbackDepth = Number(previous.fallbackDepth || 0);

  const correctCount = Number(previous.correctCount || 0) + (attempt.isCorrect ? 1 : 0);
  const incorrectCount = Number(previous.incorrectCount || 0) + (attempt.isCorrect ? 0 : 1);
  const masteryScore = attempts ? Math.round((correctCount / attempts) * 100) / 100 : 0;

  // Resolve custom adaptive rules
  const masteryRules = attempt.adaptiveRules?.masteryAchieved || null;
  const masteryThreshold = Number(masteryRules?.threshold ?? 100);
  const masteryRouteTarget = masteryRules?.target || masteryRules?.targetTemplateId || null;

  // Resolve Skill State Transitions
  let currentState = previous.state || 'practicing';
  let sourceSkillId = previous.sourceSkillId || attempt.skillId;
  let fallbackSkillId = previous.fallbackSkillId || null;

  let shouldPromote = false;
  let shouldFallback = false;
  let shouldBridgeBack = false;
  let nextAction = 'stay';

  if (attempt.isCorrect) {
    if (smartScore >= masteryThreshold) {
      currentState = 'mastered';
      shouldPromote = true;
      nextAction = 'promote';
    } else if (currentState === 'remediation') {
      if (correctStreak >= 1) {
        currentState = 'practicing';
      }
    } else if (currentState === 'prerequisite_review') {
      if (correctStreak >= 3 || smartScore >= 80) {
        currentState = 'bridge_back';
        shouldBridgeBack = true;
        nextAction = 'bridge_back';
      }
    }
  } else {
    // Check for custom incorrect/remediation target first
    const incorrectRules = attempt.adaptiveRules?.incorrect || null;
    const incorrectTarget = incorrectRules?.targetSkillId || incorrectRules?.target || incorrectRules?.targetTemplateId;
    
    if (incorrectTarget) {
      currentState = 'remediation';
      shouldFallback = true;
      fallbackSkillId = incorrectTarget;
      sourceSkillId = attempt.skillId;
      nextAction = 'fallback';
    } else {
      if (currentState === 'practicing') {
        if (wrongStreak >= 3) {
          const resolvedFallback = getPrerequisiteFallback(attempt.subject, attempt.topic, attempt.skillId);
          if (resolvedFallback && resolvedFallback !== attempt.skillId) {
            currentState = 'prerequisite_review';
            shouldFallback = true;
            fallbackSkillId = resolvedFallback;
            sourceSkillId = attempt.skillId;
            nextAction = 'fallback';
          } else {
            currentState = 'remediation';
            nextAction = 'remediating';
          }
        }
      } else if (currentState === 'remediation') {
        if (wrongStreak >= 2) {
          if (fallbackDepth < 2) {
            const resolvedFallback = getPrerequisiteFallback(attempt.subject, attempt.topic, attempt.skillId);
            if (resolvedFallback && resolvedFallback !== attempt.skillId) {
              currentState = 'prerequisite_review';
              shouldFallback = true;
              fallbackSkillId = resolvedFallback;
              sourceSkillId = attempt.skillId;
              nextAction = 'fallback';
            }
          }
        }
      }
    }
  }

  let nextFallbackDepth = fallbackDepth;
  if (shouldFallback) {
    nextFallbackDepth += 1;
  } else if (shouldBridgeBack || shouldPromote) {
    nextFallbackDepth = 0;
  }

  return {
    subject: attempt.subject,
    topic: attempt.topic,
    skillId: attempt.skillId,
    competencyId: attempt.competencyId,
    smartScore,
    masteryScore,
    phase: getMasteryPhase(smartScore),
    status: smartScore >= masteryThreshold ? 'mastered' : smartScore >= Math.min(80, masteryThreshold) ? 'proficient' : wrongStreak >= 2 ? 'needs_remediation' : 'learning',
    attempts,
    correctCount,
    incorrectCount,
    correctStreak,
    wrongStreak,
    levelStreak,
    practiceLevel,
    lastResult: attempt.isCorrect ? 'correct' : 'incorrect',
    remediationNeeded: wrongStreak >= 2 || currentState === 'remediation',
    recommendedDifficulty: recommendDifficulty({ smartScore, practiceLevel, wrongStreak }),
    recentAttempts: [attempt].concat(previous.recentAttempts || []).slice(0, 10),
    recentSeeds: [attempt.seed].concat(previous.recentSeeds || []).filter(Boolean).slice(0, 10),
    recentQuestionIds: [attempt.questionId].concat(previous.recentQuestionIds || []).filter(Boolean).slice(0, 10),
    lastAttemptAt: attempt.createdAt,
    didLevelUp,
    streakThreshold,
    state: currentState,
    sourceSkillId,
    fallbackSkillId,
    fallbackDepth: nextFallbackDepth,
    sameSkillAttempts,
    shouldPromote,
    shouldFallback,
    shouldBridgeBack,
    nextAction,
    masteryRouteTarget,
  };
}
