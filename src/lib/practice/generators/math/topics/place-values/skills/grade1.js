export const grade1PlaceValueSkills = [
  {
    id: 'pv-g1-blocks-units',
    code: 'PV.1',
    grade: 1,
    topic: 'place-values',
    title: 'Identify numbers from tens and ones blocks',
    templateId: 'place-values.blocks.units',
    config: { forcedTask: 'identify_from_blocks', difficulty: 'easy' },
  },
  {
    id: 'pv-g1-place-name',
    code: 'PV.2',
    grade: 1,
    topic: 'place-values',
    title: 'Name the place value of a digit',
    templateId: 'place-values.place-name',
    config: { forcedTask: 'place_name', difficulty: 'easy' },
  },
  {
    id: 'pv-g1-match-blocks-to-number',
    code: 'PV.3',
    grade: 1,
    topic: 'place-values',
    title: 'Which base-ten model shows the number?',
    templateId: 'place-values.blocks.match-number',
    config: {
      forcedTask: 'match_blocks_to_number',
      difficulty: 'adaptive',
      optionCount: 4,
    },
  },
];
