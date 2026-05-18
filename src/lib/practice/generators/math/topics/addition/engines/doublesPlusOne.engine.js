import { createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

function pickTarget(range, random) {
  const min = Math.max(2, range.min);
  const max = Math.max(min, range.max);
  return randInt(min, max, random);
}

export function generateDoublesPlusOneQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = normalizeRange(template.config?.targetRange || template.config?.range || [2, 20]);
  const target = Number(template.config?.target || variables.target) || pickTarget(range, random);
  const isOdd = target % 2 === 1;
  const half = Math.floor(target / 2);
  const parity = target % 2 === 0 ? 'even' : 'odd';
  const factName = isOdd ? 'doubles-plus-one' : 'doubles';
  const expressionText = isOdd
    ? `${target} = [[left]] + [[right]] + 1`
    : `${target} = [[left]] + [[right]]`;
  const answer = { left: String(half), right: String(half), parity };

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `Complete the ${factName} fact for ${target}.`,
    parts: [
      {
        type: 'text',
        content: `Complete the ${factName} fact for ${target}.`,
        isVertical: true,
        hasAudio: true,
        style: {
          textAlign: 'left',
          width: '100%',
          fontSize: 28,
          fontWeight: 400,
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
        },
      },
      {
        type: 'text',
        content: expressionText,
        isVertical: true,
        style: {
          textAlign: 'left',
          width: '100%',
          paddingLeft: 44,
          fontSize: 26,
          fontWeight: 400,
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
        },
      },
      {
        type: 'text',
        content: `Is ${target} even or odd?`,
        isVertical: true,
        hasAudio: true,
        style: {
          textAlign: 'left',
          width: '100%',
          fontSize: 28,
          fontWeight: 400,
          color: '#000000',
          fontFamily: 'Arial, Helvetica, sans-serif',
        },
      },
      {
        type: 'option_select',
        id: 'parity',
        options: [
          { label: 'even', value: 'even' },
          { label: 'odd', value: 'odd' },
        ],
        isVertical: true,
        style: {
          paddingLeft: 44,
        },
      },
    ],
    answer,
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify(answer),
    solution: {
      sections: [
        { type: 'text', content: 'An even number can be split into two equal groups.' },
        { type: 'text', content: 'An odd number cannot be split into two equal groups. There is always one left over.' },
        {
          type: 'text',
          content: isOdd
            ? `${target} has two equal groups of ${half} with 1 left over.`
            : `${target} has two equal groups of ${half}.`,
        },
        {
          type: 'text',
          content: isOdd
            ? `So, ${target} = ${half} + ${half} + 1, and ${target} is ${parity}.`
            : `So, ${target} = ${half} + ${half}, and ${target} is ${parity}.`,
        },
      ],
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'doublesPlusOne',
      target,
      half,
      parity,
      factName,
      range,
    },
  };
}
