// engine.js
import { getMultiplicationTemplate } from './templates/index.js';
import { getMultiplicationSkill } from './skills/index.js';
import { generateFactsQuestion } from './engines/facts.engine.js';
import { generateVerticalMultiplicationQuestion } from './engines/vertical.engine.js';
import { generateVisualGroupsQuestion } from './engines/visualGroups.engine.js';

const ENGINE_GENERATORS = {
  facts: generateFactsQuestion,
  vertical: generateVerticalMultiplicationQuestion,
  visualGroups: generateVisualGroupsQuestion
};

export function createMultiplicationTemplate(skillOrTemplateId, overrides = {}) {
  const skill = getMultiplicationSkill(skillOrTemplateId);
  const templateId = skill?.templateId || skillOrTemplateId;
  const template = getMultiplicationTemplate(templateId);

  return {
    logic_type: skill?.id || template.id,
    microSkillId: skill?.id || null,
    code: skill?.code || null,
    grade: skill?.grade || null,
    competencyId: skill?.competencyId || null,
    title: skill?.title || template.id,
    topic: 'multiplication',
    templateId: template.id,
    engine: template.engine,
    type: template.questionType,
    config: {
      ...(template.defaultConfig || {}),
      ...(skill?.config || {}),
      ...(overrides.config || {}),
      ...(overrides.difficulty ? { difficulty: overrides.difficulty } : {}),
      ...(overrides.history ? { history: overrides.history } : {})
    },
    adaptiveConfig: {
      logic_type: skill?.id || template.id,
      topic: 'multiplication',
      templateId: template.id,
      engine: template.engine
    }
  };
}

export function generateMultiplicationQuestion(config) {
  const logicType = config?.logic_type
    || config?.adaptiveConfig?.logic_type
    || config?.skill
    || config?.templateId
    || 'multiplication-g2-a1-facts-to-5';
  const template = createMultiplicationTemplate(logicType, config);
  const generator = ENGINE_GENERATORS[template.engine];

  if (!generator) {
    throw new Error(`No generator found for multiplication engine: ${template.engine}`);
  }

  const variables = {
    ...(config?.variables || {}),
    ...(config?.adaptiveConfig?.variables || {})
  };
  const question = generator(template, variables);

  return {
    ...question,
    resolvedConfig: template,
    adaptiveConfig: {
      ...(question.adaptiveConfig || {}),
      ...template.adaptiveConfig,
      variables: {
        seed: variables.seed || config?.seed || Date.now().toString()
      }
    },
    metadata: {
      ...question.metadata,
      subject: 'math',
      topic: 'multiplication',
      logicType,
      skillId: template.microSkillId || logicType,
      microSkillId: template.microSkillId,
      templateId: template.templateId,
      engine: template.engine,
      code: template.code,
      grade: template.grade,
      competencyId: template.competencyId,
      title: template.title,
    }
  };
}
