
import { generateSmartPlaceValueQuestion } from './index.js';
import { getPlaceValueSkill, placeValueMicroSkills } from './skills/index.js';
import { getPlaceValueTemplate } from './templates/index.js';
import { generateBlocksModelMatchQuestion } from './engines/blocks.engine.js';

const legacyRegistry = {
  'place_value_identification': {
    params: { forcedTask: 'place_name' }
  },
  'visual_blocks_units': {
    params: { difficulty: 'easy', forcedTask: 'identify_from_blocks' }
  },
  'visual_blocks_hundreds': {
    params: { difficulty: 'medium', forcedTask: 'identify_from_blocks_3d' }
  },
  'visual_blocks_thousands': {
    params: { difficulty: 'hard', forcedTask: 'thousands_blocks' }
  },
  'expanded_form_mastery': {
    params: { difficulty: 'medium', forcedTask: 'expanded_form' }
  },
  'word_to_number_mastery': {
    params: { difficulty: 'hard', forcedTask: 'word_to_number' }
  }
};

const skillRegistry = Object.fromEntries(
  placeValueMicroSkills.map((skill) => {
    const template = getPlaceValueTemplate(skill.templateId);
    return [
      skill.id,
      {
        params: {
          ...(template?.defaultConfig || {}),
          ...(skill.config || {}),
        },
        skill,
        template,
      },
    ];
  }),
);

export const placeValueRawRegistry = {
  ...legacyRegistry,
  ...skillRegistry,
};

export const placeValueGenerator = (config) => {
  const logicType = config.logic_type || 'place_value_identification';
  const skill = getPlaceValueSkill(logicType);
  const entry = placeValueRawRegistry[logicType] || placeValueRawRegistry['place_value_identification'];
  
  if (entry.params.forcedTask === 'match_blocks_to_number') {
    const selectedDifficulty = config.difficulty && config.difficulty !== 'adaptive'
      ? config.difficulty
      : entry.params.difficulty || config.difficulty;
    return generateBlocksModelMatchQuestion({
      ...config,
      difficulty: selectedDifficulty,
      engineParams: {
        ...entry.params,
        ...(config.engineParams || {})
      },
      variables: config.variables || {},
    });
  }

  return generateSmartPlaceValueQuestion({
    ...config,
    difficulty: entry.params.difficulty || config.difficulty,
    forcedTask: entry.params.forcedTask || config.forcedTask,
    engineParams: {
      ...entry.params,
      ...(config.engineParams || {})
    },
    metadata: {
      ...(config.metadata || {}),
      skill,
      template: entry.template
    },
  });
};

export const placeValueRegistry = Object.fromEntries(
  Object.keys(placeValueRawRegistry).map((key) => [key, placeValueGenerator])
);
