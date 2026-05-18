let uidCounter = 0;

function createSeededRandom(seedInput = 'multiplication') {
  const str = String(seedInput);
  let seed = 0;
  for (let i = 0; i < str.length; i += 1) {
    seed = (seed * 31 + str.charCodeAt(i)) % 2147483647;
  }
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}

function randInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function generateFactsQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || Date.now());
  const range = template.config?.range || [1, 10];
  const min = Number(range[0] ?? 1);
  const max = Number(range[1] ?? 10);
  const first = randInt(min, max, random);
  const second = randInt(min, max, random);
  const product = first * second;

  return {
    id: `multiplication_${Date.now()}_${++uidCounter}`,
    type: 'fillInTheBlank',
    questionText: 'Multiply.',
    parts: [
      {
        type: 'text',
        content: `${first} × ${second} = [blank:ans]`,
        isVertical: true,
        hasAudio: true
      }
    ],
    answer: { ans: String(product) },
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify({ ans: String(product) }),
    solution: {
      sections: [
        { type: 'text', content: `${first} groups of ${second} make ${product}.` },
        { type: 'text', content: `${first} × ${second} = ${product}.` }
      ]
    },
    metadata: {
      subject: 'math',
      topic: 'multiplication',
      templateId: template.id,
      engine: 'facts',
      first,
      second,
      product,
      range: { min, max }
    }
  };
}
