import { createSubtractionTopicTemplate, generateSubtractionTopicQuestion } from './engine.js';
import { subtractionMicroSkills } from './skills/index.js';
import { subtractionTemplates } from './templates/index.js';

export const rawSubtractionTopicRegistry = Object.fromEntries([
  ...subtractionMicroSkills.map((skill) => [
    skill.id,
    {
      title: skill.title,
      code: skill.code,
      grade: skill.grade,
      topic: skill.topic,
      templateId: skill.templateId,
      params: createSubtractionTopicTemplate(skill.id),
    },
  ]),
  ...Object.values(subtractionTemplates).map((template) => [
    template.id,
    {
      title: template.id,
      topic: template.topic,
      templateId: template.id,
      params: createSubtractionTopicTemplate(template.id),
    },
  ]),
]);

export const subtractionTopicGenerators = Object.fromEntries(
  Object.keys(rawSubtractionTopicRegistry).map((key) => [key, generateSubtractionTopicQuestion])
);
