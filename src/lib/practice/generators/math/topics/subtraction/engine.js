import { generateRemoveCubesQuestion } from './engines/removeCubes.engine.js';
import { generatePictureSentenceQuestion } from './engines/pictureSentence.engine.js';
import { getSubtractionSkill } from './skills/index.js';
import { getSubtractionTemplate } from './templates/index.js';

const ENGINE_GENERATORS = {
  removeCubes: generateRemoveCubesQuestion,
  pictureSentence: generatePictureSentenceQuestion,
};

export function createSubtractionTopicTemplate(skillOrTemplateId, overrides = {}) {
  const skill = getSubtractionSkill(skillOrTemplateId);
  const templateId = skill?.templateId || skillOrTemplateId;
  const template = getSubtractionTemplate(templateId);
  if (!template) return null;

  return {
    logic_type: skill?.id || template.id,
    microSkillId: skill?.id || null,
    code: skill?.code || null,
    grade: skill?.grade || null,
    title: skill?.title || template.id,
    topic: 'subtraction',
    templateId: template.id,
    engine: template.engine,
    type: template.questionType,
    config: {
      ...(template.defaultConfig || {}),
      ...(skill?.config || {}),
      ...(overrides.config || {}),
      ...(overrides.difficulty ? { difficulty: overrides.difficulty } : {}),
      ...(overrides.history ? { history: overrides.history } : {}),
    },
    adaptiveConfig: {
      logic_type: skill?.id || template.id,
      topic: 'subtraction',
      templateId: template.id,
      engine: template.engine,
      ...(overrides.adaptiveConfig || {}),
    },
  };
}

export function generateSubtractionTopicQuestion(config = {}, overrideVariables = null) {
  const logicType = config.logic_type
    || config.adaptiveConfig?.logic_type
    || config.template_id
    || config.templateId
    || config.microSkillId
    || 'subtraction-g1-c1-remove-cubes-to-10';

  const template = createSubtractionTopicTemplate(logicType, config);
  if (!template) {
    throw new Error(`[SubtractionTopic] No template or skill registered for: ${logicType}`);
  }

  const generator = ENGINE_GENERATORS[template.engine];
  if (!generator) {
    throw new Error(`[SubtractionTopic] No engine registered for: ${template.engine}`);
  }

  const variables = {
    ...(config.variables || {}),
    ...(config.adaptiveConfig?.variables || {}),
    ...(overrideVariables || {}),
  };
  const question = generator(template, variables);

  return {
    ...question,
    resolvedConfig: template,
    adaptiveConfig: {
      ...(question.adaptiveConfig || {}),
      ...template.adaptiveConfig,
      variables: {
        seed: variables.seed || config.seed || Date.now().toString(),
      },
    },
    metadata: {
      ...(question.metadata || {}),
      subject: 'math',
      logicType,
      skillId: template.microSkillId || logicType,
      microSkillId: template.microSkillId,
      code: template.code,
      grade: template.grade,
      topic: 'subtraction',
      templateId: template.templateId,
      engine: template.engine,
    },
  };
}
