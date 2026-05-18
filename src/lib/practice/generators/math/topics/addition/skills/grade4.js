export const grade4AdditionSkills = [
  {
    id: 'addition-g4-place-value-to-9999',
    code: 'PV.4',
    grade: 4,
    topic: 'addition',
    competencyId: 'place_value_addition',
    title: 'Add four-digit numbers using place value',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [1000, 9999],
      layout: 'vertical',
      regrouping: false,
      difficulty: 'hard'
    }
  },
  {
    id: 'addition-g4-regrouping-to-9999',
    code: 'R.4',
    grade: 4,
    topic: 'addition',
    competencyId: 'regrouping',
    title: 'Add four-digit numbers with regrouping',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [1000, 9999],
      layout: 'vertical',
      regrouping: true,
      difficulty: 'hard'
    }
  },
  {
    id: 'addition-g4-multi-addend-to-9999',
    code: 'MA.4',
    grade: 4,
    topic: 'addition',
    competencyId: 'multi_addend_addition',
    title: 'Add three and more multi-digit numbers',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [100, 9999],
      layout: 'vertical',
      addendCount: 3,
      difficulty: 'hard'
    }
  },
  {
    id: 'addition-g4-mental-strategies-to-10000',
    code: 'M.4',
    grade: 4,
    topic: 'addition',
    competencyId: 'mental_strategies',
    title: 'Mental strategies for larger sums',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1000, 5000],
      layout: 'horizontal',
      difficulty: 'hard'
    }
  }
];
