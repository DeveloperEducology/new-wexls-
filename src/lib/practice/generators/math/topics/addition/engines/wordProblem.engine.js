import { buildCubeTrainSvg, createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

const STORIES = [
  { name: 'Maya', item: ['sticker', 'stickers'], second: 'Leo gives her' },
  { name: 'Deb', item: ['doll', 'dolls'], second: 'Her brother has' },
  { name: 'Nina', item: ['block', 'blocks'], second: 'Sam has' }
];

const plural = (count, forms) => (count === 1 ? forms[0] : forms[1]);

export function generateWordProblemQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = normalizeRange(template.config?.range || [1, 9]);
  const maxTotal = Math.min(10, range.max);
  const first = randInt(1, Math.max(1, maxTotal - 1), random);
  const second = randInt(1, Math.max(1, maxTotal - first), random);
  const total = first + second;
  const story = STORIES[Math.floor(random() * STORIES.length)];

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `${story.name} has ${first} ${plural(first, story.item)}. ${story.second} ${second} ${plural(second, story.item)}.`,
    parts: [
      { type: 'text', content: 'Read the story.', hasAudio: true, isVertical: true },
      { type: 'text', content: `${story.name} has ${first} ${plural(first, story.item)}.`, hasAudio: true, isVertical: true },
      { type: 'text', content: `${story.second} ${second} ${plural(second, story.item)}.`, hasAudio: true, isVertical: true },
      {
        type: 'svg',
        content: buildCubeTrainSvg({ firstCount: first, secondCount: second, large: true }),
        isVertical: true,
        style: { maxWidth: '620px', margin: '14px 0' }
      },
      { type: 'text', content: `Write the addition sentence: ${first} + ${second} = [blank:ans]`, isVertical: true, style: { fontSize: '24px', fontWeight: 700 } }
    ],
    answer: { ans: String(total) },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ ans: String(total) }),
    solution: { sections: [{ type: 'text', content: `The story shows ${first} and ${second}, so ${first} + ${second} = ${total}.` }] },
    metadata: { topic: 'addition', templateId: template.id, engine: 'wordProblem', first, second, total, range }
  };
}
