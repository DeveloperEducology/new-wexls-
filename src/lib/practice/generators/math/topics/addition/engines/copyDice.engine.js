import { createSeededRandom, randInt, uid } from './shared.js';

const CUBE_PALETTES = [
  { fill: '#c45add', stroke: '#a83ac4' },
  { fill: '#5cc4c0', stroke: '#269b98' },
  { fill: '#f59e0b', stroke: '#d97706' },
  { fill: '#60a5fa', stroke: '#2563eb' },
  { fill: '#34d399', stroke: '#059669' },
  { fill: '#fb7185', stroke: '#e11d48' },
];

export function generateCopyDiceQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = template.config?.copyCountRange || [2, 5];
  const existingCount = Number(template.config?.prefilledCount ?? 1);
  const copyCount = randInt(Number(range[0] ?? 2), Number(range[1] ?? 5), random);
  const total = existingCount + copyCount;
  const firstPalette = CUBE_PALETTES[randInt(0, CUBE_PALETTES.length - 1, random)];
  let secondPalette = CUBE_PALETTES[randInt(0, CUBE_PALETTES.length - 1, random)];
  if (secondPalette.fill === firstPalette.fill) {
    secondPalette = CUBE_PALETTES[(CUBE_PALETTES.indexOf(firstPalette) + 1) % CUBE_PALETTES.length];
  }

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `Here is ${existingCount} cube. Add ${copyCount} more cubes.`,
    parts: [
      {
        type: 'text',
        content: `Here is ${existingCount} cube. Add ${copyCount} more cubes.`,
        isVertical: true,
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isCopiable: true,
        categories: [
          {
            id: 'cube_train',
            label: `Copy ${copyCount} cubes into the boxes`,
            requiredCount: copyCount,
            prefilledCount: existingCount,
            prefillColor: firstPalette.fill,
            prefillStroke: firstPalette.stroke,
          },
        ],
        items: [
          {
            id: 'purple_cube',
            content: 'Cube',
            visual: 'cube',
            color: secondPalette.fill,
            stroke: secondPalette.stroke,
          },
        ],
        answerKey: { cube_train: copyCount },
        isVertical: true,
      },
    ],
    answer: { cube_train: copyCount },
    correctAnswerText: JSON.stringify({ cube_train: copyCount }),
    solution: {
      sections: [
        { type: 'text', content: `Start with ${existingCount} cube.` },
        { type: 'text', content: `Copy ${copyCount} more cubes into the boxes.` },
        { type: 'text', content: `${existingCount} and ${copyCount} is ${total}.` },
      ],
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'copyDice',
      existingCount,
      copyCount,
      total,
    },
  };
}
