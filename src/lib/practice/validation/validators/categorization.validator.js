function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, '').toLowerCase();
}

function parseMaybeJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Robust, isolated validation engine for Categorization & Sorting questions.
 */
export function validateCategorization(question, userAnswer) {
  if (!userAnswer || typeof userAnswer !== 'object' || Array.isArray(userAnswer)) return false;

  // 1. Explicit answerKey / answer object
  const answerKey = parseMaybeJson(question.answerKey ?? question.answer ?? question.correctAnswer, null);
  if (answerKey && typeof answerKey === 'object' && !Array.isArray(answerKey)) {
    const keys = Object.keys(answerKey);
    if (keys.length > 0) {
      return keys.every(key => normalizeText(userAnswer[key]) === normalizeText(answerKey[key]));
    }
  }

  // 2. Validate using question.items target mapping
  const items = question.items || question.parts?.find(p => p?.items)?.items || [];
  if (Array.isArray(items) && items.length > 0) {
    const itemTargetMap = new Map(items.map(item => [item.id, item.target || item.categoryId]));
    const validItems = items.filter(i => itemTargetMap.get(i.id));
    if (validItems.length > 0) {
      return validItems.every(item => {
        const expectedTarget = itemTargetMap.get(item.id);
        const actualTarget = userAnswer[item.id];
        return normalizeText(actualTarget) === normalizeText(expectedTarget);
      });
    }
  }

  // 3. Validate using question.options isCorrect (correct option -> category 0, distractor -> category 1)
  const options = Array.isArray(question.options) ? question.options : [];
  const categories = question.categories || question.parts?.find(p => p?.categories)?.categories || [];

  if (options.length > 0 && categories.length >= 2) {
    const targetCatCorrect = categories[0]?.id;
    const targetCatIncorrect = categories[1]?.id;

    return options.every((opt) => {
      const optId = opt.id || opt.label;
      const actualTarget = userAnswer[optId];
      if (!actualTarget) return false;
      const expectedTarget = opt.isCorrect ? targetCatCorrect : targetCatIncorrect;
      return normalizeText(actualTarget) === normalizeText(expectedTarget);
    });
  }

  return false;
}
