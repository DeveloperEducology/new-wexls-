import { generatePlaceValueQuestion } from '../engine.js';

export function generateWordToNumberQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    difficulty: config.difficulty || 'hard',
    engineParams: {
      forcedTask: 'word_to_number',
      ...(config.engineParams || {}),
    },
  });
}

export function generateDigitWordCombinationQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    difficulty: config.difficulty || 'medium',
    engineParams: {
      forcedTask: 'digit_word_combination',
      ...(config.engineParams || {}),
    },
  });
}
