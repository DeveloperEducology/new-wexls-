export const RATIO_LEARNING_PROGRESSION = [
  {
    level: 1,
    title: "Concrete Visual Comparison",
    microSkills: [
      "ratio_visual_count",
      "ratio_write_part_to_part_mcq",
      "ratio_write_colon_single_blank",
      "ratio_write_fraction_single_blank",
      "ratio_which_model_represents_mcq"
    ],
    allowedTemplates: [
      "ratio_visual_count",
      "ratio_write_part_to_part_mcq",
      "ratio_write_colon_single_blank",
      "ratio_write_fraction_single_blank",
      "ratio_which_model_represents_mcq"
    ],
    difficulty: "easy",
    unlockCriteria: { smartScore: 80, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "order_confusion" }
  },
  {
    level: 2,
    title: "Same-Kind Quantity Check",
    microSkills: ["ratio_compare_same_kind", "ratio_unlike_quantities"],
    allowedTemplates: ["ratio_same_kind_check"],
    difficulty: "easy",
    unlockCriteria: { smartScore: 80, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "unlike_quantities_confusion" }
  },
  {
    level: 3,
    title: "Ratio Notation from Words",
    microSkills: ["ratio_identify_from_words", "ratio_compare_by_subtraction", "ratio_compare_by_division"],
    allowedTemplates: ["ratio_identify_from_words", "ratio_subtraction_vs_division"],
    difficulty: "easy",
    unlockCriteria: { smartScore: 80, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "subtraction_vs_ratio_confusion" }
  },
  {
    level: 4,
    title: "Antecedent & Consequent",
    microSkills: ["ratio_terms_antecedent", "ratio_terms_consequent", "ratio_units_no_units"],
    allowedTemplates: ["ratio_terms_antecedent_consequent", "ratio_units_concept"],
    difficulty: "easy",
    unlockCriteria: { smartScore: 80, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "antecedent_consequent_confusion" }
  },
  {
    level: 5,
    title: "Simplify 2-Term Ratios",
    microSkills: ["ratio_simplify_two_terms", "ratio_matching"],
    allowedTemplates: ["ratio_simplify_two_terms", "ratio_matching"],
    difficulty: "medium",
    unlockCriteria: { smartScore: 85, consecutiveCorrect: 5 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "hcf_not_used" }
  },
  {
    level: 6,
    title: "Simplify 3-Term Ratios",
    microSkills: ["ratio_simplify_three_terms"],
    allowedTemplates: ["ratio_simplify_three_terms"],
    difficulty: "medium",
    unlockCriteria: { smartScore: 85, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "partial_simplification" }
  },
  {
    level: 7,
    title: "Equivalent Ratios",
    microSkills: ["ratio_equivalent_scale_up", "ratio_equivalent_scale_down", "ratio_equivalent_check", "ratio_sorting"],
    allowedTemplates: ["ratio_equivalent_find", "ratio_equivalent_check", "ratio_sorting"],
    difficulty: "medium",
    unlockCriteria: { smartScore: 80, consecutiveCorrect: 5 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "equivalent_ratio_scaling_error" }
  },
  {
    level: 8,
    title: "Missing Values",
    microSkills: ["ratio_missing_value"],
    allowedTemplates: ["ratio_missing_value"],
    difficulty: "medium",
    unlockCriteria: { smartScore: 85, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "missing_value_cross_multiply_error" }
  },
  {
    level: 9,
    title: "Ratio Tables",
    microSkills: ["ratio_table_completion", "ratio_pattern_completion"],
    allowedTemplates: ["ratio_table_completion", "ratio_pattern_completion"],
    difficulty: "medium",
    unlockCriteria: { smartScore: 85, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "equivalent_ratio_scaling_error" }
  },
  {
    level: 10,
    title: "Fraction Ratios",
    microSkills: ["ratio_fraction_to_whole"],
    allowedTemplates: ["ratio_fraction_to_whole"],
    difficulty: "hard",
    unlockCriteria: { smartScore: 80, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "fraction_ratio_lcm_error" }
  },
  {
    level: 11,
    title: "Word Problems",
    microSkills: ["ratio_word_problem_basic"],
    allowedTemplates: ["ratio_word_problem_basic"],
    difficulty: "hard",
    unlockCriteria: { smartScore: 85, consecutiveCorrect: 5 },
    remediationTriggers: { wrongCount: 2, misconceptionTriggered: "order_confusion" }
  },
  {
    level: 12,
    title: "Comparison of Ratios",
    microSkills: ["ratio_compare_greater"],
    allowedTemplates: ["ratio_greater_comparison"],
    difficulty: "hard",
    unlockCriteria: { smartScore: 85, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2 }
  },
  {
    level: 13,
    title: "Error Analysis",
    microSkills: ["ratio_error_analysis"],
    allowedTemplates: ["ratio_error_analysis"],
    difficulty: "hard",
    unlockCriteria: { smartScore: 85, consecutiveCorrect: 4 },
    remediationTriggers: { wrongCount: 2 }
  },
  {
    level: 14,
    title: "Mixed Mastery Review",
    microSkills: [
      "ratio_visual_count",
      "ratio_identify_from_words",
      "ratio_simplify_two_terms",
      "ratio_equivalent_check",
      "ratio_missing_value",
      "ratio_word_problem_basic",
      "ratio_compare_greater"
    ],
    allowedTemplates: [
      "ratio_visual_count",
      "ratio_identify_from_words",
      "ratio_simplify_two_terms",
      "ratio_equivalent_check",
      "ratio_missing_value",
      "ratio_word_problem_basic",
      "ratio_greater_comparison"
    ],
    difficulty: "hard",
    unlockCriteria: { smartScore: 95, consecutiveCorrect: 10 },
    remediationTriggers: { wrongCount: 3 }
  }
];
