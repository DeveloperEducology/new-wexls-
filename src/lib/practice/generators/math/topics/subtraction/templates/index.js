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
  'subtraction.mcq.modelMatch': {
    id: 'subtraction.mcq.modelMatch',
    topic: 'subtraction',
    engine: 'pictureSentence',
    questionType: 'mcq',
    defaultConfig: {
      range: [2, 10],
      mode: 'findModel'
    }
  },
  'subtraction.mcq.pictureSentence': {
    id: 'subtraction.mcq.pictureSentence',
    topic: 'subtraction',
    engine: 'pictureSentence',
    questionType: 'mcq',
    defaultConfig: {
      range: [2, 10]
    }
  }
};

export function getSubtractionTemplate(templateId) {
  return subtractionTemplates[templateId] || null;
}
