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

export function isAnswerCorrect(question, userAnswer) {
  if (!question) return false;
  const type = String(question.type || '').toLowerCase();

  if (type === 'mcq' || type === 'imagechoice' || type === 'multiplechoice') {
    const selectedIndex = typeof userAnswer === 'object'
      ? Number(userAnswer?.selectedIndex ?? userAnswer?.index)
      : Number(userAnswer);

    if (Number.isFinite(selectedIndex)) {
      if (question.options?.[selectedIndex]?.isCorrect) return true;
      if (Number.isFinite(Number(question.correctAnswerIndex))) {
        return Number(question.correctAnswerIndex) === selectedIndex;
      }
    }

    const selectedId = typeof userAnswer === 'object' ? userAnswer?.id : null;
    if (selectedId && question.answer) return String(selectedId) === String(question.answer);
    return false;
  }

  const expectedRaw = question.answer
    ?? question.correctAnswerText
    ?? question.correctAnswer
    ?? question.correct_answer_text
    ?? question.correct_answer;
  const expected = parseMaybeJson(expectedRaw, expectedRaw);

  if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
    const answerObject = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {};
    return Object.keys(expected).every((key) => normalizeText(answerObject[key]) === normalizeText(expected[key]));
  }

  if (Array.isArray(expected)) {
    const answerArray = Array.isArray(userAnswer) ? userAnswer : [];
    return JSON.stringify(answerArray.map(normalizeText)) === JSON.stringify(expected.map(normalizeText));
  }

  return normalizeText(userAnswer) === normalizeText(expected);
}
