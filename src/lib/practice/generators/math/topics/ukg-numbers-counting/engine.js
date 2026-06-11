import { generateLkgQuestion } from '../lkg/index.js';
import { ukgNumbersCountingSkillMap } from './skills.js';
import { coinsGroupSvg } from '../money/shared/moneyAssets.js';
import { shadowAssets } from './shadowAssets.js';
import { comparisonEnoughPairs, comparisonObjectAssets } from './comparisonAssets.js';

const NUMBER_NAMES = [
  'zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten',
  'eleven', 'twelve', 'thirteen', 'fourteen', 'fifteen', 'sixteen', 'seventeen',
  'eighteen', 'nineteen', 'twenty'
];

const SKIP_COUNT_GROUP_ASSETS = {
  2: [
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780590812316-tennis-rocket2s.svg',
    singular: 'tennis racket',
    plural: 'tennis rackets'
  },
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780590812785-tennis-rocket2s--1-.svg',
    singular: 'tennis racket',
    plural: 'tennis rackets'
  },
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780590892171-cats-two.webp',
    singular: 'cat',
    plural: 'cats'
  },
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780591265264-badges-two.webp',
    singular: 'badge',
    plural: 'badges'
  },
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780591266250-cherries-two.png',
    singular: 'cherry',
    plural: 'cherries'
  },
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780591267050-pair-of-heels.webp',
    singular: 'heel',
    plural: 'heels'
  },
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780591268606-pair-of-socks.webp',
    singular: 'sock',
    plural: 'socks'
  },
  {
    imageUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780591269479-swin-fins-two.webp',
    singular: 'swim fin',
    plural: 'swim fins'
  }
  ]
};

const SKIP_COUNT_GROUP_COLORS = ['#60a5fa', '#86efac', '#fbbf24', '#f9a8d4', '#c4b5fd'];

function seededRandom(seed) {
  let value = 0;
  for (const character of String(seed || Date.now())) {
    value = (value * 31 + character.charCodeAt(0)) >>> 0;
  }
  return () => {
    value = (value * 1664525 + 1013904223) >>> 0;
    return value / 4294967296;
  };
}

const randInt = (random, min, max) => min + Math.floor(random() * (max - min + 1));

function shuffle(random, values) {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const next = Math.floor(random() * (index + 1));
    [result[index], result[next]] = [result[next], result[index]];
  }
  return result;
}

function mcq(questionText, answer, choices, parts = []) {
  const values = [...new Set(choices)].slice(0, 4);
  const answerIndex = values.indexOf(answer);
  return {
    type: 'mcq',
    questionText,
    parts: [{ type: 'text', content: questionText }, ...parts],
    options: values.map((value) => ({ id: String(value), label: String(value), value })),
    answer,
    correctAnswerIndex: answerIndex,
    solution: { sections: [{ type: 'text', content: `The answer is ${answer}.` }] }
  };
}

function choicesNear(random, answer, min, max) {
  const values = new Set([answer]);
  while (values.size < Math.min(4, max - min + 1)) {
    values.add(randInt(random, min, max));
  }
  return shuffle(random, [...values]);
}

function choicesByStepAdaptive(random, answer, max, step, correctStreak = 0) {
  const numOptions = correctStreak >= 6 ? 4 : correctStreak >= 3 ? 3 : 2;
  const values = new Set([answer]);

  if (correctStreak >= 3) {
    // Target adjacent multiples of step to increase cognitive challenge
    const adjacentOffsets = [-step, step, -2 * step, 2 * step, 3 * step];
    for (const offset of adjacentOffsets) {
      if (values.size >= numOptions) break;
      const candidate = answer + offset;
      if (candidate >= step && candidate <= max && candidate !== answer) {
        values.add(candidate);
      }
    }
  }

  // Fill in remaining multiples if needed
  while (values.size < Math.min(numOptions, Math.floor(max / step))) {
    values.add(randInt(random, 1, Math.floor(max / step)) * step);
  }

  return shuffle(random, [...values]);
}

function stickerSvg(count) {
  const stickers = Array.from({ length: count }, (_, index) => {
    const x = 45 + (index % 5) * 68;
    const y = 50 + Math.floor(index / 5) * 70;
    return `<g transform="translate(${x} ${y})"><circle r="25" fill="#fde68a" stroke="#f59e0b" stroke-width="3"/><circle cx="-8" cy="-5" r="3" fill="#334155"/><circle cx="8" cy="-5" r="3" fill="#334155"/><path d="M-9 8 Q0 17 9 8" fill="none" stroke="#334155" stroke-width="3" stroke-linecap="round"/></g>`;
  }).join('');
  const height = 40 + Math.ceil(count / 5) * 70;
  return `<svg viewBox="0 0 390 ${height}" xmlns="http://www.w3.org/2000/svg">${stickers}</svg>`;
}

function tallySvg(count) {
  const marks = [];
  for (let index = 0; index < count; index += 1) {
    const group = Math.floor(index / 5);
    const within = index % 5;
    const x = 45 + group * 120 + within * 20;
    if (within === 4) {
      marks.push(`<line x1="${x - 75}" y1="105" x2="${x}" y2="35" stroke="#334155" stroke-width="8" stroke-linecap="round"/>`);
    } else {
      marks.push(`<line x1="${x}" y1="30" x2="${x}" y2="110" stroke="#334155" stroke-width="8" stroke-linecap="round"/>`);
    }
  }
  const width = Math.max(300, 80 + Math.ceil(count / 5) * 120);
  return `<svg viewBox="0 0 ${width} 140" xmlns="http://www.w3.org/2000/svg">${marks.join('')}</svg>`;
}

function numberLineSvg(target, max = 10) {
  const width = 700;
  const spacing = (width - 60) / max;
  const ticks = Array.from({ length: max + 1 }, (_, number) => {
    const x = 30 + number * spacing;
    const marker = number === target
      ? `<circle cx="${x}" cy="55" r="11" fill="#f97316"/><path d="M${x} 18 L${x - 8} 32 H${x + 8} Z" fill="#f97316"/>`
      : '';
    return `<line x1="${x}" y1="48" x2="${x}" y2="68" stroke="#334155" stroke-width="3"/><text x="${x}" y="92" text-anchor="middle" font-size="14" font-weight="700">${number}</text>${marker}`;
  }).join('');
  return `<svg viewBox="0 0 ${width} 110" xmlns="http://www.w3.org/2000/svg"><line x1="30" y1="58" x2="${width - 30}" y2="58" stroke="#334155" stroke-width="4"/>${ticks}</svg>`;
}

function tenFrameSvg(filled, capacity = 10, groupSize = 0) {
  const cells = Array.from({ length: capacity }, (_, index) => {
    const x = 25 + (index % 5) * 58;
    const y = 25 + Math.floor(index / 5) * 58;
    const fill = groupSize > 0 && index < filled
      ? SKIP_COUNT_GROUP_COLORS[Math.floor(index / groupSize) % SKIP_COUNT_GROUP_COLORS.length]
      : (index < filled ? '#60a5fa' : '#fff');
    return `<rect x="${x}" y="${y}" width="50" height="50" rx="6" fill="${fill}" stroke="#334155" stroke-width="3"/>`;
  }).join('');
  const height = 35 + Math.ceil(capacity / 5) * 58;
  return `<svg viewBox="0 0 330 ${height}" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
}

function tensOnesSvg(number) {
  const tens = Math.floor(number / 10);
  const ones = number % 10;
  const rods = Array.from({ length: tens }, (_, rod) => {
    const x = 35 + rod * 55;
    const units = Array.from({ length: 10 }, (_, index) => (
      `<rect x="${x}" y="${25 + index * 20}" width="42" height="19" fill="#60a5fa" stroke="#2563eb" stroke-width="2"/>`
    )).join('');
    return units;
  }).join('');
  const cubes = Array.from({ length: ones }, (_, index) => {
    const x = 165 + (index % 5) * 34;
    const y = 35 + Math.floor(index / 5) * 34;
    return `<rect x="${x}" y="${y}" width="28" height="28" rx="3" fill="#86efac" stroke="#16a34a" stroke-width="2"/>`;
  }).join('');
  return `<svg viewBox="0 0 360 250" xmlns="http://www.w3.org/2000/svg">${rods}${cubes}<text x="70" y="238" text-anchor="middle" font-size="18" font-weight="700">tens</text><text x="235" y="238" text-anchor="middle" font-size="18" font-weight="700">ones</text></svg>`;
}

function skipCountGroupGridSvg(total, asset, step, showRunningTotals = false) {
  const groupCount = Math.max(1, Math.floor(total / step));
  const columns = Math.min(5, groupCount);
  const rows = Math.ceil(groupCount / columns);
  const cellWidth = 140;
  const cellHeight = showRunningTotals ? 132 : 108;
  const width = columns * cellWidth + 40;
  const height = rows * cellHeight + 32;
  const groups = Array.from({ length: groupCount }, (_, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    const x = 20 + column * cellWidth;
    const y = 12 + row * cellHeight;
    const totalLabel = showRunningTotals
      ? `<text x="${x + 60}" y="${y + 116}" text-anchor="middle" font-size="22" font-weight="900" fill="#2563eb">${(index + 1) * step}</text>`
      : '';
    const visual = asset?.imageUrl
      ? `<image href="${asset.imageUrl}" x="${x + 10}" y="${y + 8}" width="100" height="84" preserveAspectRatio="xMidYMid meet"/>`
      : Array.from({ length: step }, (_, itemIndex) => {
        const itemX = x + 25 + (itemIndex % Math.min(step, 3)) * 34;
        const itemY = y + 30 + Math.floor(itemIndex / 3) * 34;
        return `<circle cx="${itemX}" cy="${itemY}" r="13" fill="${SKIP_COUNT_GROUP_COLORS[index % SKIP_COUNT_GROUP_COLORS.length]}" stroke="#334155" stroke-width="2"/>`;
      }).join('');
    return `<g>
      <rect x="${x}" y="${y}" width="120" height="${showRunningTotals ? 124 : 100}" rx="18" fill="#ffffff" fill-opacity="0.72" stroke="#dbeafe" stroke-width="2"/>
      ${visual}
      ${totalLabel}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">${groups}</svg>`;
}

function comparisonDots(count, startX, startY, color, columns = 5, gap = 48) {
  return Array.from({ length: count }, (_, index) => {
    const x = startX + (index % columns) * gap;
    const y = startY + Math.floor(index / columns) * gap;
    return `<circle cx="${x}" cy="${y}" r="17" fill="${color}" stroke="#334155" stroke-width="2"/>`;
  }).join('');
}

function comparisonImageGrid(count, asset, startX, startY, columns = 4, gapX = 58, gapY = 58, size = 48) {
  if (!asset?.imageUrl) return comparisonDots(count, startX, startY, '#60a5fa', columns, gapX);
  return Array.from({ length: count }, (_, index) => {
    const x = startX + (index % columns) * gapX;
    const y = startY + Math.floor(index / columns) * gapY;
    return `<image href="${asset.imageUrl}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }).join('');
}

function comparisonBoxesSvg(leftCount, rightCount, leftAsset, rightAsset, matching = false) {
  const columns = matching ? 2 : 4;
  const startY = matching ? 38 : 48;
  const gapY = matching ? 43 : 58;
  const size = matching ? 38 : 48;
  const leftItems = comparisonImageGrid(leftCount, leftAsset, 52, startY, columns, 58, gapY, size);
  const rightItems = comparisonImageGrid(rightCount, rightAsset, 376, startY, columns, 58, gapY, size);
  return `<svg viewBox="0 0 650 300" xmlns="http://www.w3.org/2000/svg">
    <rect x="28" y="20" width="270" height="250" rx="18" fill="#fff" stroke="#bae6fd" stroke-width="4"/>
    <rect x="352" y="20" width="270" height="250" rx="18" fill="#fff" stroke="#bae6fd" stroke-width="4"/>
    ${leftItems}${rightItems}
  </svg>`;
}

function mixedComparisonSvg(firstCount, secondCount, firstAsset, secondAsset, random) {
  const total = firstCount + secondCount;
  const assets = shuffle(random, [
    ...Array(firstCount).fill(firstAsset),
    ...Array(secondCount).fill(secondAsset)
  ]);
  const items = assets.map((asset, index) => {
    const x = 32 + (index % 10) * 54;
    const y = 20 + Math.floor(index / 10) * 58;
    return `<image href="${asset.imageUrl}" x="${x}" y="${y}" width="48" height="48" preserveAspectRatio="xMidYMid meet"/>`;
  }).join('');
  return `<svg viewBox="0 0 580 ${total > 10 ? 150 : 90}" xmlns="http://www.w3.org/2000/svg">${items}</svg>`;
}

const ADDITION_OBJECT_ASSETS = [
  { imageUrl: '/images/lkg/apple.png', singular: 'apple', plural: 'apples' },
  { imageUrl: '/images/lkg/flower.png', singular: 'flower', plural: 'flowers' },
  { imageUrl: '/images/lkg/car.png', singular: 'car', plural: 'cars' },
  { imageUrl: '/images/lkg/duck.png', singular: 'duck', plural: 'ducks' },
  { imageUrl: '/images/lkg/ball.png', singular: 'ball', plural: 'balls' },
  { imageUrl: '/images/rabbit.svg', singular: 'rabbit', plural: 'rabbits' },
  { imageUrl: '/images/penguin.svg', singular: 'penguin', plural: 'penguins' },
];

function additionImageGrid(count, asset, startX, startY, columns = 5, gapX = 56, gapY = 56, size = 44) {
  return Array.from({ length: count }, (_, index) => {
    const x = startX + (index % columns) * gapX;
    const y = startY + Math.floor(index / columns) * gapY;
    return `<image href="${asset.imageUrl}" x="${x}" y="${y}" width="${size}" height="${size}" preserveAspectRatio="xMidYMid meet"/>`;
  }).join('');
}

function additionGroupsSvg(first, second, asset) {
  const firstWidth = Math.max(140, 36 + Math.min(5, first) * 56);
  const secondWidth = Math.max(140, 36 + Math.min(5, second) * 56);
  const gap = 72;
  const totalWidth = firstWidth + secondWidth + gap + 40;
  const firstItems = additionImageGrid(first, asset, 28, 38);
  const secondItems = additionImageGrid(second, asset, 28 + firstWidth + gap, 38);
  return `<svg viewBox="0 0 ${totalWidth} 170" xmlns="http://www.w3.org/2000/svg">
    <rect x="12" y="20" width="${firstWidth}" height="104" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>
    <rect x="${12 + firstWidth + gap}" y="20" width="${secondWidth}" height="104" rx="10" fill="#fff" stroke="#cbd5e1" stroke-width="3"/>
    ${firstItems}${secondItems}
    <text x="${12 + firstWidth / 2}" y="158" text-anchor="middle" font-size="28" font-weight="700" fill="#1f2937">${first}</text>
    <text x="${12 + firstWidth + gap / 2}" y="158" text-anchor="middle" font-size="32" font-weight="700" fill="#1f2937">+</text>
    <text x="${12 + firstWidth + gap + secondWidth / 2}" y="158" text-anchor="middle" font-size="28" font-weight="700" fill="#1f2937">${second}</text>
  </svg>`;
}

function additionSingleModelSvg(total, asset, activeCount = total, capacity = Math.max(5, total)) {
  const width = Math.max(360, 60 + capacity * 54);
  const cells = Array.from({ length: capacity }, (_, index) => {
    const x = 24 + index * 54;
    const fill = index < activeCount ? '#dbeafe' : '#f8fafc';
    const item = index < total
      ? `<image href="${asset.imageUrl}" x="${x + 8}" y="22" width="38" height="38" preserveAspectRatio="xMidYMid meet"/>`
      : '';
    return `<g>
      <rect x="${x}" y="14" width="48" height="56" rx="6" fill="${fill}" stroke="#bae6fd" stroke-width="3"/>
      ${item}
    </g>`;
  }).join('');
  return `<svg viewBox="0 0 ${width} 90" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
}

function makeFillQuestion(questionText, parts, answer, solutionText) {
  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [{ type: 'text', content: questionText, hasAudio: true }, ...parts],
    answer,
    correctAnswerIndex: null,
    correctAnswerText: JSON.stringify(answer),
    solution: { sections: [{ type: 'text', content: solutionText }] }
  };
}

function pickAddends(random, limit, targetSum = null) {
  const total = targetSum || randInt(random, 2, limit);
  const first = randInt(random, 1, total - 1);
  return [first, total - first, total];
}

function expressionChoices(random, total, limit, correctExpression = null) {
  const expressions = new Set();
  if (correctExpression) expressions.add(correctExpression);
  while (expressions.size < 4) {
    const candidateTotal = randInt(random, 2, limit);
    const first = randInt(random, 1, candidateTotal - 1);
    const expression = `${first} + ${candidateTotal - first}`;
    if (candidateTotal !== total || expression === correctExpression) {
      expressions.add(expression);
    }
  }
  return shuffle(random, [...expressions]);
}

function pickSubtractionFact(random, limit, targetDifference = null) {
  if (Number.isFinite(targetDifference)) {
    const difference = Math.max(0, Math.min(limit - 1, targetDifference));
    const takeAway = randInt(random, 1, Math.max(1, limit - difference));
    return [difference + takeAway, takeAway, difference];
  }

  const minuend = randInt(random, 1, limit);
  const takeAway = randInt(random, 1, minuend);
  return [minuend, takeAway, minuend - takeAway];
}

function subtractionChoices(random, answer, limit) {
  return choicesNear(random, answer, 0, limit);
}

function subtractionExpressionChoices(random, difference, limit, correctExpression = null) {
  const expressions = new Set();
  if (correctExpression) expressions.add(correctExpression);

  let attempts = 0;
  while (expressions.size < 4 && attempts < 120) {
    attempts += 1;
    const minuend = randInt(random, 1, limit);
    const takeAway = randInt(random, 0, minuend);
    const candidateDifference = minuend - takeAway;
    const expression = `${minuend} - ${takeAway}`;
    if (candidateDifference !== difference || expression === correctExpression) {
      expressions.add(expression);
    }
  }

  while (expressions.size < 4) {
    expressions.add(`${limit} - ${Math.max(0, limit - expressions.size)}`);
  }

  return shuffle(random, [...expressions]);
}

function subtractionModelSvg(minuend, takeAway, asset, capacity = Math.max(5, minuend)) {
  const width = Math.max(360, 60 + capacity * 58);
  const difference = minuend - takeAway;
  const cells = Array.from({ length: capacity }, (_, index) => {
    const x = 24 + index * 58;
    const hasItem = index < minuend;
    const removed = hasItem && index >= difference;
    const item = hasItem
      ? `<g opacity="${removed ? '0.34' : '1'}">
          <image href="${asset.imageUrl}" x="${x + 8}" y="22" width="40" height="40" preserveAspectRatio="xMidYMid meet"/>
        </g>`
      : '';
    const cross = removed
      ? `<line x1="${x + 10}" y1="24" x2="${x + 46}" y2="60" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
         <line x1="${x + 46}" y1="24" x2="${x + 10}" y2="60" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>`
      : '';
    return `<g>
      <rect x="${x}" y="14" width="52" height="60" rx="8" fill="${hasItem ? '#fff7ed' : '#f8fafc'}" stroke="#fed7aa" stroke-width="3"/>
      ${item}${cross}
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 ${width} 96" xmlns="http://www.w3.org/2000/svg">${cells}</svg>`;
}

function subtractionGroupsSvg(minuend, takeAway, asset) {
  const capacity = Math.max(5, minuend);
  const modelWidth = 60 + capacity * 58;
  const offsetX = Math.max(20, (720 - modelWidth) / 2);
  const difference = minuend - takeAway;
  const cells = Array.from({ length: capacity }, (_, index) => {
    const x = offsetX + 24 + index * 58;
    const hasItem = index < minuend;
    const removed = hasItem && index >= difference;
    const item = hasItem
      ? `<g opacity="${removed ? '0.34' : '1'}">
          <image href="${asset.imageUrl}" x="${x + 8}" y="22" width="40" height="40" preserveAspectRatio="xMidYMid meet"/>
        </g>`
      : '';
    const cross = removed
      ? `<line x1="${x + 10}" y1="24" x2="${x + 46}" y2="60" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>
         <line x1="${x + 46}" y1="24" x2="${x + 10}" y2="60" stroke="#ef4444" stroke-width="4" stroke-linecap="round"/>`
      : '';
    return `<g>
      <rect x="${x}" y="14" width="52" height="60" rx="8" fill="${hasItem ? '#fff7ed' : '#f8fafc'}" stroke="#fed7aa" stroke-width="3"/>
      ${item}${cross}
    </g>`;
  }).join('');

  return `<svg viewBox="0 0 720 180" xmlns="http://www.w3.org/2000/svg">
    ${cells}
    <text x="210" y="154" text-anchor="middle" font-size="34" font-weight="800" fill="#1f2937">${minuend}</text>
    <text x="310" y="154" text-anchor="middle" font-size="34" font-weight="800" fill="#1f2937">-</text>
    <text x="410" y="154" text-anchor="middle" font-size="34" font-weight="800" fill="#1f2937">${takeAway}</text>
    <text x="510" y="154" text-anchor="middle" font-size="34" font-weight="800" fill="#1f2937">=</text>
  </svg>`;
}

function generateUkgAdditionQuestion(skill, random) {
  const { mode, limit } = skill.params;
  const upper = Math.max(5, limit);
  const [first, second, total] = pickAddends(random, upper, mode === 'addition_complete_make_10' ? 10 : null);
  const asset = ADDITION_OBJECT_ASSETS[randInt(random, 0, ADDITION_OBJECT_ASSETS.length - 1)];
  const itemName = total === 1 ? asset.singular : asset.plural;
  const nearbyChoices = choicesNear(random, total, 0, upper);

  if (mode === 'addition_pictures') {
    return makeFillQuestion(
      'Add.',
      [
        {
          type: 'svg',
          content: additionGroupsSvg(first, second, asset),
          isVertical: true,
          style: { maxWidth: '720px', margin: '10px 0 6px' }
        },
        {
          type: 'text',
          content: `${first} + ${second} = [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { ans: String(total) },
      `${first} plus ${second} equals ${total}.`
    );
  }

  if (mode === 'addition_sentences') {
    return mcq(
      `Which addition sentence is shown?`,
      `${first} + ${second}`,
      expressionChoices(random, total, upper, `${first} + ${second}`),
      [
        {
          type: 'svg',
          content: additionSingleModelSvg(total, asset, first, upper),
          style: { maxWidth: '680px', margin: '0 auto', justifyContent: 'center' }
        }
      ]
    );
  }

  if (mode === 'addition_make_number') {
    const target = total;
    return mcq(
      `How do you make ${target}?`,
      `${first} + ${second}`,
      expressionChoices(random, target, upper, `${first} + ${second}`)
    );
  }

  if (mode === 'addition_two_numbers') {
    return makeFillQuestion(
      'Add.',
      [
        {
          type: 'text',
          content: `${first} + ${second} = [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { ans: String(total) },
      `${first} + ${second} = ${total}.`
    );
  }

  if (mode === 'addition_complete_sentence' || mode === 'addition_complete_make_10') {
    const hideFirst = random() < 0.5;
    const content = hideFirst
      ? `[blank:ans] + ${second} = ${total}`
      : `${first} + [blank:ans] = ${total}`;
    return makeFillQuestion(
      'Fill in the missing number.',
      [
        {
          type: 'text',
          content,
          isVertical: true,
          style: { fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { ans: String(hideFirst ? first : second) },
      `${first} + ${second} = ${total}.`
    );
  }

  if (mode === 'addition_write_sentences') {
    return makeFillQuestion(
      'Write the addition sentence.',
      [
        {
          type: 'svg',
          content: additionGroupsSvg(first, second, asset),
          isVertical: true,
          style: { maxWidth: '720px', margin: '10px 0 6px' }
        },
        {
          type: 'text',
          content: `[blank:first] + [blank:second] = ${total}`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { first: String(first), second: String(second) },
      `The two groups show ${first} and ${second}.`
    );
  }

  if (mode === 'addition_word_problems') {
    const childNames = ['Anu', 'Mia', 'Ravi', 'Tara', 'Sam'];
    const child = childNames[randInt(random, 0, childNames.length - 1)];
    const questionText = `${child} has ${first} ${first === 1 ? asset.singular : asset.plural}. ${child} gets ${second} more. How many ${asset.plural} does ${child} have now?`;
    return mcq(questionText, total, nearbyChoices);
  }

  return mcq('Add.', total, nearbyChoices, [
    { type: 'svg', content: additionGroupsSvg(first, second, asset) }
  ]);
}

function generateUkgSubtractionQuestion(skill, random) {
  const { mode, limit } = skill.params;
  const upper = Math.max(5, limit);
  const [minuend, takeAway, difference] = pickSubtractionFact(random, upper);
  const asset = ADDITION_OBJECT_ASSETS[randInt(random, 0, ADDITION_OBJECT_ASSETS.length - 1)];
  const itemName = minuend === 1 ? asset.singular : asset.plural;
  const nearbyChoices = subtractionChoices(random, difference, upper);

  if (mode === 'subtraction_pictures') {
    return makeFillQuestion(
      'Subtract.',
      [
        {
          type: 'svg',
          content: subtractionGroupsSvg(minuend, takeAway, asset),
          isVertical: true,
          style: { maxWidth: '760px', margin: '10px 0 6px' }
        },
        {
          type: 'text',
          content: `${minuend} - ${takeAway} = [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { ans: String(difference) },
      `${minuend} minus ${takeAway} equals ${difference}.`
    );
  }

  if (mode === 'subtraction_sentences') {
    return mcq(
      'Which subtraction sentence is shown?',
      `${minuend} - ${takeAway}`,
      subtractionExpressionChoices(random, difference, upper, `${minuend} - ${takeAway}`),
      [
        {
          type: 'svg',
          content: subtractionModelSvg(minuend, takeAway, asset, upper),
          style: { maxWidth: '700px', margin: '0 auto', justifyContent: 'center' }
        }
      ]
    );
  }

  if (mode === 'subtraction_make_number') {
    const target = randInt(random, 0, upper - 1);
    const [targetMinuend, targetTakeAway] = pickSubtractionFact(random, upper, target);
    return mcq(
      `How do you make ${target}?`,
      `${targetMinuend} - ${targetTakeAway}`,
      subtractionExpressionChoices(random, target, upper, `${targetMinuend} - ${targetTakeAway}`)
    );
  }

  if (mode === 'subtraction_two_numbers') {
    return makeFillQuestion(
      'Subtract.',
      [
        {
          type: 'text',
          content: `${minuend} - ${takeAway} = [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { ans: String(difference) },
      `${minuend} - ${takeAway} = ${difference}.`
    );
  }

  if (mode === 'subtraction_complete_sentence') {
    const hideTakeAway = random() < 0.5;
    const content = hideTakeAway
      ? `${minuend} - [blank:ans] = ${difference}`
      : `${minuend} - ${takeAway} = [blank:ans]`;
    return makeFillQuestion(
      'Fill in the missing number.',
      [
        {
          type: 'text',
          content,
          isVertical: true,
          style: { fontSize: 'clamp(30px, 5vw, 42px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { ans: String(hideTakeAway ? takeAway : difference) },
      `${minuend} - ${takeAway} = ${difference}.`
    );
  }

  if (mode === 'subtraction_write_sentences') {
    return makeFillQuestion(
      'Write the subtraction sentence.',
      [
        {
          type: 'svg',
          content: subtractionModelSvg(minuend, takeAway, asset, upper),
          isVertical: true,
          style: { maxWidth: '720px', margin: '10px 0 6px' }
        },
        {
          type: 'text',
          content: `[blank:first] - [blank:second] = ${difference}`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left' }
        }
      ],
      { first: String(minuend), second: String(takeAway) },
      `The picture starts with ${minuend} and takes away ${takeAway}.`
    );
  }

  if (mode === 'subtraction_word_problems') {
    const childNames = ['Anu', 'Mia', 'Ravi', 'Tara', 'Sam'];
    const child = childNames[randInt(random, 0, childNames.length - 1)];
    const questionText = `${child} has ${minuend} ${itemName}. ${child} gives away ${takeAway}. How many ${asset.plural} are left?`;
    return mcq(questionText, difference, nearbyChoices);
  }

  return mcq('Subtract.', difference, nearbyChoices, [
    { type: 'svg', content: subtractionModelSvg(minuend, takeAway, asset, upper) }
  ]);
}

const PATTERN_COLORS = [
  { id: 'blue', label: 'blue', fill: '#5cc4ed', stroke: '#0284c7' },
  { id: 'green', label: 'green', fill: '#2fb86b', stroke: '#15803d' },
  { id: 'orange', label: 'orange', fill: '#fb7c2d', stroke: '#ea580c' },
  { id: 'purple', label: 'purple', fill: '#8478df', stroke: '#6d5bd0' },
  { id: 'pink', label: 'pink', fill: '#d946ef', stroke: '#a21caf' },
  { id: 'yellow', label: 'yellow', fill: '#facc15', stroke: '#ca8a04' },
];

const PATTERN_BASE_SHAPES = ['square', 'circle', 'triangle', 'star', 'spade'];

function patternShapeSvg({ shape = 'square', fill = '#5cc4ed', stroke = '#0284c7', scale = 1 }) {
  const size = Math.round(54 * scale);
  const offset = Math.round((72 - size) / 2);
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="0"`;
  const shapeMarkup = {
    square: `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" rx="0" ${common}/>`,
    circle: `<circle cx="36" cy="36" r="${Math.round(size / 2)}" ${common}/>`,
    triangle: `<path d="M36 ${offset} L${offset + size} ${offset + size} H${offset} Z" ${common}/>`,
    star: `<path d="M36 7 L44 27 H65 L48 40 L55 62 L36 49 L17 62 L24 40 L7 27 H28 Z" ${common} transform="translate(36 36) scale(${scale}) translate(-36 -36)"/>`,
    spade: `<path d="M36 10 C22 24 14 31 14 43 C14 53 22 59 32 54 C31 61 27 65 22 67 H50 C45 65 41 61 40 54 C50 59 58 53 58 43 C58 31 50 24 36 10 Z" ${common} transform="translate(36 36) scale(${scale}) translate(-36 -36)"/>`,
  }[shape] || `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" rx="0" ${common}/>`;

  return `<svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg">${shapeMarkup}</svg>`;
}

function makePatternItem(token) {
  const label = token.label || [token.sizeLabel, token.color?.label, token.shape].filter(Boolean).join(' ');
  const id = token.id || label.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
  return {
    id,
    content: label,
    label,
    svg: patternShapeSvg({
      shape: token.shape,
      fill: token.color?.fill,
      stroke: token.color?.stroke,
      scale: token.scale || 1,
    }),
    imageWidth: token.scale > 1 ? 108 : 92,
  };
}

function repeatPattern(pattern, count) {
  return Array.from({ length: count }, (_, index) => pattern[index % pattern.length]);
}

function buildPatternCopyQuestion({ questionText, items, promptIds, answerIds, patternRows = null }) {
  const targets = answerIds.map((_, index) => ({ id: `slot_${index + 1}`, label: '' }));
  const answer = Object.fromEntries(targets.map((target, index) => [target.id, answerIds[index]]));

  return {
    type: 'categorizationv2',
    renderer: 'html',
    layoutMode: 'grid_fill',
    isCopiable: true,
    hideItemLabels: true,
    questionText,
    parts: [{ type: 'text', content: questionText }],
    items,
    categories: [],
    targets,
    answer,
    correctAnswer: answer,
    grid: {
      columns: Math.max(answerIds.length, 1),
      requiredCount: answerIds.length,
      fitToWindow: true,
      cellMinHeight: 84,
    },
    pattern: {
      promptItems: promptIds,
      rows: patternRows,
      hideLabels: true,
    },
    behavior: {
      clickToDrop: true,
      clickToNextEmpty: true,
      dragToDrop: true,
      isCopiable: true,
      preserveSourceSlots: true,
    },
    solution: {
      sections: [{ type: 'text', content: 'Copy the pattern into the empty boxes in the same order.' }]
    }
  };
}

function generatePatternQuestion(skill, random) {
  const mode = skill.params.mode;
  const [firstColor, secondColor] = shuffle(random, PATTERN_COLORS).slice(0, 2);
  const [firstShape, secondShape] = shuffle(random, PATTERN_BASE_SHAPES).slice(0, 2);

  if (mode === 'pattern_colour') {
    const items = [
      makePatternItem({ id: `${firstColor.id}_square`, color: firstColor, shape: 'square' }),
      makePatternItem({ id: `${secondColor.id}_square`, color: secondColor, shape: 'square' }),
    ];
    const promptIds = repeatPattern(items.map((item) => item.id), 6);
    return buildPatternCopyQuestion({
      questionText: 'Copy the pattern.',
      items,
      promptIds,
      answerIds: promptIds,
    });
  }

  if (mode === 'pattern_size') {
    const color = PATTERN_COLORS[randInt(random, 0, PATTERN_COLORS.length - 1)];
    const shape = ['star', 'circle', 'triangle'][randInt(random, 0, 2)];
    const items = [
      makePatternItem({ id: `small_${shape}`, color, shape, scale: 0.72, sizeLabel: 'small' }),
      makePatternItem({ id: `large_${shape}`, color, shape, scale: 1.12, sizeLabel: 'large' }),
    ];
    const promptIds = repeatPattern(items.map((item) => item.id), 6);
    return buildPatternCopyQuestion({
      questionText: 'Copy the pattern.',
      items,
      promptIds,
      answerIds: promptIds,
    });
  }

  if (mode === 'pattern_shape') {
    const items = [
      makePatternItem({ id: firstShape, color: firstColor, shape: firstShape }),
      makePatternItem({ id: secondShape, color: secondColor, shape: secondShape }),
    ];
    const promptIds = repeatPattern(items.map((item) => item.id), 6);
    return buildPatternCopyQuestion({
      questionText: 'Copy the pattern.',
      items,
      promptIds,
      answerIds: promptIds,
    });
  }

  if (mode === 'pattern_next_shape') {
    const items = [
      makePatternItem({ id: firstShape, color: firstColor, shape: firstShape }),
      makePatternItem({ id: secondShape, color: secondColor, shape: secondShape }),
    ];
    const sequence = repeatPattern(items.map((item) => item.id), 7);
    return buildPatternCopyQuestion({
      questionText: 'What shape comes next?',
      items,
      promptIds: sequence.slice(0, 6),
      answerIds: [sequence[6]],
    });
  }

  if (mode === 'pattern_complete') {
    const items = [
      makePatternItem({ id: firstShape, color: firstColor, shape: firstShape }),
      makePatternItem({ id: secondShape, color: secondColor, shape: secondShape }),
    ];
    const sequence = repeatPattern(items.map((item) => item.id), 10);
    return buildPatternCopyQuestion({
      questionText: 'Use the shapes to continue the pattern.',
      items,
      promptIds: sequence.slice(0, 8),
      answerIds: sequence.slice(8, 10),
    });
  }

  if (mode === 'pattern_growing' || mode === 'pattern_growing_next_shape') {
    const items = [
      makePatternItem({ id: `${firstColor.id}_${firstShape}`, color: firstColor, shape: firstShape }),
      makePatternItem({ id: `${secondColor.id}_${secondShape}`, color: secondColor, shape: secondShape }),
    ];
    const promptIds = [
      items[0].id,
      items[1].id,
      items[0].id,
      items[0].id,
      items[1].id,
      items[0].id,
      items[0].id,
      items[0].id,
      items[1].id,
    ];
    const answerIds = mode === 'pattern_growing' ? promptIds : [items[0].id];
    return buildPatternCopyQuestion({
      questionText: mode === 'pattern_growing' ? 'Copy the pattern.' : 'What shape comes next?',
      items,
      promptIds,
      answerIds,
    });
  }

  if (mode === 'pattern_growing_next_row') {
    const items = [
      makePatternItem({ id: `${firstColor.id}_${firstShape}`, color: firstColor, shape: firstShape }),
      makePatternItem({ id: `${secondColor.id}_${secondShape}`, color: secondColor, shape: secondShape }),
    ];
    const rows = [
      [items[0].id, items[1].id],
      [items[0].id, items[0].id, items[1].id],
      [items[0].id, items[0].id, items[0].id, items[1].id],
    ];
    return buildPatternCopyQuestion({
      questionText: 'What row comes next in the pattern?',
      items,
      promptIds: [],
      patternRows: rows,
      answerIds: [items[0].id, items[0].id, items[0].id, items[0].id, items[1].id],
    });
  }

  return buildPatternCopyQuestion({
    questionText: 'Copy the pattern.',
    items: [
      makePatternItem({ id: 'blue_square', color: PATTERN_COLORS[0], shape: 'square' }),
      makePatternItem({ id: 'green_circle', color: PATTERN_COLORS[1], shape: 'circle' }),
    ],
    promptIds: ['blue_square', 'green_circle', 'blue_square', 'green_circle'],
    answerIds: ['blue_square', 'green_circle', 'blue_square', 'green_circle'],
  });
}

function reuseLkg(skill, config, seed) {
  const aliases = {
    learn: 'learn',
    count: 'objects',
    ten_frame_count: 'ten-frames',
    ten_frame_show: 'show-ten-frames',
    represent: 'represent'
  };
  const lkgSkill = `lkg-count${skill.params.limit}-${aliases[skill.params.mode]}`;
  return generateLkgQuestion({ ...config, logic_type: lkgSkill, variables: { ...(config.variables || {}), seed } });
}

// ── Pictograph Generator ─────────────────────────────────────────────────────

const PICTOGRAPH_FRUIT_SETS = [
  [
    { name: 'Bananas', emoji: '🍌', min: 2, max: 6 },
    { name: 'Apples',  emoji: '🍎', min: 1, max: 5 },
  ],
  [
    { name: 'Oranges', emoji: '🍊', min: 2, max: 6 },
    { name: 'Grapes',  emoji: '🍇', min: 1, max: 5 },
  ],
  [
    { name: 'Mangoes', emoji: '🥭', min: 2, max: 5 },
    { name: 'Lemons',  emoji: '🍋', min: 1, max: 4 },
  ],
  [
    { name: 'Strawberries', emoji: '🍓', min: 2, max: 5 },
    { name: 'Cherries',     emoji: '🍒', min: 1, max: 4 },
  ],
  [
    { name: 'Watermelons', emoji: '🍉', min: 1, max: 4 },
    { name: 'Pineapples',  emoji: '🍍', min: 1, max: 3 },
  ],
];

const STORY_NAMES  = ['Andrew', 'Mia', 'Ravi', 'Tara', 'Sam', 'Anu', 'Leo', 'Zara'];
const STORE_PLACES = ['the store', 'the market', 'the shop', 'the fruit stall'];

function generatePictographQuestion(skill, random, mode) {
  const fruitSet = PICTOGRAPH_FRUIT_SETS[randInt(random, 0, PICTOGRAPH_FRUIT_SETS.length - 1)];

  const correctCounts = fruitSet.map(fruit => ({
    ...fruit,
    count: randInt(random, fruit.min, fruit.max),
  }));

  // Build a wrong option: change counts by small delta
  const wrongCounts = correctCounts.map(fruit => {
    const delta = random() < 0.6 ? (random() < 0.5 ? 1 : -1) : (random() < 0.5 ? 2 : -2);
    return { ...fruit, count: Math.max(1, Math.min(fruit.max + 2, fruit.count + delta)) };
  });

  const allSame = wrongCounts.every((f, i) => f.count === correctCounts[i].count);
  if (allSame) wrongCounts[0] = { ...wrongCounts[0], count: Math.max(1, wrongCounts[0].count + 1) };

  // Build scatter positions for the scene SVG (3 rows, 7 columns to decrease height)
  const scatterPositions = [];
  const usedSlots = new Set();
  const COLS = 7, ROWS = 3;
  correctCounts.forEach(fruit => {
    for (let k = 0; k < fruit.count; k++) {
      let slot;
      do { slot = `${randInt(random, 0, COLS - 1)}_${randInt(random, 0, ROWS - 1)}`; }
      while (usedSlots.has(slot));
      usedSlots.add(slot);
      const [col, row] = slot.split('_').map(Number);
      scatterPositions.push({
        emoji: fruit.emoji,
        name: fruit.name,
        x: col * 65 + 35 + randInt(random, -8, 8), // tightened x-spacing
        y: row * 60 + 40 + randInt(random, -8, 8),  // tightened y-spacing to fit height of 200
        rotate: randInt(random, -25, 25),          // slightly gentler rotation
        scale: 1.0 + random() * 0.2,               // larger base scale
      });
    }
  });

  const personName = STORY_NAMES[randInt(random, 0, STORY_NAMES.length - 1)];
  const place = STORE_PLACES[randInt(random, 0, STORE_PLACES.length - 1)];
  const fruitLabel = fruitSet.map(f => f.name.toLowerCase()).join(' and ');
  const storyText = `${personName} went to ${place}. He bought some ${fruitLabel}.`;
  const questionText = 'Which pictograph shows the right number of each fruit?';

  const correctOptionIndex = randInt(random, 0, 1);
  const optionData = correctOptionIndex === 0
    ? [correctCounts, wrongCounts]
    : [wrongCounts, correctCounts];

  const solutionText = correctCounts.map(f => `${f.name}: ${f.count}`).join(', ');

  return {
    type: 'mcq',
    interaction: 'pictograph_mcq',
    questionText,
    metaConfig: { readable: true },
    parts: [
      {
        type: 'text',
        content: storyText,
        showSpeaker: true,
        style: { fontSize: '22px', fontWeight: 700 },
      },
      {
        type: 'pictograph_scene',
        items: scatterPositions,
        svgWidth: 460,
        svgHeight: 200, // decreased height to 200
      },
      {
        type: 'text',
        content: questionText,
        showSpeaker: true,
        style: { fontSize: '22px', fontWeight: 700, marginTop: 16 },
      },
    ],
    options: optionData.map((counts, idx) => ({
      id: `picto_${idx}`,
      label: `Option ${idx + 1}`,
      pictograph: {
        title: fruitSet[0].name.replace(/s$/, '').replace(/ies$/, 'y'),
        rows: counts.map(fruit => ({
          label: fruit.name,
          emoji: fruit.emoji,
          count: fruit.count,
          maxCols: 6,
        })),
      },
    })),
    answer: correctOptionIndex,
    correctAnswerIndex: correctOptionIndex,
    solution: {
      sections: [{ type: 'text', content: `The correct pictograph shows: ${solutionText}.` }],
    },
  };
}

// ── Begin Venn Diagram & Number Ordering Generators ──────────────────────────

function vennDiagramSvg(leftLabel, rightLabel, leftItems = [], middleItems = [], rightItems = [], outsideItems = []) {
  const renderItem = (item, x, y) => {
    if (item.shape === 'circle') {
      return `<circle cx="${x}" cy="${y}" r="12" fill="${item.color}" stroke="${item.stroke}" stroke-width="2"/>`;
    } else if (item.shape === 'square') {
      return `<rect x="${x-12}" y="${y-12}" width="24" height="24" fill="${item.color}" stroke="${item.stroke}" stroke-width="2" rx="2"/>`;
    } else {
      return `<polygon points="${x},${y-12} ${x-12},${y+12} ${x+12},${y+12}" fill="${item.color}" stroke="${item.stroke}" stroke-width="2"/>`;
    }
  };

  const leftItemsSvg = leftItems.map((item, idx) => {
    const offsets = [[-25, -20], [-25, 20], [0, 0]];
    const [dx, dy] = offsets[idx % offsets.length];
    return renderItem(item, 120 + dx, 120 + dy);
  }).join('');

  const middleItemsSvg = middleItems.map((item, idx) => {
    const offsets = [[0, -20], [0, 20]];
    const [dx, dy] = offsets[idx % offsets.length];
    return renderItem(item, 200 + dx, 120 + dy);
  }).join('');

  const rightItemsSvg = rightItems.map((item, idx) => {
    const offsets = [[25, -20], [25, 20], [0, 0]];
    const [dx, dy] = offsets[idx % offsets.length];
    return renderItem(item, 280 + dx, 120 + dy);
  }).join('');

  const outsideItemsSvg = outsideItems.map((item, idx) => {
    const x = idx % 2 === 0 ? 50 : 350;
    const y = 50 + Math.floor(idx / 2) * 120;
    return renderItem(item, x, y);
  }).join('');

  return `<svg width="100%" height="240" viewBox="0 0 400 240" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:2px solid #cbd5e1; border-radius:12px; display:block; margin:0 auto; max-width:400px;">
    <circle cx="160" cy="120" r="85" fill="rgba(244, 63, 94, 0.08)" stroke="#f43f5e" stroke-width="3"/>
    <circle cx="240" cy="120" r="85" fill="rgba(59, 130, 246, 0.08)" stroke="#3b82f6" stroke-width="3"/>
    <text x="110" y="45" font-size="14" font-weight="800" fill="#e11d48" text-anchor="middle">${leftLabel.toUpperCase()}</text>
    <text x="290" y="45" font-size="14" font-weight="800" fill="#2563eb" text-anchor="middle">${rightLabel.toUpperCase()}</text>
    ${leftItemsSvg}
    ${middleItemsSvg}
    ${rightItemsSvg}
    ${outsideItemsSvg}
  </svg>`;
}

function shapeSvgDataUrl(colorObj, shapeName) {
  const fill = colorObj.value;
  const stroke = colorObj.stroke;
  let itemSvg = '';
  if (shapeName === 'circle') {
    itemSvg = `<circle cx="40" cy="40" r="30" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
  } else if (shapeName === 'square') {
    itemSvg = `<rect x="12" y="12" width="56" height="56" fill="${fill}" stroke="${stroke}" stroke-width="4" rx="4"/>`;
  } else {
    itemSvg = `<polygon points="40,10 10,70 70,70" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
  }
  const svg = `<svg viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg">${itemSvg}</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function vennDiagramButtonsSvg(leftLabel, rightLabel, leftImage, middleImage, rightImage, outsideImage) {
  const leftItem = leftImage ? `<image href="${leftImage}" x="142" y="102" width="36" height="36" preserveAspectRatio="xMidYMid meet"/>` : '';
  const middleItem = middleImage ? `<image href="${middleImage}" x="202" y="102" width="36" height="36" preserveAspectRatio="xMidYMid meet"/>` : '';
  const rightItem = rightImage ? `<image href="${rightImage}" x="262" y="102" width="36" height="36" preserveAspectRatio="xMidYMid meet"/>` : '';
  const outsideItem = outsideImage ? `<image href="${outsideImage}" x="48" y="162" width="36" height="36" preserveAspectRatio="xMidYMid meet"/>` : '';

  return `<svg viewBox="0 0 440 240" xmlns="http://www.w3.org/2000/svg" style="background:#f8fafc; border:2px solid #cbd5e1; border-radius:12px; display:block; margin:0 auto; max-width:440px; width:100%;">
    <circle cx="160" cy="120" r="85" fill="rgba(244, 63, 94, 0.04)" stroke="#f43f5e" stroke-width="3"/>
    <circle cx="280" cy="120" r="85" fill="rgba(59, 130, 246, 0.04)" stroke="#3b82f6" stroke-width="3"/>
    <text x="130" y="45" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#e11d48" text-anchor="middle">${leftLabel.toUpperCase()}</text>
    <text x="310" y="45" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#2563eb" text-anchor="middle">${rightLabel.toUpperCase()}</text>
    ${leftItem}
    ${middleItem}
    ${rightItem}
    ${outsideItem}
  </svg>`;
}

function renderSingleItemSvg(colorObj, shapeName) {
  const fill = colorObj.value;
  const stroke = colorObj.stroke;
  let itemSvg = '';
  if (shapeName === 'circle') {
    itemSvg = `<circle cx="40" cy="40" r="28" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
  } else if (shapeName === 'square') {
    itemSvg = `<rect x="12" y="12" width="56" height="56" fill="${fill}" stroke="${stroke}" stroke-width="4" rx="4"/>`;
  } else {
    itemSvg = `<polygon points="40,8 8,72 72,72" fill="${fill}" stroke="${stroke}" stroke-width="4"/>`;
  }
  return `<svg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:10px auto;">${itemSvg}</svg>`;
}

function numberCardsSvg(numbers) {
  const cardWidth = 60;
  const cardHeight = 80;
  const spacing = 15;
  const totalWidth = numbers.length * cardWidth + (numbers.length - 1) * spacing + 40;
  
  const cards = numbers.map((num, idx) => {
    const x = 20 + idx * (cardWidth + spacing);
    const y = 20;
    const bgColors = ['#fef3c7', '#dcfce7', '#dbeafe', '#fce7f3'];
    const textColors = ['#d97706', '#15803d', '#1d4ed8', '#be185d'];
    const bg = bgColors[idx % bgColors.length];
    const textCol = textColors[idx % textColors.length];
    
    return `<g>
      <rect x="${x}" y="${y}" width="${cardWidth}" height="${cardHeight}" fill="${bg}" stroke="${textCol}" stroke-width="3" rx="12" filter="drop-shadow(0 4px 6px rgba(0,0,0,0.05))"/>
      <text x="${x + cardWidth/2}" y="${y + cardHeight/2 + 8}" font-size="28" font-weight="900" fill="${textCol}" text-anchor="middle">${num}</text>
    </g>`;
  }).join('');
  
  return `<svg width="100%" height="120" viewBox="0 0 ${totalWidth} 120" xmlns="http://www.w3.org/2000/svg" style="display:block; margin:0 auto; justify-content:center; max-width:${totalWidth}px;">
    ${cards}
  </svg>`;
}

function generateVennDiagramQuestion(skill, random, mode) {
  const colorsList = [
    { name: 'red', value: '#ef4444', stroke: '#b91c1c' },
    { name: 'blue', value: '#3b82f6', stroke: '#1d4ed8' },
    { name: 'green', value: '#10b981', stroke: '#047857' },
    { name: 'pink', value: '#ec4899', stroke: '#be185d' },
    { name: 'orange', value: '#f97316', stroke: '#c2410c' }
  ];

  const shapesList = [
    { name: 'triangle', shape: 'triangle' },
    { name: 'square', shape: 'square' },
    { name: 'circle', shape: 'circle' }
  ];

  const color = colorsList[randInt(random, 0, colorsList.length - 1)];
  const shape = shapesList[randInt(random, 0, shapesList.length - 1)];

  const leftLabel = `${color.name} shapes`;
  const rightLabel = `${shape.name}s`;

  if (mode === 'venn_sort') {
    const chosenColor = colorsList[randInt(random, 0, colorsList.length - 1)];
    const chosenShape = shapesList[randInt(random, 0, shapesList.length - 1)];

    const leftLabel = `${chosenColor.name} shapes`;
    const rightLabel = `${chosenShape.name}s`;

    // 1. Generate the 4 shapes stickers corresponding to each region
    const otherShapes = shuffle(random, shapesList.filter(s => s.name !== chosenShape.name));
    const shLeft = otherShapes[0];
    const itemLeft = {
      id: 0,
      type: 'left',
      name: `${chosenColor.name} ${shLeft.name}`,
      imageUrl: shapeSvgDataUrl(chosenColor, shLeft.shape),
      widthPercent: 12,
      heightPercent: 12
    };

    const itemMiddle = {
      id: 1,
      type: 'middle',
      name: `${chosenColor.name} ${chosenShape.name}`,
      imageUrl: shapeSvgDataUrl(chosenColor, chosenShape.shape),
      widthPercent: 12,
      heightPercent: 12
    };

    const otherColors = shuffle(random, colorsList.filter(c => c.name !== chosenColor.name));
    const colorRight = otherColors[0];
    const itemRight = {
      id: 2,
      type: 'right',
      name: `${colorRight.name} ${chosenShape.name}`,
      imageUrl: shapeSvgDataUrl(colorRight, chosenShape.shape),
      widthPercent: 12,
      heightPercent: 12
    };

    const colorOutside = otherColors[1];
    const shOutside = otherShapes[1];
    const itemOutside = {
      id: 3,
      type: 'outside',
      name: `${colorOutside.name} ${shOutside.name}`,
      imageUrl: shapeSvgDataUrl(colorOutside, shOutside.shape),
      widthPercent: 12,
      heightPercent: 12
    };

    const stickers = [itemLeft, itemMiddle, itemRight, itemOutside];

    // Targets in the Venn Diagram
    const targets = [
      {
        id: 't_left',
        type: 'left',
        name: 'Left circle area',
        x: 34,
        y: 52,
        widthPercent: 12,
        heightPercent: 12,
        label: 'Left circle area'
      },
      {
        id: 't_middle',
        type: 'middle',
        name: 'Middle overlap area',
        x: 50,
        y: 52,
        widthPercent: 12,
        heightPercent: 12,
        label: 'Middle overlap area'
      },
      {
        id: 't_right',
        type: 'right',
        name: 'Right circle area',
        x: 66,
        y: 52,
        widthPercent: 12,
        heightPercent: 12,
        label: 'Right circle area'
      },
      {
        id: 't_outside_left',
        type: 'outside',
        name: 'Outside both circles (left)',
        x: 14,
        y: 75,
        widthPercent: 12,
        heightPercent: 12,
        label: 'Outside both circles'
      },
      {
        id: 't_outside_right',
        type: 'outside',
        name: 'Outside both circles (right)',
        x: 86,
        y: 75,
        widthPercent: 12,
        heightPercent: 12,
        label: 'Outside both circles'
      }
    ];

    // Select one sticker that the user has to place. The other 3 will be pre-placed.
    const userStickerId = randInt(random, 0, 3);
    const targetSticker = stickers[userStickerId];

    const initialPlacements = [];
    [0, 1, 2, 3].forEach(idx => {
      if (idx !== userStickerId) {
        const target = targets.find(t => t.type === stickers[idx].type);
        initialPlacements.push({
          id: idx,
          x: target.x,
          y: target.y,
          isSnapped: true,
          type: stickers[idx].type
        });
      }
    });

    // Generate the SVG on the fly as a data URI
    const svgString = `<svg width="550" height="240" viewBox="0 0 550 240" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" rx="12"/>
      <circle cx="215" cy="120" r="90" fill="rgba(244, 63, 94, 0.02)" stroke="#f43f5e" stroke-width="3"/>
      <circle cx="335" cy="120" r="90" fill="rgba(59, 130, 246, 0.02)" stroke="#3b82f6" stroke-width="3"/>
      <text x="170" y="45" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#e11d48" text-anchor="middle">${leftLabel.toUpperCase()}</text>
      <text x="380" y="45" font-family="system-ui, sans-serif" font-size="14" font-weight="800" fill="#2563eb" text-anchor="middle">${rightLabel.toUpperCase()}</text>
    </svg>`;
    const sceneImageUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svgString)}`;

    const questionText = `Put the **${targetSticker.name}** into the Venn diagram.`;

    let explanationText = "";
    if (targetSticker.type === 'left') {
      explanationText = `Great sorting! The **${targetSticker.name}** is ${chosenColor.name}, so it belongs in the ${chosenColor.name} shapes circle.`;
    } else if (targetSticker.type === 'middle') {
      explanationText = `You got it! The **${targetSticker.name}** is ${chosenColor.name} and it is a ${chosenShape.name}, so it belongs in the middle overlap.`;
    } else if (targetSticker.type === 'right') {
      explanationText = `Awesome! The **${targetSticker.name}** is a ${chosenShape.name}, so it belongs in the ${chosenShape.name}s circle.`;
    } else {
      explanationText = `Great job! The **${targetSticker.name}** is not ${chosenColor.name} and not a ${chosenShape.name}, so it belongs outside both circles.`;
    }

    return {
      type: 'mcq',
      interaction: 'interactive_stickers',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        {
          type: 'interactive_stickers',
          mode: 'shadow_match',
          isVenn: true,
          hideTargetShadows: true,
          sceneImageUrl,
          stickers,
          targets,
          initialPlacements,
          itemLabel: 'buttons'
        }
      ],
      options: [],
      answer: targets.length,
      solution: {
        sections: [
          {
            type: 'text',
            content: explanationText
          }
        ]
      }
    };
  } else {
    const leftNonShapes = shapesList.filter(s => s.name !== shape.name);
    const leftItems = Array.from({ length: randInt(random, 1, 2) }, () => {
      const sh = leftNonShapes[randInt(random, 0, leftNonShapes.length - 1)];
      return { shape: sh.shape, color: color.value, stroke: color.stroke };
    });

    const middleItems = Array.from({ length: randInt(random, 1, 2) }, () => {
      return { shape: shape.shape, color: color.value, stroke: color.stroke };
    });

    const rightNonColors = colorsList.filter(c => c.name !== color.name);
    const rightItems = Array.from({ length: randInt(random, 1, 2) }, () => {
      const col = rightNonColors[randInt(random, 0, rightNonColors.length - 1)];
      return { shape: shape.shape, color: col.value, stroke: col.stroke };
    });

    const outsideItems = Array.from({ length: randInt(random, 1, 2) }, () => {
      const sh = leftNonShapes[randInt(random, 0, leftNonShapes.length - 1)];
      const col = rightNonColors[randInt(random, 0, rightNonColors.length - 1)];
      return { shape: sh.shape, color: col.value, stroke: col.stroke };
    });

    const queryTypes = ['left_total', 'right_total', 'intersection', 'outside'];
    const queryType = queryTypes[randInt(random, 0, queryTypes.length - 1)];

    let questionText = '';
    let answer = 0;
    let solutionText = '';

    if (queryType === 'left_total') {
      questionText = `How many **${color.name} shapes** are in the Venn diagram?`;
      answer = leftItems.length + middleItems.length;
      solutionText = `There are ${leftItems.length} ${color.name} shapes that are not ${shape.name}s, and ${middleItems.length} ${color.name} ${shape.name}s in the overlap. In total, there are ${leftItems.length} + ${middleItems.length} = ${answer} ${color.name} shapes.`;
    } else if (queryType === 'right_total') {
      questionText = `How many **${shape.name}s** are in the Venn diagram?`;
      answer = middleItems.length + rightItems.length;
      solutionText = `There are ${rightItems.length} ${shape.name}s that are not ${color.name}, and ${middleItems.length} ${color.name} ${shape.name}s in the overlap. In total, there are ${middleItems.length} + ${rightItems.length} = ${answer} ${shape.name}s.`;
    } else if (queryType === 'intersection') {
      questionText = `How many **${color.name} ${shape.name}s** are in the overlap in the middle?`;
      answer = middleItems.length;
      solutionText = `The overlap in the middle contains shapes that are both ${color.name} and ${shape.name}s. There are exactly ${answer} of them.`;
    } else {
      questionText = 'How many shapes are **outside** the circles?';
      answer = outsideItems.length;
      solutionText = `The shapes outside both circles do not match the labels. There are exactly ${answer} shapes outside the circles.`;
    }

    const options = Array.from({ length: 7 }, (_, i) => ({
      id: String(i),
      label: String(i)
    }));

    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: vennDiagramSvg(leftLabel, rightLabel, leftItems, middleItems, rightItems, outsideItems) }
      ],
      options,
      answer: String(answer),
      correctAnswerIndex: answer,
      solution: {
        sections: [{ type: 'text', content: solutionText }]
      }
    };
  }
}

function generateOrderNumbersQuestion(skill, random, mode) {
  const count = 3 + (random() > 0.5 ? 1 : 0);
  const rangeMin = 1;
  const rangeMax = mode.endsWith('10') ? 10 : 20;

  const numbers = [];
  while (numbers.length < count) {
    const num = randInt(random, rangeMin, rangeMax);
    if (!numbers.includes(num)) {
      numbers.push(num);
    }
  }

  const direction = random() > 0.5 ? 'ascending' : 'descending';
  const sortedNumbers = [...numbers].sort((a, b) => direction === 'ascending' ? a - b : b - a);
  const correctAnswerLabel = sortedNumbers.join(', ');

  const optionsSet = new Set();
  optionsSet.add(correctAnswerLabel);

  const maxAttempts = 15;
  let attempts = 0;
  while (optionsSet.size < 3 && attempts < maxAttempts) {
    attempts++;
    const shuffled = shuffle(random, [...numbers]);
    const label = shuffled.join(', ');
    if (label !== correctAnswerLabel) {
      optionsSet.add(label);
    }
  }

  while (optionsSet.size < 3) {
    optionsSet.add(shuffle(random, [...numbers]).join(', '));
  }

  const choices = Array.from(optionsSet);
  const questionText = `Put these numbers in order from **${direction === 'ascending' ? 'smallest to largest' : 'largest to smallest'}**:`;

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: questionText },
      { type: 'svg', content: numberCardsSvg(numbers) }
    ],
    options: choices.map(choice => ({ id: choice, label: choice })),
    answer: correctAnswerLabel,
    correctAnswerIndex: choices.indexOf(correctAnswerLabel),
    solution: {
      sections: [{ type: 'text', content: `Comparing the values from ${direction === 'ascending' ? 'smallest to largest' : 'largest to smallest'} gives: ${correctAnswerLabel}.` }]
    }
  };
}

// ── End Venn Diagram & Number Ordering Generators ────────────────────────────

function generateProgressionQuestion(skill, random, config = {}) {

  const { mode, limit } = skill.params;
  const upper = Math.max(2, limit);
  const correctStreak = config.history?.correctStreak ?? 0;

  if (mode.startsWith('pattern_')) {
    return generatePatternQuestion(skill, random);
  }

  if (mode.startsWith('addition_')) {
    return generateUkgAdditionQuestion(skill, random);
  }

  if (mode.startsWith('subtraction_')) {
    return generateUkgSubtractionQuestion(skill, random);
  }

  if (mode === 'count') {
    const answer = randInt(random, 11, upper);
    return mcq('How many stickers are there?', answer, choicesNear(random, answer, 1, upper), [
      { type: 'svg', content: stickerSvg(answer) }
    ]);
  }

  if (mode === 'ten_frame_count' || mode === 'ten_frame_show' || mode === 'represent') {
    const answer = randInt(random, 1, upper);
    const prompts = {
      ten_frame_count: 'How many counters are shown?',
      ten_frame_show: 'Which number is shown on the ten frames?',
      represent: 'Which number does this model represent?'
    };
    return mcq(prompts[mode], answer, choicesNear(random, answer, 0, upper), [
      { type: 'svg', content: tenFrameSvg(answer, upper) }
    ]);
  }

  if (mode === 'stickers') {
    const targetCount = randInt(random, 1, upper);
    const useCatV2Contract = skill.skillId === 'ukg-count3-stickers';
    const stickerChoices = [
      { imageUrl: '/images/rabbit.svg', singular: 'rabbit', plural: 'rabbits', widthPercent: 9, heightPercent: 16 },
      { imageUrl: '/images/penguin.svg', singular: 'penguin', plural: 'penguins', widthPercent: 8, heightPercent: 15 },
    ];
    const selectedSticker = stickerChoices[randInt(random, 0, stickerChoices.length - 1)];
    const itemLabel = targetCount === 1 ? selectedSticker.singular : selectedSticker.plural;
    const questionText = `Put ${targetCount} ${itemLabel} in the picture.`;
    return {
      type: useCatV2Contract ? 'categorizationv2' : 'mcq',
      interaction: 'interactive_stickers',
      ...(useCatV2Contract ? { layoutMode: 'sticker_scene', renderer: 'html' } : {}),
      questionText,
      parts: [
        { type: 'text', content: questionText },
        {
          type: 'interactive_stickers',
          targetCount,
          capacity: Math.max(5, upper),
          sceneImageUrl: '/images/prek_landscape.webp',
          sticker: selectedSticker,
          itemLabel: selectedSticker.plural,
        }
      ],
      options: [],
      answer: targetCount,
      targetCount,
      solution: { sections: [{ type: 'text', content: `Place exactly ${targetCount} ${itemLabel}.` }] }
    };
  }

  if (mode === 'shadow_match') {
    const assets = shadowAssets.ukgNumbersShadowMatch;
    const questionText = 'Match the stickers to their correct shadow shapes in the picture.';
    return {
      type: 'mcq',
      interaction: 'interactive_stickers',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        {
          type: 'interactive_stickers',
          mode: 'shadow_match',
          sceneImageUrl: assets.sceneImageUrl,
          stickers: assets.stickers,
          targets: assets.targets,
          itemLabel: 'stickers',
        }
      ],
      options: [],
      answer: assets.targets.length,
      solution: { sections: [{ type: 'text', content: 'Match each sticker to its correct shadow shape.' }] }
    };
  }

  if (mode === 'pictograph_correct' || mode === 'pictograph_read') {
    return generatePictographQuestion(skill, random, mode);
  }
  if (['one_more', 'count_one_more', 'one_less', 'count_one_less'].includes(mode)) {
    const isMore = mode.includes('more');
    const start = randInt(random, isMore ? 0 : 2, isMore ? upper - 1 : upper);
    const answer = start + (isMore ? 1 : -1);
    const objectChoices = [
      { imageUrl: '/images/lkg/apple.png', singular: 'apple', plural: 'apples' },
      { imageUrl: '/images/lkg/flower.png', singular: 'flower', plural: 'flowers' },
      { imageUrl: '/images/lkg/car.png', singular: 'car', plural: 'cars' },
      { imageUrl: '/images/rabbit.svg', singular: 'rabbit', plural: 'rabbits' },
      { imageUrl: '/images/penguin.svg', singular: 'penguin', plural: 'penguins' },
    ];
    const object = objectChoices[randInt(random, 0, objectChoices.length - 1)];
    const questionText = mode.startsWith('count_')
      ? `There are ${start} ${start === 1 ? object.singular : object.plural} in the top row. How many ${object.plural} are in the bottom row?`
      : `What is one ${isMore ? 'more' : 'less'} than ${start}?`;
    const visual = mode.startsWith('count_') ? [
      {
        type: 'text',
        content: `Hint: the bottom row has one ${isMore ? 'more' : 'less'}.`,
        showSpeaker: true,
        style: { fontSize: 'clamp(15px, 3vw, 19px)', fontWeight: 700, textAlign: 'center' },
      },
      {
        type: 'one_more_rows',
        startCount: start,
        comparisonCount: answer,
        capacity: upper,
        direction: isMore ? 'more' : 'less',
        object,
      },
    ] : [];
    return mcq(questionText, answer, choicesNear(random, answer, 0, upper), visual);
  }

  if (['one_more_less', 'count_one_more_less', 'before_after_between'].includes(mode)) {
    const middle = randInt(random, 1, upper - 1);
    const askBefore = random() < 0.5;
    const answer = askBefore ? middle - 1 : middle + 1;
    const questionText = `${askBefore ? 'What comes before' : 'What comes after'} ${middle}?`;
    return mcq(questionText, answer, choicesNear(random, answer, 0, upper));
  }

  if (mode === 'next_number' || mode === 'forward_backward' || mode === 'complete_sequence') {
    const forward = mode === 'complete_sequence' || random() < 0.5;
    const start = randInt(random, forward ? 0 : 3, forward ? upper - 3 : upper);
    const sequence = [start, start + (forward ? 1 : -1), start + (forward ? 2 : -2)];
    const answer = start + (forward ? 3 : -3);
    return mcq(`What number comes next? ${sequence.join(', ')}, __`, answer, choicesNear(random, answer, 0, upper));
  }

  if (mode === 'fill_ten_frame') {
    const filled = randInt(random, 1, 9);
    const answer = 10 - filled;
    return mcq('How many more counters fill the ten frame?', answer, choicesNear(random, answer, 1, 10), [
      { type: 'svg', content: tenFrameSvg(filled) }
    ]);
  }

  if (mode === 'tally_marks') {
    const answer = randInt(random, 1, upper);
    return mcq('How many tally marks are shown?', answer, choicesNear(random, answer, 1, upper), [
      { type: 'svg', content: tallySvg(answer) }
    ]);
  }

  if (mode === 'number_line') {
    const answer = randInt(random, 0, upper);
    return mcq('What number is the marker pointing to?', answer, choicesNear(random, answer, 0, upper), [
      { type: 'svg', content: numberLineSvg(answer, upper) }
    ]);
  }

  if (mode === 'number_names') {
    const answer = randInt(random, 0, upper);
    const choices = choicesNear(random, answer, 0, upper).map((number) => NUMBER_NAMES[number]);
    return mcq(`Choose the name of the number ${answer}.`, NUMBER_NAMES[answer], choices);
  }

  if (mode === 'tens_ones') {
    const answer = randInt(random, 10, upper);
    return mcq('Count the tens and ones. What number is shown?', answer, choicesNear(random, answer, 10, upper), [
      { type: 'svg', content: tensOnesSvg(answer) }
    ]);
  }

  if (mode === 'learn_skip_twos' || mode === 'skip_twos') {
    const step = Math.max(2, Number(skill.params.step) || 2);
    const answer = randInt(random, 1, Math.floor(upper / step)) * step;
    const matchingAssets = SKIP_COUNT_GROUP_ASSETS[step] || [];
    const asset = matchingAssets.length
      ? matchingAssets[randInt(random, 0, matchingAssets.length - 1)]
      : null;
    const itemPlural = asset?.plural || 'counters';
    const isLearning = mode === 'learn_skip_twos';
    const questionText = isLearning
      ? `Count the ${itemPlural} by ${NUMBER_NAMES[step] || step}s. How many are there?`
      : `Skip-count the ${itemPlural} by ${NUMBER_NAMES[step] || step}s. How many are there?`;
    return mcq(questionText, answer, choicesByStepAdaptive(random, answer, upper, step, correctStreak), [
      {
        type: 'svg',
        content: skipCountGroupGridSvg(answer, asset, step, isLearning),
        style: { maxWidth: '760px', margin: '0 auto', justifyContent: 'center' }
      }
    ]);
  }

  if (mode === 'skip_twos_ten_frames') {
    const step = Math.max(2, Number(skill.params.step) || 2);
    const answer = randInt(random, 1, Math.floor(upper / step)) * step;
    return mcq(`Count the counters by ${NUMBER_NAMES[step] || step}s. How many are shown?`, answer, choicesByStepAdaptive(random, answer, upper, step, correctStreak), [
      { type: 'svg', content: tenFrameSvg(answer, upper, step) }
    ]);
  }

  if (mode === 'compare_enough') {
    const needed = randInt(random, 2, upper);
    const available = Math.min(upper, Math.max(1, needed + randInt(random, -2, 2)));
    const pair = comparisonEnoughPairs[randInt(random, 0, comparisonEnoughPairs.length - 1)];
    const answer = available >= needed ? 'yes' : 'no';
    return mcq(`Are there enough ${pair.supply.plural} for every ${pair.target.singular}?`, answer, ['yes', 'no'], [
      { type: 'svg', content: comparisonBoxesSvg(needed, available, pair.target, pair.supply, true), style: { maxWidth: '620px', margin: '0 auto', justifyContent: 'center' } }
    ]);
  }

  if (mode === 'compare_matching' || mode === 'compare_counting') {
    const left = randInt(random, 1, upper - 1);
    let right = randInt(random, 1, upper);
    if (right === left) right = right === upper ? right - 1 : right + 1;
    const [leftAsset, rightAsset] = shuffle(random, comparisonObjectAssets).slice(0, 2);
    const askMore = random() < 0.5;
    const answer = askMore
      ? (left > right ? leftAsset.plural : rightAsset.plural)
      : (left < right ? leftAsset.plural : rightAsset.plural);
    return mcq(`Which group has ${askMore ? 'more' : 'fewer'}?`, answer, [leftAsset.plural, rightAsset.plural], [
      { type: 'svg', content: comparisonBoxesSvg(left, right, leftAsset, rightAsset, mode === 'compare_matching'), style: { maxWidth: '650px', margin: '0 auto', justifyContent: 'center' } }
    ]);
  }

  if (mode === 'compare_mixed') {
    const green = randInt(random, 1, upper - 1);
    let pink = randInt(random, 1, upper - 1);
    if (pink === green) pink = pink === upper - 1 ? pink - 1 : pink + 1;
    const [firstAsset, secondAsset] = shuffle(random, comparisonObjectAssets).slice(0, 2);
    const askMore = random() < 0.5;
    const answer = askMore
      ? (green > pink ? firstAsset.plural : secondAsset.plural)
      : (green < pink ? firstAsset.plural : secondAsset.plural);
    return mcq(`Are there ${askMore ? 'more' : 'fewer'} ${firstAsset.plural} or ${secondAsset.plural}?`, answer, [firstAsset.plural, secondAsset.plural], [
      { type: 'svg', content: mixedComparisonSvg(green, pink, firstAsset, secondAsset, random), style: { maxWidth: '620px', margin: '0 auto', justifyContent: 'center' } }
    ]);
  }

  if (mode === 'compare_fewer_more_same') {
    const left = randInt(random, 1, upper);
    const relation = randInt(random, -1, 1);
    const right = Math.min(upper, Math.max(1, left + relation));
    const [leftAsset, rightAsset] = shuffle(random, comparisonObjectAssets).slice(0, 2);
    const relationWord = ['fewer', 'same number of', 'more'][randInt(random, 0, 2)];
    const statementIsTrue = relationWord === 'more'
      ? left > right
      : relationWord === 'fewer'
        ? left < right
        : left === right;
    const questionText = relationWord === 'same number of'
      ? `Are there the same number of ${leftAsset.plural} and ${rightAsset.plural}?`
      : `Are there ${relationWord} ${leftAsset.plural} than ${rightAsset.plural}?`;
    return mcq(questionText, statementIsTrue ? 'yes' : 'no', ['yes', 'no'], [
      { type: 'svg', content: comparisonBoxesSvg(left, right, leftAsset, rightAsset), style: { maxWidth: '650px', margin: '0 auto', justifyContent: 'center' } }
    ]);
  }

  if (mode === 'compare_two_numbers') {
    const first = randInt(random, 0, upper);
    let second = randInt(random, 0, upper);
    if (second === first) second = second === upper ? second - 1 : second + 1;
    const askLarger = random() < 0.5;
    return mcq(`Which number is ${askLarger ? 'larger' : 'smaller'}?`, askLarger ? Math.max(first, second) : Math.min(first, second), shuffle(random, [first, second]));
  }

  if (mode === 'compare_three_numbers') {
    const numbers = shuffle(random, Array.from({ length: upper + 1 }, (_, number) => number)).slice(0, 3);
    const askLargest = random() < 0.5;
    return mcq(`Which number is ${askLargest ? 'largest' : 'smallest'}?`, askLargest ? Math.max(...numbers) : Math.min(...numbers), numbers);
  }

  if (mode === 'venn_sort' || mode === 'venn_count') {
    return generateVennDiagramQuestion(skill, random, mode);
  }

  if (mode === 'order_numbers_10' || mode === 'order_numbers_20') {
    return generateOrderNumbersQuestion(skill, random, mode);
  }

  return mcq('What number comes next?', 3, [3, 2, 4, 1]);
}

const UKG_BUTTON_ASSETS = {
  circle: {
    label: 'round button',
    plural: 'round buttons',
    pink: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656379987-round-buttons-pink.webp',
    yellow: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656381647-round-buttons-yellow.webp',
    red: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656380817-round-buttons-red.webp',
    green: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656377875-round-buttons-green.webp',
  },
  triangle: {
    label: 'triangular button',
    plural: 'triangular buttons',
    pink: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656385146-triangular-buttons.webp',
    yellow: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656384207-triangular-buttons-yellow.webp',
    red: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656383427-triangular-buttons-red.webp',
    green: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1780656382619-triangular-buttons-green.webp',
  }
};

function resolveSortingDifficulty(config) {
  if (config.difficulty && config.difficulty !== 'adaptive') {
    return config.difficulty; // 'easy', 'medium', 'hard'
  }
  const level = config.history?.practiceLevel || 1;
  const streak = config.history?.correctStreak || 0;
  if (level >= 3 || streak >= 5) return 'hard';
  if (level >= 2 || streak >= 2) return 'medium';
  return 'easy';
}

function generateUkgClassifyShapesColorQuestion(skill, random, config) {
  const difficulty = resolveSortingDifficulty(config || {});
  const isColorSort = random() < 0.5;

  if (isColorSort) {
    // Green vs Red sorting
    const categories = [
      { id: 'red_shapes', label: 'Red buttons' },
      { id: 'green_shapes', label: 'Green buttons' }
    ];

    let items = [];
    if (difficulty === 'easy') {
      // 4 items, same shape (e.g. all circles)
      const chosenShape = random() < 0.5 ? 'circle' : 'triangle';
      items = [
        {
          id: `red_${chosenShape}_btn_1`,
          content: `Red ${chosenShape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[chosenShape].red,
          target: 'red_shapes',
          categoryId: 'red_shapes'
        },
        {
          id: `red_${chosenShape}_btn_2`,
          content: `Red ${chosenShape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[chosenShape].red,
          target: 'red_shapes',
          categoryId: 'red_shapes'
        },
        {
          id: `green_${chosenShape}_btn_1`,
          content: `Green ${chosenShape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[chosenShape].green,
          target: 'green_shapes',
          categoryId: 'green_shapes'
        },
        {
          id: `green_${chosenShape}_btn_2`,
          content: `Green ${chosenShape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[chosenShape].green,
          target: 'green_shapes',
          categoryId: 'green_shapes'
        }
      ];
    } else if (difficulty === 'medium') {
      // 6 items, mixed shapes (3 red, 3 green)
      const shapesRed = shuffle(random, ['circle', 'circle', 'triangle']);
      const shapesGreen = shuffle(random, ['circle', 'triangle', 'triangle']);
      const redItems = shapesRed.map((shape, idx) => ({
        id: `red_${shape}_btn_${idx}`,
        content: `Red ${shape === 'circle' ? 'round' : 'triangular'} button`,
        imageUrl: UKG_BUTTON_ASSETS[shape].red,
        target: 'red_shapes',
        categoryId: 'red_shapes'
      }));
      const greenItems = shapesGreen.map((shape, idx) => ({
        id: `green_${shape}_btn_${idx}`,
        content: `Green ${shape === 'circle' ? 'round' : 'triangular'} button`,
        imageUrl: UKG_BUTTON_ASSETS[shape].green,
        target: 'green_shapes',
        categoryId: 'green_shapes'
      }));
      items = [...redItems, ...greenItems];
    } else {
      // hard: 8 items, mixed shapes (4 red, 4 green)
      const shapesRed = shuffle(random, ['circle', 'circle', 'triangle', 'triangle']);
      const shapesGreen = shuffle(random, ['circle', 'circle', 'triangle', 'triangle']);
      const redItems = shapesRed.map((shape, idx) => ({
        id: `red_${shape}_btn_${idx}`,
        content: `Red ${shape === 'circle' ? 'round' : 'triangular'} button`,
        imageUrl: UKG_BUTTON_ASSETS[shape].red,
        target: 'red_shapes',
        categoryId: 'red_shapes'
      }));
      const greenItems = shapesGreen.map((shape, idx) => ({
        id: `green_${shape}_btn_${idx}`,
        content: `Green ${shape === 'circle' ? 'round' : 'triangular'} button`,
        imageUrl: UKG_BUTTON_ASSETS[shape].green,
        target: 'green_shapes',
        categoryId: 'green_shapes'
      }));
      items = [...redItems, ...greenItems];
    }

    const shuffledItems = shuffle(random, items).map(item => ({ ...item, imageWidth: 80 }));
    const answer = Object.fromEntries(shuffledItems.map(item => [item.id, item.target]));
    const questionText = 'Sort the buttons by colour into Red and Green.';

    return {
      type: 'categorizationv2',
      renderer: 'html',
      layoutMode: 'category_sort',
      hideItemLabels: true,
      borderlessItems: true,
      questionText,
      parts: [{ type: 'text', content: questionText }],
      categories,
      items: shuffledItems,
      answer,
      correctAnswer: answer,
      solution: {
        sections: [
          { type: 'text', content: 'Put all the red buttons in the "Red buttons" group, and all the green buttons in the "Green buttons" group.' }
        ]
      }
    };
  } else {
    // Shapes sort: Round vs Triangular
    const categories = [
      { id: 'round_shapes', label: 'Round buttons' },
      { id: 'triangular_shapes', label: 'Triangular buttons' }
    ];

    let items = [];
    if (difficulty === 'easy') {
      const chosenColor = shuffle(random, ['pink', 'yellow', 'red', 'green'])[0];
      const roundItems = [1, 2].map((_, idx) => ({
        id: `round_${chosenColor}_btn_${idx}`,
        content: `${chosenColor.charAt(0).toUpperCase() + chosenColor.slice(1)} round button`,
        imageUrl: UKG_BUTTON_ASSETS.circle[chosenColor],
        target: 'round_shapes',
        categoryId: 'round_shapes'
      }));
      const triangularItems = [1, 2].map((_, idx) => ({
        id: `triangular_${chosenColor}_btn_${idx}`,
        content: `${chosenColor.charAt(0).toUpperCase() + chosenColor.slice(1)} triangular button`,
        imageUrl: UKG_BUTTON_ASSETS.triangle[chosenColor],
        target: 'triangular_shapes',
        categoryId: 'triangular_shapes'
      }));
      items = [...roundItems, ...triangularItems];
    } else if (difficulty === 'medium') {
      const colors = ['pink', 'yellow', 'red', 'green'];
      const chosenColors = shuffle(random, colors).slice(0, 3);
      const roundItems = chosenColors.map((color, idx) => ({
        id: `round_${color}_btn_${idx}`,
        content: `${color.charAt(0).toUpperCase() + color.slice(1)} round button`,
        imageUrl: UKG_BUTTON_ASSETS.circle[color],
        target: 'round_shapes',
        categoryId: 'round_shapes'
      }));
      const triangularItems = chosenColors.map((color, idx) => ({
        id: `triangular_${color}_btn_${idx}`,
        content: `${color.charAt(0).toUpperCase() + color.slice(1)} triangular button`,
        imageUrl: UKG_BUTTON_ASSETS.triangle[color],
        target: 'triangular_shapes',
        categoryId: 'triangular_shapes'
      }));
      items = [...roundItems, ...triangularItems];
    } else {
      const colors = ['pink', 'yellow', 'red', 'green'];
      const chosenColors = shuffle(random, colors);
      const roundItems = chosenColors.map((color, idx) => ({
        id: `round_${color}_btn_${idx}`,
        content: `${color.charAt(0).toUpperCase() + color.slice(1)} round button`,
        imageUrl: UKG_BUTTON_ASSETS.circle[color],
        target: 'round_shapes',
        categoryId: 'round_shapes'
      }));
      const triangularItems = chosenColors.map((color, idx) => ({
        id: `triangular_${color}_btn_${idx}`,
        content: `${color.charAt(0).toUpperCase() + color.slice(1)} triangular button`,
        imageUrl: UKG_BUTTON_ASSETS.triangle[color],
        target: 'triangular_shapes',
        categoryId: 'triangular_shapes'
      }));
      items = [...roundItems, ...triangularItems];
    }

    const shuffledItems = shuffle(random, items).map(item => ({ ...item, imageWidth: 80 }));
    const answer = Object.fromEntries(shuffledItems.map(item => [item.id, item.target]));
    const questionText = 'Sort the buttons into Round and Triangular.';

    return {
      type: 'categorizationv2',
      renderer: 'html',
      layoutMode: 'category_sort',
      hideItemLabels: true,
      borderlessItems: true,
      questionText,
      parts: [{ type: 'text', content: questionText }],
      categories,
      items: shuffledItems,
      answer,
      correctAnswer: answer,
      solution: {
        sections: [
          { type: 'text', content: 'Put all the round buttons in the "Round buttons" group, and all the triangular buttons in the "Triangular buttons" group.' }
        ]
      }
    };
  }
}

function generateUkgSortingQuestion(skill, random, config) {
  const difficulty = resolveSortingDifficulty(config || {});
  const mode = skill.params.mode;

  // Determine sorting type
  let isColorSort = false;
  if (mode === 'sort_color') {
    isColorSort = true;
  } else if (mode === 'sort_shape') {
    isColorSort = false;
  } else if (mode === 'classify_sort') {
    isColorSort = random() > 0.5;
  }

  const colors = ['pink', 'yellow', 'red', 'green'];

  if (isColorSort) {
    // Sort by Color
    // Choose 2 random colors to sort
    const sortedColors = shuffle(random, colors).slice(0, 2);
    const colorA = sortedColors[0];
    const colorB = sortedColors[1];

    const categories = [
      { id: `${colorA}_group`, label: `${colorA.charAt(0).toUpperCase() + colorA.slice(1)} buttons` },
      { id: `${colorB}_group`, label: `${colorB.charAt(0).toUpperCase() + colorB.slice(1)} buttons` }
    ];

    let items = [];

    if (difficulty === 'easy') {
      // 4 items total (2 of Color A, 2 of Color B). All same shape (e.g. all circle).
      const chosenShape = random() < 0.5 ? 'circle' : 'triangle';
      [1, 2].forEach((_, idx) => {
        items.push({
          id: `btn_${colorA}_${chosenShape}_${idx}`,
          content: `${colorA.charAt(0).toUpperCase() + colorA.slice(1)} ${chosenShape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[chosenShape][colorA],
          target: `${colorA}_group`,
          categoryId: `${colorA}_group`
        });
      });
      [1, 2].forEach((_, idx) => {
        items.push({
          id: `btn_${colorB}_${chosenShape}_${idx}`,
          content: `${colorB.charAt(0).toUpperCase() + colorB.slice(1)} ${chosenShape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[chosenShape][colorB],
          target: `${colorB}_group`,
          categoryId: `${colorB}_group`
        });
      });
    } else if (difficulty === 'medium') {
      // 6 items total (3 of Color A, 3 of Color B). Mixed shapes.
      const shapesA = shuffle(random, ['circle', 'circle', 'triangle']);
      const shapesB = shuffle(random, ['circle', 'triangle', 'triangle']);
      shapesA.forEach((shape, idx) => {
        items.push({
          id: `btn_${colorA}_${shape}_${idx}`,
          content: `${colorA.charAt(0).toUpperCase() + colorA.slice(1)} ${shape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[shape][colorA],
          target: `${colorA}_group`,
          categoryId: `${colorA}_group`
        });
      });
      shapesB.forEach((shape, idx) => {
        items.push({
          id: `btn_${colorB}_${shape}_${idx}`,
          content: `${colorB.charAt(0).toUpperCase() + colorB.slice(1)} ${shape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[shape][colorB],
          target: `${colorB}_group`,
          categoryId: `${colorB}_group`
        });
      });
    } else {
      // hard: 8 items total (4 of Color A, 4 of Color B). Mixed shapes.
      const shapesA = shuffle(random, ['circle', 'circle', 'triangle', 'triangle']);
      const shapesB = shuffle(random, ['circle', 'circle', 'triangle', 'triangle']);
      shapesA.forEach((shape, idx) => {
        items.push({
          id: `btn_${colorA}_${shape}_${idx}`,
          content: `${colorA.charAt(0).toUpperCase() + colorA.slice(1)} ${shape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[shape][colorA],
          target: `${colorA}_group`,
          categoryId: `${colorA}_group`
        });
      });
      shapesB.forEach((shape, idx) => {
        items.push({
          id: `btn_${colorB}_${shape}_${idx}`,
          content: `${colorB.charAt(0).toUpperCase() + colorB.slice(1)} ${shape === 'circle' ? 'round' : 'triangular'} button`,
          imageUrl: UKG_BUTTON_ASSETS[shape][colorB],
          target: `${colorB}_group`,
          categoryId: `${colorB}_group`
        });
      });
    }

    const shuffledItems = shuffle(random, items).map(item => ({ ...item, imageWidth: 80 }));
    const answer = Object.fromEntries(shuffledItems.map(item => [item.id, item.target]));

    const questionText = 'Sort the buttons.';

    return {
      type: 'categorizationv2',
      renderer: 'html',
      layoutMode: 'category_sort',
      hideItemLabels: true,
      borderlessItems: true,
      questionText,
      parts: [{ type: 'text', content: questionText }],
      categories,
      items: shuffledItems,
      answer,
      correctAnswer: answer,
      solution: {
        sections: [
          { type: 'text', content: `Put all the ${colorA} buttons in the "${colorA.charAt(0).toUpperCase() + colorA.slice(1)} buttons" group, and all the ${colorB} buttons in the "${colorB.charAt(0).toUpperCase() + colorB.slice(1)} buttons" group.` }
        ]
      }
    };
  } else {
    // Sort by Shape
    const categories = [
      { id: 'round_group', label: 'Round buttons' },
      { id: 'triangular_group', label: 'Triangular buttons' }
    ];

    let items = [];

    if (difficulty === 'easy') {
      // 4 items total (2 round, 2 triangular). All 4 items are of the same single color.
      const chosenColor = shuffle(random, colors)[0];
      [1, 2].forEach((_, idx) => {
        items.push({
          id: `btn_round_${chosenColor}_${idx}`,
          content: `${chosenColor.charAt(0).toUpperCase() + chosenColor.slice(1)} round button`,
          imageUrl: UKG_BUTTON_ASSETS.circle[chosenColor],
          target: 'round_group',
          categoryId: 'round_group'
        });
      });
      [1, 2].forEach((_, idx) => {
        items.push({
          id: `btn_triangular_${chosenColor}_${idx}`,
          content: `${chosenColor.charAt(0).toUpperCase() + chosenColor.slice(1)} triangular button`,
          imageUrl: UKG_BUTTON_ASSETS.triangle[chosenColor],
          target: 'triangular_group',
          categoryId: 'triangular_group'
        });
      });
    } else if (difficulty === 'medium') {
      // 6 items total (3 round, 3 triangular). Mixed colors.
      const roundColors = shuffle(random, colors).slice(0, 3);
      roundColors.forEach((color, idx) => {
        items.push({
          id: `btn_round_${color}_${idx}`,
          content: `${color.charAt(0).toUpperCase() + color.slice(1)} round button`,
          imageUrl: UKG_BUTTON_ASSETS.circle[color],
          target: 'round_group',
          categoryId: 'round_group'
        });
      });
      const triangularColors = shuffle(random, colors).slice(0, 3);
      triangularColors.forEach((color, idx) => {
        items.push({
          id: `btn_triangular_${color}_${idx}`,
          content: `${color.charAt(0).toUpperCase() + color.slice(1)} triangular button`,
          imageUrl: UKG_BUTTON_ASSETS.triangle[color],
          target: 'triangular_group',
          categoryId: 'triangular_group'
        });
      });
    } else {
      // hard: 8 items total (4 round, 4 triangular). Mixed colors.
      const roundColors = shuffle(random, colors);
      roundColors.forEach((color, idx) => {
        items.push({
          id: `btn_round_${color}_${idx}`,
          content: `${color.charAt(0).toUpperCase() + color.slice(1)} round button`,
          imageUrl: UKG_BUTTON_ASSETS.circle[color],
          target: 'round_group',
          categoryId: 'round_group'
        });
      });
      const triangularColors = shuffle(random, colors);
      triangularColors.forEach((color, idx) => {
        items.push({
          id: `btn_triangular_${color}_${idx}`,
          content: `${color.charAt(0).toUpperCase() + color.slice(1)} triangular button`,
          imageUrl: UKG_BUTTON_ASSETS.triangle[color],
          target: 'triangular_group',
          categoryId: 'triangular_group'
        });
      });
    }

    const shuffledItems = shuffle(random, items).map(item => ({ ...item, imageWidth: 80 }));
    const answer = Object.fromEntries(shuffledItems.map(item => [item.id, item.target]));

    const questionText = 'Sort the buttons.';

    return {
      type: 'categorizationv2',
      renderer: 'html',
      layoutMode: 'category_sort',
      hideItemLabels: true,
      borderlessItems: true,
      questionText,
      parts: [{ type: 'text', content: questionText }],
      categories,
      items: shuffledItems,
      answer,
      correctAnswer: answer,
      solution: {
        sections: [
          { type: 'text', content: `Put all the round buttons in the "Round buttons" group, and all the triangular buttons in the "Triangular buttons" group.` }
        ]
      }
    };
  }
}

const snakeSvg = (isLong) => {
  const width = 280;
  const height = 110;
  const bodyPath = isLong 
    ? "M 20 60 Q 40 30 60 60 T 100 60 T 140 60 T 180 60 T 220 60 T 260 60"
    : "M 20 60 Q 40 30 60 60 T 100 60 T 140 60";
  const headX = isLong ? 260 : 140;
  const spots = isLong
    ? [
        {cx: 40, cy: 45}, {cx: 80, cy: 75}, {cx: 120, cy: 45},
        {cx: 160, cy: 75}, {cx: 200, cy: 45}, {cx: 240, cy: 75}
      ]
    : [
        {cx: 40, cy: 45}, {cx: 80, cy: 75}, {cx: 120, cy: 45}
      ];
  
  const spotsHtml = spots.map(s => `<circle cx="${s.cx}" cy="${s.cy}" r="3.5" fill="#f59e0b" stroke="#ffffff" stroke-width="0.5" />`).join('');
  const eye = `<circle cx="${headX - 6}" cy="56" r="2.5" fill="#000000" /><circle cx="${headX - 7}" cy="55" r="1" fill="#ffffff" />`;
  const tongue = `<path d="M ${headX} 60 Q ${headX + 6} 58 ${headX + 12} 62 M ${headX + 8} 60 L ${headX + 12} 57" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />`;

  return `<svg width="100%" height="100%" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <!-- Dirt Path -->
    <path d="M 10 90 L 270 90" stroke="#d97706" stroke-width="6" stroke-linecap="round" opacity="0.3"/>
    <!-- Grass blades -->
    <path d="M 45 90 L 47 80 M 52 90 L 50 82 M 190 90 L 188 81" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
    <!-- Snake body shadow -->
    <path d="${bodyPath}" fill="none" stroke="#166534" stroke-width="17" stroke-linecap="round" opacity="0.1" transform="translate(0, 3)" />
    <!-- Snake body -->
    <path d="${bodyPath}" fill="none" stroke="#22c55e" stroke-width="14" stroke-linecap="round" />
    <!-- Tongue -->
    ${tongue}
    <!-- Eye -->
    ${eye}
    <!-- Spots -->
    ${spotsHtml}
  </svg>`;
};

const crayonSvg = (isLong) => {
  const w = isLong ? 200 : 100;
  const h = 32;
  const color = "#3b82f6"; // Blue crayon
  const darkColor = "#1d4ed8";
  return `<svg width="100%" height="100%" viewBox="0 0 260 100" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <!-- Crayon Shadow -->
    <rect x="23" y="37" width="${w}" height="${h}" rx="4" fill="#64748b" opacity="0.15" />
    <polygon points="${23 + w},37 ${23 + w + 20},53 ${23 + w},69" fill="#64748b" opacity="0.15" />
    
    <!-- Crayon Body -->
    <rect x="20" y="34" width="${w}" height="${h}" rx="4" fill="${color}" stroke="${darkColor}" stroke-width="2" />
    <!-- Wrapper -->
    <rect x="${20 + w * 0.15}" y="34" width="${w * 0.7}" height="${h}" fill="#ffffff" opacity="0.9" stroke="${darkColor}" stroke-width="2" />
    <!-- Crayon Label -->
    <rect x="${20 + w * 0.25}" y="42" width="${w * 0.5}" height="16" rx="8" fill="${color}" />
    <!-- Tip -->
    <polygon points="${20 + w},34 ${20 + w + 20},50 ${20 + w},66" fill="${color}" stroke="${darkColor}" stroke-width="2" />
    <!-- Tip highlight -->
    <polygon points="${20 + w},36 ${20 + w + 15},50 ${20 + w},64" fill="#60a5fa" />
  </svg>`;
};

const caterpillarSvg = (isLong) => {
  const segmentsCount = isLong ? 7 : 4;
  const radius = 14;
  const startX = 30;
  const y = 50;
  const overlap = 20;
  
  let bodyHtml = '';
  for (let i = 0; i < segmentsCount; i++) {
    const cx = startX + i * overlap;
    const fill = i % 2 === 0 ? "#84cc16" : "#a3e635";
    bodyHtml += `<circle cx="${cx}" cy="${y + (i % 2 === 0 ? -3 : 3)}" r="${radius}" fill="${fill}" stroke="#4d7c0f" stroke-width="1.5" />`;
    bodyHtml += `<path d="M ${cx - 4} ${y + radius} Q ${cx - 2} ${y + radius + 10} ${cx + 2} ${y + radius + 10}" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />`;
    bodyHtml += `<path d="M ${cx + 2} ${y + radius} Q ${cx + 4} ${y + radius + 10} ${cx + 8} ${y + radius + 10}" fill="none" stroke="#78350f" stroke-width="2.5" stroke-linecap="round" />`;
  }
  
  const headX = startX + segmentsCount * overlap;
  const headHtml = `
    <!-- Antennae -->
    <path d="M ${headX - 4} ${y - radius} Q ${headX - 10} ${y - radius - 12} ${headX - 8} ${y - radius - 14}" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" />
    <circle cx="${headX - 8}" cy="${y - radius - 15}" r="3" fill="#ef4444" />
    <path d="M ${headX + 4} ${y - radius} Q ${headX + 10} ${y - radius - 12} ${headX + 8} ${y - radius - 14}" fill="none" stroke="#4d7c0f" stroke-width="2" stroke-linecap="round" />
    <circle cx="${headX + 8}" cy="${y - radius - 15}" r="3" fill="#ef4444" />
    <!-- Head -->
    <circle cx="${headX}" cy="${y}" r="${radius + 2}" fill="#ef4444" stroke="#b91c1c" stroke-width="2" />
    <circle cx="${headX - 4}" cy="${y - 2}" r="2.5" fill="#000000" />
    <circle cx="${headX - 5}" cy="${y - 3}" r="0.8" fill="#ffffff" />
    <circle cx="${headX + 4}" cy="${y - 2}" r="2.5" fill="#000000" />
    <circle cx="${headX + 3}" cy="${y - 3}" r="0.8" fill="#ffffff" />
    <path d="M ${headX - 5} ${y + 5} Q ${headX} ${y + 10} ${headX + 5} ${y + 5}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
  `;

  return `<svg width="100%" height="100%" viewBox="0 0 260 100" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <line x1="10" y1="74" x2="250" y2="74" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" stroke-dasharray="4,4" />
    ${bodyHtml}
    ${headHtml}
  </svg>`;
};

const flagpoleSvg = (isTall) => {
  const height = isTall ? 180 : 100;
  const poleY = 220 - height;
  const flagW = 56;
  const flagH = 36;
  
  const flagHtml = `
    <rect x="70" y="${poleY + 3}" width="${flagW}" height="${flagH}" fill="#3b82f6" rx="2" stroke="#1d4ed8" stroke-width="1.5" />
    <rect x="70" y="${poleY + 3 + flagH * 0.25}" width="${flagW}" height="${flagH * 0.15}" fill="#ffffff" />
    <rect x="70" y="${poleY + 3 + flagH * 0.55}" width="${flagW}" height="${flagH * 0.15}" fill="#ffffff" />
    <rect x="70" y="${poleY + 3 + flagH * 0.75}" width="${flagW}" height="${flagH * 0.2}" fill="#ef4444" rx="1" />
    <polygon points="${70 + 8},${poleY + 10} ${70 + 10},${poleY + 14} ${70 + 14},${poleY + 14} ${70 + 11},${poleY + 16} ${70 + 12},${poleY + 20} ${70 + 8},${poleY + 18} ${70 + 4},${poleY + 20} ${70 + 5},${poleY + 16} ${70 + 2},${poleY + 14} ${70 + 6},${poleY + 14}" fill="#f59e0b" />
  `;

  return `<svg width="100%" height="100%" viewBox="0 0 160 250" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <ellipse cx="80" cy="225" rx="35" ry="8" fill="#86efac" stroke="#22c55e" stroke-width="1.5" />
    <line x1="72" y1="${poleY}" x2="72" y2="225" stroke="#cbd5e1" stroke-width="4" stroke-linecap="round" opacity="0.4" />
    <line x1="70" y1="${poleY}" x2="70" y2="225" stroke="#94a3b8" stroke-width="4" stroke-linecap="round" />
    <line x1="69" y1="${poleY}" x2="69" y2="225" stroke="#cbd5e1" stroke-width="1.2" />
    <circle cx="70" cy="${poleY}" r="4.5" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
    ${flagHtml}
  </svg>`;
};

const treeSvg = (isTall) => {
  const h = isTall ? 180 : 100;
  const trunkW = isTall ? 14 : 9;
  const trunkH = isTall ? 65 : 35;
  const foliageR = isTall ? 44 : 26;
  const startY = 220;
  const trunkY = startY - trunkH;
  const foliageY = trunkY - foliageR + 8;
  
  return `<svg width="100%" height="100%" viewBox="0 0 160 250" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <ellipse cx="80" cy="${startY}" rx="45" ry="9" fill="#86efac" stroke="#22c55e" stroke-width="1.5" />
    <rect x="${80 - trunkW / 2}" y="${trunkY}" width="${trunkW}" height="${trunkH}" fill="#78350f" stroke="#451a03" stroke-width="1.5" rx="2" />
    <path d="M 80 ${trunkY + 15} Q 70 ${trunkY + 5} 66 ${trunkY + 8}" fill="none" stroke="#451a03" stroke-width="2.5" stroke-linecap="round" />
    <path d="M 80 ${trunkY + 22} Q 90 ${trunkY + 10} 94 ${trunkY + 14}" fill="none" stroke="#451a03" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="80" cy="${foliageY}" r="${foliageR}" fill="#166534" opacity="0.1" transform="translate(0, 3)" />
    <circle cx="80" cy="${foliageY}" r="${foliageR}" fill="#22c55e" stroke="#15803d" stroke-width="2" />
    <circle cx="${80 - foliageR * 0.4}" cy="${foliageY - foliageR * 0.3}" r="${foliageR * 0.7}" fill="#4ade80" />
    <circle cx="${80 + foliageR * 0.4}" cy="${foliageY - foliageR * 0.3}" r="${foliageR * 0.6}" fill="#4ade80" />
    <circle cx="${80 - foliageR * 0.5}" cy="${foliageY + foliageR * 0.2}" r="${foliageR * 0.5}" fill="#22c55e" />
    <circle cx="${80 + foliageR * 0.5}" cy="${foliageY + foliageR * 0.2}" r="${foliageR * 0.5}" fill="#22c55e" />
  </svg>`;
};

const ladderSvg = (isTall) => {
  const height = isTall ? 190 : 110;
  const startY = 220;
  const topY = startY - height;
  const rungsCount = isTall ? 7 : 4;
  const ladderW = 32;
  const rungSpacing = height / (rungsCount + 1);
  
  let rungsHtml = '';
  for (let i = 1; i <= rungsCount; i++) {
    const ry = topY + i * rungSpacing;
    rungsHtml += `<line x1="${80 - ladderW/2 + 2}" y1="${ry}" x2="${80 + ladderW/2 - 2}" y2="${ry}" stroke="#b45309" stroke-width="4.5" stroke-linecap="round" />`;
  }

  return `<svg width="100%" height="100%" viewBox="0 0 160 250" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <line x1="30" y1="225" x2="130" y2="225" stroke="#cbd5e1" stroke-width="2" stroke-linecap="round" />
    <line x1="${80 - ladderW/2}" y1="${topY}" x2="${80 - ladderW/2}" y2="222" stroke="#64748b" stroke-width="5" stroke-linecap="round" opacity="0.15" transform="translate(3, 2)" />
    <line x1="${80 + ladderW/2}" y1="${topY}" x2="${80 + ladderW/2}" y2="222" stroke="#64748b" stroke-width="5" stroke-linecap="round" opacity="0.15" transform="translate(3, 2)" />
    <line x1="${80 - ladderW/2}" y1="${topY}" x2="${80 - ladderW/2}" y2="222" stroke="#d97706" stroke-width="5" stroke-linecap="round" />
    <circle cx="${80 - ladderW/2}" cy="${topY}" r="2.5" fill="#b45309" />
    <line x1="${80 + ladderW/2}" y1="${topY}" x2="${80 + ladderW/2}" y2="222" stroke="#d97706" stroke-width="5" stroke-linecap="round" />
    <circle cx="${80 + ladderW/2}" cy="${topY}" r="2.5" fill="#b45309" />
    ${rungsHtml}
  </svg>`;
};

const bedSvg = (isWide) => {
  const w = isWide ? 200 : 110;
  const startX = 130 - w / 2;
  const pillowsHtml = isWide
    ? `
      <rect x="${startX + 22}" y="110" width="65" height="26" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      <path d="M ${startX + 22 + 10} 123 Q ${startX + 22 + 32} 118 ${startX + 22 + 55} 123" fill="none" stroke="#e2e8f0" stroke-width="1.5" />
      <rect x="${startX + w - 87}" y="110" width="65" height="26" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      <path d="M ${startX + w - 87 + 10} 123 Q ${startX + w - 87 + 32} 118 ${startX + w - 87 + 55} 123" fill="none" stroke="#e2e8f0" stroke-width="1.5" />
    `
    : `
      <rect x="${startX + w/2 - 32}" y="110" width="64" height="26" rx="5" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      <path d="M ${startX + w/2 - 22} 123 Q ${startX + w/2} 118 ${startX + w/2 + 22} 123" fill="none" stroke="#e2e8f0" stroke-width="1.5" />
    `;
    
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:#fdf2f8; overflow:visible; border-radius:12px;">
    <rect x="0" y="160" width="260" height="60" fill="#fed7aa" />
    <line x1="0" y1="160" x2="260" y2="160" stroke="#f97316" stroke-width="2" />
    <rect x="${startX - 6}" y="82" width="${w + 12}" height="68" rx="6" fill="#b45309" stroke="#78350f" stroke-width="2" />
    <line x1="${startX + w*0.25}" y1="86" x2="${startX + w*0.25}" y2="140" stroke="#78350f" stroke-width="1.5" />
    <line x1="${startX + w*0.5}" y1="86" x2="${startX + w*0.5}" y2="140" stroke="#78350f" stroke-width="1.5" />
    <line x1="${startX + w*0.75}" y1="86" x2="${startX + w*0.75}" y2="140" stroke="#78350f" stroke-width="1.5" />
    <rect x="${startX}" y="134" width="${w}" height="42" fill="#64748b" opacity="0.1" transform="translate(0, 4)" />
    <rect x="${startX}" y="130" width="${w}" height="40" rx="4" fill="#60a5fa" stroke="#2563eb" stroke-width="2" />
    ${pillowsHtml}
    <rect x="${startX}" y="142" width="${w}" height="28" fill="#f43f5e" rx="2" stroke="#be123c" stroke-width="1.5" />
    <rect x="${startX + w*0.1}" y="146" width="${w*0.8}" height="10" fill="#fda4af" rx="1" />
    <rect x="${startX}" y="170" width="8" height="12" rx="1" fill="#78350f" />
    <rect x="${startX + w - 8}" y="170" width="8" height="12" rx="1" fill="#78350f" />
  </svg>`;
};

const doorSvg = (isWide) => {
  const w = isWide ? 150 : 80;
  const startX = 130 - w / 2;
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:#ecfeff; overflow:visible; border-radius:12px;">
    <line x1="10" y1="205" x2="250" y2="205" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
    <rect x="${startX - 6}" y="20" width="${w + 12}" height="185" fill="none" stroke="#475569" stroke-width="4" />
    <rect x="${startX}" y="22" width="${w}" height="181" fill="#d97706" stroke="#b45309" stroke-width="2" />
    ${isWide 
      ? `
        <rect x="${startX + 14}" y="36" width="50" height="153" rx="2" fill="none" stroke="#78350f" stroke-width="2" />
        <rect x="${startX + 22}" y="44" width="34" height="60" rx="1" fill="#b45309" opacity="0.3" />
        <rect x="${startX + w - 64}" y="36" width="50" height="153" rx="2" fill="none" stroke="#78350f" stroke-width="2" />
        <rect x="${startX + w - 56}" y="44" width="34" height="60" rx="1" fill="#b45309" opacity="0.3" />
      `
      : `
        <rect x="${startX + 12}" y="36" width="${w - 24}" height="153" rx="2" fill="none" stroke="#78350f" stroke-width="2" />
        <rect x="${startX + 18}" y="44" width="${w - 36}" height="60" rx="1" fill="#b45309" opacity="0.3" />
      `
    }
    <circle cx="${isWide ? (startX + w - 20) : (startX + w - 12)}" cy="115" r="4.5" fill="#f59e0b" stroke="#d97706" stroke-width="1" />
    <rect x="${isWide ? (startX + w - 24) : (startX + w - 14)}" y="113" width="8" height="4" fill="#f59e0b" />
  </svg>`;
};

const windowSvg = (isWide) => {
  const w = isWide ? 190 : 95;
  const startX = 130 - w / 2;
  const y = 35;
  const h = 130;
  
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:#f1f5f9; overflow:visible; border-radius:12px;">
    <rect x="${startX - 10}" y="${y + h}" width="${w + 20}" height="12" rx="3" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1.5" />
    <rect x="${startX}" y="${y}" width="${w}" height="${h}" fill="#93c5fd" stroke="#1e40af" stroke-width="4" />
    ${isWide 
      ? `
        <circle cx="${startX + 35}" cy="${y + 35}" r="16" fill="#fbbf24" opacity="0.85" />
        <line x1="${startX + w * 0.33}" y1="${y}" x2="${startX + w * 0.33}" y2="${y + h}" stroke="#1e40af" stroke-width="3" />
        <line x1="${startX + w * 0.67}" y1="${y}" x2="${startX + w * 0.67}" y2="${y + h}" stroke="#1e40af" stroke-width="3" />
        <line x1="${startX}" y1="${y + h * 0.5}" x2="${startX + w}" y2="${y + h * 0.5}" stroke="#1e40af" stroke-width="3" />
      `
      : `
        <circle cx="${startX + 20}" cy="${y + 30}" r="12" fill="#fbbf24" opacity="0.85" />
        <line x1="${startX + w * 0.5}" y1="${y}" x2="${startX + w * 0.5}" y2="${y + h}" stroke="#1e40af" stroke-width="3" />
        <line x1="${startX}" y1="${y + h * 0.5}" x2="${startX + w}" y2="${y + h * 0.5}" stroke="#1e40af" stroke-width="3" />
      `
    }
  </svg>`;
};

const featherSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <path d="M 60 170 Q 140 100 200 50 Q 190 80 160 110 Q 130 140 80 180 Z" fill="#64748b" opacity="0.1" transform="translate(4, 4)" />
    <path d="M 60 170 Q 130 110 200 50" fill="none" stroke="#94a3b8" stroke-width="3.5" stroke-linecap="round" />
    <path d="M 60 170 C 90 160 120 120 150 90 C 130 110 105 130 80 150 C 95 135 115 115 130 95 C 110 115 90 130 70 140 Z" fill="#93c5fd" stroke="#60a5fa" stroke-width="1" />
    <path d="M 130 95 C 150 75 170 55 190 40 C 170 55 150 70 130 85 Z" fill="#93c5fd" />
    <path d="M 90 140 C 120 110 150 80 180 50 C 160 70 140 90 115 110 C 135 90 155 70 170 55 C 150 70 130 85 110 100 Z" fill="#e0f2fe" stroke="#bae6fd" stroke-width="1" />
    <circle cx="80" cy="150" r="10" fill="#bae6fd" opacity="0.6" />
    <circle cx="95" cy="135" r="8" fill="#bae6fd" opacity="0.6" />
  </svg>`;
};

const brickSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <polygon points="50,140 190,140 210,120 70,120" fill="#64748b" opacity="0.15" transform="translate(0, 8)" />
    <rect x="50" y="90" width="140" height="50" fill="#b91c1c" stroke="#7f1d1d" stroke-width="2" rx="2" />
    <rect x="65" y="102" width="25" height="26" rx="2" fill="#7f1d1d" opacity="0.4" />
    <rect x="107" y="102" width="25" height="26" rx="2" fill="#7f1d1d" opacity="0.4" />
    <rect x="150" y="102" width="25" height="26" rx="2" fill="#7f1d1d" opacity="0.4" />
    <polygon points="50,90 190,90 210,70 70,70" fill="#f87171" stroke="#7f1d1d" stroke-width="2" />
    <ellipse cx="85" cy="80" rx="10" ry="4" fill="#7f1d1d" opacity="0.5" />
    <ellipse cx="130" cy="80" rx="10" ry="4" fill="#7f1d1d" opacity="0.5" />
    <ellipse cx="175" cy="80" rx="10" ry="4" fill="#7f1d1d" opacity="0.5" />
    <polygon points="190,90 210,70 210,120 190,140" fill="#991b1b" stroke="#7f1d1d" stroke-width="2" />
  </svg>`;
};

const balloonSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <path d="M 130 128 Q 120 155 135 170 T 125 195" fill="none" stroke="#64748b" stroke-width="2" stroke-linecap="round" />
    <circle cx="130" cy="78" r="45" fill="#64748b" opacity="0.1" transform="translate(4, 4)" />
    <circle cx="130" cy="78" r="45" fill="#ef4444" stroke="#dc2626" stroke-width="2.5" />
    <polygon points="125,123 135,123 130,132" fill="#dc2626" stroke="#b91c1c" stroke-width="1.5" />
    <ellipse cx="112" cy="58" rx="8" ry="14" fill="#ffffff" opacity="0.5" transform="rotate(-30, 112, 58)" />
    <ellipse cx="108" cy="54" rx="3" ry="6" fill="#ffffff" opacity="0.8" transform="rotate(-30, 108, 54)" />
  </svg>`;
};

const anvilSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <rect x="50" y="152" width="160" height="18" rx="9" fill="#cbd5e1" />
    <path d="M 70 120 L 190 120 L 210 155 L 50 155 Z" fill="#334155" stroke="#1e293b" stroke-width="2" />
    <path d="M 70 155 Q 80 148 90 155 M 170 155 Q 180 148 190 155" fill="none" stroke="#1e293b" stroke-width="2" />
    <path d="M 90 85 Q 100 120 90 120 L 170 120 Q 160 120 170 85 Z" fill="#475569" stroke="#1e293b" stroke-width="2" />
    <path d="M 50 60 Q 95 65 95 85 L 55 85 Z" fill="#64748b" stroke="#1e293b" stroke-width="2" />
    <rect x="95" y="55" width="115" height="30" fill="#475569" stroke="#1e293b" stroke-width="2" rx="1" />
    <polygon points="95,55 210,55 200,45 85,45" fill="#94a3b8" stroke="#1e293b" stroke-width="1.5" />
    <polygon points="50,60 95,55 85,45 45,52" fill="#cbd5e1" stroke="#1e293b" stroke-width="1.5" />
  </svg>`;
};

const beachBallSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <ellipse cx="130" cy="165" rx="42" ry="8" fill="#64748b" opacity="0.15" />
    <mask id="ball-mask">
      <circle cx="130" cy="110" r="50" fill="#ffffff" />
    </mask>
    <circle cx="130" cy="110" r="50" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2.5" />
    <g mask="url(#ball-mask)">
      <path d="M 130 110 L 80 70 A 50 50 0 0 1 140 60 Z" fill="#ef4444" />
      <path d="M 130 110 L 180 130 A 50 50 0 0 1 110 160 Z" fill="#fbbf24" />
      <path d="M 130 110 L 140 60 A 50 50 0 0 1 180 130 Z" fill="#ffffff" />
      <path d="M 130 110 L 110 160 A 50 50 0 0 1 80 70 Z" fill="#ffffff" />
      <circle cx="130" cy="110" r="9" fill="#f59e0b" stroke="#1d4ed8" stroke-width="1.5" />
    </g>
    <circle cx="130" cy="110" r="50" fill="none" stroke="#1d4ed8" stroke-width="2.5" />
    <ellipse cx="110" cy="90" rx="10" ry="5" fill="#ffffff" opacity="0.4" transform="rotate(-30, 110, 90)" />
  </svg>`;
};

const fishbowlSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <ellipse cx="130" cy="162" rx="42" ry="7" fill="#64748b" opacity="0.15" />
    <mask id="bowl-mask">
      <circle cx="130" cy="110" r="48" fill="#ffffff" />
    </mask>
    <circle cx="130" cy="110" r="48" fill="#e0f2fe" opacity="0.6" stroke="#0284c7" stroke-width="2.5" />
    <g mask="url(#bowl-mask)">
      <rect x="70" y="92" width="120" height="80" fill="#bae6fd" opacity="0.8" />
      <ellipse cx="130" cy="92" rx="48" ry="6" fill="#7dd3fc" />
      <path d="M 82 145 Q 130 140 178 145 L 160 160 L 100 160 Z" fill="#fef08a" opacity="0.9" />
      <path d="M 155 145 Q 160 120 152 108" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" />
      <path d="M 160 145 Q 165 125 162 118" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" />
      <ellipse cx="120" cy="118" rx="10" ry="6" fill="#f97316" />
      <polygon points="110,118 102,112 104,118 102,124" fill="#f97316" />
      <circle cx="126" cy="116" r="1.2" fill="#000000" />
      <path d="M 118 112 Q 115 106 112 112" fill="#f97316" />
      <circle cx="132" cy="108" r="1.5" fill="#ffffff" opacity="0.7" />
      <circle cx="135" cy="102" r="1" fill="#ffffff" opacity="0.7" />
    </g>
    <ellipse cx="130" cy="64" rx="26" ry="5" fill="#e0f2fe" stroke="#0284c7" stroke-width="2" />
    <path d="M 94 90 A 40 40 0 0 1 125 72" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.5" />
  </svg>`;
};

const leafSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <path d="M 70 150 C 90 90 140 70 190 70 C 170 120 120 170 70 150 Z" fill="#64748b" opacity="0.1" transform="translate(4, 4)" />
    <path d="M 50 170 Q 75 145 100 130" fill="none" stroke="#4d7c0f" stroke-width="3.5" stroke-linecap="round" />
    <path d="M 70 150 C 85 110 125 75 190 70 C 165 110 125 155 70 150 Z" fill="#84cc16" stroke="#4d7c0f" stroke-width="2" />
    <path d="M 70 150 Q 120 115 190 70" fill="none" stroke="#4d7c0f" stroke-width="2" />
    <path d="M 105 127 Q 110 110 125 105 M 130 110 Q 140 95 155 90 M 155 94 Q 165 82 178 80" fill="none" stroke="#4d7c0f" stroke-width="1.5" stroke-linecap="round" />
    <path d="M 105 127 Q 95 138 90 144 M 130 110 Q 118 128 110 135 M 155 94 Q 142 115 132 125" fill="none" stroke="#4d7c0f" stroke-width="1.5" stroke-linecap="round" />
  </svg>`;
};

const stoneSvg = () => {
  return `<svg width="100%" height="100%" viewBox="0 0 260 220" xmlns="http://www.w3.org/2000/svg" style="background:transparent; overflow:visible;">
    <ellipse cx="130" cy="155" rx="55" ry="12" fill="#64748b" opacity="0.2" />
    <path d="M 80 145 C 60 125 70 90 100 80 C 130 70 175 75 190 100 C 205 125 185 145 160 152 C 130 158 100 155 80 145 Z" fill="#64748b" stroke="#334155" stroke-width="2.5" />
    <path d="M 85 115 C 90 95 120 85 155 85 C 170 95 175 105 175 110" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" opacity="0.4" />
    <path d="M 105 92 Q 115 105 110 120 M 150 90 Q 145 110 152 135" fill="none" stroke="#475569" stroke-width="1.5" stroke-linecap="round" />
    <circle cx="165" cy="120" r="1.5" fill="#475569" />
    <circle cx="95" cy="125" r="2" fill="#475569" />
    <circle cx="130" cy="138" r="1.5" fill="#475569" />
  </svg>`;
};

function generateUkgMeasurementQuestion(skill, random, config) {
  const { mode } = skill.params;
  
  if (mode === 'size_long_short') {
    const isLonger = random() > 0.5;
    const questionText = isLonger ? "Which is longer?" : "Which is shorter?";
    
    const objTypes = ['snake', 'crayon', 'caterpillar'];
    const objType = objTypes[Math.floor(random() * objTypes.length)];
    
    let longSvg, shortSvg, itemName;
    if (objType === 'snake') {
      longSvg = snakeSvg(true);
      shortSvg = snakeSvg(false);
      itemName = isLonger ? "longer snake" : "shorter snake";
    } else if (objType === 'crayon') {
      longSvg = crayonSvg(true);
      shortSvg = crayonSvg(false);
      itemName = isLonger ? "longer crayon" : "shorter crayon";
    } else {
      longSvg = caterpillarSvg(true);
      shortSvg = caterpillarSvg(false);
      itemName = isLonger ? "longer caterpillar" : "shorter caterpillar";
    }
    
    const isFirstLong = random() > 0.5;
    const optionAContent = isFirstLong ? longSvg : shortSvg;
    const optionBContent = isFirstLong ? shortSvg : longSvg;
    
    const answerId = isLonger
      ? (isFirstLong ? 'option_a' : 'option_b')
      : (isFirstLong ? 'option_b' : 'option_a');
      
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        {
          id: 'option_a',
          label: isFirstLong ? 'Longer' : 'Shorter',
          svg: optionAContent,
          hideLabel: true
        },
        {
          id: 'option_b',
          label: isFirstLong ? 'Shorter' : 'Longer',
          svg: optionBContent,
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'option_a' ? 0 : 1,
      layoutConfig: {
        columns: 1
      },
      solution: {
        sections: [
          { type: 'text', content: `The ${itemName} is the correct choice.` }
        ]
      }
    };
  }

  if (mode === 'size_tall_short') {
    const isTaller = random() > 0.5;
    const questionText = isTaller ? "Which is taller?" : "Which is shorter?";
    
    const objTypes = ['flagpole', 'tree', 'ladder'];
    const objType = objTypes[Math.floor(random() * objTypes.length)];
    
    let tallSvg, shortSvg, itemName;
    if (objType === 'flagpole') {
      tallSvg = flagpoleSvg(true);
      shortSvg = flagpoleSvg(false);
      itemName = isTaller ? "taller flagpole" : "shorter flagpole";
    } else if (objType === 'tree') {
      tallSvg = treeSvg(true);
      shortSvg = treeSvg(false);
      itemName = isTaller ? "taller tree" : "shorter tree";
    } else {
      tallSvg = ladderSvg(true);
      shortSvg = ladderSvg(false);
      itemName = isTaller ? "taller ladder" : "shorter ladder";
    }
    
    const isFirstTall = random() > 0.5;
    const optionAContent = isFirstTall ? tallSvg : shortSvg;
    const optionBContent = isFirstTall ? shortSvg : tallSvg;
    
    const answerId = isTaller
      ? (isFirstTall ? 'option_a' : 'option_b')
      : (isFirstTall ? 'option_b' : 'option_a');
      
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        {
          id: 'option_a',
          label: isFirstTall ? 'Taller' : 'Shorter',
          svg: optionAContent,
          hideLabel: true
        },
        {
          id: 'option_b',
          label: isFirstTall ? 'Shorter' : 'Taller',
          svg: optionBContent,
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'option_a' ? 0 : 1,
      layoutConfig: {
        columns: 2
      },
      solution: {
        sections: [
          { type: 'text', content: `The ${itemName} is the correct choice.` }
        ]
      }
    };
  }

  if (mode === 'size_wide_narrow') {
    const isWider = random() > 0.5;
    const questionText = isWider ? "Which is wider?" : "Which is narrower?";
    
    const objTypes = ['bed', 'door', 'window'];
    const objType = objTypes[Math.floor(random() * objTypes.length)];
    
    let wideSvg, narrowSvg, itemName;
    if (objType === 'bed') {
      wideSvg = bedSvg(true);
      narrowSvg = bedSvg(false);
      itemName = isWider ? "wider bed" : "narrower bed";
    } else if (objType === 'door') {
      wideSvg = doorSvg(true);
      narrowSvg = doorSvg(false);
      itemName = isWider ? "wider door" : "narrower door";
    } else {
      wideSvg = windowSvg(true);
      narrowSvg = windowSvg(false);
      itemName = isWider ? "wider window" : "narrower window";
    }
    
    const isFirstWide = random() > 0.5;
    const optionAContent = isFirstWide ? wideSvg : narrowSvg;
    const optionBContent = isFirstWide ? narrowSvg : wideSvg;
    
    const answerId = isWider
      ? (isFirstWide ? 'option_a' : 'option_b')
      : (isFirstWide ? 'option_b' : 'option_a');
      
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        {
          id: 'option_a',
          label: isFirstWide ? 'Wider' : 'Narrower',
          svg: optionAContent,
          hideLabel: true
        },
        {
          id: 'option_b',
          label: isFirstWide ? 'Narrower' : 'Wider',
          svg: optionBContent,
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'option_a' ? 0 : 1,
      layoutConfig: {
        columns: 2
      },
      solution: {
        sections: [
          { type: 'text', content: `The ${itemName} is the correct choice.` }
        ]
      }
    };
  }

  if (mode === 'size_light_heavy') {
    const isHeavier = random() > 0.5;
    const questionText = isHeavier ? "Which is heavier?" : "Which is lighter?";
    
    const pairs = [
      { heavy: fishbowlSvg(), light: beachBallSvg(), heavyName: 'fishbowl', lightName: 'beach ball' },
      { heavy: brickSvg(), light: featherSvg(), heavyName: 'brick', lightName: 'feather' },
      { heavy: anvilSvg(), light: balloonSvg(), heavyName: 'anvil', lightName: 'balloon' },
      { heavy: stoneSvg(), light: leafSvg(), heavyName: 'stone', lightName: 'leaf' }
    ];
    const pair = pairs[Math.floor(random() * pairs.length)];
    
    const isFirstHeavy = random() > 0.5;
    const optionAContent = isFirstHeavy ? pair.heavy : pair.light;
    const optionBContent = isFirstHeavy ? pair.light : pair.heavy;
    
    const answerId = isHeavier
      ? (isFirstHeavy ? 'option_a' : 'option_b')
      : (isFirstHeavy ? 'option_b' : 'option_a');
      
    const correctName = isHeavier ? pair.heavyName : pair.lightName;
      
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        {
          id: 'option_a',
          label: isFirstHeavy ? 'Heavier' : 'Lighter',
          svg: optionAContent,
          hideLabel: true
        },
        {
          id: 'option_b',
          label: isFirstHeavy ? 'Lighter' : 'Heavier',
          svg: optionBContent,
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'option_a' ? 0 : 1,
      layoutConfig: {
        columns: 2
      },
      solution: {
        sections: [
          { type: 'text', content: `The ${correctName} is the correct choice.` }
        ]
      }
    };
  }
}



function generateUkgMoneyQuestion(skill, random, config) {
  const { mode } = skill.params;
  
  const streak = config.history?.correctStreak ?? 0;
  const level = config.history?.practiceLevel ?? 1;
  let difficulty = 'easy';
  if (level >= 3 || streak >= 5) difficulty = 'hard';
  else if (level >= 2 || streak >= 2) difficulty = 'medium';

  if (mode === 'money_coin_values') {
    let allowedValues = [1, 2];
    if (difficulty === 'hard') allowedValues = [1, 2, 5, 10, 20, 50, 100];
    else if (difficulty === 'medium') allowedValues = [1, 2, 5, 10];
    
    const targetVal = allowedValues[Math.floor(random() * allowedValues.length)];
    const coinSvg = coinsGroupSvg([targetVal]);
    
    const questionText = targetVal >= 10 ? "How much is this note worth?" : "How much is this coin worth?";
    return makeFillQuestion(
      questionText,
      [
        {
          type: 'svg',
          content: coinSvg,
          isVertical: true,
          style: { maxWidth: '180px', margin: '15px auto', justifyContent: 'center' }
        },
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '10px 0' }
        }
      ],
      { ans: String(targetVal) },
      `It has a value of ₹${targetVal}.`
    );
  }

  if (mode === 'money_count_1') {
    let maxCoins = 4;
    let minCoins = 1;
    if (difficulty === 'hard') {
      minCoins = 8;
      maxCoins = 10;
    } else if (difficulty === 'medium') {
      minCoins = 5;
      maxCoins = 7;
    }
    const count = minCoins + Math.floor(random() * (maxCoins - minCoins + 1));
    const coinsList = Array(count).fill(1);
    const coinsSvg = coinsGroupSvg(coinsList);
    
    const questionText = "How much money is there?";
    return makeFillQuestion(
      questionText,
      [
        {
          type: 'svg',
          content: coinsSvg,
          isVertical: true,
          style: { maxWidth: '100%', margin: '15px 0', justifyContent: 'left' }
        },
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '10px 0' }
        }
      ],
      { ans: String(count) },
      `The total is ₹${count}.`
    );
  }

  if (mode === 'money_count_1_2') {
    let maxCoins = 3;
    let maxTwos = 1;
    if (difficulty === 'hard') {
      maxCoins = 7;
      maxTwos = 4;
    } else if (difficulty === 'medium') {
      maxCoins = 5;
      maxTwos = 2;
    }
    
    const coinsCount = 2 + Math.floor(random() * (maxCoins - 1));
    const coinsList = [];
    let twosCount = 0;
    for (let i = 0; i < coinsCount; i++) {
      if (twosCount < maxTwos && random() > 0.5) {
        coinsList.push(2);
        twosCount++;
      } else {
        coinsList.push(1);
      }
    }
    coinsList.sort(() => random() - 0.5);
    
    const total = coinsList.reduce((sum, val) => sum + val, 0);
    const coinsSvg = coinsGroupSvg(coinsList);
    
    const questionText = "How much money is there?";
    return makeFillQuestion(
      questionText,
      [
        {
          type: 'svg',
          content: coinsSvg,
          isVertical: true,
          style: { maxWidth: '100%', margin: '15px 0', justifyContent: 'left' }
        },
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '10px 0' }
        }
      ],
      { ans: String(total) },
      `The total is ₹${total}.`
    );
  }

  if (mode === 'money_count_1_2_5') {
    let maxCoins = 3;
    let maxFives = 1;
    if (difficulty === 'hard') {
      maxCoins = 6;
      maxFives = 3;
    } else if (difficulty === 'medium') {
      maxCoins = 5;
      maxFives = 2;
    }
    
    const coinsCount = 2 + Math.floor(random() * (maxCoins - 1));
    const coinsList = [];
    let fivesCount = 0;
    for (let i = 0; i < coinsCount; i++) {
      if (fivesCount < maxFives && random() > 0.6) {
        coinsList.push(5);
        fivesCount++;
      } else if (random() > 0.5) {
        coinsList.push(2);
      } else {
        coinsList.push(1);
      }
    }
    coinsList.sort(() => random() - 0.5);
    
    const total = coinsList.reduce((sum, val) => sum + val, 0);
    const coinsSvg = coinsGroupSvg(coinsList);
    
    const questionText = "How much money is there?";
    return makeFillQuestion(
      questionText,
      [
        {
          type: 'svg',
          content: coinsSvg,
          isVertical: true,
          style: { maxWidth: '100%', margin: '15px 0', justifyContent: 'left' }
        },
        {
          type: 'text',
          content: `₹ [blank:ans]`,
          isVertical: true,
          style: { fontSize: 'clamp(28px, 5vw, 38px)', fontWeight: 700, textAlign: 'left', margin: '10px 0' }
        }
      ],
      { ans: String(total) },
      `The total is ₹${total}.`
    );
  }

  if (mode === 'money_equivalent_groups') {
    let maxVal = 5;
    if (difficulty === 'hard') maxVal = 40;
    else if (difficulty === 'medium') maxVal = 15;
    
    const targetVal = 2 + Math.floor(random() * (maxVal - 1));
    
    const generateDistinctGroup = (val, excludeList = []) => {
      const excludeStrings = excludeList.map(arr => arr.slice().sort().join(','));
      let attempts = 0;
      while (attempts < 30) {
        attempts++;
        let t = val;
        const group = [];
        while (t > 0) {
          const coinOpts = [1];
          if (t >= 2) coinOpts.push(2);
          if (t >= 5) coinOpts.push(5);
          if (t >= 10) coinOpts.push(10);
          if (t >= 20) coinOpts.push(20);
          if (t >= 50) coinOpts.push(50);
          const chosen = coinOpts[Math.floor(random() * coinOpts.length)];
          group.push(chosen);
          t -= chosen;
        }
        const str = group.slice().sort().join(',');
        if (!excludeStrings.includes(str)) {
          return group;
        }
      }
      let rem = val;
      const fallback = [];
      while (rem > 0) {
        if (rem >= 5) { fallback.push(5); rem -= 5; }
        else if (rem >= 2) { fallback.push(2); rem -= 2; }
        else { fallback.push(1); rem -= 1; }
      }
      return fallback;
    };
    
    const targetCoins = generateDistinctGroup(targetVal);
    const targetSvg = coinsGroupSvg(targetCoins);
    
    const correctCoins = generateDistinctGroup(targetVal, [targetCoins]);
    const decoy1Coins = generateDistinctGroup(targetVal + (random() > 0.5 ? 1 : -1), [targetCoins, correctCoins]);
    const decoy2Coins = generateDistinctGroup(targetVal + (random() > 0.5 ? 2 : -2), [targetCoins, correctCoins, decoy1Coins]);
    
    const correctSvg = coinsGroupSvg(correctCoins);
    const decoy1Svg = coinsGroupSvg(decoy1Coins);
    const decoy2Svg = coinsGroupSvg(decoy2Coins);
    
    const choices = [
      { id: 'correct', svg: correctSvg, label: 'Correct Group', value: targetVal },
      { id: 'decoy1', svg: decoy1Svg, label: 'Decoy Group 1', value: targetVal + 1 },
      { id: 'decoy2', svg: decoy2Svg, label: 'Decoy Group 2', value: targetVal + 2 }
    ];
    
    choices.sort(() => random() - 0.5);
    const correctIdx = choices.findIndex(c => c.id === 'correct');
    const answerId = choices[correctIdx].id;
    
    const questionText = "Which group shows the same amount?";
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: "Look at this money:" },
        { type: 'svg', content: targetSvg },
        { type: 'text', content: questionText }
      ],
      options: choices.map(c => ({
        id: c.id,
        label: c.label,
        svg: c.svg,
        hideLabel: true
      })),
      answer: answerId,
      correctAnswerIndex: correctIdx,
      layoutConfig: {
        columns: 1
      },
      solution: {
        sections: [
          { type: 'text', content: `The target group adds up to ₹${targetVal}. The correct option also adds up to ₹${targetVal}.` }
        ]
      }
    };
  }

  if (mode === 'money_compare_groups') {
    let maxVal = 6;
    let minDiff = 2;
    if (difficulty === 'hard') {
      maxVal = 100;
      minDiff = 5;
    } else if (difficulty === 'medium') {
      maxVal = 30;
      minDiff = 2;
    }
    
    const valA = 2 + Math.floor(random() * (maxVal - 1));
    let valB = 2 + Math.floor(random() * (maxVal - 1));
    while (Math.abs(valA - valB) < minDiff || valA === valB) {
      valB = 2 + Math.floor(random() * (maxVal - 1));
    }
    
    const generateCoinsForVal = (val) => {
      let t = val;
      const list = [];
      while (t > 0) {
        const coinOpts = [1];
        if (t >= 2) coinOpts.push(2);
        if (t >= 5) coinOpts.push(5);
        if (t >= 10) coinOpts.push(10);
        if (t >= 20) coinOpts.push(20);
        if (t >= 50) coinOpts.push(50);
        if (t >= 100) coinOpts.push(100);
        if (t >= 200) coinOpts.push(200);
        if (t >= 500) coinOpts.push(500);
        const chosen = coinOpts[Math.floor(random() * coinOpts.length)];
        list.push(chosen);
        t -= chosen;
      }
      return list.sort(() => random() - 0.5);
    };
    
    const coinsA = generateCoinsForVal(valA);
    const coinsB = generateCoinsForVal(valB);
    
    const svgA = coinsGroupSvg(coinsA);
    const svgB = coinsGroupSvg(coinsB);
    
    const isCompareMore = random() > 0.5;
    const questionText = isCompareMore ? "Which is more?" : "Which is less?";
    
    const isAMore = valA > valB;
    const isACorrect = isCompareMore ? isAMore : !isAMore;
    
    const choices = [
      { id: 'group_a', svg: svgA, label: 'Group A', isCorrect: isACorrect },
      { id: 'group_b', svg: svgB, label: 'Group B', isCorrect: !isACorrect }
    ];
    
    const answerId = choices.find(c => c.isCorrect).id;
    const correctIdx = choices.findIndex(c => c.isCorrect);
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: choices.map(c => ({
        id: c.id,
        label: c.label,
        svg: c.svg,
        hideLabel: true
      })),
      answer: answerId,
      correctAnswerIndex: correctIdx,
      layoutConfig: {
        columns: 1
      },
      solution: {
        sections: [
          { type: 'text', content: `Group A shows ₹${valA} and Group B shows ₹${valB}. The ${isCompareMore ? 'larger' : 'smaller'} amount is ${isACorrect ? 'Group A' : 'Group B'}.` }
        ]
      }
    };
  }
}

const drawJarOfMarbles = (colorA, countA, colorB, countB, random) => {
  const jarWidth = 200;
  const jarHeight = 220;
  
  let marblesHtml = '';
  const colors = [];
  for (let i = 0; i < countA; i++) colors.push(colorA);
  for (let i = 0; i < countB; i++) colors.push(colorB);
  
  for (let i = colors.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [colors[i], colors[j]] = [colors[j], colors[i]];
  }

  const marbleRadius = 14;
  const positions = [
    {x: 65, y: 185}, {x: 100, y: 185}, {x: 135, y: 185},
    {x: 52, y: 158}, {x: 83, y: 158}, {x: 117, y: 158}, {x: 148, y: 158},
    {x: 65, y: 131}, {x: 100, y: 131}, {x: 135, y: 131},
    {x: 83, y: 104}, {x: 117, y: 104}
  ];

  const MARBLE_IMAGES = {
    black: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781142819264-black-marble.webp',
    blue: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781142824300-blue-marble.webp',
    green: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781142833112-green-marble.webp',
    gren: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781142833112-green-marble.webp',
    yellow: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/1781142840665-yellow-marble.webp'
  };

  for (let i = 0; i < colors.length && i < positions.length; i++) {
    const pos = positions[i];
    const colorKey = String(colors[i] || '').toLowerCase().trim();
    const imgUrl = MARBLE_IMAGES[colorKey];
    if (imgUrl) {
      marblesHtml += `<image href="${imgUrl}" x="${pos.x - marbleRadius}" y="${pos.y - marbleRadius}" width="${marbleRadius * 2}" height="${marbleRadius * 2}" />`;
    } else {
      const fill = colors[i] === 'red' ? '#ef4444' : (colors[i] === 'blue' ? '#3b82f6' : (colors[i] === 'green' ? '#10b981' : '#f59e0b'));
      const stroke = colors[i] === 'red' ? '#991b1b' : (colors[i] === 'blue' ? '#1e3a8a' : (colors[i] === 'green' ? '#065f46' : '#92400e'));
      marblesHtml += `<circle cx="${pos.x + 1.5}" cy="${pos.y + 1.5}" r="${marbleRadius}" fill="#0f172a" opacity="0.1" />`;
      marblesHtml += `
        <circle cx="${pos.x}" cy="${pos.y}" r="${marbleRadius}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
        <circle cx="${pos.x - 4}" cy="${pos.y - 4}" r="4" fill="#ffffff" opacity="0.45" />
      `;
    }
  }

  return `
    <svg viewBox="0 0 200 240" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto; overflow: visible;">
      <ellipse cx="100" cy="205" rx="72" ry="16" fill="#0f172a" opacity="0.1" />
      <rect x="30" y="40" width="140" height="160" rx="20" fill="#f8fafc" opacity="0.05" />
      ${marblesHtml}
      <rect x="30" y="40" width="140" height="165" rx="20" fill="none" stroke="#64748b" stroke-width="3.5" />
      <path d="M 60,40 L 60,28 A 5,5 0 0,1 65,23 L 135,23 A 5,5 0 0,1 140,28 L 140,40" fill="none" stroke="#64748b" stroke-width="3" />
      <rect x="55" y="15" width="90" height="10" rx="3" fill="#cbd5e1" stroke="#475569" stroke-width="1.5" />
      <path d="M 42,65 Q 46,140 42,185" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" opacity="0.4" />
    </svg>
  `;
};

const drawSpinner = (colorA, sectorsA, colorB, sectorsB) => {
  const total = sectorsA + sectorsB;
  let paths = '';
  const cx = 100;
  const cy = 100;
  const r = 70;
  
  const colorsList = [];
  for (let i = 0; i < sectorsA; i++) colorsList.push(colorA);
  for (let i = 0; i < sectorsB; i++) colorsList.push(colorB);

  const getSectColor = (col) => col === 'red' ? '#ef4444' : (col === 'blue' ? '#3b82f6' : (col === 'green' ? '#10b981' : (col === 'black' ? '#1e293b' : '#f59e0b')));

  for (let i = 0; i < total; i++) {
    const angleStart = (i * 360) / total;
    const angleEnd = ((i + 1) * 360) / total;
    
    const radStart = (angleStart - 90) * Math.PI / 180;
    const radEnd = (angleEnd - 90) * Math.PI / 180;
    
    const x1 = cx + r * Math.cos(radStart);
    const y1 = cy + r * Math.sin(radStart);
    const x2 = cx + r * Math.cos(radEnd);
    const y2 = cy + r * Math.sin(radEnd);
    
    const largeArc = (angleEnd - angleStart) > 180 ? 1 : 0;
    
    const fill = getSectColor(colorsList[i]);
    paths += `<path d="M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2} Z" fill="${fill}" stroke="#0f172a" stroke-width="2" />`;
  }

  return `
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto; overflow: visible;">
      <circle cx="100" cy="103" r="70" fill="#0f172a" opacity="0.1" />
      ${paths}
      <circle cx="100" cy="100" r="8" fill="#475569" stroke="#0f172a" stroke-width="2" />
      <g transform="rotate(45, 100, 100)">
        <path d="M 100,105 L 95,100 L 98,100 L 98,45 L 102,45 L 102,100 L 105,100 Z" fill="#1e293b" />
        <polygon points="100,35 94,48 106,48" fill="#dc2626" />
      </g>
    </svg>
  `;
};

function generateUkgProbabilityQuestion(skill, random, config) {
  const isSpinner = random() > 0.5;
  const colors = ['green', 'yellow', 'blue', 'red', 'black'];
  const colorA = colors[Math.floor(random() * colors.length)];
  const remainingColors = colors.filter(c => c !== colorA);
  const colorB = remainingColors[Math.floor(random() * remainingColors.length)];

  const compareMore = random() > 0.5;

  let questionText = '';
  let svg = '';
  let correctAnswerLabel = '';
  let solutionText = '';

  if (isSpinner) {
    const sectorsA = Math.floor(random() * 3) + 4;
    const sectorsB = Math.floor(random() * 2) + 1;
    
    svg = drawSpinner(colorA, sectorsA, colorB, sectorsB);
    
    questionText = compareMore 
      ? `Spin the spinner. Which colour is it **more likely** to land on?`
      : `Spin the spinner. Which colour is it **less likely** to land on?`;
      
    const isCorrectA = compareMore ? (sectorsA > sectorsB) : (sectorsA < sectorsB);
    correctAnswerLabel = isCorrectA ? colorA : colorB;
    
    solutionText = `The spinner has **${sectorsA} ${colorA}** sectors and **${sectorsB} ${colorB}** sectors. Since there are ${compareMore ? 'more' : 'fewer'} ${correctAnswerLabel} sectors, it is ${compareMore ? 'more likely' : 'less likely'} to land on **${correctAnswerLabel}**.`;
  } else {
    const countA = Math.floor(random() * 3) + 6;
    const countB = Math.floor(random() * 2) + 2;
    
    svg = drawJarOfMarbles(colorA, countA, colorB, countB, random);
    
    questionText = compareMore
      ? `If you close your eyes and pick a marble, which colour are you **more likely** to pick?`
      : `If you close your eyes and pick a marble, which colour are you **less likely** to pick?`;
      
    const isCorrectA = compareMore ? (countA > countB) : (countA < countB);
    correctAnswerLabel = isCorrectA ? colorA : colorB;
    
    solutionText = `The jar contains **${countA} ${colorA}** marbles and **${countB} ${colorB}** marbles. Since there are ${compareMore ? 'more' : 'fewer'} ${correctAnswerLabel} marbles, you are ${compareMore ? 'more likely' : 'less likely'} to pick **${correctAnswerLabel}**.`;
  }

  const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
  const options = [
    { id: 'opt_a', label: cap(colorA) },
    { id: 'opt_b', label: cap(colorB) }
  ];
  
  const correctAnswerIndex = correctAnswerLabel === colorA ? 0 : 1;

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: questionText },
      { type: 'svg', content: svg }
    ],
    options,
    correctAnswerIndex,
    solution: {
      sections: [{ type: 'text', content: solutionText }]
    }
  };
}

export function generateUkgNumbersCountingQuestion(config = {}) {
  const skillId = config.logic_type || config.forcedTask || 'ukg-count3-learn';
  const skill = ukgNumbersCountingSkillMap[skillId] || ukgNumbersCountingSkillMap['ukg-count3-learn'];
  const seed = config.variables?.seed || config.seed || String(Date.now());
  const random = seededRandom(seed);
  const reusedModes = ['learn', 'count', 'ten_frame_count', 'ten_frame_show', 'represent'];
  const classifyModes = ['same', 'different', 'same_different'];

  let rawQuestion;
  if (skill.params.mode === 'shapes_color') {
    rawQuestion = generateUkgClassifyShapesColorQuestion(skill, random, config);
  } else if (['sort_color', 'sort_shape', 'classify_sort'].includes(skill.params.mode)) {
    rawQuestion = generateUkgSortingQuestion(skill, random, config);
  } else if (skill.params.mode.startsWith('size_')) {
    rawQuestion = generateUkgMeasurementQuestion(skill, random, config);
  } else if (skill.params.mode.startsWith('money_')) {
    rawQuestion = generateUkgMoneyQuestion(skill, random, config);
  } else if (skill.params.mode === 'probability_likely') {
    rawQuestion = generateUkgProbabilityQuestion(skill, random, config);
  } else if (reusedModes.includes(skill.params.mode) && skill.params.limit <= 10) {
    rawQuestion = reuseLkg(skill, config, seed);
  } else if (classifyModes.includes(skill.params.mode)) {
    let lkgSkill = `lkg-classify-${skill.params.mode.replace('_', '-')}`;
    rawQuestion = generateLkgQuestion({ ...config, logic_type: lkgSkill, variables: { ...(config.variables || {}), seed } });
  } else {
    rawQuestion = generateProgressionQuestion(skill, random, config);
  }
  const hasOnlyNumericOptions = Array.isArray(rawQuestion.options)
    && rawQuestion.options.length > 0
    && rawQuestion.options.every((option) => /^-?\d+(?:\.\d+)?$/.test(String(option?.label ?? option?.value ?? option)));
  const layoutConfig = hasOnlyNumericOptions && !rawQuestion.layoutConfig?.variant
    ? { ...(rawQuestion.layoutConfig || {}), variant: 'numbers' }
    : rawQuestion.layoutConfig;

  return {
    ...rawQuestion,
    ...(layoutConfig ? { layoutConfig } : {}),
    id: `ukg-numbers-counting-${skill.skillId}-${seed}`,
    metaConfig: { readable: true, readOptions: true, ...(rawQuestion.metaConfig || {}) },
    metadata: {
      ...(rawQuestion.metadata || {}),
      subject: 'math',
      topic: 'ukg-numbers-counting',
      grade: 'UKG',
      skillId: skill.skillId,
      templateId: skill.templateId,
      chapter: skill.chapter,
      seed
    }
  };
}
