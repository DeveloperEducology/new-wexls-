import { validateInteractiveToolAnswer } from './interactiveToolEngines/validateInteractiveToolAnswer.js';
import { validateQuestionAnswer } from './validation/index.js';

function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, '').toLowerCase();
}

function normalizeLooseText(value) {
  return String(value ?? '').trim().replace(/\s+/g, ' ');
}

function isMathEquationCorrect(actual, expected) {
  const cleanActual = String(actual || '').replace(/\s+/g, '');
  const cleanExpected = String(expected || '').replace(/\s+/g, '');
  
  if (cleanActual === cleanExpected) return true;
  
  if ((cleanActual.match(/=/g) || []).length !== 1 || (cleanExpected.match(/=/g) || []).length !== 1) {
    return false;
  }
  if (/[^\d+=]/.test(cleanActual) || /[^\d+=]/.test(cleanExpected)) {
    return false;
  }
  
  const parseSide = (sideStr) => {
    return sideStr.split('+').map(numStr => parseInt(numStr, 10)).filter(n => !isNaN(n));
  };
  
  const [actLhs, actRhs] = cleanActual.split('=');
  const [expLhs, expRhs] = cleanExpected.split('=');
  
  const actLhsNums = parseSide(actLhs);
  const actRhsNums = parseSide(actRhs);
  const expLhsNums = parseSide(expLhs);
  const expRhsNums = parseSide(expRhs);
  
  const actLhsSum = actLhsNums.reduce((sum, n) => sum + n, 0);
  const actRhsSum = actRhsNums.reduce((sum, n) => sum + n, 0);
  const expLhsSum = expLhsNums.reduce((sum, n) => sum + n, 0);
  const expRhsSum = expRhsNums.reduce((sum, n) => sum + n, 0);
  
  if (actLhsSum !== actRhsSum || expLhsSum !== expRhsSum) return false;
  
  const allActNums = [...actLhsNums, ...actRhsNums].sort((x, y) => x - y);
  const allExpNums = [...expLhsNums, ...expRhsNums].sort((x, y) => x - y);
  
  if (allActNums.length !== allExpNums.length) return false;
  return allActNums.every((val, idx) => val === allExpNums[idx]);
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

function objectMatches(actual, expected) {
  if (!actual || !expected || typeof actual !== 'object' || typeof expected !== 'object') return false;
  if (Array.isArray(actual) || Array.isArray(expected)) {
    if (!Array.isArray(actual) || !Array.isArray(expected) || actual.length !== expected.length) return false;
    return expected.every((item, index) => normalizeText(actual[index]) === normalizeText(item));
  }
  const expectedKeys = Object.keys(expected);
  return expectedKeys.every((key) => normalizeText(actual[key]) === normalizeText(expected[key]));
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

function getAnswerPrimitive(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    if (value.value !== undefined) return value.value;
    if (value.answer !== undefined) return value.answer;
    if (value.ans !== undefined) return value.ans;
    if (value.selectedIndex !== undefined) return value.selectedIndex;
    if (value.index !== undefined) return value.index;
    const keys = Object.keys(value);
    if (keys.length === 1) return value[keys[0]];
  }
  return value;
}

function getSelectedOptionValue(question, userAnswer) {
  const options = Array.isArray(question?.options)
    ? question.options
    : (question?.options && typeof question.options === 'object' ? Object.values(question.options) : []);
  const optionKeys = Array.isArray(question?.options)
    ? question.options.map((_, i) => i)
    : (question?.options && typeof question.options === 'object' ? Object.keys(question.options) : []);

  const getIndexFromAnswer = (val) => {
    if (val === null || val === undefined || val === '') return -1;
    const num = Number(val);
    if (Number.isFinite(num) && num >= 0 && num < optionKeys.length) {
      return num;
    }
    if (typeof val === 'string') {
      const idx = optionKeys.findIndex(k => String(k).toUpperCase() === val.toUpperCase());
      if (idx >= 0) return idx;
    }
    return -1;
  };

  if (Array.isArray(userAnswer)) {
    const labels = userAnswer.map((item) => {
      const idx = getIndexFromAnswer(item);
      if (idx >= 0) return getOptionValue(options[idx]);
      return String(item || '');
    });
    return labels.join('');
  }
  const primitive = getAnswerPrimitive(userAnswer);
  const selectedIndex = getIndexFromAnswer(primitive);
  if (selectedIndex < 0) return primitive;
  return getOptionValue(options[selectedIndex]);
}

function getNormalizedTypeAndInteraction(question) {
  if (!question) return { type: '', interaction: '' };
  let type = String(question.type || '').toLowerCase();
  let interaction = '';
  if (typeof question.interaction === 'object' && question.interaction !== null) {
    interaction = String(question.interaction.engine || question.interaction.inputMode || '').toLowerCase();
  } else {
    interaction = String(question.interaction || '').toLowerCase();
  }

  // Normalize spelling (s -> z) for categorization engines
  if (type === 'categorisationv2') type = 'categorizationv2';
  if (type === 'categorisation') type = 'categorization';
  if (interaction === 'categorisationv2') interaction = 'categorizationv2';
  if (interaction === 'categorisation') interaction = 'categorization';

  const optionsCount = Array.isArray(question.options)
    ? question.options.length
    : (question?.options && typeof question.options === 'object' ? Object.keys(question.options).length : 0);

  if ((type === '' || type === 'parameterized') && optionsCount > 0) {
    if (interaction === 'msq' || question.optionsType === 'msq') {
      type = 'multi_select';
    } else {
      type = 'mcq';
    }
  }
  return { type, interaction };
}

function getRuleActualValue(rule, question, userAnswer) {
  const target = String(rule?.target || rule?.field || '').toLowerCase();
  const { type, interaction } = getNormalizedTypeAndInteraction(question);
  const isMcq = ['mcq', 'imagechoice', 'multiplechoice', 'visual_choice', 'picture_mcq', 'picture_choice', 'audio_mcq', 'multi_select', 'msq', 'hotspot_select', 'hotspot'].includes(type) || 
                ['mcq', 'imagechoice', 'multiplechoice', 'visual_choice', 'picture_mcq', 'picture_choice', 'audio_mcq', 'multi_select', 'msq', 'hotspot_select', 'hotspot'].includes(interaction) ||
                interaction === 'choice' || interaction === 'multi-choice';

  if (
    target === 'selectedoption' || 
    target === 'selected_option' || 
    target === 'optionlabel' || 
    target === 'option_label' ||
    (target === 'answer' && isMcq)
  ) {
    return getSelectedOptionValue(question, userAnswer);
  }
  return getAnswerPrimitive(userAnswer);
}

function hasUnresolvedPlaceholder(value) {
  if (value === null || value === undefined) return false;
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return value.some(hasUnresolvedPlaceholder);
    }
    return Object.values(value).some(hasUnresolvedPlaceholder);
  }
  return /\[[A-Za-z_][A-Za-z0-9_]*\]/.test(String(value));
}

function validateRule(rule, question, userAnswer) {
  if (!rule || typeof rule !== 'object') return true;
  const type = String(rule.type || 'exact_match').toLowerCase();
  const answerValue = getRuleActualValue(rule, question, userAnswer);
  const expectedRaw = rule.value
    ?? rule.expected
    ?? rule.answer
    ?? rule.formula
    ?? question.correctAnswerText
    ?? question.correctAnswer
    ?? question.answer;

  if (hasUnresolvedPlaceholder(expectedRaw)) {
    return true;
  }

  if (isPickFromSentenceType(question)) {
    return validatePickFromSentence(question, userAnswer);
  }

  const { type: qType, interaction: qInteraction } = getNormalizedTypeAndInteraction(question);
  const isCategorizationQuestion = [
    'categorization',
    'categorizationv2',
    'categorisation',
    'categorisationv2',
    'sorting',
    'sort',
    'drag_drop'
  ].includes(qType) || [
    'categorization',
    'categorizationv2',
    'categorisation',
    'categorisationv2',
    'sorting',
    'sort',
    'drag_drop'
  ].includes(qInteraction);

  if (isCategorizationQuestion && (typeof expectedRaw !== 'object' || expectedRaw === null)) {
    return validateCategorizationDragDrop(question, userAnswer);
  }

  if (expectedRaw && typeof expectedRaw === 'object') {
    const actualObject = userAnswer && typeof userAnswer === 'object' ? userAnswer : answerValue;
    return objectMatches(actualObject, expectedRaw);
  }

  if (type === 'numeric_tolerance') {
    const actual = Number(answerValue);
    const expected = Number(expectedRaw);
    const tolerance = Number(rule.tolerance ?? question.validation?.tolerance ?? 0);
    return Number.isFinite(actual) && Number.isFinite(expected) && Math.abs(actual - expected) <= tolerance;
  }

  if (type === 'case_insensitive') {
    return normalizeText(answerValue) === normalizeText(expectedRaw);
  }

  if (type === 'regex_validation') {
    try {
      const regex = new RegExp(String(expectedRaw), rule.flags || 'i');
      return regex.test(String(answerValue ?? ''));
    } catch {
      return false;
    }
  }

  if (type === 'multi_answer') {
    const expected = Array.isArray(expectedRaw)
      ? expectedRaw
      : String(expectedRaw ?? '').split(',').map(item => item.trim()).filter(Boolean);
    const actual = Array.isArray(userAnswer)
      ? userAnswer
      : String(answerValue ?? '').split(',').map(item => item.trim()).filter(Boolean);
    if (expected.length !== actual.length) return false;
    const expectedSet = new Set(expected.map(normalizeText));
    return actual.every(item => expectedSet.has(normalizeText(item)));
  }

  if (type === 'custom_formula') {
    const formulaResult = rule.resolvedValue ?? rule.result ?? expectedRaw;
    return normalizeLooseText(answerValue) === normalizeLooseText(formulaResult);
  }

  // all_correct: user must select exactly all correct options (MSQ)
  if (type === 'all_correct') {
    const expectedValues = Array.isArray(rule.values)
      ? rule.values
      : [rule.value].filter(Boolean);
    if (expectedValues.length === 0) return true;
    if (hasUnresolvedPlaceholder(expectedValues)) return true;

    const options = Array.isArray(question.options)
      ? question.options
      : (question?.options && typeof question.options === 'object' ? Object.values(question.options) : []);
    const optionKeys = Array.isArray(question.options)
      ? question.options.map((_, i) => i)
      : (question?.options && typeof question.options === 'object' ? Object.keys(question.options) : []);

    const getIndexFromAnswer = (val) => {
      if (val === null || val === undefined || val === '') return -1;
      const num = Number(val);
      if (Number.isFinite(num) && num >= 0 && num < optionKeys.length) {
        return num;
      }
      if (typeof val === 'string') {
        const idx = optionKeys.findIndex(k => String(k).toUpperCase() === val.toUpperCase());
        if (idx >= 0) return idx;
      }
      return -1;
    };

    // Resolve expected labels to option indices
    const correctIndices = options
      .map((opt, idx) => {
        const label = getOptionValue(opt);
        return expectedValues.some(ev => normalizeLooseText(label) === normalizeLooseText(ev)) ? idx : null;
      })
      .filter(idx => idx !== null);

    // Also include any options already flagged isCorrect
    options.forEach((opt, idx) => {
      if (opt?.isCorrect && !correctIndices.includes(idx)) correctIndices.push(idx);
    });

    let selectedIndices = [];
    if (Array.isArray(userAnswer)) {
      selectedIndices = userAnswer.map(getIndexFromAnswer).filter(idx => idx >= 0);
    } else if (userAnswer && typeof userAnswer === 'object') {
      selectedIndices = Object.entries(userAnswer)
        .filter(([_, val]) => Boolean(val))
        .map(([key]) => getIndexFromAnswer(key))
        .filter(idx => idx >= 0);
    } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
      selectedIndices = [Number(userAnswer)];
    }

    if (correctIndices.length !== selectedIndices.length) return false;
    const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
    const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
    return sortedCorrect.every((val, idx) => val === sortedSelected[idx]);
  }

  return normalizeText(answerValue) === normalizeText(expectedRaw);
}

function validateRules(question, userAnswer) {
  const rules = Array.isArray(question.validationRules)
    ? question.validationRules
    : Array.isArray(question.validation?.rules)
    ? question.validation.rules
    : [];
  const actionableRules = rules.filter(rule => rule && typeof rule === 'object' && !hasUnresolvedPlaceholder(rule.value ?? rule.expected ?? rule.answer ?? rule.formula));
  if (!actionableRules.length) return null;
  return actionableRules.every(rule => validateRule(rule, question, userAnswer));
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

function validateCategorizationDragDrop(question, userAnswer) {
  if (!userAnswer || typeof userAnswer !== 'object' || Array.isArray(userAnswer)) return false;

  // 1. If explicit answerKey or answer object exists
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
  const options = Array.isArray(question.options)
    ? question.options
    : (question?.options && typeof question.options === 'object' ? Object.values(question.options) : []);
  const categories = question.categories || question.parts?.find(p => p?.categories)?.categories || [
    { id: 'cat_long_e', label: 'Long e' },
    { id: 'cat_short_e', label: 'Short e' }
  ];

  if (options.length > 0 && categories.length >= 2) {
    const targetCatCorrect = categories[0]?.id || 'cat_long_e';
    const targetCatIncorrect = categories[1]?.id || 'cat_short_e';

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

function isPickFromSentenceType(question) {
  if (!question) return false;
  const { type, interaction } = getNormalizedTypeAndInteraction(question);
  const targets = ['pick_from_sentence', 'select_from_sentence', 'token_select'];
  if (targets.includes(type) || targets.includes(interaction)) return true;
  const parts = Array.isArray(question.parts) ? question.parts : [];
  return parts.some(p => p && (targets.includes(p.type) || Array.isArray(p.tokens)));
}

function validatePickFromSentence(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null) return false;

  const parts = Array.isArray(question.parts) ? question.parts : [];
  let tokenParts = parts.filter(p => p && (['pick_from_sentence', 'select_from_sentence', 'token_select'].includes(p.type) || Array.isArray(p.tokens)));
  if (tokenParts.length === 0 && Array.isArray(question.tokens)) {
    tokenParts = [question];
  }

  let selectedTokenIds = [];
  if (userAnswer && typeof userAnswer === 'object' && !Array.isArray(userAnswer)) {
    Object.values(userAnswer).forEach(val => {
      if (typeof val === 'string') {
        selectedTokenIds.push(...val.split('|').map(s => s.trim()).filter(Boolean));
      } else if (Array.isArray(val)) {
        selectedTokenIds.push(...val.map(s => String(s).trim()).filter(Boolean));
      } else if (val !== undefined && val !== null) {
        selectedTokenIds.push(String(val).trim());
      }
    });
  } else if (typeof userAnswer === 'string') {
    selectedTokenIds = userAnswer.split('|').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(userAnswer)) {
    selectedTokenIds = userAnswer.map(s => String(s).trim()).filter(Boolean);
  }

  if (selectedTokenIds.length === 0) return false;

  // 1. Check against part.tokens (isCorrect: true)
  if (tokenParts.length > 0) {
    for (const part of tokenParts) {
      const tokens = Array.isArray(part.tokens) ? part.tokens : [];
      if (tokens.length > 0) {
        const correctTokens = tokens.filter(t => Boolean(t.isCorrect));
        if (correctTokens.length > 0) {
          const correctIds = new Set(correctTokens.map(t => String(t.id || '').trim()).filter(Boolean));
          const correctTexts = new Set(correctTokens.map(t => normalizeText(t.text || t.display || t.content || t.label)).filter(Boolean));

          const userIds = new Set();
          const userTexts = new Set();

          selectedTokenIds.forEach(sel => {
            userIds.add(sel);
            const matchingTok = tokens.find(t => String(t.id || '').trim() === sel || normalizeText(t.text || t.display || t.content || t.label) === normalizeText(sel));
            if (matchingTok) {
              if (matchingTok.id) userIds.add(String(matchingTok.id).trim());
              const txt = matchingTok.text || matchingTok.display || matchingTok.content || matchingTok.label;
              if (txt) userTexts.add(normalizeText(txt));
            } else {
              userTexts.add(normalizeText(sel));
            }
          });

          let idMatch = false;
          if (correctIds.size > 0 && correctIds.size === userIds.size) {
            idMatch = [...correctIds].every(id => userIds.has(id));
          }

          let textMatch = false;
          if (correctTexts.size > 0 && correctTexts.size === userTexts.size) {
            textMatch = [...correctTexts].every(txt => userTexts.has(txt));
          }

          if (idMatch || textMatch) return true;
        }
      }
    }
  }

  // 2. Check against question.correctAnswer / question.answer / question.correctAnswerText
  const expectedRaw = question.answer ?? question.correctAnswer ?? question.correctAnswerText;
  const expected = parseMaybeJson(expectedRaw, expectedRaw);

  if (expected) {
    let expectedSet = new Set();
    if (typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
      Object.values(expected).forEach(val => {
        if (typeof val === 'string') {
          val.split(/[|,]/).forEach(v => expectedSet.add(normalizeText(v)));
        } else if (Array.isArray(val)) {
          val.forEach(v => expectedSet.add(normalizeText(v)));
        } else if (v !== undefined && v !== null) {
          expectedSet.add(normalizeText(v));
        }
      });
    } else if (typeof expected === 'string') {
      expected.split(/[|,]/).forEach(v => expectedSet.add(normalizeText(v)));
    } else if (Array.isArray(expected)) {
      expected.forEach(v => expectedSet.add(normalizeText(v)));
    }

    if (expectedSet.size > 0) {
      const userNormSet = new Set(selectedTokenIds.map(normalizeText));
      if (expectedSet.size === userNormSet.size && [...expectedSet].every(item => userNormSet.has(item))) {
        return true;
      }
    }
  }

  return false;
}

export function isAnswerCorrect(question, userAnswer) {
  if (!question) return false;

  const isolatedResult = validateQuestionAnswer(question, userAnswer);
  if (isolatedResult !== null) {
    return isolatedResult;
  }

  const { type, interaction } = getNormalizedTypeAndInteraction(question);

  const isCategorizationType = [
    'categorization',
    'categorizationv2',
    'categorisation',
    'categorisationv2',
    'sorting',
    'sort',
    'drag_drop'
  ].includes(type) || [
    'categorization',
    'categorizationv2',
    'categorisation',
    'categorisationv2',
    'sorting',
    'sort',
    'drag_drop'
  ].includes(interaction);

  if (isCategorizationType && question.layoutMode !== 'ordering' && question.layoutMode !== 'word_completion' && question.layoutMode !== 'complete_words') {
    return validateCategorizationDragDrop(question, userAnswer);
  }

  const ruleResult = validateRules(question, userAnswer);
  if (ruleResult !== null) {
    return ruleResult;
  }

  if (type === 'sentence_ordering' || interaction === 'sentence_ordering') {
    const expected = String(question.correctAnswer || question.answer || '').trim().replace(/\s+/g, ' ');
    const actual = String(userAnswer || '').trim().replace(/\s+/g, ' ');
    if (expected.includes('=') && expected.includes('+')) {
      if (isMathEquationCorrect(actual, expected)) {
        return true;
      }
    }
    return actual === expected;
  }

  if (interaction === 'balloon_tap') {
    const hitsNeeded = question.hitsNeeded || 3;
    const hits = Number(userAnswer);
    return Number.isFinite(hits) && hits >= hitsNeeded;
  }

  if (interaction === 'interactive_stickers') {
    const stickersPart = question.parts?.find((p) => p.type === 'interactive_stickers') || question;
    if (stickersPart?.mode === 'column_sort') {
      const placements = userAnswer && typeof userAnswer === 'object' && Array.isArray(userAnswer.placements)
        ? userAnswer.placements
        : [];
      const stickers = Array.isArray(stickersPart.stickers) ? stickersPart.stickers : [];
      const categories = Array.isArray(stickersPart.categories) ? stickersPart.categories : [];
      
      if (placements.length < stickers.length) return false;

      return placements.every(placement => {
        const sticker = stickers.find(s => s.id === placement.id);
        if (!sticker) return false;
        const correctCategory = sticker.category || sticker.target || sticker.categoryId;
        
        const currentCategory = categories.find(cat => 
          placement.x >= (cat.minX ?? 0) && placement.x < (cat.maxX ?? 100)
        );

        return currentCategory && currentCategory.id === correctCategory;
      });
    }
    if (stickersPart?.mode === 'shadow_match') {
      const placements = userAnswer && typeof userAnswer === 'object' && Array.isArray(userAnswer.placements)
        ? userAnswer.placements
        : [];
      const stickers = Array.isArray(stickersPart.stickers) ? stickersPart.stickers : [];
      if (stickers.length === 0) return false;
      return stickers.every(sticker => {
        const p = placements.find(x => x.id === sticker.id);
        return p && p.isSnapped && p.type === sticker.type;
      });
    }
    const placedCount = userAnswer && typeof userAnswer === 'object'
      ? Number(userAnswer.count ?? userAnswer.placements?.length)
      : Number(userAnswer);
    return placedCount === Number(question.answer ?? question.targetCount);
  }

  if (interaction === 'direct_image_select' || question.directImageSelect) {
    const selectedIndex = Number(userAnswer);
    const parts = Array.isArray(question.parts) ? question.parts : [];
    if (!Number.isFinite(selectedIndex) || selectedIndex < 0) {
      return false;
    }
    // If parts is a single row/group container, look inside its children
    if (parts.length === 1 && (parts[0]?.type === 'row' || parts[0]?.type === 'group') && Array.isArray(parts[0]?.parts)) {
      const children = parts[0].parts;
      if (selectedIndex >= children.length) return false;
      return !!children[selectedIndex]?.isCorrect;
    }
    if (selectedIndex >= parts.length) return false;
    const selectedPart = parts[selectedIndex];
    return !!selectedPart?.isCorrect;
  }

  if (interaction === 'hotspot_multi_select') {
    const options = Array.isArray(question.options)
      ? question.options
      : (question?.options && typeof question.options === 'object' ? Object.values(question.options) : []);
    const optionKeys = Array.isArray(question.options)
      ? question.options.map((_, i) => i)
      : (question?.options && typeof question.options === 'object' ? Object.keys(question.options) : []);

    const getIndexFromAnswer = (val) => {
      if (val === null || val === undefined || val === '') return -1;
      const num = Number(val);
      if (Number.isFinite(num) && num >= 0 && num < optionKeys.length) {
        return num;
      }
      if (typeof val === 'string') {
        const idx = optionKeys.findIndex(k => String(k).toUpperCase() === val.toUpperCase());
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const correctIndices = options
      .map((opt, idx) => (opt?.isCorrect ? idx : null))
      .filter((idx) => idx !== null);

    let selectedIndices = [];
    if (Array.isArray(userAnswer)) {
      selectedIndices = userAnswer.map(getIndexFromAnswer).filter(idx => idx >= 0);
    } else if (userAnswer && typeof userAnswer === 'object') {
      selectedIndices = Object.entries(userAnswer)
        .filter(([_, val]) => Boolean(val))
        .map(([key]) => getIndexFromAnswer(key))
        .filter(idx => idx >= 0);
    } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
      selectedIndices = [getIndexFromAnswer(userAnswer)].filter(idx => idx >= 0);
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

  if (
    type === 'categorizationv2'
    && (question.layoutMode === 'word_completion' || question.layoutMode === 'complete_words')
  ) {
    const answerObject = typeof userAnswer === 'object' && userAnswer !== null && !Array.isArray(userAnswer)
      ? userAnswer
      : {};
    const expected = parseMaybeJson(question.answer ?? question.correctAnswer ?? question.answerKey, null);

    const wordCards = Array.isArray(question.wordCards)
      ? question.wordCards
      : Array.isArray(question.parts)
        ? question.parts.find(part => part?.layoutMode === 'word_completion' || part?.layoutMode === 'complete_words')?.wordCards || []
        : [];
    const items = Array.isArray(question.items)
      ? question.items
      : Array.isArray(question.parts)
        ? question.parts.find(part => part?.layoutMode === 'word_completion' || part?.layoutMode === 'complete_words')?.items || []
        : [];
    const itemById = new Map(items.map(item => [item.id, item]));

    if (!wordCards.length) return false;

    const valueMatches = wordCards.every((card) => {
      const placedItem = itemById.get(answerObject[card.id]);
      const placedValue = placedItem?.content ?? placedItem?.label ?? placedItem?.letter;
      return normalizeText(placedValue) === normalizeText(card.answer ?? card.initial);
    });

    if (valueMatches) return true;

    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      return objectMatches(answerObject, expected);
    }

    return false;
  }

  if (type === 'interactivetool') {
    return validateInteractiveToolAnswer(question, userAnswer);
  }

  if (type === 'mcq' || type === 'imagechoice' || type === 'multiplechoice' || type === 'visual_choice' || type === 'picture_mcq' || type === 'picture_choice' || type === 'audio_mcq' || type === 'multi_select' || type === 'msq' || type === 'hotspot_select' || type === 'hotspot') {
    const options = Array.isArray(question.options)
      ? question.options
      : (question?.options && typeof question.options === 'object' ? Object.values(question.options) : []);
    const optionKeys = Array.isArray(question.options)
      ? question.options.map((_, i) => i)
      : (question?.options && typeof question.options === 'object' ? Object.keys(question.options) : []);

    const getIndexFromAnswer = (val) => {
      if (val === null || val === undefined || val === '') return -1;
      const num = Number(val);
      if (Number.isFinite(num) && num >= 0 && num < optionKeys.length) {
        return num;
      }
      if (typeof val === 'string') {
        const idx = optionKeys.findIndex(k => String(k).toUpperCase() === val.toUpperCase());
        if (idx >= 0) return idx;
      }
      return -1;
    };

    const isMultiSelect = question.interaction === 'multi_select' || question.interaction === 'multi-choice' ||
      question.interaction?.engine === 'msq' || question.multiSelect === true ||
      (typeof question.interaction === 'object' && question.interaction?.inputMode === 'multi-choice') ||
      type === 'msq';

    if (isMultiSelect) {
      let correctIndices = options
        .map((opt, idx) => (opt?.isCorrect ? idx : null))
        .filter((idx) => idx !== null);

      if (correctIndices.length === 0) {
        const expected = question.correctAnswerIndices ?? question.answer ?? question.correctAnswerIndex ?? question.correctAnswer;
        if (Array.isArray(expected)) {
          correctIndices = expected.map(getIndexFromAnswer).filter(idx => idx >= 0);
        } else if (expected && typeof expected === 'object') {
          correctIndices = Object.entries(expected)
            .filter(([_, val]) => Boolean(val))
            .map(([key]) => getIndexFromAnswer(key))
            .filter(idx => idx >= 0);
        } else if (expected !== null && expected !== undefined && expected !== '') {
          correctIndices = [getIndexFromAnswer(expected)].filter(idx => idx >= 0);
        }
      }

      let selectedIndices = [];
      if (Array.isArray(userAnswer)) {
        selectedIndices = userAnswer.map(getIndexFromAnswer).filter(idx => idx >= 0);
      } else if (userAnswer && typeof userAnswer === 'object') {
        selectedIndices = Object.entries(userAnswer)
          .filter(([_, val]) => Boolean(val))
          .map(([key]) => getIndexFromAnswer(key))
          .filter(idx => idx >= 0);
      } else if (userAnswer !== null && userAnswer !== undefined && userAnswer !== '') {
        selectedIndices = [getIndexFromAnswer(userAnswer)].filter(idx => idx >= 0);
      }

      if (correctIndices.length !== selectedIndices.length) {
        return false;
      }

      const sortedCorrect = [...correctIndices].sort((a, b) => a - b);
      const sortedSelected = [...selectedIndices].sort((a, b) => a - b);
      return sortedCorrect.every((val, idx) => val === sortedSelected[idx]);
    }

    let selectedIndex = -1;
    if (typeof userAnswer === 'object' && userAnswer !== null) {
      selectedIndex = getIndexFromAnswer(userAnswer?.selectedIndex ?? userAnswer?.index);
    } else {
      selectedIndex = getIndexFromAnswer(userAnswer);
    }

    if (!Number.isFinite(selectedIndex) || selectedIndex < 0 || selectedIndex >= options.length) {
      return false;
    }

    const selectedOption = options[selectedIndex];
    if (selectedOption?.isCorrect) return true;

    const getOptionIndexFromKey = (val) => {
      if (val === null || val === undefined || val === '') return null;
      if (isNumericAnswer(val)) {
        const num = Number(val);
        if (Number.isInteger(num) && num >= 0 && num < options.length) return num;
      }
      if (typeof val === 'string') {
        const idx = optionKeys.findIndex(k => String(k).toUpperCase() === val.toUpperCase());
        if (idx >= 0) return idx;
      }
      return null;
    };

    const expectedIndices = [
      getOptionIndexFromKey(question.correctAnswerIndex),
      getOptionIndexFromKey(question.correct_answer_index),
      getOptionIndexFromKey(question.answer),
      getOptionIndexFromKey(question.correctAnswer),
      getOptionIndexFromKey(question.correctAnswerText),
      getOptionIndexFromKey(question.correctOption),
      getOptionIndexFromKey(question.correct_option),
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
