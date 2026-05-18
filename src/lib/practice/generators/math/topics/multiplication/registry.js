// registry.js
import { createMultiplicationTemplate, generateMultiplicationQuestion } from './engine.js';
import { multiplicationMicroSkills } from './skills/index.js';
import { multiplicationTemplates } from './templates/index.js';

export const multiplicationTopicGenerators = Object.fromEntries(
  [
    ...multiplicationMicroSkills.map((skill) => skill.id),
    ...Object.keys(multiplicationTemplates)
  ].map((key) => [key, generateMultiplicationQuestion])
);