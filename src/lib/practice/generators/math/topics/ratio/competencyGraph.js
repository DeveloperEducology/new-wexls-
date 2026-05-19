export const RATIO_COMPETENCY_GRAPH = {
  topic: "ratio",
  competencies: [
    {
      competencyId: "ratio_remediation",
      title: "Ratio Remediation",
      description: "Fundamental scaffolding for basic division and visualization concepts.",
      microSkills: ["ratio_remediation"],
      prerequisites: [],
      unlocks: ["ratio_visual_models"]
    },
    {
      competencyId: "ratio_visual_models",
      title: "Ratio Visual Models",
      description: "Concrete visual groups, ratio tables, and equivalent visual diagrams.",
      microSkills: ["ratio_visual_count", "ratio_table_completion", "ratio_pattern_completion"],
      prerequisites: ["ratio_remediation"],
      unlocks: ["ratio_foundations"]
    },
    {
      competencyId: "ratio_foundations",
      title: "Ratio Foundations",
      description: "Understanding ratios as comparison by division, same-kind checking, and standard colon notation.",
      microSkills: [
        "ratio_compare_same_kind",
        "ratio_compare_by_subtraction",
        "ratio_compare_by_division",
        "ratio_identify_from_words"
      ],
      prerequisites: ["ratio_visual_models"],
      unlocks: ["ratio_terms", "ratio_simplification"]
    },
    {
      competencyId: "ratio_terms",
      title: "Ratio Terms",
      description: "Identifying antecedent and consequent terms in a ratio.",
      microSkills: ["ratio_terms_antecedent", "ratio_terms_consequent"],
      prerequisites: ["ratio_foundations"],
      unlocks: ["ratio_simplification"]
    },
    {
      competencyId: "ratio_simplification",
      title: "Ratio Simplification",
      description: "Reducing two-term and three-term ratios to lowest terms using HCF.",
      microSkills: ["ratio_simplify_two_terms", "ratio_simplify_three_terms", "ratio_matching"],
      prerequisites: ["ratio_foundations"],
      unlocks: ["ratio_equivalence", "ratio_fraction_ratios"]
    },
    {
      competencyId: "ratio_equivalence",
      title: "Ratio Equivalence",
      description: "Finding equivalent ratios by scaling up/down and checking equivalence.",
      microSkills: [
        "ratio_equivalent_scale_up",
        "ratio_equivalent_scale_down",
        "ratio_equivalent_check",
        "ratio_missing_value",
        "ratio_sorting"
      ],
      prerequisites: ["ratio_simplification"],
      unlocks: ["ratio_word_problems", "ratio_reasoning"]
    },
    {
      competencyId: "ratio_fraction_ratios",
      title: "Fraction Ratios",
      description: "Converting ratios containing fractions to whole number form.",
      microSkills: ["ratio_fraction_to_whole"],
      prerequisites: ["ratio_simplification"],
      unlocks: ["ratio_word_problems"]
    },
    {
      competencyId: "ratio_word_problems",
      title: "Ratio Word Problems",
      description: "Practical real-world applications and story-based ratio problem solving.",
      microSkills: ["ratio_word_problem_basic"],
      prerequisites: ["ratio_equivalence", "ratio_fraction_ratios"],
      unlocks: ["ratio_reasoning"]
    },
    {
      competencyId: "ratio_reasoning",
      title: "Mathematical Reasoning",
      description: "Comparing sizes, checking physical unit rules, and identifying conceptual errors.",
      microSkills: [
        "ratio_units_no_units",
        "ratio_unlike_quantities",
        "ratio_error_analysis",
        "ratio_compare_greater"
      ],
      prerequisites: ["ratio_word_problems"],
      unlocks: []
    }
  ]
};
