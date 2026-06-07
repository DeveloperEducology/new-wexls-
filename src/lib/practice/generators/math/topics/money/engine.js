import { generateMoneyQuestion } from './engines/money.engine.js';
import { getMoneyTemplate } from './templates/index.js';
import { getMoneySkill } from './skills/index.js';

const ENGINE_GENERATORS = {
  money: generateMoneyQuestion
};

export function createMoneyTopicTemplate(skillOrTemplateId, overrides = {}) {
  const skill = getMoneySkill(skillOrTemplateId);
  const templateId = skill?.templateId || skillOrTemplateId;
  const template = getMoneyTemplate(templateId);
  if (!template) return null;

  return {
    logic_type: skill?.id || template.id,
    microSkillId: skill?.id || null,
    code: skill?.code || null,
    grade: skill?.grade || null,
    competencyId: skill?.competencyId || null,
    title: skill?.title || template.id,
    topic: 'money',
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
      topic: 'money',
      templateId: template.id,
      engine: template.engine,
      ...(overrides.adaptiveConfig || {})
    }
  };
}

export function generateMoneyTopicQuestion(config = {}, overrideVariables = null) {
  const logicType = config.logic_type
    || config.adaptiveConfig?.logic_type
    || config.template_id
    || config.templateId
    || config.microSkillId
    || 'lkg-money-coin-values';

  const template = createMoneyTopicTemplate(logicType, config);
  if (!template) {
    throw new Error(`[MoneyTopic] No template or skill registered for: ${logicType}`);
  }

  const generator = ENGINE_GENERATORS[template.engine];
  if (!generator) {
    throw new Error(`[MoneyTopic] No engine registered for: ${template.engine}`);
  }

  const variables = {
    ...(config.variables || {}),
    ...(config.adaptiveConfig?.variables || {}),
    ...(overrideVariables || {})
  };
  const question = generator(template, variables);

  return {
    ...question,
    resolvedConfig: template,
    adaptiveConfig: {
      ...(question.adaptiveConfig || {}),
      ...template.adaptiveConfig,
      variables: {
        seed: variables.seed || config.seed || Date.now().toString()
      }
    },
    metadata: {
      ...(question.metadata || {}),
      subject: 'math',
      logicType,
      skillId: template.microSkillId || logicType,
      microSkillId: template.microSkillId,
      code: template.code,
      grade: template.grade,
      competencyId: template.competencyId,
      topic: 'money',
      templateId: template.templateId,
      engine: template.engine
    }
  };
}
