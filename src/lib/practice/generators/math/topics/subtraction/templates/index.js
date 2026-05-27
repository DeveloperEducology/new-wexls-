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
  },
  'subtraction.numbers.horizontal': {
    id: 'subtraction.numbers.horizontal',
    topic: 'subtraction',
    engine: 'numbers',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      layout: 'horizontal',
      range: [1, 9]
    }
  },
  'subtraction.numbers.vertical': {
    id: 'subtraction.numbers.vertical',
    topic: 'subtraction',
    engine: 'numbers',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      layout: 'vertical',
      range: [10, 99],
      regrouping: false
    }
  },
  'subtraction.word.sentence': {
    id: 'subtraction.word.sentence',
    topic: 'subtraction',
    engine: 'wordProblem',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [1, 20]
    }
  }
};

export function getSubtractionTemplate(templateId) {
  return subtractionTemplates[templateId] || null;
}
