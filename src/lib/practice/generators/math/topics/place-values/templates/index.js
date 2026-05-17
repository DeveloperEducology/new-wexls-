export const placeValueTemplates = {
  'place-values.blocks.units': {
    id: 'place-values.blocks.units',
    family: 'blocks',
    engine: 'blocks',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'identify_from_blocks', difficulty: 'easy' },
  },
  'place-values.blocks.match-number': {
    id: 'place-values.blocks.match-number',
    family: 'blocks',
    engine: 'blocks',
    questionType: 'mcq',
    defaultConfig: {
      forcedTask: 'match_blocks_to_number',
      difficulty: 'adaptive',
      optionCount: 4,
    },
  },
  'place-values.blocks.hundreds': {
    id: 'place-values.blocks.hundreds',
    family: 'blocks',
    engine: 'blocks',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'identify_from_blocks_3d', difficulty: 'medium' },
  },
  'place-values.blocks.thousands': {
    id: 'place-values.blocks.thousands',
    family: 'blocks',
    engine: 'blocks',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'thousands_blocks', difficulty: 'hard' },
  },
  'place-values.place-name': {
    id: 'place-values.place-name',
    family: 'placeName',
    engine: 'placeName',
    questionType: 'mcq',
    defaultConfig: { forcedTask: 'place_name', difficulty: 'easy' },
  },
  'place-values.expanded-form': {
    id: 'place-values.expanded-form',
    family: 'expandedForm',
    engine: 'expandedForm',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'expanded_form', difficulty: 'medium' },
  },
  'place-values.word-to-number': {
    id: 'place-values.word-to-number',
    family: 'wordToNumber',
    engine: 'wordToNumber',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'word_to_number', difficulty: 'hard' },
  },
  'place-values.breakdown-table': {
    id: 'place-values.breakdown-table',
    family: 'expandedForm',
    engine: 'expandedForm',
    questionType: 'fillInTheBlank',
    defaultConfig: { forcedTask: 'breakdown_table', difficulty: 'medium' },
  },
};

export function getPlaceValueTemplate(templateId) {
  return placeValueTemplates[templateId] || null;
}
