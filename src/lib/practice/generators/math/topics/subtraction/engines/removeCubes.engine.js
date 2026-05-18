import { createSeededRandom, cubeWord, randInt, uid } from './shared.js';

const CUBE_PALETTES = [
  { fill: '#5cc4c0', stroke: '#269b98' },
  { fill: '#60a5fa', stroke: '#2563eb' },
  { fill: '#34d399', stroke: '#059669' },
  { fill: '#f59e0b', stroke: '#d97706' },
  { fill: '#fb7185', stroke: '#e11d48' },
  { fill: '#c45add', stroke: '#a83ac4' },
];

export function generateRemoveCubesQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const startRange = template.config?.startRange || [3, 10];
  const removeRange = template.config?.removeRange || [1, 5];
  const startCount = randInt(Number(startRange[0] ?? 3), Number(startRange[1] ?? 10), random);
  const maxRemove = Math.min(startCount - 1, Number(removeRange[1] ?? 5));
  const minRemove = Math.min(maxRemove, Number(removeRange[0] ?? 1));
  const removeCount = randInt(minRemove, maxRemove, random);
  const remainingCount = startCount - removeCount;
  const palette = CUBE_PALETTES[randInt(0, CUBE_PALETTES.length - 1, random)];

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `Start with ${startCount} ${cubeWord(startCount)}. Remove ${removeCount} ${cubeWord(removeCount)}.`,
    parts: [
      {
        type: 'text',
        content: `Start with ${startCount} ${cubeWord(startCount)}. Remove ${removeCount} ${cubeWord(removeCount)}.`,
        isVertical: true,
      },
      {
        type: 'copy_drag_drop',
        prompt: '',
        isRemoval: true,
        categories: [
          {
            id: 'cube_train',
            label: `Remove ${removeCount} ${cubeWord(removeCount)} from the row`,
            prefilledCount: startCount,
            removeCount,
            remainingCount,
            prefillColor: palette.fill,
            prefillStroke: palette.stroke,
          },
        ],
        items: [
          {
            id: 'cube',
            content: 'Cube',
            visual: 'cube',
            color: palette.fill,
            stroke: palette.stroke,
          },
        ],
        answerKey: { cube_train: remainingCount },
        isVertical: true,
      },
      {
        type: 'text',
        content: `${startCount} - ${removeCount} = [[ans]]`,
        isVertical: true,
      },
    ],
    answer: { cube_train: remainingCount, ans: String(remainingCount) },
    correctAnswerText: JSON.stringify({ cube_train: remainingCount, ans: String(remainingCount) }),
    solution: {
      sections: [
        { type: 'text', content: `Start with ${startCount} ${cubeWord(startCount)}.` },
        { type: 'text', content: `Remove ${removeCount} ${cubeWord(removeCount)}.` },
        { type: 'text', content: `${startCount} - ${removeCount} = ${remainingCount}.` },
      ],
    },
    metadata: {
      topic: 'subtraction',
      templateId: template.id,
      engine: 'removeCubes',
      startCount,
      removeCount,
      remainingCount,
    },
  };
}
