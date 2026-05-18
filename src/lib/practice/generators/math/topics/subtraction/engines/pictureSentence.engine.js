import { createSeededRandom, randInt, uid } from './shared.js';

const OBJECTS = [
  { imageUrl: 'https://cdn-icons-png.flaticon.com/512/6363/6363577.png', singular: 'toy', plural: 'toys' },
  { imageUrl: 'https://cdn-icons-png.flaticon.com/512/5120/5120828.png', singular: 'item', plural: 'items' },
  { imageUrl: 'https://cdn-icons-png.flaticon.com/512/4191/4191509.png', singular: 'object', plural: 'objects' },
];

function buildCrossedImagesSvg(start, remove, obj) {
  const itemSize = 40;
  const gap = 8;
  const width = start * (itemSize + gap) + gap;
  const height = itemSize + gap * 2;
  const items = [];
  
  for (let i = 0; i < start; i++) {
    const isCrossed = i >= (start - remove);
    const x = gap + i * (itemSize + gap);
    const y = gap;
    
    // Background for better visibility
    let content = `<rect x="${x}" y="${y}" width="${itemSize}" height="${itemSize}" rx="8" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />`;
    
    // Image tag
    content += `<image href="${obj.imageUrl}" x="${x + 6}" y="${y + 6}" width="${itemSize - 12}" height="${itemSize - 12}" />`;
    
    if (isCrossed) {
      content += `<line x1="${x+4}" y1="${y+4}" x2="${x+itemSize-4}" y2="${y+itemSize-4}" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />
      <line x1="${x+itemSize-4}" y1="${y+4}" x2="${x+4}" y2="${y+itemSize-4}" stroke="#ef4444" stroke-width="4" stroke-linecap="round" />`;
    }
    items.push(content);
  }
  
  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" style="max-height: 80px;" xmlns="http://www.w3.org/2000/svg">
    ${items.join('')}
  </svg>`;
}

export function generatePictureSentenceQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const range = template.config?.range || [2, 5];
  const maxStart = Math.min(10, Math.max(2, range[1]));
  const minStart = Math.max(2, range[0]);
  const startCount = randInt(minStart, maxStart, random);
  const removeCount = randInt(1, startCount - 1, random);
  const correctRemaining = startCount - removeCount;
  
  const isFindModel = template.config?.mode === 'findModel';
  const obj = OBJECTS[randInt(0, OBJECTS.length - 1, random)];
  
  const correctSentence = `${startCount} - ${removeCount} = ${correctRemaining}`;
  const wrongRemove = removeCount === 1 ? 2 : removeCount - 1;
  const distractorSentence = `${startCount} - ${wrongRemove} = ${startCount - wrongRemove}`;
  
  const options = [];
  
  if (isFindModel) {
    options.push({
      id: 'opt_correct',
      label: 'Correct Model',
      value: 'correct',
      isCorrect: true,
      svg: buildCrossedImagesSvg(startCount, removeCount, obj)
    });
    options.push({
      id: 'opt_distractor',
      label: 'Distractor Model',
      value: 'distractor',
      isCorrect: false,
      svg: buildCrossedImagesSvg(startCount, wrongRemove, obj)
    });
  } else {
    options.push({
      id: 'opt_correct',
      label: correctSentence,
      value: correctSentence,
      isCorrect: true
    });
    options.push({
      id: 'opt_distractor',
      label: distractorSentence,
      value: distractorSentence,
      isCorrect: false
    });
  }
  
  if (random() < 0.5) options.reverse();
  
  const questionText = isFindModel ? `Which model shows ${correctSentence}?` : 'Which subtraction sentence does the model show?';
  
  const parts = [];
  if (!isFindModel) {
    parts.push({
      type: 'svg',
      content: buildCrossedImagesSvg(startCount, removeCount, obj),
      isVertical: true,
      style: { maxWidth: '560px', margin: '8px 0 16px' }
    });
  } else {
    parts.push({
      type: 'text',
      content: correctSentence,
      isVertical: true,
      style: { fontSize: '24px', fontWeight: 'bold', margin: '8px 0 16px' }
    });
  }
  
  return {
    id: uid(),
    type: 'mcq',
    questionText,
    question_text: questionText,
    isGrid: isFindModel,
    layoutConfig: {
      variant: isFindModel ? 'svgGrid' : 'textOptions',
      columns: 1,
    },
    parts,
    options: options.map(opt => ({
      ...opt,
      content: opt.svg ? [{ type: 'svg', content: opt.svg }] : null
    })),
    answer: options.findIndex((o) => o.isCorrect),
    correctAnswerIndex: options.findIndex((o) => o.isCorrect),
    solution: {
      sections: [
        { type: 'text', content: `Start with ${startCount} ${startCount === 1 ? obj.singular : obj.plural}. Cross out ${removeCount}.` },
        { type: 'text', content: `The correct sentence is ${correctSentence}.` },
      ],
    },
    metadata: {
      topic: 'subtraction',
      templateId: template.id,
      engine: 'pictureSentence',
      startCount,
      removeCount,
      correctRemaining
    },
  };
}
