import { createSeededRandom, randInt, uid } from './shared.js';

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function makeFactForSum(total, random) {
  const first = randInt(Math.max(1, total - 10), Math.min(10, total - 1), random);
  return { first, second: total - first, total };
}

export function generateSortFactsQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  
  const difficulty = String(template.config?.difficulty || 'adaptive').toLowerCase();
  const history = template.config?.history || {};
  const level = Math.min(5, Math.max(1, Number(history.practiceLevel || 1)));

  // Determine difficulty level: easy, medium, hard
  let effectiveDifficulty = difficulty;
  if (difficulty === 'adaptive') {
    if (level <= 2) {
      effectiveDifficulty = 'easy';
    } else if (level <= 4) {
      effectiveDifficulty = 'medium';
    } else {
      effectiveDifficulty = 'hard';
    }
  }

  let sums;
  if (template.config?.sums && template.config.sums.length >= 3) {
    // Respect explicitly configured sums if provided
    sums = shuffle(template.config.sums, random).slice(0, 3).sort((a, b) => a - b);
  } else {
    // Generate adaptive sums based on difficulty level
    let sumPool;
    if (effectiveDifficulty === 'easy') {
      sumPool = [5, 6, 7, 8, 9, 10];
    } else if (effectiveDifficulty === 'medium') {
      sumPool = [10, 11, 12, 13, 14, 15];
    } else {
      sumPool = [15, 16, 17, 18, 19, 20];
    }
    sums = shuffle(sumPool, random).slice(0, 3).sort((a, b) => a - b);
  }

  const facts = shuffle(sums.map((target) => makeFactForSum(target, random)), random);
  const categories = sums.map((target) => ({
    id: `sum_${target}`,
    label: `Equal to ${target}`,
  }));
  const items = facts.map((fact) => ({
    id: `fact_${fact.first}_${fact.second}_${fact.total}`,
    content: `${fact.first} + ${fact.second}`,
    target: `sum_${fact.total}`,
    categoryId: `sum_${fact.total}`,
  }));
  const answer = Object.fromEntries(items.map((item) => [item.id, item.target]));

  return {
    id: uid(),
    type: 'categorization',
    renderer: template.config?.renderer || undefined,
    questionText: 'Sort.',
    parts: [],
    options: [],
    categories,
    items,
    poolPosition: 'top',
    answer,
    correctAnswerIndex: null,
    solution: {
      sections: facts.map((fact) => ({
        type: 'text',
        content: `${fact.first} + ${fact.second} = ${fact.total}, so it belongs in Equal to ${fact.total}.`,
      })),
    },
    metadata: {
      topic: 'addition',
      templateId: template.id,
      engine: 'sortFacts',
      sums,
      range: template.config?.range || [1, 20],
    },
  };
}
