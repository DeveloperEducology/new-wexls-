import { createMoneyTopicTemplate, generateMoneyTopicQuestion } from './engine.js';
import { moneyMicroSkills, getMoneySkill } from './skills/index.js';
import { moneyTemplates } from './templates/index.js';

export const moneyTopicContract = {
  subject: 'math',
  topic: 'money',
  label: 'Money',
  badge: 'MATH',
  description: 'Practice counting coins and notes, identifying coin values, comparing amounts, making change, and solving money word problems.',
  defaultSkill: 'lkg-money-coin-values',
  catalog: moneyMicroSkills,

  generateQuestion(config) {
    return generateMoneyTopicQuestion(config);
  },

  getTemplate(skillId) {
    const skill = getMoneySkill(skillId);
    return {
      templateId: skill?.templateId || skillId,
      family: 'money',
      engine: 'money',
      questionType: skill?.config ? 'fillInTheBlank' : 'mixed',
      title: skill?.title || skillId
    };
  },

  normalizeQuestion(question, context) {
    return {
      ...question,
      id: question.id || `${context.topic}-${context.skill}-${context.seed}`,
      metadata: {
        ...(question.metadata || {}),
        subject: context.subject,
        topic: context.topic,
        skillId: context.skill,
        templateId: question.metadata?.templateId || context.skill,
        engine: 'money',
        seed: context.seed,
      },
    };
  },
};

export const rawMoneyTopicRegistry = Object.fromEntries([
  ...moneyMicroSkills.map((skill) => [
    skill.id,
    {
      title: skill.title,
      code: skill.code,
      grade: skill.grade,
      topic: skill.topic,
      templateId: skill.templateId,
      params: createMoneyTopicTemplate(skill.id)
    }
  ]),
  ...Object.values(moneyTemplates).map((template) => [
    template.id,
    {
      title: template.id,
      topic: template.topic,
      templateId: template.id,
      params: createMoneyTopicTemplate(template.id)
    }
  ])
]);

export const moneyTopicGenerators = Object.fromEntries(
  Object.keys(rawMoneyTopicRegistry).map((key) => [key, generateMoneyTopicQuestion])
);
