import { generateUkgNumbersCountingQuestion } from './engine.js';
import { ukgNumbersCountingSkills, ukgNumbersCountingSkillMap } from './skills.js';

export const ukgNumbersCountingTopicContract = {
  subject: 'math',
  topic: 'ukg-numbers-counting',
  label: 'UKG Numbers & Counting',
  badge: 'UKG',
  description: 'Interactive UKG number sense, counting, sequences, tallies, and number lines.',
  defaultSkill: 'ukg-count3-learn',
  catalog: ukgNumbersCountingSkills,

  generateQuestion(config) {
    return generateUkgNumbersCountingQuestion(config);
  },

  getTemplate(skillId) {
    const skill = ukgNumbersCountingSkillMap[skillId];
    return {
      templateId: skill?.templateId || skillId,
      family: 'ukg_numbers_counting',
      engine: 'ukg-numbers-counting',
      questionType: 'mixed',
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
        engine: 'ukg-numbers-counting',
        seed: context.seed
      }
    };
  }
};
