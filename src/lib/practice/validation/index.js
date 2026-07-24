import { validateTokenSelect } from './validators/tokenSelect.validator.js';
import { validateTapToFill } from './validators/tapToFill.validator.js';
import { validateCategorization } from './validators/categorization.validator.js';

const VALIDATOR_MAP = {
  pick_from_sentence: validateTokenSelect,
  select_from_sentence: validateTokenSelect,
  token_select: validateTokenSelect,
  tap_to_fill: validateTapToFill,
  categorization: validateCategorization,
  categorizationv2: validateCategorization,
  categorisation: validateCategorization,
  categorisationv2: validateCategorization,
  sorting: validateCategorization,
  sort: validateCategorization,
  drag_drop: validateCategorization
};

/**
 * Clean Strategy Dispatcher for question validation.
 * Safely routes to individual validator modules.
 */
export function validateQuestionAnswer(question, userAnswer) {
  if (!question) return false;
  
  const type = String(question.type || question.interaction?.engine || question.interaction || '').toLowerCase();
  
  // Check if question type has an isolated validator
  const validator = VALIDATOR_MAP[type];
  if (validator) {
    return validator(question, userAnswer);
  }

  // Check parts for token select
  const parts = Array.isArray(question.parts) ? question.parts : [];
  if (parts.some(p => p && (['pick_from_sentence', 'select_from_sentence', 'token_select'].includes(p.type) || Array.isArray(p.tokens)))) {
    return validateTokenSelect(question, userAnswer);
  }

  return null; // Fall back to main validation logic if not handled by isolated validator
}
