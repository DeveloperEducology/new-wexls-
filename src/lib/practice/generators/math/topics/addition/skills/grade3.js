export const grade3AdditionSkills = [
  {
    id: 'addition-g3-place-value-to-999',
    code: 'PV.3',
    grade: 3,
    topic: 'addition',
    competencyId: 'place_value_addition',
    title: 'Add three-digit numbers using place value',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [100, 999],
      layout: 'vertical',
      regrouping: false,
      difficulty: 'medium'
    }
  },
  {
    id: 'addition-g3-regrouping-to-999',
    code: 'R.3',
    grade: 3,
    topic: 'addition',
    competencyId: 'regrouping',
    title: 'Add three-digit numbers with regrouping',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [100, 999],
      layout: 'vertical',
      regrouping: true,
      difficulty: 'medium'
    }
  },
  {
    id: 'addition-g3-mental-strategies-to-1000',
    code: 'M.3',
    grade: 3,
    topic: 'addition',
    competencyId: 'mental_strategies',
    title: 'Mental addition strategies - sums up to 1,000',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [100, 500],
      layout: 'horizontal',
      difficulty: 'medium'
    }
  },
  {
    id: 'addition-g3-multi-addend-to-999',
    code: 'MA.3',
    grade: 3,
    topic: 'addition',
    competencyId: 'multi_addend_addition',
    title: 'Add three multi-digit numbers',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [10, 999],
      layout: 'vertical',
      addendCount: 3,
      difficulty: 'medium'
    }
  },
  {
    id: 'addition-g3-number-decomposition-to-1000',
    code: 'ND.3',
    grade: 3,
    topic: 'addition',
    competencyId: 'number_decomposition',
    title: 'Use decomposition to add within 1,000',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [100, 500],
      layout: 'horizontal',
      difficulty: 'medium'
    }
  }
];
