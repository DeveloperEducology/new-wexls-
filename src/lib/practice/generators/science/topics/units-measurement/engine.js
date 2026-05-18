import { generateThermometerQuestion } from './engines/thermometer.engine.js';
import { generateTimeEstimateQuestion } from './engines/unitChoice.engine.js';
import { generateDistanceEstimateQuestion } from './engines/distanceEstimate.engine.js';
import { generateMetricDistanceQuestion } from './engines/metricDistance.engine.js';
import { generateMeasurementToolQuestion } from './engines/measurementTool.engine.js';
import { getUnitsMeasurementSkill } from './skills/index.js';
import { getUnitsMeasurementTemplate } from './templates/index.js';

const ENGINE_GENERATORS = {
  thermometer: generateThermometerQuestion,
  unitChoice: generateTimeEstimateQuestion,
  distanceEstimate: generateDistanceEstimateQuestion,
  metricDistanceEstimate: generateMetricDistanceQuestion,
  measurementToolChoice: generateMeasurementToolQuestion,
};

export function createUnitsMeasurementTopicTemplate(skillOrTemplateId, overrides = {}) {
  const isTemplateId = skillOrTemplateId.includes('.');
  
  let template = null;
  let skill = null;
  
  if (isTemplateId) {
    template = getUnitsMeasurementTemplate(skillOrTemplateId);
  } else {
    skill = getUnitsMeasurementSkill(skillOrTemplateId);
    if (skill) {
      template = getUnitsMeasurementTemplate(skill.templateId);
    }
  }

  if (!template) {
    throw new Error(`Template not found for: ${skillOrTemplateId}`);
  }

  const engineConfig = {
    ...template,
    ...overrides,
    config: {
      ...(template.config || {}),
      ...(overrides.config || {}),
    },
    metadata: {
      ...(template.metadata || {}),
      ...(overrides.metadata || {}),
      skillId: skill?.id || overrides.metadata?.skillId,
      templateId: template.id,
      competencyId: skill?.competencyId || overrides.metadata?.competencyId,
    },
  };

  const generator = ENGINE_GENERATORS[template.engine];
  if (!generator) {
    throw new Error(`Engine generator not found for engine: ${template.engine}`);
  }

  return {
    template: engineConfig,
    generate: (variables = {}) => generator(engineConfig, variables),
  };
}
