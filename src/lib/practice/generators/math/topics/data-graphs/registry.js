import { dataGraphsSkills } from './skills/index.js';
import { generateDataGraphsQuestion } from './engine.js';
import { getDataGraphsTemplate } from './templates/index.js';

export const dataGraphsTopicContract = {
  subject: 'math',
  topic: 'data-graphs',
  label: 'Data & Graphs',
  badge: 'DATA',
  description: 'Read picture graphs, bar graphs, and compare data.',
  defaultSkill: 'data-graphs-g1-read-picture-graph',
  catalog: dataGraphsSkills,

  generateQuestion(config) {
    return generateDataGraphsQuestion(config);
  },

  getTemplate(skillId, question) {
    return getDataGraphsTemplate(question?.metadata?.templateId || question?.metadata?.task || skillId);
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
        templateId: question.metadata?.templateId || question.metadata?.task || context.skill,
        engine: 'data-graphs',
        seed: context.seed
      }
    };
  }
};
