export const lkgEnglishTemplateRegistry = {
  'lkg.english.beginning_sounds': {
    title: 'Beginning Letter Sounds',
    engine: 'beginning_sounds',
    family: 'lkg.english',
    questionType: 'mcq'
  },
  'lkg.english.identify_category': {
    title: 'Identify Category',
    engine: 'identify_category',
    family: 'lkg.english',
    questionType: 'mcq'
  }
};

export const lkgEnglishMicroSkillRegistry = {
  'lkg-english-beginning-sounds': {
    templateId: 'lkg.english.beginning_sounds',
    code: 'EL.1',
    title: 'Beginning sounds: choose the correct object',
    grade: 'LKG'
  },
  'lkg-english-identify-category': {
    templateId: 'lkg.english.identify_category',
    code: 'EL.2',
    title: 'Identify category (fruits, animals, things)',
    grade: 'LKG'
  }
};

export function getTemplatesForSkill(skillId) {
  const skill = lkgEnglishMicroSkillRegistry[skillId];
  return skill ? [skill.templateId] : [];
}

export function getSkillByTemplate(templateId) {
  const entry = Object.entries(lkgEnglishMicroSkillRegistry).find(
    ([_, s]) => s.templateId === templateId
  );
  return entry ? entry[0] : null;
}
