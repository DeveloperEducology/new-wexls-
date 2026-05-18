export const grade2AdditionSkills = [
  {
    id: 'addition-g2-b1-vertical-10-99',
    code: 'B.1',
    grade: 2,
    topic: 'addition',
    competencyId: 'two_digit_addition_no_regrouping',
    title: 'Add two-digit numbers vertically',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [10, 99],
      layout: 'vertical',
      regrouping: false
    }
  },
  {
    id: 'addition-g2-b2-vertical-10-99-regrouping',
    code: 'B.2',
    grade: 2,
    topic: 'addition',
    competencyId: 'two_digit_addition_with_regrouping',
    title: 'Add two-digit numbers with regrouping',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [10, 99],
      layout: 'vertical',
      regrouping: true
    }
  },
  {
    id: 'addition-g2-g3-three-addends-make-10',
    code: 'G.3',
    grade: 2,
    topic: 'addition',
    competencyId: 'make_ten_strategy',
    title: 'Add three numbers: make 10',
    templateId: 'addition.numbers.threeAddendsTarget',
    config: {
      range: [1, 9],
      layout: 'horizontal',
      addendCount: 3,
      targetSum: 10
    }
  },
  {
    id: 'addition-g2-doubles-to-20',
    code: 'D.1',
    grade: 2,
    topic: 'addition',
    competencyId: 'doubles',
    title: 'Add doubles - sums up to 20',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 10],
      addendCount: 2,
      sameAddends: true,
      layout: 'horizontal'
    }
  },
  {
    id: 'addition-g2-g4-doubles-plus-one',
    code: 'G.4',
    grade: 2,
    topic: 'addition',
    competencyId: 'near_doubles',
    title: 'Complete doubles and doubles-plus-one facts',
    templateId: 'addition.numbers.doublesPlusOne',
    config: {
      targetRange: [2, 20],
      addendCount: 3
    }
  },
  {
    id: 'addition-g2-g4-three-addends-vertical',
    code: 'G.5',
    grade: 2,
    topic: 'addition',
    competencyId: 'make_ten_strategy',
    title: 'Add three numbers: make 10 vertical',
    templateId: 'addition.numbers.threeAddendsTarget',
    config: {
      range: [1, 9],
      layout: 'vertical',
      addendCount: 3,
      targetSum: 10
    }
  },
  {
    id: 'addition-g2-balance-equations-to-20',
    code: 'G.6',
    grade: 2,
    topic: 'addition',
    competencyId: 'balancing_equations',
    title: 'Balance addition equations - sums up to 20',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [3, 20],
      optionCount: 4
    }
  },
  {
    id: 'addition-g2-unknown-addend-to-20',
    code: 'G.7',
    grade: 2,
    topic: 'addition',
    competencyId: 'unknown_addend',
    title: 'Find the missing addend - sums up to 20',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [3, 20],
      optionCount: 4
    }
  },
  {
    id: 'addition-g2-equality-to-20',
    code: 'G.8',
    grade: 2,
    topic: 'addition',
    competencyId: 'equality',
    title: 'Choose equations with the same sum',
    templateId: 'addition.sort.valuesTo20Html',
    config: {
      range: [1, 20],
      sums: [12, 15, 18],
      renderer: 'html'
    }
  },
  {
    id: 'addition-g2-addition-subtraction-relation-to-20',
    code: 'H.1',
    grade: 2,
    topic: 'addition',
    competencyId: 'addition_subtraction_relation',
    title: 'Use related addition facts - sums up to 20',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [3, 20],
      optionCount: 4
    }
  },
  {
    id: 'addition-g2-mental-strategies-to-100',
    code: 'M.1',
    grade: 2,
    topic: 'addition',
    competencyId: 'mental_strategies',
    title: 'Mental addition strategies - sums up to 100',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [10, 50],
      layout: 'horizontal'
    }
  },
  {
    id: 'addition-g2-place-value-to-99',
    code: 'PV.1',
    grade: 2,
    topic: 'addition',
    competencyId: 'place_value_addition',
    title: 'Add two-digit numbers using place value',
    templateId: 'addition.numbers.vertical',
    config: {
      range: [10, 99],
      layout: 'vertical',
      regrouping: false
    }
  },
  {
    id: 'addition-g2-multi-addend-to-20',
    code: 'MA.1',
    grade: 2,
    topic: 'addition',
    competencyId: 'multi_addend_addition',
    title: 'Add three numbers - sums up to 20',
    templateId: 'addition.numbers.threeAddendsTarget',
    config: {
      range: [1, 9],
      layout: 'horizontal',
      addendCount: 3
    }
  },
];
