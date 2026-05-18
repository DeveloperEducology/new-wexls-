// templates/index.js
export const multiplicationTemplates = {
  'multiplication.facts.basic': {
    id: 'multiplication.facts.basic',
    topic: 'multiplication',
    engine: 'facts',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      range: [1, 10],
      layout: 'horizontal'
    }
  },
  'multiplication.vertical.1digit': {
    id: 'multiplication.vertical.1digit',
    topic: 'multiplication',
    engine: 'vertical',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      topDigits: 1,
      bottomDigits: 1,
      regrouping: false,
      numberSystem: 'indian'
    }
  },
  'multiplication.vertical.2digit.by1digit': {
    id: 'multiplication.vertical.2digit.by1digit',
    topic: 'multiplication',
    engine: 'vertical',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      topDigits: 2,
      bottomDigits: 1,
      regrouping: false,
      numberSystem: 'indian'
    }
  },
  'multiplication.vertical.3digit.by1digit': {
    id: 'multiplication.vertical.3digit.by1digit',
    topic: 'multiplication',
    engine: 'vertical',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      topDigits: 3,
      bottomDigits: 1,
      regrouping: true,
      numberSystem: 'indian'
    }
  },
  'multiplication.vertical.4digit.by1digit': {
    id: 'multiplication.vertical.4digit.by1digit',
    topic: 'multiplication',
    engine: 'vertical',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      topDigits: 4,
      bottomDigits: 1,
      regrouping: true,
      numberSystem: 'indian'
    }
  },
  'multiplication.visual.equalGroups.describe': {
    id: 'multiplication.visual.equalGroups.describe',
    topic: 'multiplication',
    engine: 'visualGroups',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'describe',
      groupsRange: [2, 4],
      eachRange: [2, 6]
    }
  },
  'multiplication.visual.equalGroups.expression': {
    id: 'multiplication.visual.equalGroups.expression',
    topic: 'multiplication',
    engine: 'visualGroups',
    questionType: 'mcq',
    defaultConfig: {
      mode: 'expressionMatch',
      groupsRange: [2, 5],
      eachRange: [2, 6]
    }
  },
  'multiplication.visual.equalGroups.sentence': {
    id: 'multiplication.visual.equalGroups.sentence',
    topic: 'multiplication',
    engine: 'visualGroups',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'sentence',
      groupsRange: [2, 5],
      eachRange: [2, 6]
    }
  },
  'multiplication.visual.equalGroups.relateAddition': {
    id: 'multiplication.visual.equalGroups.relateAddition',
    topic: 'multiplication',
    engine: 'visualGroups',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'relateAddition',
      groupsRange: [2, 5],
      eachRange: [2, 6]
    }
  },
  'multiplication.visual.equalGroups.rabbits': {
    id: 'multiplication.visual.equalGroups.rabbits',
    topic: 'multiplication',
    engine: 'visualGroups',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'sentence',
      groups: 4,
      eachRange: [2, 5],
      shape: 'rabbit'
    }
  },
  'multiplication.visual.equalGroups.penguins': {
    id: 'multiplication.visual.equalGroups.penguins',
    topic: 'multiplication',
    engine: 'visualGroups',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'sentence',
      groupsRange: [2, 4],
      eachRange: [2, 5],
      shape: 'penguin'
    }
  }
};

export function getMultiplicationTemplate(templateId) {
  const template = multiplicationTemplates[templateId];
  if (!template) {
    throw new Error(`Template not found: ${templateId}`);
  }
  return template;
}
