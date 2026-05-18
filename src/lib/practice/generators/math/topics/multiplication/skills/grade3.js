export const grade3MultiplicationSkills = [
  {
    id: 'multiplication-g3-n5-write-sentence-equal-groups',
    code: 'N.5',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups_sentences',
    title: 'Write multiplication sentences for equal groups',
    templateId: 'multiplication.visual.equalGroups.sentence',
    config: {
      groupsRange: [2, 5],
      eachRange: [2, 6],
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-n6-relate-addition-multiplication-equal-groups',
    code: 'N.6',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_repeated_addition',
    title: 'Relate addition and multiplication for equal groups',
    templateId: 'multiplication.visual.equalGroups.relateAddition',
    config: {
      groupsRange: [2, 5],
      eachRange: [2, 6],
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-c1-vertical-3digit-no-carry',
    code: 'C.1',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_3digit',
    title: 'Multiply a three-digit number by a one-digit number',
    templateId: 'multiplication.vertical.3digit.by1digit',
    config: {
      topDigits: 3,
      bottomDigits: 1,
      regrouping: false,
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g3-c2-vertical-3digit-carry',
    code: 'C.2',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_3digit_regrouping',
    title: 'Multiply a three-digit number by a one-digit number with regrouping',
    templateId: 'multiplication.vertical.3digit.by1digit',
    config: {
      topDigits: 3,
      bottomDigits: 1,
      regrouping: true,
      difficulty: 'hard'
    }
  },
  {
    id: 'multiplication-g3-n7-rabbit-equal-groups',
    code: 'N.7',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups_rabbits',
    title: 'Multiplication with equal groups of rabbits',
    templateId: 'multiplication.visual.equalGroups.rabbits',
    config: {
      groups: 4,
      eachRange: [2, 5],
      shape: 'rabbit',
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-g3-n8-penguin-equal-groups',
    code: 'N.8',
    grade: 3,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups_penguins',
    title: 'Multiplication with equal groups of penguins',
    templateId: 'multiplication.visual.equalGroups.penguins',
    config: {
      groupsRange: [2, 4],
      eachRange: [2, 5],
      shape: 'penguin',
      difficulty: 'easy'
    }
  }
];
