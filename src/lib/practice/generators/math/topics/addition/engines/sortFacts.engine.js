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
  const sums = shuffle(template.config?.sums || [14, 15, 16], random).slice(0, 3);
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
