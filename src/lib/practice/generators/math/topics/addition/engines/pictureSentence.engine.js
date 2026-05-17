import { buildCubeTrainSvg, createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

function makeSentence(first, second) {
  return `${first} + ${second} = ${first + second}`;
}

function makeDistractor(first, second, random) {
  const total = first + second;
  const variants = [
    [Math.max(1, first - 1), second],
    [first, Math.max(1, second - 1)],
    [second, first],
    [Math.max(1, total - 1), 1],
    [1, Math.max(1, total - 1)],
  ].filter(([a, b]) => a + b !== total || a !== first || b !== second);

  const picked = variants[Math.floor(random() * variants.length)] || [first, Math.max(1, second - 1)];
  const wrongTotal = picked[0] + picked[1] === total ? Math.max(1, total - 1) : picked[0] + picked[1];
  return `${picked[0]} + ${picked[1]} = ${wrongTotal}`;
}

export function generatePictureSentenceQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = normalizeRange(template.config?.range || [1, 5]);
  const maxTotal = Math.min(5, range.max);
  const total = randInt(Math.max(2, range.min), maxTotal, random);
  const first = randInt(1, total - 1, random);
  const second = total - first;
  const correctSentence = makeSentence(first, second);

  const options = [
    { id: 'opt_correct', label: correctSentence, value: correctSentence, isCorrect: true },
    { id: 'opt_distractor', label: makeDistractor(first, second, random), value: 'distractor', isCorrect: false },
  ];

  if (random() < 0.5) options.reverse();

  const questionText = 'Which addition sentence does the picture show?';

  return {
    id: uid(),
    type: 'mcq',
    questionText,
    question_text: questionText,
    hasAudio: true,
    isGrid: true,
    layoutConfig: {
      variant: 'pictureSentence',
      columns: 2,
    },
    parts: [
      {
        type: 'svg',
        content: buildCubeTrainSvg({
          firstCount: first,
          secondCount: second,
          firstColor: template.config?.colors?.[0] || '#ff7f2a',
          firstAccent: '#d95f13',
          secondColor: template.config?.colors?.[1] || '#14b8b2',
          secondAccent: '#0f8f8a',
          large: true,
          showFrame: false,
        }),
        isVertical: true,
        style: {
          maxWidth: '560px',
          margin: '8px 0 8px',
          justifyContent: 'flex-start',
          alignSelf: 'flex-start',
        },
      },
    ],
    options,
    answer: options.findIndex((option) => option.isCorrect),
    correctAnswerIndex: options.findIndex((option) => option.isCorrect),
    solution: {
      sections: [
        { type: 'text', content: `The picture shows ${first} cube${first === 1 ? '' : 's'} and ${second} more cube${second === 1 ? '' : 's'}.` },
        { type: 'text', content: `So the addition sentence is ${correctSentence}.` },
      ],
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'pictureSentence',
      first,
      second,
      total,
      range,
    },
  };
}
