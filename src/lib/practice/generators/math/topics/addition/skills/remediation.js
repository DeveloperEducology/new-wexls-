export const remediationAdditionSkills = [
  {
    id: 'addition-remedial-combine-sets-to-5',
    code: 'R0.1',
    grade: 'remediation',
    topic: 'addition',
    competencyId: 'combining_sets',
    title: 'Combine two groups up to 5',
    templateId: 'addition.visual.counting',
    config: {
      range: [1, 5],
      model: 'cubes',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-remedial-count-all-to-10',
    code: 'R0.2',
    grade: 'remediation',
    topic: 'addition',
    competencyId: 'counting_all',
    title: 'Count all objects to add up to 10',
    templateId: 'addition.visual.counting',
    config: {
      range: [1, 10],
      model: 'cubes',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-remedial-one-more-to-10',
    code: 'R0.3',
    grade: 'remediation',
    topic: 'addition',
    competencyId: 'one_more',
    title: 'Add one more up to 10',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 9],
      fixedAddend: 1,
      layout: 'horizontal',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-remedial-two-more-to-10',
    code: 'R0.4',
    grade: 'remediation',
    topic: 'addition',
    competencyId: 'two_more',
    title: 'Add two more up to 10',
    templateId: 'addition.numbers.horizontal',
    config: {
      range: [1, 8],
      fixedAddend: 2,
      layout: 'horizontal',
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-remedial-number-bonds-to-10',
    code: 'R0.5',
    grade: 'remediation',
    topic: 'addition',
    competencyId: 'number_bonds',
    title: 'Make number bonds to 10',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [3, 10],
      optionCount: 4,
      difficulty: 'easy'
    }
  },
  {
    id: 'addition-remedial-unknown-addend-to-10',
    code: 'R0.6',
    grade: 'remediation',
    topic: 'addition',
    competencyId: 'unknown_addend',
    title: 'Find the missing addend up to 10',
    templateId: 'addition.makeNumber.to20',
    config: {
      targetRange: [3, 10],
      optionCount: 4,
      difficulty: 'easy'
    }
  }
];
