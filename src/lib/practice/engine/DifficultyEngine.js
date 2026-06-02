/**
 * WEXLS Difficulty Engine
 * Evaluates cognitive load parameters based on student history (streak, level)
 * or explicit difficulty overrides.
 */

export const DIFFICULTY_MAP = {
  lkg: {
    easy: {
      optionCount: 2,
      distractorSimilarityMin: 1, // distant options
      rotationScale: 0,
      scaleVariation: 1.0,
      crowdingFactor: 0,
      audioAutoplay: true,
      visualHintsEnabled: true,
      wordingComplexity: 'simple'
    },
    medium: {
      optionCount: 3,
      distractorSimilarityMin: 3, // moderate/phonetic similar options
      rotationScale: 15,
      scaleVariation: 0.95,
      crowdingFactor: 1,
      audioAutoplay: true,
      visualHintsEnabled: false,
      wordingComplexity: 'simple'
    },
    hard: {
      optionCount: 4,
      distractorSimilarityMin: 5, // mirror letter / visual confusable options (b/d/p/q)
      rotationScale: 30,
      scaleVariation: 0.9,
      crowdingFactor: 2,
      audioAutoplay: false,
      visualHintsEnabled: false,
      wordingComplexity: 'standard'
    }
  }
};

/**
 * Resolves difficulty level and retrieves difficulty parameters.
 * 
 * @param {Object} history - Student practice history
 * @param {number} history.correctStreak - Current correct streak
 * @param {number} history.practiceLevel - Student level (1-5)
 * @param {string} [explicitDifficulty] - Explicit override ('easy' | 'medium' | 'hard')
 * @param {string} [grade='lkg'] - Student grade
 * @returns {Object} Hydrated difficulty parameters
 */
export function getDifficultyParameters(history = {}, explicitDifficulty, grade = 'lkg') {
  const gradeKey = String(grade).toLowerCase();
  const gradeMap = DIFFICULTY_MAP[gradeKey] || DIFFICULTY_MAP.lkg;

  let level = 'easy';

  if (explicitDifficulty && gradeMap[explicitDifficulty]) {
    level = explicitDifficulty;
  } else {
    const streak = Number(history.correctStreak || 0);
    if (streak >= 6) {
      level = 'hard';
    } else if (streak >= 3) {
      level = 'medium';
    } else {
      level = 'easy';
    }
  }

  return {
    level,
    ...gradeMap[level]
  };
}
