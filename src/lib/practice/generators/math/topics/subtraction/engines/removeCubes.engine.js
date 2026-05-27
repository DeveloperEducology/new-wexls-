import { createSeededRandom, randInt, uid } from './shared.js';

const PALETTES = [
  { fill: '#ff8a3d', stroke: '#e06013' }, // Orange
  { fill: '#5cc4c0', stroke: '#269b98' }, // Teal
  { fill: '#60a5fa', stroke: '#2563eb' }, // Blue
  { fill: '#34d399', stroke: '#059669' }, // Green
  { fill: '#fb7185', stroke: '#e11d48' }, // Pink
  { fill: '#c45add', stroke: '#a83ac4' }, // Purple
];

const OBJECTS = [
  { imageUrl: 'https://cdn-icons-png.flaticon.com/512/6363/6363577.png', singular: 'toy', plural: 'toys' },
  { imageUrl: 'https://cdn-icons-png.flaticon.com/512/5120/5120828.png', singular: 'item', plural: 'items' },
  { imageUrl: 'https://cdn-icons-png.flaticon.com/512/4191/4191509.png', singular: 'object', plural: 'objects' },
];

function objectWord(count, obj) {
  return count === 1 ? obj.singular : obj.plural;
}

export function generateRemoveCubesQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const startRange = template.config?.startRange || [3, 10];
  const removeRange = template.config?.removeRange || [1, 5];
  const startCount = randInt(Number(startRange[0] ?? 3), Number(startRange[1] ?? 10), random);
  const maxRemove = Math.min(startCount - 1, Number(removeRange[1] ?? 5));
  const minRemove = Math.min(maxRemove, Number(removeRange[0] ?? 1));
  const removeCount = randInt(minRemove, maxRemove, random);
  const remainingCount = startCount - removeCount;
  
  const palette = PALETTES[randInt(0, PALETTES.length - 1, random)];
  const obj = OBJECTS[randInt(0, OBJECTS.length - 1, random)];
  const isCube = template.config?.visual === 'cube' || template.config?.model === 'cubes';
  
  const startWord = isCube ? (startCount === 1 ? 'cube' : 'cubes') : objectWord(startCount, obj);
  const removeWord = isCube ? (removeCount === 1 ? 'cube' : 'cubes') : objectWord(removeCount, obj);
  
  const isWordProblem = template.config?.isWordProblem;
  let questionText;
  if (isWordProblem) {
    questionText = isCube 
      ? `Nina has ${startCount} cubes. She gives away ${removeCount} cubes. How many cubes does she have left?`
      : `Nina has ${startCount} ${startWord}. She gives away ${removeCount} ${removeWord}. How many ${objectWord(remainingCount, obj)} does she have left?`;
  } else {
    questionText = isCube
      ? `Start with ${startCount} cubes. Remove ${removeCount} cubes.`
      : `Start with ${startCount} ${startWord}. Remove ${removeCount} ${removeWord}.`;
  }

  const items = isCube ? [
    {
      id: 'cube_unit',
      content: 'cube',
      visual: 'cube',
      color: palette.fill,
      stroke: palette.stroke,
    }
  ] : [
    {
      id: 'cube',
      content: obj.singular,
      visual: 'image',
      imageUrl: obj.imageUrl,
      color: palette.fill,
      stroke: palette.stroke,
    }
  ];

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
        isRemoval: true,
        categories: [
          {
            id: 'cube_train',
            label: isCube ? '' : `Remove ${removeCount} ${removeWord}`,
            prefilledCount: startCount,
            removeCount,
            remainingCount,
            prefillColor: palette.fill,
            prefillStroke: palette.stroke,
          },
        ],
        items,
        answerKey: { cube_train: remainingCount },
        isVertical: true,
      },
      {
        type: 'text',
        content: `${startCount} - ${removeCount} = [[ans]]`,
        style: {
          marginTop: 24,
          fontSize: 'clamp(20px, 5vw, 24px)',
          fontWeight: 700,
          color: '#0f172a'
        }
      },
    ],
    answer: { cube_train: remainingCount, ans: String(remainingCount) },
    correctAnswerText: JSON.stringify({ cube_train: remainingCount, ans: String(remainingCount) }),
    solution: {
      sections: [
        { type: 'text', content: `Start with ${startCount} ${startWord}.` },
        { type: 'text', content: `Click exactly ${removeCount} ${removeWord} to cross them out.` },
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
