import { createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

const STORIES = [
  { name: 'apples', group: 'children', verb: 'shared equally among' },
  { name: 'stickers', group: 'pages', verb: 'divided equally into' },
  { name: 'toys', group: 'boxes', verb: 'packed equally into' }
];

export function generateWordProblemQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = normalizeRange(template.config?.range || [6, 50]); // range for the dividend

  // Generate quotient (q) and divisor (d) such that dividend (D = q * d) falls in the range
  const divisor = randInt(2, 6, random);
  const minQ = Math.max(2, Math.floor(range.min / divisor));
  const maxQ = Math.max(minQ, Math.floor(range.max / divisor));
  const quotient = randInt(minQ, maxQ, random);
  const dividend = divisor * quotient;

  const story = STORIES[Math.floor(random() * STORIES.length)];

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `If ${dividend} ${story.name} are ${story.verb} ${divisor} ${story.group}, how many ${story.name} in each?`,
    parts: [
      { type: 'text', content: 'Read the story.', hasAudio: true, isVertical: true },
      { type: 'text', content: `${dividend} ${story.name} are ${story.verb} ${divisor} ${story.group}.`, hasAudio: true, isVertical: true },
      { type: 'text', content: `Write the division sentence: ${dividend} ÷ ${divisor} = [blank:ans]`, isVertical: true, style: { fontSize: '24px', fontWeight: 700 } }
    ],
    answer: { ans: String(quotient) },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ ans: String(quotient) }),
    solution: {
      sections: [{ type: 'text', content: `Splitting ${dividend} into ${divisor} equal groups gives ${quotient} in each group. So, ${dividend} ÷ ${divisor} = ${quotient}.` }]
    },
    metadata: { topic: 'division', templateId: template.id, engine: 'wordProblem', dividend, divisor, quotient }
  };
}
