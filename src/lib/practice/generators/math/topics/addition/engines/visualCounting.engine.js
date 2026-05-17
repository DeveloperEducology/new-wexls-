import { buildCubeTrainSvg, createSeededRandom, normalizeRange, randInt, uid } from './shared.js';

export function generateVisualCountingQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = normalizeRange(template.config?.range || [1, 9]);
  const maxTotal = Math.min(10, range.max);
  const first = randInt(1, Math.max(1, maxTotal - 1), random);
  const second = randInt(1, Math.max(1, maxTotal - first), random);
  const total = first + second;

  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText: `Add ${first} and ${second}.`,
    parts: [
      { type: 'text', content: `Add ${first} and ${second}.`, hasAudio: true, isVertical: true },
      {
        type: 'svg',
        content: buildCubeTrainSvg({ firstCount: first, secondCount: second, large: true }),
        isVertical: true,
        style: { maxWidth: '620px', margin: '14px 0' }
      },
      { type: 'text', content: `${first} + ${second} = [blank:ans]`, isVertical: true, style: { fontSize: '26px', fontWeight: 700 } }
    ],
    answer: { ans: String(total) },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ ans: String(total) }),
    solution: { sections: [{ type: 'text', content: `Count all cubes. There are ${total} cubes.` }] },
    metadata: { topic: 'addition', templateId: template.id, engine: 'visualCounting', first, second, total, range }
  };
}
