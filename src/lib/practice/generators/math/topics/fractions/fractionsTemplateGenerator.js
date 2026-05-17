
import { fractionsV2Registry } from './registry.js';

/**
 * Fractions V2 Smart Template Generator
 * Orchestrates the existing Fractions V2 engines into a pedagogical ladder.
 */

const FRACTIONS_LADDER = [
  { level: 1, skills: ['visual_models_equal_parts', 'visual_models_identify'], desc: 'Visual Foundations' },
  { level: 2, skills: ['visual_models_fraction_of_set', 'number_lines_identify'], desc: 'Models & Number Lines' },
  { level: 3, skills: ['equivalence_identify_equivalent', 'equivalence_simplify'], desc: 'Equivalence' },
  { level: 4, skills: ['comparison_visual_compare', 'comparison_sorting_fractions'], desc: 'Comparison & Ordering' },
  { level: 5, skills: ['visual_models_mixed_numbers', 'conversions_fraction_to_decimal'], desc: 'Mixed Numbers & Decimals' },
  { level: 6, skills: ['operations_add_like_denominators', 'operations_subtract_like_denominators'], desc: 'Basic Operations' },
  { level: 7, skills: ['word_problems_fraction_value', 'word_problems_fraction_of_number'], desc: 'Word Problems' },
  { level: 8, skills: ['rational_numbers_add_sub', 'rational_numbers_compare'], desc: 'Rational Mastery' }
];

export function generateSmartFractionsQuestion(config = {}) {
  const history = config.history || { correctStreak: 0, lastResult: 'none' };
  const difficulty = config.difficulty || 'adaptive';
  const seed = config.variables?.seed || Date.now().toString();

  let currentLevel = 1;
  if (difficulty === 'adaptive') {
    // SmartScore mapping for Fractions
    if (history.correctStreak >= 15) currentLevel = 8;
    else if (history.correctStreak >= 12) currentLevel = 7;
    else if (history.correctStreak >= 10) currentLevel = 6;
    else if (history.correctStreak >= 8) currentLevel = 5;
    else if (history.correctStreak >= 6) currentLevel = 4;
    else if (history.correctStreak >= 4) currentLevel = 3;
    else if (history.correctStreak >= 2) currentLevel = 2;

    if (history.lastResult === 'incorrect' && currentLevel > 1) {
      currentLevel -= 1; // Remediation drop
    }
  } else {
    const diffMap = { easy: 1, medium: 4, hard: 7 };
    currentLevel = diffMap[difficulty] || 1;
  }

  const levelData = FRACTIONS_LADDER.find(l => l.level === currentLevel) || FRACTIONS_LADDER[0];
  const selectedSkillId = levelData.skills[Math.floor(Math.random() * levelData.skills.length)];
  
  const skillConfig = fractionsV2Registry[selectedSkillId];
  if (!skillConfig) {
      console.error(`Skill ${selectedSkillId} not found in registry`);
      return { error: 'skill_not_found' };
  }

  // Call the specific engine from registry
  const question = skillConfig.engine({
      ...config,
      engineParams: {
          ...skillConfig.params,
          ...config.engineParams
      },
      variables: {
          ...config.variables,
          seed
      }
  });

  // Inject smart metadata
  return {
    ...question,
    metadata: {
      ...question.metadata,
      adaptive_level: currentLevel,
      level_desc: levelData.desc,
      smart_skill_id: selectedSkillId
    }
  };
}

export default generateSmartFractionsQuestion;
