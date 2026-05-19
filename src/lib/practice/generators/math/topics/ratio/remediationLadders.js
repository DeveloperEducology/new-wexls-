export const RATIO_REMEDIATION_LADDERS = {
  subtraction_vs_ratio_confusion: {
    misconceptionCode: "subtraction_vs_ratio_confusion",
    diagnosis: "The student compares quantities by subtraction/difference instead of division/multiplicative relationship.",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "Ratios measure how many times larger one group is compared to another using division, not how many more objects there are.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 2,
        hint: "Find the ratio by dividing the count of the first group by the second group.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_compare_by_subtraction",
        templateId: "ratio_subtraction_vs_division",
        scaffoldLevel: 3,
        hint: "Remember: 'how many times as many' indicates a ratio division comparison.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_compare_by_division",
        templateId: "ratio_subtraction_vs_division",
        scaffoldLevel: 4,
        hint: "Read the prompt carefully to see if it asks for the difference or the division ratio.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_compare_by_division",
        templateId: "ratio_subtraction_vs_division",
        scaffoldLevel: 5,
        hint: "Demonstrate mastery in distinguishing subtraction and division comparisons.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 80 }
  },
  order_confusion: {
    misconceptionCode: "order_confusion",
    diagnosis: "The student reverses the terms of the ratio (e.g. writing B:A instead of A:B).",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "The order of words determines the order of the numbers. If we ask for apples to oranges, apples must be first.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 2,
        hint: "Identify which item is mentioned first and write its number first.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_identify_from_words",
        templateId: "ratio_identify_from_words",
        scaffoldLevel: 3,
        hint: "Look closely at the phrase 'ratio of X to Y'. X is the first term, Y is the second term.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_identify_from_words",
        templateId: "ratio_identify_from_words",
        scaffoldLevel: 4,
        hint: "Confirm the positions of both terms before submitting.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_identify_from_words",
        templateId: "ratio_identify_from_words",
        scaffoldLevel: 5,
        hint: "Verify order under mixed settings.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 80 }
  },
  antecedent_consequent_confusion: {
    misconceptionCode: "antecedent_consequent_confusion",
    diagnosis: "The student confuses the antecedent (first term) with the consequent (second term).",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "Antecedent starts with 'A' (first), Consequent starts with 'C' (comes later/second).",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_terms_antecedent",
        templateId: "ratio_terms_antecedent_consequent",
        scaffoldLevel: 2,
        hint: "In ratio a:b, 'a' is the antecedent.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_terms_consequent",
        templateId: "ratio_terms_antecedent_consequent",
        scaffoldLevel: 3,
        hint: "In ratio a:b, 'b' is the consequent.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_terms_antecedent",
        templateId: "ratio_terms_antecedent_consequent",
        scaffoldLevel: 4,
        hint: "Identify the correct term requested by the prompt.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_terms_consequent",
        templateId: "ratio_terms_antecedent_consequent",
        scaffoldLevel: 5,
        hint: "Verify both terms accurately in random checks.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 80 }
  },
  hcf_not_used: {
    misconceptionCode: "hcf_not_used",
    diagnosis: "The student does not divide by the Highest Common Factor to simplify the ratio.",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "To find simplest form, we must divide both terms by the largest number that divides both.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_simplify_two_terms",
        templateId: "ratio_simplify_two_terms",
        scaffoldLevel: 2,
        hint: "Find the HCF of the two terms, and divide both terms by that HCF.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_simplify_two_terms",
        templateId: "ratio_simplify_two_terms",
        scaffoldLevel: 3,
        hint: "Make sure no common factors other than 1 remain in your answer.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_matching",
        templateId: "ratio_matching",
        scaffoldLevel: 4,
        hint: "Match each unsimplified ratio to its simplest form by dividing by their HCF.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_simplify_three_terms",
        templateId: "ratio_simplify_three_terms",
        scaffoldLevel: 5,
        hint: "Simplify a 3-term ratio completely using the HCF of all three terms.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 85 }
  },
  partial_simplification: {
    misconceptionCode: "partial_simplification",
    diagnosis: "The student divides by a common factor, but not the highest common factor, leaving it partially simplified (e.g. 12:18 simplified to 6:9 instead of 2:3).",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "If terms can still be divided by another number, the ratio is not yet in simplest form.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_simplify_two_terms",
        templateId: "ratio_simplify_two_terms",
        scaffoldLevel: 2,
        hint: "Check if the resulting numbers still have common factors.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_simplify_two_terms",
        templateId: "ratio_simplify_two_terms",
        scaffoldLevel: 3,
        hint: "Determine the true HCF from the start to simplify in one step.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_simplify_three_terms",
        templateId: "ratio_simplify_three_terms",
        scaffoldLevel: 4,
        hint: "Simplify all three terms completely.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_simplify_two_terms",
        templateId: "ratio_simplify_two_terms",
        scaffoldLevel: 5,
        hint: "Simplify two-term and three-term check.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 85 }
  },
  unlike_quantities_confusion: {
    misconceptionCode: "unlike_quantities_confusion",
    diagnosis: "The student attempts to form a ratio between unlike quantities with incompatible physical units (e.g. length to weight).",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "Ratios compare similar physical properties. You cannot compare distance directly to weight.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_unlike_quantities",
        templateId: "ratio_same_kind_check",
        scaffoldLevel: 2,
        hint: "Check if both values represent the same physical property (like weight, volume, or length).",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_unlike_quantities",
        templateId: "ratio_same_kind_check",
        scaffoldLevel: 3,
        hint: "Ensure you declare a ratio 'impossible' if the kinds of quantities are different.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_unlike_quantities",
        templateId: "ratio_same_kind_check",
        scaffoldLevel: 4,
        hint: "Decide whether the pair can form a valid ratio.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_unlike_quantities",
        templateId: "ratio_same_kind_check",
        scaffoldLevel: 5,
        hint: "Final validation check.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 80 }
  },
  unit_attached_to_ratio: {
    misconceptionCode: "unit_attached_to_ratio",
    diagnosis: "The student retains units in the simplified ratio (e.g., writing 2:3 kg instead of 2:3).",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "Because a ratio divides similar quantities, the units cancel out. Ratios must have no units.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_units_no_units",
        templateId: "ratio_units_concept",
        scaffoldLevel: 2,
        hint: "A ratio is a pure number. Remove units (like cm or kg) from your final ratio answer.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_units_no_units",
        templateId: "ratio_units_concept",
        scaffoldLevel: 3,
        hint: "Choose the option that represents a unitless ratio.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_units_no_units",
        templateId: "ratio_units_concept",
        scaffoldLevel: 4,
        hint: "Simplify and write without units.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_units_no_units",
        templateId: "ratio_units_concept",
        scaffoldLevel: 5,
        hint: "Confirm understanding that ratios are numerical relationships only.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 80 }
  },
  fraction_ratio_lcm_error: {
    misconceptionCode: "fraction_ratio_lcm_error",
    diagnosis: "The student fails to multiply by the correct LCM of denominators when converting a fractional ratio to a whole number ratio.",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "To eliminate denominators, find the Least Common Multiple (LCM) of all denominators and multiply every term by it.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_fraction_to_whole",
        templateId: "ratio_fraction_to_whole",
        scaffoldLevel: 2,
        hint: "Find the LCM of the denominators. Multiply both fractions by this LCM.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_fraction_to_whole",
        templateId: "ratio_fraction_to_whole",
        scaffoldLevel: 3,
        hint: "Ensure both terms are converted to integers, then simplify if they share common factors.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_fraction_to_whole",
        templateId: "ratio_fraction_to_whole",
        scaffoldLevel: 4,
        hint: "Perform the full conversion from fractional ratio to simplified integer ratio.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_fraction_to_whole",
        templateId: "ratio_fraction_to_whole",
        scaffoldLevel: 5,
        hint: "Verify with random fraction inputs.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 80 }
  },
  equivalent_ratio_scaling_error: {
    misconceptionCode: "equivalent_ratio_scaling_error",
    diagnosis: "The student multiplies or divides one term incorrectly, or adds/subtracts a constant instead of multiplying/dividing.",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "Equivalent ratios can ONLY be made by multiplying or dividing both terms by the SAME non-zero number. Adding or subtracting does not work.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_equivalent_scale_up",
        templateId: "ratio_equivalent_find",
        scaffoldLevel: 2,
        hint: "Multiply both terms of the ratio by the same given factor.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_equivalent_scale_down",
        templateId: "ratio_equivalent_find",
        scaffoldLevel: 3,
        hint: "Divide both terms of the ratio by the same given factor.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_equivalent_check",
        templateId: "ratio_equivalent_check",
        scaffoldLevel: 4,
        hint: "Check if one ratio can be scaled directly to the other using multiplication or division.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_sorting",
        templateId: "ratio_sorting",
        scaffoldLevel: 5,
        hint: "Sort ratios into equivalent piles to prove mastery.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 80 }
  },
  missing_value_cross_multiply_error: {
    misconceptionCode: "missing_value_cross_multiply_error",
    diagnosis: "The student performs incorrect scaling or arithmetic when solving equivalent ratios with an unknown variable.",
    ladder: [
      {
        step: 1,
        type: "concept_visual",
        microSkillId: "ratio_remediation",
        templateId: "ratio_remediation",
        scaffoldLevel: 1,
        hint: "Set up the ratios as fractions, then find the multiplier that relates the known terms.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 2,
        type: "guided_numeric",
        microSkillId: "ratio_missing_value",
        templateId: "ratio_missing_value",
        scaffoldLevel: 2,
        hint: "Identify the scale factor between the two matching parts, then apply it to get the missing number.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 3,
        type: "partial_independent",
        microSkillId: "ratio_table_completion",
        templateId: "ratio_table_completion",
        scaffoldLevel: 3,
        hint: "Apply the constant ratio scale factor across the table rows.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 4,
        type: "independent_retry",
        microSkillId: "ratio_pattern_completion",
        templateId: "ratio_pattern_completion",
        scaffoldLevel: 4,
        hint: "Fill in the next equivalent ratio term following the scale sequence.",
        successCriteria: { consecutiveCorrect: 1 }
      },
      {
        step: 5,
        type: "mastery_check",
        microSkillId: "ratio_missing_value",
        templateId: "ratio_missing_value",
        scaffoldLevel: 5,
        hint: "Demonstrate final mastery on missing values.",
        successCriteria: { consecutiveCorrect: 2 }
      }
    ],
    exitCriteria: { smartScore: 85 }
  }
};
