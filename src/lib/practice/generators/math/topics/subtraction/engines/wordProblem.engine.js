import { createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

const STORIES = [
  { name: 'Maya', item: ['sticker', 'stickers'], action: 'gives away' },
  { name: 'Deb', item: ['doll', 'dolls'], action: 'loses' },
  { name: 'Nina', item: ['block', 'blocks'], action: 'lends Sam' }
];

const plural = (count, forms) => (count === 1 ? forms[0] : forms[1]);

export function generateWordProblemQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = normalizeRange(template.config?.range || [1, 20]);
  
  // Make sure we generate first > second so subtraction remains non-negative and non-zero
  const first = randInt(Math.max(2, range.min), range.max, random);
  const second = randInt(1, first - 1, random);
  const total = first - second;
  const story = STORIES[Math.floor(random() * STORIES.length)];

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `${story.name} has ${first} ${plural(first, story.item)}. She ${story.action} ${second} ${plural(second, story.item)}.`,
    parts: [
      { type: 'text', content: 'Read the story.', hasAudio: true, isVertical: true },
      { type: 'text', content: `${story.name} has ${first} ${plural(first, story.item)}.`, hasAudio: true, isVertical: true },
      { type: 'text', content: `She ${story.action} ${second} ${plural(second, story.item)}.`, hasAudio: true, isVertical: true },
      { type: 'text', content: `Write the subtraction sentence: ${first} − ${second} = [blank:ans]`, isVertical: true, style: { fontSize: '24px', fontWeight: 700 } }
    ],
    answer: { ans: String(total) },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ ans: String(total) }),
    solution: { sections: [{ type: 'text', content: `${story.name} started with ${first} and gave/lost ${second}, so ${first} − ${second} = ${total}.` }] },
    metadata: { topic: 'subtraction', templateId: template.id, engine: 'wordProblem', first, second, total, range }
  };
}
