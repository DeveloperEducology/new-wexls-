export const remediationPlaceValueSkills = [
  {
    id: 'pv-remedial-tens-ones-to-20',
    code: 'R0.1',
    grade: 'remediation',
    topic: 'place-values',
    competencyId: 'place_value_tens_ones',
    title: 'Identify tens and ones up to 20',
    templateId: 'place-values.blocks.units',
    config: {
      forcedTask: 'identify_from_blocks',
      difficulty: 'easy',
      range: [10, 20]
    }
  },
  {
    id: 'pv-remedial-count-tens-to-100',
    code: 'R0.2',
    grade: 'remediation',
    topic: 'place-values',
    competencyId: 'place_value_tens_ones',
    title: 'Count tens up to 100',
    templateId: 'place-values.blocks.units',
    config: {
      forcedTask: 'identify_from_blocks',
      difficulty: 'easy',
      range: [10, 100]
    }
  }
];
