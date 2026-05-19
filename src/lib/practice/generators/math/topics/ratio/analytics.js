export function buildAttemptAnalytics(question, userAnswer, validationResult = {}) {
  const metadata = question.metadata || {};
  const pedagogy = question.pedagogy || {};
  const isCorrect = !!validationResult.isCorrect;
  const misconceptionDetected = validationResult.detectedMisconception || null;

  // Determine standard deltas
  let masteryDelta = isCorrect ? 5 : -10;
  let confidenceDelta = isCorrect ? 10 : -15;

  // Boost negative delta slightly if misconception is specifically targeted / remediated
  if (misconceptionDetected) {
    masteryDelta = -15;
    confidenceDelta = -20;
  }

  // Basic adaptive path recommendation
  let nextRecommendation = null;
  if (!isCorrect && misconceptionDetected) {
    nextRecommendation = {
      action: "remediate",
      misconceptionCode: misconceptionDetected,
      skillId: pedagogy.remediationSkillIds?.[0] || question.skillId
    };
  } else if (!isCorrect) {
    nextRecommendation = {
      action: "retry",
      skillId: question.skillId
    };
  } else {
    nextRecommendation = {
      action: "advance",
      skillId: question.skillId
    };
  }

  return {
    questionId: question.id,
    skillId: question.skillId,
    microSkillId: pedagogy.microSkillId || question.skillId,
    competencyId: pedagogy.competencyId || null,
    templateId: question.templateId || null,
    isCorrect,
    misconceptionDetected,
    timeSpent: metadata.timeSpent || null,
    attemptNumber: metadata.attemptNumber || 1,
    difficultyProfile: question.difficultyProfile || null,
    masteryDelta,
    confidenceDelta,
    nextRecommendation
  };
}
