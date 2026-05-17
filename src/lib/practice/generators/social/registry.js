import { gkGenerators } from './topics/gk/registry.js';

export const socialTopicRegistry = {
  gk: {
    subject: 'social',
    topic: 'gk',
    title: 'General Knowledge',
    defaultSkill: 'gk_identify_person_v1',
    generators: gkGenerators,
    stableSkills: [
      'gk_identify_person_v1',
      'gk_identify_image_v1',
      'gk_trivia_v1',
      'gk_fill_blanks_v1',
      'gk_sort_people_v1',
      'gk_true_false_v1',
      'gk_misconception_v1',
      'gk_inference_v1',
    ],
  },
};
