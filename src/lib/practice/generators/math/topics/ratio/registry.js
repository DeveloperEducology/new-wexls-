/**
 * Registry of Ratio Templates, Micro-skills, and Competencies
 */

import {
  ratio_identify_from_words,
  ratio_same_kind_check,
  ratio_subtraction_vs_division,
  ratio_terms_antecedent_consequent,
  ratio_simplify_two_terms,
  ratio_simplify_three_terms,
  ratio_equivalent_find,
  ratio_equivalent_check,
  ratio_missing_value,
  ratio_fraction_to_whole,
  ratio_visual_count,
  ratio_word_problem_basic,
  ratio_error_analysis,
  ratio_table_completion,
  ratio_sorting,
  ratio_matching,
  ratio_units_concept,
  ratio_greater_comparison,
  ratio_pattern_completion,
  ratio_remediation,
  ratio_write_part_to_part_mcq,
  ratio_write_colon_single_blank,
  ratio_write_fraction_single_blank,
  ratio_which_model_represents_mcq
} from './engine.js';

import { RATIO_MICRO_SKILLS } from './microSkills.js';
import { RATIO_COMPETENCY_GRAPH } from './competencyGraph.js';
import { RATIO_LEARNING_PROGRESSION } from './progression.js';

export const ratioTemplateRegistry = {
  ratio_identify_from_words,
  ratio_same_kind_check,
  ratio_subtraction_vs_division,
  ratio_terms_antecedent_consequent,
  ratio_simplify_two_terms,
  ratio_simplify_three_terms,
  ratio_equivalent_find,
  ratio_equivalent_check,
  ratio_missing_value,
  ratio_fraction_to_whole,
  ratio_visual_count,
  ratio_word_problem_basic,
  ratio_error_analysis,
  ratio_table_completion,
  ratio_sorting,
  ratio_matching,
  ratio_units_concept,
  ratio_greater_comparison,
  ratio_pattern_completion,
  ratio_remediation,
  ratio_write_part_to_part_mcq,
  ratio_write_colon_single_blank,
  ratio_write_fraction_single_blank,
  ratio_which_model_represents_mcq
};

export const ratioMicroSkillRegistry = RATIO_MICRO_SKILLS;
export const ratioCompetencyRegistry = RATIO_COMPETENCY_GRAPH;

export function getTemplatesForSkill(skillId) {
  return RATIO_MICRO_SKILLS[skillId]?.templates || [];
}

export function getSkillByTemplate(templateId) {
  for (const [skillId, skill] of Object.entries(RATIO_MICRO_SKILLS)) {
    if (skill.templates.includes(templateId)) {
      return skillId;
    }
  }
  return null;
}

export function getNextSkill(currentSkillId, result = {}) {
  // If incorrect and misconception is detected, recommend ratio_remediation
  if (!result.isCorrect && result.detectedMisconception) {
    return "ratio_remediation";
  }

  // Otherwise, trace progression
  const progression = RATIO_LEARNING_PROGRESSION;
  let currentLevelIndex = -1;
  for (let i = 0; i < progression.length; i++) {
    if (progression[i].microSkills.includes(currentSkillId)) {
      currentLevelIndex = i;
      break;
    }
  }

  if (currentLevelIndex === -1) {
    return progression[0].microSkills[0];
  }

  if (result.isCorrect) {
    // If correct, go to the next skill in the current level, or the first skill in the next level
    const currentLevelSkills = progression[currentLevelIndex].microSkills;
    const currentSkillIndexInLevel = currentLevelSkills.indexOf(currentSkillId);

    if (currentSkillIndexInLevel < currentLevelSkills.length - 1) {
      return currentLevelSkills[currentSkillIndexInLevel + 1];
    } else {
      // Go to next level
      const nextLevelIndex = currentLevelIndex + 1;
      if (nextLevelIndex < progression.length) {
        return progression[nextLevelIndex].microSkills[0];
      }
    }
  }

  // Fallback to current skill if we can't advance or if result is incorrect without misconception
  return currentSkillId;
}
