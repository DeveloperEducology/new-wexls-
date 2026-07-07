/**
 * Registry – Chemical Reactions & Equations (Grade 10 Science)
 *
 * Follows the same pattern as:
 *   /src/lib/practice/generators/science/topics/units-measurement/registry.js
 */

import { generateChemicalReactionQuestion } from './engine.js';
import { grade10ChemReactionSkills } from './skills.js';

const skillMap = grade10ChemReactionSkills.reduce((acc, skill) => {
  acc[skill.id] = skill;
  return acc;
}, {});

/**
 * resolveChemicalReactionsGenerator
 *
 * @param {string} skillId   – one of 'cr-g10-identify-reaction' | 'cr-g10-classify-reaction' | 'cr-g10-balance-equation'
 * @param {object} overrides – optional overrides forwarded to the engine
 * @returns {{ generate: Function, template: object } | null}
 */
export function resolveChemicalReactionsGenerator(skillId, overrides = {}) {
  try {
    const skill = skillMap[skillId];
    if (!skill) {
      console.warn(`[ChemReactions Registry] Unknown skill: ${skillId}`);
      return null;
    }

    const engineConfig = {
      id: skill.templateId,
      engine: 'chemicalReactions',
      config: {
        defaultDifficulty: skill.difficulty,
        ...(overrides.config || {}),
      },
      metadata: {
        subject: skill.subject,
        topic: skill.topic,
        skillId: skill.id,
        competencyId: skill.competencyId,
        grade: skill.grade,
        ...(overrides.metadata || {}),
      },
      ...overrides,
    };

    return {
      template: engineConfig,
      generate: (variables = {}) =>
        generateChemicalReactionQuestion(engineConfig, {
          difficulty: skill.difficulty,
          ...variables,
        }),
    };
  } catch (error) {
    console.warn(`[ChemReactions Registry] Generator failed for ${skillId}:`, error);
    return null;
  }
}

export { grade10ChemReactionSkills, skillMap };
