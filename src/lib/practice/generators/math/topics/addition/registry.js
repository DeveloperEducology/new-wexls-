import { createAdditionTopicTemplate, generateAdditionTopicQuestion } from './engine.js';
import { additionMicroSkills } from './skills/index.js';
import { additionTemplates } from './templates/index.js';

export const rawAdditionTopicRegistry = Object.fromEntries([
  ...additionMicroSkills.map((skill) => [
    skill.id,
    {
      title: skill.title,
      code: skill.code,
      grade: skill.grade,
      topic: skill.topic,
      templateId: skill.templateId,
      params: createAdditionTopicTemplate(skill.id)
    }
  ]),
  ...Object.values(additionTemplates).map((template) => [
    template.id,
    {
      title: template.id,
      topic: template.topic,
      templateId: template.id,
      params: createAdditionTopicTemplate(template.id)
    }
  ])
]);

export const additionTopicGenerators = Object.fromEntries(
  Object.keys(rawAdditionTopicRegistry).map((key) => [key, generateAdditionTopicQuestion])
);
