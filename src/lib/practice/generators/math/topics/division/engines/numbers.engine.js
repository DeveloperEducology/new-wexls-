import { createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

export function generateNumbersQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const baseRange = normalizeRange(template.config?.range || [4, 100]); // dividend range
  const supportRemainder = Boolean(template.config?.supportRemainder);
  const fixedDivisor = template.config?.fixedDivisor;
  const divisorRange = template.config?.divisorRange;

  let divisor, quotient, dividend, remainder = 0;

  if (fixedDivisor !== undefined && fixedDivisor !== null) {
    divisor = Number(fixedDivisor);
    const minQ = Math.max(1, Math.floor(baseRange.min / divisor));
    const maxQ = Math.max(minQ, Math.floor(baseRange.max / divisor));
    quotient = randInt(minQ, maxQ, random);
    dividend = divisor * quotient;
  } else if (divisorRange && Array.isArray(divisorRange)) {
    const minD = Number(divisorRange[0] ?? 10);
    const maxD = Number(divisorRange[1] ?? 25);
    divisor = randInt(minD, maxD, random);
    const minQ = Math.max(1, Math.floor(baseRange.min / divisor));
    const maxQ = Math.max(minQ, Math.floor(baseRange.max / divisor));
    quotient = randInt(minQ, maxQ, random);
    dividend = divisor * quotient;
  } else {
    // Choose a divisor from 2 up to sqrt of max dividend (bounded between 2 and 12 for basic facts, or higher for multidigit)
    const maxDiv = Math.min(12, Math.max(2, Math.floor(Math.sqrt(baseRange.max))));
    divisor = randInt(2, maxDiv, random);
    const minQ = Math.max(1, Math.floor(baseRange.min / divisor));
    const maxQ = Math.max(minQ, Math.floor(baseRange.max / divisor));
    quotient = randInt(minQ, maxQ, random);
    dividend = divisor * quotient;
  }

  if (supportRemainder) {
    if (divisor > 1) {
      remainder = randInt(1, divisor - 1, random);
      dividend += remainder;
    }
  }

  const isFacts = baseRange.max <= 100 && !supportRemainder;

  let questionText = 'Divide.';
  let parts = [];
  let answer = {};

  if (supportRemainder) {
    parts = [
      {
        type: 'text',
        content: `${dividend} ÷ ${divisor} = [blank:q] R [blank:r]`,
        isVertical: true,
        hasAudio: true
      }
    ];
    answer = { q: String(quotient), r: String(remainder) };
  } else {
    parts = [
      {
        type: 'text',
        content: `${dividend} ÷ ${divisor} = [blank:ans]`,
        isVertical: true,
        hasAudio: true
      }
    ];
    answer = { ans: String(quotient) };
  }

  const solutionText = supportRemainder
    ? `${dividend} ÷ ${divisor} = ${quotient} with a remainder of ${remainder}.`
    : `${dividend} ÷ ${divisor} = ${quotient} because ${divisor} × ${quotient} = ${dividend}.`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts,
    answer,
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify(answer),
    solution: {
      sections: [{ type: 'text', content: solutionText }]
    },
    metadata: {
      topic: 'division',
      templateId: template.id,
      engine: 'numbers',
      dividend,
      divisor,
      quotient,
      remainder,
      supportRemainder,
      isFacts,
      range: baseRange
    }
  };
}
