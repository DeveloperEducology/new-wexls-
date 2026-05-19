export const RATIO_DIFFICULTY_PROFILES = {
  easy_visual: {
    label: "Easy Visual",
    numberRange: [1, 10],
    termsCount: 2,
    allowFractions: false,
    allowDecimals: false,
    visualSupport: true,
    stepsRequired: 1,
    distractorComplexity: "low",
    languageComplexity: "simple",
    misconceptionRisk: 0.1,
    estimatedTime: 20
  },
  easy_numeric: {
    label: "Easy Numeric",
    numberRange: [1, 15],
    termsCount: 2,
    allowFractions: false,
    allowDecimals: false,
    visualSupport: false,
    stepsRequired: 1,
    distractorComplexity: "low",
    languageComplexity: "simple",
    misconceptionRisk: 0.2,
    estimatedTime: 25
  },
  medium_simplify: {
    label: "Medium Simplify",
    numberRange: [2, 50],
    termsCount: 2,
    allowFractions: false,
    allowDecimals: false,
    visualSupport: false,
    stepsRequired: 2,
    distractorComplexity: "medium",
    languageComplexity: "simple",
    misconceptionRisk: 0.4,
    estimatedTime: 35
  },
  medium_equivalent: {
    label: "Medium Equivalent",
    numberRange: [2, 30],
    termsCount: 2,
    allowFractions: false,
    allowDecimals: false,
    visualSupport: false,
    stepsRequired: 2,
    distractorComplexity: "medium",
    languageComplexity: "simple",
    misconceptionRisk: 0.4,
    estimatedTime: 30
  },
  medium_missing_value: {
    label: "Medium Missing Value",
    numberRange: [2, 60],
    termsCount: 2,
    allowFractions: false,
    allowDecimals: false,
    visualSupport: true,
    stepsRequired: 2,
    distractorComplexity: "medium",
    languageComplexity: "simple",
    misconceptionRisk: 0.5,
    estimatedTime: 40
  },
  hard_fraction: {
    label: "Hard Fraction",
    numberRange: [2, 20],
    termsCount: 2,
    allowFractions: true,
    allowDecimals: false,
    visualSupport: false,
    stepsRequired: 3,
    distractorComplexity: "high",
    languageComplexity: "medium",
    misconceptionRisk: 0.6,
    estimatedTime: 50
  },
  hard_word_problem: {
    label: "Hard Word Problem",
    numberRange: [2, 100],
    termsCount: 2,
    allowFractions: false,
    allowDecimals: false,
    visualSupport: false,
    stepsRequired: 3,
    distractorComplexity: "high",
    languageComplexity: "complex",
    misconceptionRisk: 0.5,
    estimatedTime: 60
  },
  hard_reasoning: {
    label: "Hard Reasoning",
    numberRange: [2, 120],
    termsCount: 3,
    allowFractions: false,
    allowDecimals: false,
    visualSupport: false,
    stepsRequired: 3,
    distractorComplexity: "high",
    languageComplexity: "complex",
    misconceptionRisk: 0.7,
    estimatedTime: 55
  },
  mastery_mixed: {
    label: "Mastery Mixed",
    numberRange: [2, 150],
    termsCount: 3,
    allowFractions: true,
    allowDecimals: false,
    visualSupport: false,
    stepsRequired: 3,
    distractorComplexity: "high",
    languageComplexity: "complex",
    misconceptionRisk: 0.6,
    estimatedTime: 45
  }
};

/**
 * Maps a simple difficulty string ("easy" | "medium" | "hard") to a target profile.
 */
export function mapDifficultyToProfile(difficulty, fallbackProfile = "easy_numeric") {
  if (!difficulty) return RATIO_DIFFICULTY_PROFILES[fallbackProfile];
  const diffStr = String(difficulty).toLowerCase();
  
  if (diffStr === "easy") {
    return RATIO_DIFFICULTY_PROFILES.easy_numeric;
  }
  if (diffStr === "medium") {
    return RATIO_DIFFICULTY_PROFILES.medium_simplify;
  }
  if (diffStr === "hard") {
    return RATIO_DIFFICULTY_PROFILES.hard_word_problem;
  }
  
  if (RATIO_DIFFICULTY_PROFILES[difficulty]) {
    return RATIO_DIFFICULTY_PROFILES[difficulty];
  }
  
  return RATIO_DIFFICULTY_PROFILES[fallbackProfile];
}
