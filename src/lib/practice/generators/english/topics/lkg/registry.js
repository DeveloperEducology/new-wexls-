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
  },
  'lkg.english.letter_recognition': {
    title: 'Letter Recognition & Phonics',
    engine: 'letter_recognition',
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
  },
  'lkg-english-letter-recognition-uppercase': {
    templateId: 'lkg.english.letter_recognition',
    code: 'EL.3',
    title: 'Letter recognition: uppercase letters (A-Z)',
    grade: 'LKG'
  },
  'lkg-english-letter-recognition-lowercase': {
    templateId: 'lkg.english.letter_recognition',
    code: 'EL.4',
    title: 'Letter recognition: lowercase letters (a-z)',
    grade: 'LKG'
  },
  'lkg-english-letter-recognition-case-match': {
    templateId: 'lkg.english.letter_recognition',
    code: 'EL.5',
    title: 'Match capital and small letters',
    grade: 'LKG'
  },
  'lkg-english-letter-recognition-phonics-sound': {
    templateId: 'lkg.english.letter_recognition',
    code: 'EL.6',
    title: 'Match letters to their phonics sounds',
    grade: 'LKG'
  },
  'lkg-english-letter-recognition-alphabetical-sequence': {
    templateId: 'lkg.english.letter_recognition',
    code: 'EL.7',
    title: 'Fill in the missing alphabet letters',
    grade: 'LKG'
  },
  'lkg-english-letter-recognition-odd-one-out': {
    templateId: 'lkg.english.letter_recognition',
    code: 'EL.8',
    title: 'Find the letter that is different (odd one out)',
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
