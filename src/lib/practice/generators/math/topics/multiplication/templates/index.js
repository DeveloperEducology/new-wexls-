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
  },
  'multiplication.cubes.repeatedAddition': {
    id: 'multiplication.cubes.repeatedAddition',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'repeatedAddition',
      groupsRange: [2, 4],
      eachRange: [2, 5]
    }
  },
  'multiplication.cubes.arrays': {
    id: 'multiplication.cubes.arrays',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'arrayGrid',
      rowsRange: [2, 4],
      colsRange: [2, 5]
    }
  },
  'multiplication.cubes.areaModel': {
    id: 'multiplication.cubes.areaModel',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'areaModel',
      rowsRange: [3, 6],
      colsRange: [4, 8]
    }
  },
  'multiplication.cubes.distributiveProperty': {
    id: 'multiplication.cubes.distributiveProperty',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'distributiveProperty',
      rowsRange: [3, 5],
      colsRange: [5, 9]
    }
  },
  'multiplication.cubes.areaGridRectangle': {
    id: 'multiplication.cubes.areaGridRectangle',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'areaGridRectangle',
      difficulty: 'medium'
    }
  },
  'multiplication.cubes.areaGridRectangleFill': {
    id: 'multiplication.cubes.areaGridRectangleFill',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'areaGridRectangleFill',
      difficulty: 'medium'
    }
  },
  'multiplication.numberLine.identify': {
    id: 'multiplication.numberLine.identify',
    topic: 'multiplication',
    engine: 'numberLine',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'identify',
      difficulty: 'easy'
    }
  },
  'multiplication.numberLine.skipCount': {
    id: 'multiplication.numberLine.skipCount',
    topic: 'multiplication',
    engine: 'numberLine',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'skipCount',
      difficulty: 'easy'
    }
  },
  'multiplication.cubes.repeatedAdditionTower': {
    id: 'multiplication.cubes.repeatedAdditionTower',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'repeatedAddition',
      layout: 'vertical',
      difficulty: 'easy'
    }
  },
  'multiplication.cubes.dotArray': {
    id: 'multiplication.cubes.dotArray',
    topic: 'multiplication',
    engine: 'cubeArray',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'dotArray',
      difficulty: 'medium'
    }
  },
  'multiplication.barModel.findTotalSingle': {
    id: 'multiplication.barModel.findTotalSingle',
    topic: 'multiplication',
    engine: 'barModel',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'findTotalSingle',
      difficulty: 'medium'
    }
  },
  'multiplication.barModel.findValueSingle': {
    id: 'multiplication.barModel.findValueSingle',
    topic: 'multiplication',
    engine: 'barModel',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'findValueSingle',
      difficulty: 'medium'
    }
  },
  'multiplication.barModel.comparisonLarge': {
    id: 'multiplication.barModel.comparisonLarge',
    topic: 'multiplication',
    engine: 'barModel',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'comparisonLarge',
      difficulty: 'medium'
    }
  },
  'multiplication.barModel.comparisonSmall': {
    id: 'multiplication.barModel.comparisonSmall',
    topic: 'multiplication',
    engine: 'barModel',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'comparisonSmall',
      difficulty: 'medium'
    }
  },
  'multiplication.functionMachine.findOutput': {
    id: 'multiplication.functionMachine.findOutput',
    topic: 'multiplication',
    engine: 'functionMachine',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'findOutput',
      difficulty: 'medium'
    }
  },
  'multiplication.functionMachine.findInput': {
    id: 'multiplication.functionMachine.findInput',
    topic: 'multiplication',
    engine: 'functionMachine',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'findInput',
      difficulty: 'medium'
    }
  },
  'multiplication.functionMachine.findRule': {
    id: 'multiplication.functionMachine.findRule',
    topic: 'multiplication',
    engine: 'functionMachine',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'findRule',
      difficulty: 'medium'
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
