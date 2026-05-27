import { validateInteractiveToolAnswer } from './interactiveToolEngines/validateInteractiveToolAnswer.js';

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

function getOrderingDirection(question) {
  const prompt = String(question.questionText || question.prompt || '').toLowerCase();
  if (prompt.includes('largest to smallest') || prompt.includes('greatest to least') || prompt.includes('descending')) {
    return 'desc';
  }
  return 'asc';
}

function compareOrderingItems(a, b, direction) {
  const aValue = a.value ?? a.content ?? a.label ?? a.text ?? a.id;
  const bValue = b.value ?? b.content ?? b.label ?? b.text ?? b.id;
  const aNumber = Number(aValue);
  const bNumber = Number(bValue);

  let result;
  if (Number.isFinite(aNumber) && Number.isFinite(bNumber)) {
    result = aNumber - bNumber;
  } else {
    result = String(aValue).localeCompare(String(bValue), undefined, {
      numeric: true,
      sensitivity: 'base'
    });
  }

  return direction === 'desc' ? -result : result;
}

function getOrderingSlots(question, items) {
  const explicitTargets = Array.isArray(question.targets)
    ? question.targets
        .filter(target => target && (target.kind === 'order_slot' || target.order !== undefined))
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  if (explicitTargets.length >= items.length) {
    return explicitTargets.slice(0, items.length).map(target => target.id);
  }

  return items.map((_, index) => `slot_${index + 1}`);
}

function getExpectedOrderingAnswer(question) {
  const items = Array.isArray(question.items) ? question.items : [];
  if (!items.length) return null;

  const slotIds = getOrderingSlots(question, items);
  const targetIdSet = new Set(slotIds);
  const existingAnswer = parseMaybeJson(question.answer ?? question.correctAnswer, null);

  if (
    existingAnswer
    && typeof existingAnswer === 'object'
    && !Array.isArray(existingAnswer)
    && items.every(item => targetIdSet.has(existingAnswer[item.id]))
  ) {
    return existingAnswer;
  }

  const orderedItems = [...items].sort((a, b) => compareOrderingItems(a, b, getOrderingDirection(question)));
  return orderedItems.reduce((answer, item, index) => {
    answer[item.id] = slotIds[index];
    return answer;
  }, {});
}

export function isAnswerCorrect(question, userAnswer) {
  if (!question) return false;
  const type = String(question.type || '').toLowerCase();
  const interaction = String(question.interaction || '').toLowerCase();

  if (interaction === 'hotspot_multi_select') {
    const options = Array.isArray(question.options) ? question.options : [];
    const correctIndices = options
      .map((opt, idx) => (opt?.isCorrect ? idx : null))
      .filter((idx) => idx !== null);

    let selectedIndices = [];
    if (Array.isArray(userAnswer)) {
      selectedIndices = userAnswer.map(Number);
    } else if (userAnswer && typeof userAnswer === 'object') {
      selectedIndices = Object.entries(userAnswer)
        .filter(([_, val]) => Boolean(val))
        .map(([key]) => Number(key));
    } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
      selectedIndices = [Number(userAnswer)];
    }

    if (correctIndices.length !== selectedIndices.length) {
      return false;
    }

    const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
    const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
    return sortedCorrect.every((val, idx) => val === sortedSelected[idx]);
  }

  if (type === 'categorizationv2' && question.layoutMode === 'ordering') {
    const expectedOrderingAnswer = getExpectedOrderingAnswer(question);
    const answerObject = typeof userAnswer === 'object' && userAnswer !== null ? userAnswer : {};
    if (!expectedOrderingAnswer) return false;
    return Object.keys(expectedOrderingAnswer).every((key) => (
      normalizeText(answerObject[key]) === normalizeText(expectedOrderingAnswer[key])
    ));
  }

  if (type === 'interactivetool') {
    return validateInteractiveToolAnswer(question, userAnswer);
  }

  if (type === 'mcq' || type === 'imagechoice' || type === 'multiplechoice') {
    const options = Array.isArray(question.options) ? question.options : [];
    const isMultiSelect = question.interaction === 'multi_select' || question.multiSelect === true;

    if (isMultiSelect) {
      let correctIndices = options
        .map((opt, idx) => (opt?.isCorrect ? idx : null))
        .filter((idx) => idx !== null);

      if (correctIndices.length === 0) {
        const expected = question.correctAnswerIndices ?? question.answer ?? question.correctAnswerIndex ?? question.correctAnswer;
        if (Array.isArray(expected)) {
          correctIndices = expected.map(Number);
        } else if (expected && typeof expected === 'object') {
          correctIndices = Object.entries(expected)
            .filter(([_, val]) => Boolean(val))
            .map(([key]) => Number(key));
        } else if (expected !== null && expected !== undefined && expected !== '') {
          correctIndices = [Number(expected)];
        }
      }

      let selectedIndices = [];
      if (Array.isArray(userAnswer)) {
        selectedIndices = userAnswer.map(Number);
      } else if (userAnswer && typeof userAnswer === 'object') {
        selectedIndices = Object.entries(userAnswer)
          .filter(([_, val]) => Boolean(val))
          .map(([key]) => Number(key));
      } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
        selectedIndices = [Number(userAnswer)];
      }

      if (correctIndices.length !== selectedIndices.length) {
        return false;
      }

      const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
      const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
      return sortedCorrect.every((val, idx) => val === sortedSelected[idx]);
    }

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

  let finalUserAnswer = userAnswer;
  if (userAnswer && typeof userAnswer === 'object' && !Array.isArray(userAnswer)) {
    const keys = Object.keys(userAnswer);
    if (keys.length === 1) {
      finalUserAnswer = userAnswer[keys[0]];
    } else if (userAnswer.ans !== undefined) {
      finalUserAnswer = userAnswer.ans;
    } else if (userAnswer.answer !== undefined) {
      finalUserAnswer = userAnswer.answer;
    }
  }

  if (normalizeText(finalUserAnswer) === normalizeText(expected)) {
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
      } else if (normalizeText(finalUserAnswer) === normalizeText(alt)) {
        return true;
      }
    }
  }

  return false;
}
