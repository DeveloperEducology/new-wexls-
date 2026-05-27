import { createDivisionTopicTemplate, generateDivisionTopicQuestion } from './engine.js';
import { divisionMicroSkills } from './skills/index.js';
import { divisionTemplates } from './templates/index.js';

export const rawDivisionTopicRegistry = Object.fromEntries([
  ...divisionMicroSkills.map((skill) => [
    skill.id,
    {
      title: skill.title,
      code: skill.code,
      grade: skill.grade,
      topic: skill.topic,
      templateId: skill.templateId,
      params: createDivisionTopicTemplate(skill.id)
    }
  ]),
  ...Object.values(divisionTemplates).map((template) => [
    template.id,
    {
      title: template.id,
      topic: template.topic,
      templateId: template.id,
      params: createDivisionTopicTemplate(template.id)
    }
  ])
]);

export const divisionTopicGenerators = Object.fromEntries(
  Object.keys(rawDivisionTopicRegistry).map((key) => [key, generateDivisionTopicQuestion])
);
