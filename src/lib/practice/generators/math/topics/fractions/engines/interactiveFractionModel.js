import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';

let uidCounter = 0;
const uid = () => `${Date.now()}_${++uidCounter}`;

const SHAPE_LABELS = {
  pie: 'circle',
  square: 'square',
  rectangle: 'rectangle',
  bar: 'fraction bar',
};

const PALETTES = [
  { fillColor: '#bbf7d0', strokeColor: '#16a34a' },
  { fillColor: '#bfdbfe', strokeColor: '#2563eb' },
  { fillColor: '#fde68a', strokeColor: '#d97706' },
  { fillColor: '#e9d5ff', strokeColor: '#9333ea' },
];

function pickOne(values, random) {
  return values[Math.floor(random() * values.length)];
}

export function interactiveFractionModelEngine(config = {}) {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config;
  const params = {
    ...engineParams,
    ...variables,
    ...(adaptiveConfig.variables || {}),
  };

  const seed = params.seed || `interactive_fraction_${Date.now()}`;
  const random = createSeededRandom(seed);
  const model = params.model || 'pie';
  const interaction = params.interaction || 'remove';
  const denominatorPool = params.denominatorPool || [3, 4, 5, 6, 8];
  const denominator = Number(params.denominator || pickOne(denominatorPool, random));
  const numeratorMax = Math.max(1, denominator - 1);
  const numerator = Number(params.numerator || getRandomInt(1, numeratorMax, random));
  const palette = PALETTES[Math.floor(random() * PALETTES.length)];
  const shapeLabel = SHAPE_LABELS[model] || 'shape';
  const actionText = interaction === 'fill' ? 'Fill' : 'Remove';
  const answerKey = interaction === 'fill' ? 'filledCount' : 'removedCount';
  const questionText = params.questionText || `${actionText} ${numerator}/${denominator} of the ${shapeLabel}.`;

  return {
    id: `q_frac_remove_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true,
      },
      {
        type: 'interactive_fraction_model',
        model,
        interaction,
        numerator,
        denominator,
        removeCount: numerator,
        fillCount: numerator,
        totalParts: denominator,
        answerKey,
        fillColor: palette.fillColor,
        strokeColor: palette.strokeColor,
        size: model === 'bar' ? 220 : 300,
        isVertical: true,
      },
    ],
    answer: {
      [answerKey]: String(numerator),
    },
    correctAnswerText: JSON.stringify({ [answerKey]: String(numerator) }),
    validation: {
      type: 'exact',
      answer: { [answerKey]: String(numerator) },
    },
    solution: {
      sections: [
        {
          type: 'text',
          content: `The denominator ${denominator} means the ${shapeLabel} is split into ${denominator} equal parts.`,
        },
        {
          type: 'text',
          content: `The numerator ${numerator} means ${interaction === 'fill' ? 'fill' : 'remove'} ${numerator} part${numerator === 1 ? '' : 's'}.`,
        },
      ],
    },
    metadata: {
      topic: 'fractions',
      templateId: `fractions.visual.remove.${model}`,
      engine: 'interactiveFractionModel',
      model,
      numerator,
      denominator,
      interaction,
    },
    adaptiveConfig: {
      logic_type: params.logic_type || adaptiveConfig.logic_type,
      variables: {
        model,
        numerator,
        denominator,
        seed,
      },
    },
  };
}
