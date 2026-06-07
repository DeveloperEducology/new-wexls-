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

  if (interaction === 'balloon_tap') {
    const hitsNeeded = question.hitsNeeded || 3;
    const hits = Number(userAnswer);
    return Number.isFinite(hits) && hits >= hitsNeeded;
  }

  if (interaction === 'interactive_stickers') {
    const stickersPart = question.parts?.find((p) => p.type === 'interactive_stickers');
    if (stickersPart?.mode === 'shadow_match') {
      const placements = userAnswer && typeof userAnswer === 'object' && Array.isArray(userAnswer.placements)
        ? userAnswer.placements
        : [];
      const targets = Array.isArray(stickersPart.targets) ? stickersPart.targets : [];
      if (targets.length === 0) return false;
      return targets.every(target =>
        placements.some(p => p.type === target.type && p.isSnapped)
      );
    }
    const placedCount = userAnswer && typeof userAnswer === 'object'
      ? Number(userAnswer.count ?? userAnswer.placements?.length)
      : Number(userAnswer);
    return placedCount === Number(question.answer ?? question.targetCount);
  }

  if (interaction === 'direct_image_select' || question.directImageSelect) {
    const selectedIndex = Number(userAnswer);
    const parts = Array.isArray(question.parts) ? question.parts : [];
    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= parts.length) {
      return false;
    }
    const selectedPart = parts[selectedIndex];
    return !!selectedPart?.isCorrect;
  }

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

  if (type === 'mcq' || type === 'imagechoice' || type === 'multiplechoice' || type === 'visual_choice') {
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

  // Intercept and run misconception diagnostics before returning false
  try {
    const meta = question.metadata || {};
    let diagnostic = null;
    if (meta.topic === 'subtraction' && meta.engine === 'numbers') {
      diagnostic = diagnoseSubtraction(question, userAnswer);
    } else if (meta.topic === 'fractions' && meta.engine === 'unlikeDenominators') {
      diagnostic = diagnoseFractions(question, userAnswer);
    }

    if (diagnostic) {
      if (!question.solution) question.solution = {};
      if (!Array.isArray(question.solution.sections)) question.solution.sections = [];
      const hasHint = question.solution.sections.some(s => s.label === 'misconception_hint');
      if (!hasHint) {
        question.solution.sections.unshift({
          type: 'section',
          label: 'misconception_hint',
          parts: [
            {
              type: 'text',
              content: diagnostic.message,
              style: {
                padding: '14px',
                background: '#fff5f5',
                borderLeft: '4px solid #ef4444',
                borderRadius: '8px',
                color: '#991b1b',
                fontWeight: '700',
                fontSize: '14px',
                lineHeight: '1.5',
                marginBottom: '14px'
              }
            }
          ]
        });
      }
    }
  } catch (err) {
    console.warn('[answerValidation] Error during misconception diagnostics:', err);
  }

  return false;
}

function gcd(a, b) {
  return b === 0 ? a : gcd(b, a % b);
}

function lcm(a, b) {
  return (a * b) / gcd(a, b);
}

function diagnoseSubtraction(question, userAnswer) {
  const { a, b } = question.metadata || {};
  if (a == null || b == null) return null;

  let ans = null;
  if (userAnswer && typeof userAnswer === 'object') {
    const keys = Object.keys(userAnswer).filter(k => /^ans_\d+$/.test(k)).sort();
    if (keys.length > 0) {
      ans = Number(keys.map(k => userAnswer[k]).join(''));
    } else if (userAnswer.ans !== undefined) {
      ans = Number(userAnswer.ans);
    } else if (userAnswer.answer !== undefined) {
      ans = Number(userAnswer.answer);
    }
  } else {
    ans = Number(userAnswer);
  }

  if (ans == null || isNaN(ans)) return null;

  const correct = a - b;

  // 1. Subtracting smaller digit from larger digit (skipping borrowing)
  const strA = String(a).split('').reverse();
  const strB = String(b).split('').reverse();
  const len = Math.max(strA.length, strB.length);
  const noBorrowDigits = [];
  for (let i = 0; i < len; i++) {
    const digitA = Number(strA[i] || 0);
    const digitB = Number(strB[i] || 0);
    noBorrowDigits.push(Math.abs(digitA - digitB));
  }
  const noBorrowAns = Number(noBorrowDigits.reverse().join(''));

  if (ans === noBorrowAns && ans !== correct) {
    return {
      code: 'subtraction_no_borrowing',
      message: '⚠️ **Common Mistake:** It looks like you subtracted the smaller digit from the larger digit at each position (e.g. subtracting top digit from bottom digit) instead of borrowing. Remember to borrow from the next column when the top digit is smaller than the bottom digit.'
    };
  }

  // 2. Off-by-one counting error
  if (Math.abs(ans - correct) === 1) {
    return {
      code: 'arithmetic_off_by_one',
      message: '⚠️ **Almost There:** You are off by just 1! Double-check your subtraction arithmetic.'
    };
  }

  // 3. Off-by-ten place value error
  if (Math.abs(ans - correct) === 10) {
    return {
      code: 'arithmetic_off_by_ten',
      message: '⚠️ **Alignment/Place Value Slip:** You are off by exactly 10. Check if your alignment or subtraction in the tens column is correct.'
    };
  }

  return null;
}

function diagnoseFractions(question, userAnswer) {
  const { n1, d1, n2, d2, op } = question.metadata || {};
  if (n1 == null || d1 == null || n2 == null || d2 == null || !op) return null;

  let ansStr = '';
  if (userAnswer && typeof userAnswer === 'object') {
    ansStr = String(userAnswer.ans || userAnswer.answer || '');
  } else {
    ansStr = String(userAnswer || '');
  }

  ansStr = ansStr.replace(/\s+/g, '');
  if (!ansStr.includes('/')) return null;

  const [ansNum, ansDen] = ansStr.split('/').map(Number);
  if (isNaN(ansNum) || isNaN(ansDen) || ansDen === 0) return null;

  // 1. Straight-across addition/subtraction: (n1 + n2) / (d1 + d2)
  const straightNum = op === '+' ? (n1 + n2) : Math.abs(n1 - n2);
  const straightDen = d1 + d2;
  if (ansNum === straightNum && ansDen === straightDen) {
    return {
      code: 'fraction_straight_across',
      message: `⚠️ **Concept Reminder:** It looks like you ${op === '+' ? 'added' : 'subtracted'} the numerators and denominators straight across. To ${op === '+' ? 'add' : 'subtract'} fractions with unlike denominators, you must first find a common denominator, not just combine them directly.`
    };
  }

  // 2. Added numerators but multiplied denominators: (n1 + n2) / (d1 * d2)
  const multDen = d1 * d2;
  if (ansNum === straightNum && ansDen === multDen) {
    return {
      code: 'fraction_added_num_multiplied_den',
      message: `⚠️ **Common Mistake:** It looks like you multiplied the denominators to get a common denominator, but you ${op === '+' ? 'added' : 'subtracted'} the original numerators directly. When you change the denominator, you must multiply the numerator by the same factor.`
    };
  }

  return null;
}
