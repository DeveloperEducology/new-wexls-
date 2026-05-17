import { generatePlaceValueQuestion } from '../engine.js';

export function generateExpandedFormQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    difficulty: config.difficulty || 'medium',
    engineParams: {
      forcedTask: 'expanded_form',
      ...(config.engineParams || {}),
    },
  });
}

export function generateMissingNumberQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    difficulty: config.difficulty || 'medium',
    engineParams: {
      forcedTask: 'missing_number',
      ...(config.engineParams || {}),
    },
  });
}

export function generateBreakdownTableQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    engineParams: {
      forcedTask: 'breakdown_table',
      ...(config.engineParams || {}),
    },
  });
}
