export const remediationMultiplicationSkills = [
  {
    id: 'multiplication-remedial-equal-groups-to-5',
    code: 'R0.1',
    grade: 'remediation',
    topic: 'multiplication',
    competencyId: 'multiplication_visual_equal_groups_to_5',
    title: 'Describe equal groups up to 5',
    templateId: 'multiplication.visual.equalGroups.describe',
    config: {
      groupsRange: [2, 3],
      eachRange: [2, 4],
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-remedial-facts-to-5',
    code: 'R0.2',
    grade: 'remediation',
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
    id: 'multiplication-remedial-skip-counting-2s',
    code: 'R0.3',
    grade: 'remediation',
    topic: 'multiplication',
    competencyId: 'multiplication_skip_counting_2s',
    title: 'Multiply by 2',
    templateId: 'multiplication.facts.basic',
    config: {
      range: [1, 10],
      fixedFactor: 2,
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-remedial-skip-counting-5s',
    code: 'R0.4',
    grade: 'remediation',
    topic: 'multiplication',
    competencyId: 'multiplication_skip_counting_5s',
    title: 'Multiply by 5',
    templateId: 'multiplication.facts.basic',
    config: {
      range: [1, 10],
      fixedFactor: 5,
      difficulty: 'easy'
    }
  },
  {
    id: 'multiplication-remedial-skip-counting-10s',
    code: 'R0.5',
    grade: 'remediation',
    topic: 'multiplication',
    competencyId: 'multiplication_skip_counting_10s',
    title: 'Multiply by 10',
    templateId: 'multiplication.facts.basic',
    config: {
      range: [1, 10],
      fixedFactor: 10,
      difficulty: 'easy'
    }
  }
];
