const adaptiveDifficulty = {
  easy: { digits: [6, 7], visual: true, guided: true },
  medium: { digits: [8, 9], visual: true, guided: false },
  hard: { digits: [9, 10], visual: false, guided: false },
};

const remediation = (prerequisiteSkills = [], hintStrategy = []) => ({
  prerequisiteSkills,
  scaffoldLevels: ['visual', 'guided', 'independent'],
  hintStrategy,
});

export const grade6PlaceValueSkills = [
  {
    id: 'pv-g6-international-comma-placement',
    code: 'G6.PV.18',
    grade: 6,
    topic: 'place-values',
    competencyId: 'international_number_system',
    title: 'Place commas in the international number system',
    templateId: 'place-values.comma.international',
    engine: 'system',
    difficulty: adaptiveDifficulty,
    prerequisites: ['pv-g4-indian-comma-placement'],
    misconceptions: ['comma_grouping_error', 'international_indian_grouping_mixup'],
    remediation: remediation(['pv-g4-indian-comma-placement'], [
      'color_group_thousands_millions',
      'contrast_with_indian_grouping',
    ]),
    config: { forcedTask: 'international_comma_grouping', difficulty: 'medium' },
  },
  {
    id: 'pv-g6-indian-international-compare',
    code: 'G6.PV.19',
    grade: 6,
    topic: 'place-values',
    competencyId: 'international_number_system',
    title: 'Compare Indian and international comma grouping',
    templateId: 'place-values.system.conversion',
    engine: 'system',
    difficulty: adaptiveDifficulty,
    prerequisites: ['pv-g4-indian-comma-placement', 'pv-g6-international-comma-placement'],
    misconceptions: ['lakh_million_confusion', 'comma_grouping_error'],
    remediation: remediation(['pv-g4-indian-comma-placement'], [
      'show_side_by_side_grouping',
      'label_lakh_and_million_chunks',
    ]),
    config: { forcedTask: 'system_conversion', difficulty: 'hard' },
  },
  {
    id: 'pv-g6-large-number-system-conversion',
    code: 'G6.PV.20',
    grade: 6,
    topic: 'place-values',
    competencyId: 'indian_number_system',
    title: 'Convert between standard numbers and grouped large-number names',
    templateId: 'place-values.system.conversion',
    engine: 'system',
    difficulty: adaptiveDifficulty,
    prerequisites: ['pv-g6-indian-international-compare'],
    misconceptions: ['lakh_crore_reversal', 'million_billion_place_confusion'],
    remediation: remediation(['pv-g6-indian-international-compare'], [
      'map_groups_to_place_names',
      'use_place_value_chart',
    ]),
    config: { forcedTask: 'system_conversion', difficulty: 'hard' },
  },
];
