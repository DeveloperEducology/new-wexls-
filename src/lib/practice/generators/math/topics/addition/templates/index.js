export const additionTemplates = {
  'addition.numbers.horizontal': {
    id: 'addition.numbers.horizontal',
    topic: 'addition',
    engine: 'numbers',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [1, 9],
      layout: 'horizontal',
      regrouping: false
    }
  },
  'addition.numbers.vertical': {
    id: 'addition.numbers.vertical',
    topic: 'addition',
    engine: 'numbers',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [10, 99],
      layout: 'vertical',
      regrouping: false
    }
  },
  'addition.numbers.threeAddendsTarget': {
    id: 'addition.numbers.threeAddendsTarget',
    topic: 'addition',
    engine: 'numbers',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [1, 9],
      layout: 'horizontal',
      addendCount: 3,
      targetSum: 10,
      regrouping: false
    }
  },
  'addition.numbers.doublesPlusOne': {
    id: 'addition.numbers.doublesPlusOne',
    topic: 'addition',
    engine: 'doublesPlusOne',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      targetRange: [2, 20],
      addendCount: 3
    }
  },
  'addition.visual.counting': {
    id: 'addition.visual.counting',
    topic: 'addition',
    engine: 'visualCounting',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [1, 10],
      model: 'cubes'
    }
  },
  'addition.visual.copyDice': {
    id: 'addition.visual.copyDice',
    topic: 'addition',
    engine: 'copyDice',
    questionType: 'categorization',
    defaultConfig: {
      prefilledCount: 1,
      copyCountRange: [2, 5]
    }
  },
  'addition.visual.modelMatch': {
    id: 'addition.visual.modelMatch',
    topic: 'addition',
    engine: 'modelMatch',
    questionType: 'mcq',
    defaultConfig: {
      range: [1, 10],
      model: 'cubes',
      colors: ['yellow', 'blue'],
      optionCount: 2
    }
  },
  'addition.visual.pictureSentence': {
    id: 'addition.visual.pictureSentence',
    topic: 'addition',
    engine: 'pictureSentence',
    questionType: 'mcq',
    defaultConfig: {
      range: [1, 5],
      model: 'cubes',
      colors: ['#ff7f2a', '#14b8b2'],
      optionCount: 2
    }
  },
  'addition.sort.factsTo20': {
    id: 'addition.sort.factsTo20',
    topic: 'addition',
    engine: 'sortFacts',
    questionType: 'categorization',
    defaultConfig: {
      range: [1, 20],
      sums: [14, 15, 16]
    }
  },
  'addition.sort.valuesTo20Html': {
    id: 'addition.sort.valuesTo20Html',
    topic: 'addition',
    engine: 'sortFacts',
    questionType: 'categorization',
    defaultConfig: {
      range: [1, 20],
      sums: [14, 15, 16],
      renderer: 'html'
    }
  },
  'addition.makeNumber.to20': {
    id: 'addition.makeNumber.to20',
    topic: 'addition',
    engine: 'makeNumber',
    questionType: 'mcq',
    defaultConfig: {
      targetRange: [3, 20],
      optionCount: 4
    }
  },
  'addition.word.model.to20': {
    id: 'addition.word.model.to20',
    topic: 'addition',
    engine: 'wordProblemModel',
    questionType: 'mcq',
    defaultConfig: {
      range: [1, 20],
      model: 'bar'
    }
  },
  'addition.word.sentence': {
    id: 'addition.word.sentence',
    topic: 'addition',
    engine: 'wordProblem',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [1, 10],
      model: 'cubes',
      isVisualShow: true
    }
  }
};

export function getAdditionTemplate(templateId) {
  return additionTemplates[templateId] || null;
}
