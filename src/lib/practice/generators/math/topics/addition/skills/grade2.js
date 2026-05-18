export const grade2AdditionSkills = [
  {
    id: 'addition-g2-b1-vertical-10-99',
    code: 'B.1',
    grade: 2,
    topic: 'addition',
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
    id: 'addition-g2-g4-doubles-plus-one',
    code: 'G.4',
    grade: 2,
    topic: 'addition',
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
    title: 'Add three numbers: make 10 vertical',
    templateId: 'addition.numbers.threeAddendsTarget',
    config: {
      range: [1, 9],
      layout: 'vertical',
      addendCount: 3,
      targetSum: 10
    }
  },
];
