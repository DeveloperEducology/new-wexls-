import { createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

function hasRegrouping(a, b) {
  const strA = String(a).split('').reverse();
  const strB = String(b).split('').reverse();
  const len = Math.max(strA.length, strB.length);
  for (let i = 0; i < len; i += 1) {
    const digitA = Number(strA[i] || 0);
    const digitB = Number(strB[i] || 0);
    if (digitA < digitB) return true;
  }
  return false;
}

function buildSubtractionNumbers({ range, regrouping, random }) {
  if (typeof regrouping !== 'boolean') {
    const a = randInt(range.min, range.max, random);
    const b = randInt(range.min, a, random);
    return [a, b];
  }

  for (let attempt = 0; attempt < 240; attempt += 1) {
    const a = randInt(range.min, range.max, random);
    const b = randInt(range.min, a, random);
    if (hasRegrouping(a, b) === regrouping) {
      return [a, b];
    }
  }

  // Fallback if requested regrouping type cannot be satisfied in range
  const a = randInt(range.min, range.max, random);
  const b = randInt(range.min, a, random);
  return [a, b];
}

function verticalRangeForDifficulty(baseRange, difficulty, history = {}) {
  const normalizedDifficulty = String(difficulty || 'adaptive').toLowerCase();

  const skillMin = baseRange?.min ?? 10;
  const skillMax = baseRange?.max ?? 9999;
  const hasSkillRange = skillMin >= 100;

  if (normalizedDifficulty === 'easy') {
    return normalizeRange([skillMin, hasSkillRange ? skillMax : 99]);
  }
  if (normalizedDifficulty === 'medium') {
    return normalizeRange([hasSkillRange ? skillMin : 100, hasSkillRange ? skillMax : 999]);
  }
  if (normalizedDifficulty === 'hard') {
    return normalizeRange([hasSkillRange ? skillMin : 1000, hasSkillRange ? skillMax : 9999]);
  }

  const level = Math.min(5, Math.max(1, Number(history.practiceLevel || 1)));

  if (hasSkillRange) {
    const span = skillMax - skillMin;
    const step = Math.floor(span / 5);
    const adaptiveMin = skillMin + step * (level - 1);
    const adaptiveMax = level >= 5 ? skillMax : skillMin + step * level - 1;
    return normalizeRange([adaptiveMin, Math.max(adaptiveMin + 1, adaptiveMax)]);
  }

  if (level >= 5) return normalizeRange([1000, 9999]);
  if (level >= 3) return normalizeRange([100, 999]);
  return normalizeRange([10, 99]);
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

  const [a, b] = buildSubtractionNumbers({ range, regrouping: effectiveRegrouping, random });
  const difference = a - b;

  const unknownPosition = template.config?.unknownPosition || 'difference'; // 'minuend', 'subtrahend', 'difference'

  if (layout === 'vertical') {
    const width = Math.max(String(a).length, String(b).length, String(difference).length);
    const resultDigits = String(difference).split('');

    return {
      id: uid(),
      type: 'fillInTheBlank',
      questionText: 'Subtract.',
      parts: [
        { type: 'text', content: 'Subtract.', isVertical: true, style: { fontSize: '34px', fontWeight: 400, color: '#000' } },
        {
          type: 'arithmeticLayout',
          layout: {
            variant: 'verticalSubtractionReplica',
            rows: [
              { kind: 'number', text: ` ${String(a).padStart(width, ' ')}` },
              { kind: 'number', text: `-${String(b).padStart(width, ' ')}` },
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
      solution: {
        sections: [
          { type: 'text', content: `${a} − ${b} = ${difference}.` }
        ]
      },
      metadata: {
        topic: 'subtraction',
        templateId: template.id,
        engine: 'numbers',
        layout,
        a,
        b,
        difference,
        range,
        regrouping: effectiveRegrouping,
        difficultyStage: effectiveStage,
        practiceLevel: template.config?.history?.practiceLevel || 1
      }
    };
  }

  // Horizontal missing numbers or simple subtraction questions
  let content = '';
  let answerKey = 'ans';
  let expectedAnswer = '';

  if (unknownPosition === 'minuend') {
    content = `[blank:ans] − ${b} = ${difference}`;
    expectedAnswer = String(a);
  } else if (unknownPosition === 'subtrahend') {
    content = `${a} − [blank:ans] = ${difference}`;
    expectedAnswer = String(b);
  } else {
    content = `${a} − ${b} = [blank:ans]`;
    expectedAnswer = String(difference);
  }

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `${a} − ${b} =`,
    parts: [
      { type: 'text', content, isVertical: true, hasAudio: true }
    ],
    answer: { [answerKey]: expectedAnswer },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ [answerKey]: expectedAnswer }),
    solution: {
      sections: [
        { type: 'text', content: `${a} − ${b} = ${difference}.` }
      ]
    },
    metadata: {
      topic: 'subtraction',
      templateId: template.id,
      engine: 'numbers',
      layout,
      a,
      b,
      difference,
      unknownPosition,
      range
    }
  };
}
