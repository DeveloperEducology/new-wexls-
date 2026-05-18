import { createUnitsMeasurementTopicTemplate } from './engine.js';
import { getUnitsMeasurementSkill } from './skills/index.js';
import { getUnitsMeasurementTemplate } from './templates/index.js';

export function resolveUnitsMeasurementGenerator(skillId, overrides = {}) {
  try {
    const isTemplateId = skillId.includes('.');
    let template = null;

    if (isTemplateId) {
      template = getUnitsMeasurementTemplate(skillId);
    } else {
      const skill = getUnitsMeasurementSkill(skillId);
      if (skill) {
        template = getUnitsMeasurementTemplate(skill.templateId);
      }
    }

    if (!template) {
      return null;
    }

    const { generate, template: resolvedTemplate } = createUnitsMeasurementTopicTemplate(skillId, overrides);
    
    return {
      generate,
      template: resolvedTemplate,
    };
  } catch (error) {
    console.warn(`[Units Measurement Registry] Generator resolution failed for ${skillId}:`, error);
    return null;
  }
}
