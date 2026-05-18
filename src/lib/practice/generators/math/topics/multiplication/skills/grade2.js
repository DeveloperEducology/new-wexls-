// skills/grade2.js
export const grade2MultiplicationSkills = [
  {
    id: 'multiplication-g2-a1-facts-to-5',
    code: 'A.1',
    grade: 2,
    topic: 'multiplication',
    competencyId: 'multiplication_facts_to_5',
    title: 'Multiplication facts up to 5',
    templateId: 'multiplication.facts.basic',
    config: {
      range: [1, 5],
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-g2-a2-facts-to-10',
    code: 'A.2',
    grade: 2,
    topic: 'multiplication',
    competencyId: 'multiplication_facts_to_10',
    title: 'Multiplication facts up to 10',
    templateId: 'multiplication.facts.basic',
    config: {
      range: [1, 10],
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g2-n1-describe-equal-groups',
    code: 'N.1',
    grade: 2,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups',
    title: 'Describe equal groups',
    templateId: 'multiplication.visual.equalGroups.describe',
    config: {
      groupsRange: [2, 4],
      eachRange: [2, 5],
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-g2-n4-expression-equal-groups',
    code: 'N.4',
    grade: 2,
    topic: 'multiplication',
    competencyId: 'multiplication_equal_groups_expressions',
    title: 'Identify multiplication expressions for equal groups',
    templateId: 'multiplication.visual.equalGroups.expression',
    config: {
      groupsRange: [2, 4],
      eachRange: [2, 5],
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g2-b1-vertical-1digit-no-carry',
    code: 'B.1',
    grade: 2,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_1digit',
    title: 'Multiply one-digit numbers vertically',
    templateId: 'multiplication.vertical.1digit',
    config: {
      topDigits: 1,
      bottomDigits: 1,
      regrouping: false,
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-g2-b2-vertical-2digit-no-carry',
    code: 'B.2',
    grade: 2,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_2digit',
    title: 'Multiply a two-digit number by a one-digit number',
    templateId: 'multiplication.vertical.2digit.by1digit',
    config: {
      topDigits: 2,
      bottomDigits: 1,
      regrouping: false,
      difficulty: 'medium'
    }
  },
  {
    id: 'multiplication-g2-b3-vertical-2digit-carry',
    code: 'B.3',
    grade: 2,
    topic: 'multiplication',
    competencyId: 'multiplication_vertical_2digit_regrouping',
    title: 'Multiply a two-digit number by a one-digit number with regrouping',
    templateId: 'multiplication.vertical.2digit.by1digit',
    config: {
      topDigits: 2,
      bottomDigits: 1,
      regrouping: true,
      difficulty: 'hard'
    }
  }
];
