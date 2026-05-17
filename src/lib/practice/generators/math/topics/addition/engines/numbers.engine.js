import { createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

function sum(numbers) {
  return numbers.reduce((total, number) => total + number, 0);
}

function buildAddends({ range, addendCount, targetSum, random }) {
  if (addendCount === 3 && targetSum) {
    const pairMin = Math.max(range.min, targetSum - range.max);
    const pairMax = Math.min(range.max, targetSum - range.min);
    if (pairMin > pairMax) {
      return Array.from({ length: addendCount }, () => randInt(range.min, range.max, random));
    }
    const firstPair = randInt(pairMin, pairMax, random);
    const secondPair = targetSum - firstPair;
    const thirdMax = Math.max(range.min, Math.min(range.max, targetSum - 1));
    const third = randInt(range.min, thirdMax, random);
    const addends = [third, firstPair, secondPair];

    if (random() < 0.5) {
      return [firstPair, secondPair, third];
    }

    return addends;
  }

  return Array.from({ length: addendCount }, () => randInt(range.min, range.max, random));
}

function hasRegrouping(addends) {
  const maxDigits = Math.max(...addends.map((addend) => String(addend).length));

  for (let place = 0; place < maxDigits; place += 1) {
    const columnTotal = addends.reduce((total, addend) => {
      const digit = Math.floor(addend / (10 ** place)) % 10;
      return total + digit;
    }, 0);

    if (columnTotal >= 10) return true;
  }

  return false;
}

function buildVerticalAddends({ range, addendCount, regrouping, targetSum, random }) {
  if (addendCount !== 2 || typeof regrouping !== 'boolean' || targetSum) {
    return buildAddends({ range, addendCount, targetSum, random });
  }

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const addends = buildAddends({ range, addendCount, targetSum, random });
    if (hasRegrouping(addends) === regrouping) return addends;
  }

  return buildAddends({ range, addendCount, targetSum, random });
}

function verticalRangeForDifficulty(baseRange, difficulty, history = {}) {
  const normalizedDifficulty = String(difficulty || 'adaptive').toLowerCase();

  if (normalizedDifficulty === 'easy') return normalizeRange([10, 99]);
  if (normalizedDifficulty === 'medium') return normalizeRange([100, 999]);
  if (normalizedDifficulty === 'hard') return normalizeRange([1000, 9999]);

  const level = Math.min(5, Math.max(1, Number(history.practiceLevel || 1)));
  if (level >= 5) return normalizeRange([1000, 9999]);
  if (level >= 3) return normalizeRange([100, 999]);
  return normalizeRange([10, 99]) || baseRange;
}

function verticalRegroupingForDifficulty(defaultRegrouping, difficulty, history = {}) {
  const normalizedDifficulty = String(difficulty || 'adaptive').toLowerCase();
  if (normalizedDifficulty !== 'adaptive') return defaultRegrouping;

  const level = Math.min(5, Math.max(1, Number(history.practiceLevel || 1)));
  if (level === 1) return false;
  if (level === 2) return true;
  if (level === 3) return false;
  return true;
}

function verticalStageForConfig(difficulty, history = {}) {
  const normalizedDifficulty = String(difficulty || 'adaptive').toLowerCase();
  if (normalizedDifficulty !== 'adaptive') return normalizedDifficulty;

  const level = Math.min(5, Math.max(1, Number(history.practiceLevel || 1)));
  if (level <= 2) return 'easy';
  if (level <= 4) return 'medium';
  return 'hard';
}

function findTargetPair(addends, targetSum) {
  if (!targetSum) return null;
  for (let i = 0; i < addends.length; i += 1) {
    for (let j = i + 1; j < addends.length; j += 1) {
      if (addends[i] + addends[j] === targetSum) {
        return { indices: [i, j], values: [addends[i], addends[j]] };
      }
    }
  }
  return null;
}

function expression(addends) {
  return addends.join(' + ');
}

function buildMakeTargetSolution(addends, targetSum, total) {
  const pair = findTargetPair(addends, targetSum);
  if (!pair) {
    return [{ type: 'text', content: `${expression(addends)} = ${total}.` }];
  }

  const remaining = addends.find((_, index) => !pair.indices.includes(index));
  const [firstPair, secondPair] = pair.values;

  return [
    { type: 'text', content: `Hint: Start by adding two of the numbers to make a ${targetSum}.` },
    { type: 'text', content: `First, add ${firstPair} and ${secondPair} to make a ${targetSum}:` },
    { type: 'text', content: `${expression(addends)} = ?` },
    { type: 'text', content: `${remaining} + ${targetSum} = ?` },
    { type: 'text', content: `Now add ${remaining} and ${targetSum}:` },
    { type: 'text', content: `${remaining} + ${targetSum} = ${total}` },
    { type: 'text', content: `The sum is ${total}.` }
  ];
}

export function generateNumbersQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const layout = template.config?.layout || 'horizontal';
  const baseRange = normalizeRange(template.config?.range || [1, 9]);
  const effectiveRegrouping = layout === 'vertical'
    ? verticalRegroupingForDifficulty(template.config?.regrouping, template.config?.difficulty, template.config?.history)
    : template.config?.regrouping;
  const effectiveStage = layout === 'vertical'
    ? verticalStageForConfig(template.config?.difficulty, template.config?.history)
    : template.config?.difficulty;
  const range = layout === 'vertical'
    ? verticalRangeForDifficulty(baseRange, template.config?.difficulty, template.config?.history)
    : baseRange;
  const addendCount = Number(template.config?.addendCount || 2);
  const targetSum = template.config?.targetSum ? Number(template.config.targetSum) : null;
  const addends = layout === 'vertical'
    ? buildVerticalAddends({
      range,
      addendCount,
      targetSum,
      regrouping: effectiveRegrouping,
      random
    })
    : buildAddends({ range, addendCount, targetSum, random });
  const total = sum(addends);
  const [a, b] = addends;
  const shouldShowStrategy = addendCount === 3 && Boolean(findTargetPair(addends, targetSum));

  if (layout === 'vertical') {
    const width = Math.max(...addends.map((addend) => String(addend).length), String(total).length);
    const resultDigits = String(total).split('');
    return {
      id: uid(),
      type: 'fillInTheBlank',
      questionText: 'Add.',
      parts: [
        { type: 'text', content: 'Add.', isVertical: true, style: { fontSize: '34px', fontWeight: 400, color: '#000' } },
        {
          type: 'arithmeticLayout',
          layout: {
            variant: 'verticalAdditionReplica',
            rows: [
              ...addends.map((addend, index) => ({
                kind: 'number',
                text: `${index === addends.length - 1 ? '+' : ' '}${String(addend).padStart(width, ' ')}`
              })),
              { kind: 'divider' },
              {
                kind: 'answer',
                variant: 'joined',
                cells: resultDigits.map((digit, idx) => ({ id: `ans_${idx}`, type: 'digit', expected: digit }))
              }
            ]
          }
        }
      ],
      answer: Object.fromEntries(resultDigits.map((digit, idx) => [`ans_${idx}`, digit])),
      correctAnswerIndex: null,
      correctAnswerText: JSON.stringify(Object.fromEntries(resultDigits.map((digit, idx) => [`ans_${idx}`, digit]))),
      solution: { sections: shouldShowStrategy ? buildMakeTargetSolution(addends, targetSum, total) : [{ type: 'text', content: `${expression(addends)} = ${total}.` }] },
      metadata: {
        topic: 'addition',
        templateId: template.id,
        engine: 'numbers',
        layout,
        a,
        b,
        addends,
        addendCount,
        targetSum,
        total,
        range,
        regrouping: effectiveRegrouping,
        difficultyStage: effectiveStage,
        practiceLevel: template.config?.history?.practiceLevel || 1
      }
    };
  }

  if (!shouldShowStrategy) {
    return {
      id: uid(),
      type: 'fillInTheBlank',
      questionText: `${expression(addends)} =`,
      parts: [
        { type: 'text', content: `${expression(addends)} = [blank:ans]`, isVertical: true, hasAudio: true }
      ],
      answer: { ans: String(total) },
      correctAnswerIndex: null,
      correctAnswerText: JSON.stringify({ ans: String(total) }),
      solution: { sections: [{ type: 'text', content: `${expression(addends)} = ${total}.` }] },
      metadata: { topic: 'addition', templateId: template.id, engine: 'numbers', layout, a, b, addends, addendCount, targetSum, total, range }
    };
  }

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: 'Add:',
    parts: [
      { type: 'text', content: 'Add:', isVertical: true, hasAudio: true, style: { fontSize: '34px', fontWeight: 400, color: '#000', textAlign: 'left', width: '100%' } },
      { type: 'text', content: `${expression(addends)} = [blank:ans]`, isVertical: true, style: { fontSize: '34px', fontWeight: 400, color: '#000', textAlign: 'left', width: '100%', paddingLeft: 40 } }
    ],
    answer: { ans: String(total) },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ ans: String(total) }),
    solution: { sections: buildMakeTargetSolution(addends, targetSum, total) },
    metadata: { topic: 'addition', templateId: template.id, engine: 'numbers', layout, a, b, addends, addendCount, targetSum, total, range }
  };
}
