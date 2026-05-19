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

function isNumericAnswer(value) {
  return value !== null && value !== undefined && value !== '' && Number.isFinite(Number(value));
}

function getOptionValue(option) {
  if (option && typeof option === 'object') {
    return option.label ?? option.text ?? option.value ?? option.content ?? option.id ?? '';
  }
  return option;
}

function getOptionId(option) {
  return option && typeof option === 'object' ? option.id ?? option.value : null;
}

function getValidIndex(value, optionsLength) {
  if (!isNumericAnswer(value)) return null;
  const numeric = Number(value);
  if (!Number.isInteger(numeric) || numeric < 0 || numeric >= optionsLength) return null;
  return numeric;
}

function orderedAnswerDigitKeys(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return [];
  return Object.keys(value)
    .filter((key) => /^ans_\d+$/.test(key))
    .sort((a, b) => Number(a.split('_')[1]) - Number(b.split('_')[1]));
}

export function isAnswerCorrect(question, userAnswer) {
  if (!question) return false;
  const type = String(question.type || '').toLowerCase();

  if (type === 'mcq' || type === 'imagechoice' || type === 'multiplechoice') {
    const options = Array.isArray(question.options) ? question.options : [];
    const selectedIndex = typeof userAnswer === 'object'
      ? Number(userAnswer?.selectedIndex ?? userAnswer?.index)
      : Number(userAnswer);

    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
      return false;
    }

    const selectedOption = options[selectedIndex];
    if (selectedOption?.isCorrect) return true;

    const expectedIndices = [
      getValidIndex(question.correctAnswerIndex, options.length),
      getValidIndex(question.correct_answer_index, options.length),
      getValidIndex(question.answer, options.length),
      getValidIndex(question.correctAnswer, options.length),
      getValidIndex(question.correctAnswerText, options.length),
    ].filter((index) => index !== null);

    if (expectedIndices.includes(selectedIndex)) {
      return true;
    }

    const selectedId = typeof userAnswer === 'object' ? userAnswer?.id : null;
    const optionId = selectedId ?? getOptionId(selectedOption);
    const expectedId = question.answer ?? question.correctAnswer ?? question.correctAnswerId ?? question.correct_answer;
    if (optionId != null && expectedId != null && normalizeText(optionId) === normalizeText(expectedId)) {
      return true;
    }

    const selectedText = getOptionValue(selectedOption);
    const expectedCandidates = [
      parseMaybeJson(question.answer, question.answer),
      parseMaybeJson(question.correctAnswer, question.correctAnswer),
      parseMaybeJson(question.correctAnswerText, question.correctAnswerText),
      parseMaybeJson(question.correct_answer, question.correct_answer),
      parseMaybeJson(question.correct_answer_text, question.correct_answer_text),
      question.solution?.text,
      ...(Array.isArray(question.solution?.sections)
        ? question.solution.sections.map((section) => section?.content ?? section?.text)
        : []),
    ].filter((candidate) => candidate !== null && candidate !== undefined && typeof candidate !== 'object');

    if (selectedText != null && expectedCandidates.some((candidate) => normalizeText(selectedText) === normalizeText(candidate))) {
      return true;
    }

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
    const expectedKeys = Object.keys(expected);
    const directMatch = expectedKeys.every((key) => normalizeText(answerObject[key]) === normalizeText(expected[key]));
    if (directMatch) return true;

    const expectedDigitKeys = orderedAnswerDigitKeys(expected);
    if (expectedDigitKeys.length && expectedDigitKeys.length === expectedKeys.length) {
      const expectedJoined = expectedDigitKeys.map((key) => normalizeText(expected[key])).join('');
      const visibleJoined = normalizeText(answerObject._joined);
      const joinedAnswer = normalizeText(answerObject.ans ?? answerObject.answer ?? answerObject.value);
      return visibleJoined === expectedJoined || joinedAnswer === expectedJoined;
    }

    return false;
  }

  if (Array.isArray(expected)) {
    const answerArray = Array.isArray(userAnswer) ? userAnswer : [];
    return JSON.stringify(answerArray.map(normalizeText)) === JSON.stringify(expected.map(normalizeText));
  }

  if (normalizeText(userAnswer) === normalizeText(expected)) {
    return true;
  }

  // Check alternative answers if present
  const altAnswers = question.altAnswers ?? question.validation?.altAnswers;
  if (Array.isArray(altAnswers)) {
    for (const alt of altAnswers) {
      if (alt && typeof alt === 'object') {
        const altKeys = Object.keys(alt);
        const answerObject = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : { ans: String(userAnswer) };
        const altMatch = altKeys.every((key) => normalizeText(answerObject[key]) === normalizeText(alt[key]));
        if (altMatch) return true;
      } else if (normalizeText(userAnswer) === normalizeText(alt)) {
        return true;
      }
    }
  }

  return false;
}
