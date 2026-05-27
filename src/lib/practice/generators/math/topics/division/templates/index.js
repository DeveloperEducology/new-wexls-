export const divisionTemplates = {
  'division.numbers.horizontal': {
    id: 'division.numbers.horizontal',
    topic: 'division',
    engine: 'numbers',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [4, 100],
      supportRemainder: false
    }
  },
  'division.word.sentence': {
    id: 'division.word.sentence',
    topic: 'division',
    engine: 'wordProblem',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [6, 50]
    }
  }
};

export function getDivisionTemplate(templateId) {
  const template = divisionTemplates[templateId];
  if (!template) {
    throw new Error(`Division template not found: ${templateId}`);
  }
  return template;
}
