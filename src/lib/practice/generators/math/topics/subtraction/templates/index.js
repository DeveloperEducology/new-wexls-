export const subtractionTemplates = {
  'subtraction.visual.removeCubes': {
    id: 'subtraction.visual.removeCubes',
    topic: 'subtraction',
    engine: 'removeCubes',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      startRange: [3, 10],
      removeRange: [1, 5],
      model: 'cubes',
    },
  },
};

export function getSubtractionTemplate(templateId) {
  return subtractionTemplates[templateId] || null;
}
