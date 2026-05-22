import { generateLkgQuestion, generateLkgCompareQuestion } from './engine.js';

export const lkgTemplateRegistry = {
  'lkg.count.objects_up_to_5': {
    generate: generateLkgQuestion,
    title: 'Count objects up to 5',
  },
  'lkg.compare.objects_up_to_5': {
    generate: generateLkgCompareQuestion,
    title: 'Compare objects up to 5',
  }
};

export const lkgMicroSkillRegistry = {
  'lkg_counting_5': {
    templateId: 'lkg.count.objects_up_to_5',
    title: 'Learn to count - up to 5',
    grade: 'LKG',
    code: 'C.1'
  },
  'lkg_comparison_5': {
    templateId: 'lkg.compare.objects_up_to_5',
    title: 'Compare quantities - up to 5',
    grade: 'LKG',
    code: 'C.2'
  }
};

export function getTemplatesForSkill(skillId) {
  const skill = lkgMicroSkillRegistry[skillId];
  return skill ? [skill.templateId] : [];
}

export function getSkillByTemplate(templateId) {
  const entry = Object.entries(lkgMicroSkillRegistry).find(
    ([_, s]) => s.templateId === templateId
  );
  return entry ? entry[0] : null;
}