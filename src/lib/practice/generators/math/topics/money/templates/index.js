export const moneyTemplates = {
  'money.coin_values': {
    id: 'money.coin_values',
    topic: 'money',
    engine: 'money',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'coin_values',
      allowedDenominations: [1, 2, 5, 10]
    }
  },
  'money.count': {
    id: 'money.count',
    topic: 'money',
    engine: 'money',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'count',
      allowedDenominations: [1, 2, 5, 10, 20, 50, 100, 200, 500]
    }
  },
  'money.equivalent_groups': {
    id: 'money.equivalent_groups',
    topic: 'money',
    engine: 'money',
    questionType: 'mcq',
    defaultConfig: {
      mode: 'equivalent_groups',
      allowedDenominations: [1, 2, 5, 10, 20, 50, 100]
    }
  },
  'money.compare_groups': {
    id: 'money.compare_groups',
    topic: 'money',
    engine: 'money',
    questionType: 'mcq',
    defaultConfig: {
      mode: 'compare_groups',
      allowedDenominations: [1, 2, 5, 10, 20, 50, 100, 200, 500]
    }
  },
  'money.making_change': {
    id: 'money.making_change',
    topic: 'money',
    engine: 'money',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'making_change',
      maxPrice: 200
    }
  },
  'money.word_problems': {
    id: 'money.word_problems',
    topic: 'money',
    engine: 'money',
    questionType: 'fillInTheBlank',
    defaultConfig: {
      mode: 'word_problems',
      maxVal: 100
    }
  }
};

export function getMoneyTemplate(id) {
  return moneyTemplates[id] || null;
}
