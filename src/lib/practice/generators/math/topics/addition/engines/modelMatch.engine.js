import { buildCubeTrainSvg, createSeededRandom, cubeWord, normalizeRange, randInt, uid } from './shared.js';

export function generateModelMatchQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = normalizeRange(template.config?.range || [1, 10]);
  const maxTotal = Math.min(10, range.max);
  const total = randInt(Math.max(3, range.min), maxTotal, random);
  const first = randInt(1, total - 1, random);
  const second = total - first;
  const moveOneFromFirst = first > 1;
  const distractorFirst = moveOneFromFirst ? first - 1 : first + 1;
  const distractorSecond = moveOneFromFirst ? second + 1 : second - 1;
  const label = (count, color) => `${count} ${color} ${cubeWord(count)}`;

  const options = [
    {
      id: 'opt_correct',
      label: `${label(first, 'yellow')} and ${label(second, 'blue')}`,
      content: buildCubeTrainSvg({ firstCount: first, secondCount: second, large: true }),
      isCorrect: true
    },
    {
      id: 'opt_distractor',
      label: `${label(distractorFirst, 'yellow')} and ${label(distractorSecond, 'blue')}`,
      content: buildCubeTrainSvg({ firstCount: distractorFirst, secondCount: distractorSecond, large: true }),
      isCorrect: false
    }
  ];

  if (random() < 0.5) options.reverse();

  const questionText = `Which shows ${first} + ${second} = ${total}?`;
  return {
    id: uid(),
    type: 'mcq',
    questionText,
    question_text: questionText,
    hasAudio: true,
    isGrid: true,
    layoutConfig: {
      variant: 'modelMatch',
      columns: 2
    },
    parts: [{ type: 'text', content: questionText, hasAudio: true, isVertical: true }],
    options,
    answer: options.find((option) => option.isCorrect)?.id || 'opt_correct',
    correctAnswerIndex: options.findIndex((option) => option.isCorrect),
    solution: {
      sections: [
        { type: 'text', content: `This shows ${label(first, 'yellow')} and ${label(second, 'blue')}.` },
        { type: 'text', content: `There are ${total} cubes in all.` },
        { type: 'text', content: `These cubes show ${first} + ${second} = ${total}.` }
      ]
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'modelMatch',
      first,
      second,
      total,
      range
    }
  };
}
