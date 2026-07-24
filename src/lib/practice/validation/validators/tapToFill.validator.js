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
 * Robust, isolated validation engine for Tap-to-Fill questions.
 */
export function validateTapToFill(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null) return false;

  const options = Array.isArray(question.options) ? question.options : [];
  
  // Extract user selected index or value
  let selectedIndex = -1;
  let selectedText = '';

  if (typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)) {
    if (userAnswer.selectedIndex !== undefined) selectedIndex = Number(userAnswer.selectedIndex);
    else if (userAnswer.index !== undefined) selectedIndex = Number(userAnswer.index);
    else {
      const firstVal = Object.values(userAnswer)[0];
      if (typeof firstVal === 'string') selectedText = firstVal;
      else if (Number.isFinite(Number(firstVal))) selectedIndex = Number(firstVal);
    }
  } else if (Number.isFinite(Number(userAnswer))) {
    selectedIndex = Number(userAnswer);
  } else if (typeof userAnswer === 'string') {
    selectedText = userAnswer;
  }

  // 1. If we have a valid option index
  if (selectedIndex >= 0 && selectedIndex < options.length) {
    const selectedOpt = options[selectedIndex];
    if (selectedOpt?.isCorrect) return true;
    selectedText = selectedOpt?.label ?? selectedOpt?.text ?? selectedOpt?.value ?? selectedText;
  }

  // 2. Check selected text against correct option label or question.answer
  if (selectedText) {
    const correctOpt = options.find(o => Boolean(o.isCorrect));
    if (correctOpt) {
      const correctLabel = correctOpt.label ?? correctOpt.text ?? correctOpt.value;
      if (correctLabel && normalizeText(selectedText) === normalizeText(correctLabel)) {
        return true;
      }
    }

    const expectedRaw = question.answer ?? question.correctAnswer ?? question.correctAnswerText;
    const expected = parseMaybeJson(expectedRaw, expectedRaw);
    if (expected) {
      let expectedText = typeof expected === 'object' ? (expected.ans ?? expected.answer ?? Object.values(expected)[0]) : expected;
      if (expectedText && normalizeText(selectedText) === normalizeText(expectedText)) {
        return true;
      }
    }
  }

  return false;
}
