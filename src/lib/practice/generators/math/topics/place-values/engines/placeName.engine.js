import { generatePlaceValueQuestion } from '../engine.js';

export function generatePlaceNameQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    engineParams: {
      forcedTask: 'place_name',
      ...(config.engineParams || {}),
    },
  });
}

export function generateValueOfDigitQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    difficulty: config.difficulty || 'medium',
    engineParams: {
      forcedTask: 'value_of_digit',
      ...(config.engineParams || {}),
    },
  });
}

export function generatePlaceValueScaffoldQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    engineParams: {
      forcedTask: 'place_value_scaffold',
      ...(config.engineParams || {}),
    },
  });
}
