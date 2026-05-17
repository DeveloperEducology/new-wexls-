import { createSeededRandom, randInt, uid } from './shared.js';

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function makePairForTarget(target, random) {
  const first = randInt(1, target - 1, random);
  return [first, target - first];
}

function uniqueWrongPair(target, used, random, minTarget, maxTarget) {
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const offset = (random() < 0.5 ? -1 : 1) * randInt(1, 3, random);
    const wrongTarget = Math.min(maxTarget, Math.max(minTarget, target + offset));
    const first = randInt(1, wrongTarget - 1, random);
    const key = `${first}+${wrongTarget - first}`;
    if (!used.has(key) && wrongTarget !== target) return [first, wrongTarget - first];
  }
  return [1, Math.max(1, target)];
}

export function generateMakeNumberQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = template.config?.targetRange || [3, 20];
  const minTarget = Number(range[0] || 3);
  const maxTarget = Number(range[1] || 20);
  const target = randInt(minTarget, maxTarget, random);
  const correctPair = makePairForTarget(target, random);
  const used = new Set([`${correctPair[0]}+${correctPair[1]}`]);
  const options = [
    {
      id: 'opt_correct',
      label: `${correctPair[0]} + ${correctPair[1]}`,
      isCorrect: true,
    },
  ];

  while (options.length < 4) {
    const pair = uniqueWrongPair(target, used, random, minTarget, maxTarget);
    const key = `${pair[0]}+${pair[1]}`;
    if (used.has(key)) continue;
    used.add(key);
    options.push({
      id: `opt_${options.length}`,
      label: `${pair[0]} + ${pair[1]}`,
      isCorrect: false,
    });
  }

  const shuffledOptions = shuffle(options, random);

  return {
    id: uid(),
    type: 'mcq',
    questionText: `How do you make ${target}?`,
    parts: [],
    options: shuffledOptions,
    answer: shuffledOptions.findIndex((option) => option.isCorrect),
    correctAnswerIndex: shuffledOptions.findIndex((option) => option.isCorrect),
    solution: {
      sections: [
        { type: 'text', content: `${correctPair[0]} + ${correctPair[1]} = ${target}.` },
      ],
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'makeNumber',
      target,
      range,
    },
  };
}
