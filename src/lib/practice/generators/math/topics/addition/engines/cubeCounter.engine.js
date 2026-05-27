import { createSeededRandom, randInt, uid } from './shared.js';

const CUBE_COLOR_PAIRS = [
  { prefill: { fill: '#ff8a3d', stroke: '#e06013' }, added: { fill: '#c45add', stroke: '#a83ac4' } }, // Orange & Purple (screenshot match)
  { prefill: { fill: '#06b6d4', stroke: '#0e7490' }, added: { fill: '#f97316', stroke: '#c2410c' } }, // Cyan & Orange
  { prefill: { fill: '#eab308', stroke: '#a16207' }, added: { fill: '#3b82f6', stroke: '#1d4ed8' } }, // Yellow & Blue
  { prefill: { fill: '#22c55e', stroke: '#15803d' }, added: { fill: '#ec4899', stroke: '#be185d' } }, // Green & Pink
];

export function generateCubeCounterQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = template.config?.range || [5, 10];
  const minTarget = Number(range[0] ?? 5);
  const maxTarget = Number(range[1] ?? 10);
  
  // Support sums up to 20 dynamically with clean responsive scaling
  const sum = randInt(minTarget, Math.min(20, maxTarget), random);
  const A = randInt(1, Math.min(15, sum - 1), random);
  const B = sum - A;

  const pair = CUBE_COLOR_PAIRS[randInt(0, CUBE_COLOR_PAIRS.length - 1, random)];

  const questionText = `Here are ${A} cubes. Add ${B} more cubes.`;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true,
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isCopiable: true,
        categories: [
          {
            id: 'cube_train',
            label: '', // Falsy/empty label hides the category title header completely
            requiredCount: B,
            prefilledCount: A,
            prefillColor: pair.prefill.fill,
            prefillStroke: pair.prefill.stroke,
          },
        ],
        items: [
          {
            id: 'cube_unit',
            content: 'Cube',
            visual: 'cube',
            color: pair.added.fill,
            stroke: pair.added.stroke,
          },
        ],
        answerKey: { cube_train: B },
        isVertical: true,
      },
      {
        type: 'text',
        content: `Add.\n\n${A} + ${B} = [[ans]]`,
        style: {
          marginTop: 24,
          fontSize: 'clamp(20px, 5vw, 24px)',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: { cube_train: B, ans: sum },
    correctAnswerText: JSON.stringify({ cube_train: B, ans: sum }),
    solution: {
      sections: [
        { type: 'text', content: `Click the block below the container to add cubes. Add exactly ${B} cubes to make ${sum} cubes total, and type ${sum} in the input box.` }
      ]
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'cubeCounter',
      A,
      B,
      sum,
      range
    }
  };
}
