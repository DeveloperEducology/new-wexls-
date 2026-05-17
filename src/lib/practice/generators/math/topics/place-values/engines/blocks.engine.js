import { generatePlaceValueQuestion } from '../engine.js';
import { buildPlaceValueSvg } from '../shared/svgBlocks.js';

export function generateBlocksQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    engineParams: {
      forcedTask: 'identify_from_blocks',
      ...(config.engineParams || {}),
    },
  });
}

export function generateHundredsBlocksQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    difficulty: config.difficulty || 'medium',
    engineParams: {
      forcedTask: 'identify_from_blocks_3d',
      ...(config.engineParams || {}),
    },
  });
}

export function generateThousandsBlocksQuestion(config = {}) {
  return generatePlaceValueQuestion({
    ...config,
    difficulty: config.difficulty || 'hard',
    engineParams: {
      forcedTask: 'thousands_blocks',
      ...(config.engineParams || {}),
    },
  });
}

function createRandom(seedInput = Date.now()) {
  const text = String(seedInput);
  let seed = 0;
  for (let index = 0; index < text.length; index += 1) {
    seed = (seed * 31 + text.charCodeAt(index)) % 2147483647;
  }
  if (seed <= 0) seed += 2147483646;

  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}

function randomInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function shuffle(items, random) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
  }
  return copy;
}

function numberToPlaces(number) {
  return {
    thousands: Math.floor(number / 1000),
    hundreds: Math.floor((number % 1000) / 100),
    tens: Math.floor((number % 100) / 10),
    ones: number % 10,
  };
}

function buildCompactTensOnesSvg(number) {
  const { tens, ones } = numberToPlaces(number);
  const rodWidth = 26;
  const rodHeight = 168;
  const unitSize = 26;
  const gap = 8;
  const padding = 24;
  const rodsWidth = Math.max(1, tens) * rodWidth + Math.max(0, tens - 1) * gap;
  const onesWidth = Math.max(1, ones) * unitSize + Math.max(0, ones - 1) * gap;
  const contentWidth = Math.max(rodsWidth, onesWidth, 240);
  const width = contentWidth + padding * 2;
  const height = padding * 2 + rodHeight + (ones > 0 ? gap + unitSize : 0);
  const rodsStartX = padding + (contentWidth - rodsWidth) / 2;
  const onesStartX = padding + (contentWidth - onesWidth) / 2;
  const onesY = padding + rodHeight + gap;

  const rods = Array.from({ length: tens }).map((_, index) => {
    const x = rodsStartX + index * (rodWidth + gap);
    return `
      <g transform="translate(${x}, ${padding})">
        <rect width="${rodWidth}" height="${rodHeight}" rx="5" fill="url(#tenGrad)" stroke="#047857" stroke-width="2" />
        ${Array.from({ length: 9 }).map((__, lineIndex) => `
          <line x1="0" y1="${(lineIndex + 1) * (rodHeight / 10)}" x2="${rodWidth}" y2="${(lineIndex + 1) * (rodHeight / 10)}" stroke="#047857" stroke-width="1" opacity="0.28" />
        `).join('')}
      </g>
    `;
  }).join('');

  const units = Array.from({ length: ones }).map((_, index) => {
    const x = onesStartX + index * (unitSize + gap);
    return `<rect x="${x}" y="${onesY}" width="${unitSize}" height="${unitSize}" rx="4" fill="url(#oneGrad)" stroke="#1d4ed8" stroke-width="2" />`;
  }).join('');

  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="display:block;">
      <defs>
        <linearGradient id="tenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#6ee7b7" />
          <stop offset="100%" stop-color="#059669" />
        </linearGradient>
        <linearGradient id="oneGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#93c5fd" />
          <stop offset="100%" stop-color="#2563eb" />
        </linearGradient>
        <filter id="pvShadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="5" stdDeviation="5" flood-color="#0f172a" flood-opacity="0.14" />
        </filter>
      </defs>
      <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="#ffffff" />
      <g filter="url(#pvShadow)">
        ${rods}
        ${units}
      </g>
    </svg>
  `.trim();
}

function normalizeRange(range = [10, 99]) {
  if (Array.isArray(range)) {
    return { min: Number(range[0] ?? 10), max: Number(range[1] ?? 99) };
  }
  return { min: Number(range.min ?? 10), max: Number(range.max ?? 99) };
}

function defaultRangeForDifficulty(difficulty = 'easy') {
  if (difficulty === 'hard') return [1000, 9999];
  if (difficulty === 'medium') return [100, 999];
  return [10, 99];
}

function placeSummary(number) {
  const { thousands, hundreds, tens, ones } = numberToPlaces(number);
  const parts = [];
  if (thousands) parts.push(`**${thousands} thousands**`);
  if (hundreds) parts.push(`**${hundreds} hundreds**`);
  if (tens) parts.push(`**${tens} tens**`);
  if (ones) parts.push(`**${ones} ones**`);
  return parts.length ? parts.join(', ') : '**0 ones**';
}

function buildOptionSvg(number, range) {
  if (range.max <= 99) return buildCompactTensOnesSvg(number);
  return buildPlaceValueSvg(numberToPlaces(number));
}

function buildDistractors(targetNumber, range, random, count = 3) {
  const values = new Set([targetNumber]);
  const digits = numberToPlaces(targetNumber);
  const candidates = [
    digits.ones * 10 + digits.tens,
    targetNumber + 10,
    targetNumber - 10,
    targetNumber + 1,
    targetNumber - 1,
  ];

  for (const value of candidates) {
    if (value >= range.min && value <= range.max) values.add(value);
    if (values.size >= count + 1) break;
  }

  while (values.size < count + 1) {
    values.add(randomInt(range.min, range.max, random));
  }

  return [...values].filter((value) => value !== targetNumber).slice(0, count);
}

export function generateBlocksModelMatchQuestion(config = {}) {
  const difficulty = config.difficulty === 'adaptive'
    ? 'easy'
    : (config.difficulty || config.engineParams?.difficulty || 'easy');
  const params = {
    numberRange: defaultRangeForDifficulty(difficulty),
    optionCount: 4,
    ...(config.engineParams || {}),
    ...(config.variables || {}),
  };
  const random = createRandom(config.variables?.seed || params.seed || Date.now());
  const range = normalizeRange(params.numberRange || params.range);
  const targetNumber = Number(params.number ?? randomInt(range.min, range.max, random));
  const distractors = buildDistractors(targetNumber, range, random, Number(params.optionCount || 4) - 1);
  const rawOptions = shuffle([targetNumber, ...distractors], random).map((value) => ({
    id: value === targetNumber ? 'opt_correct' : `opt_${value}`,
    type: 'svg',
    content: buildOptionSvg(value, range),
    label: String(value),
    value: String(value),
    isCorrect: value === targetNumber,
  }));

  const correctAnswerIndex = rawOptions.findIndex((option) => option.isCorrect);

  return {
    id: `pv_blocks_match_${Date.now()}`,
    type: 'mcq',
    questionText: `Which model shows **${targetNumber}**?`,
    parts: [{ type: 'text', content: `Choose the base-ten blocks that show **${targetNumber}**.` }],
    options: rawOptions,
    answer: 'opt_correct',
    correctAnswerIndex,
    isGrid: true,
    layoutConfig: {
      columns: 2,
      optionMedia: {
        cardMinHeight: range.max <= 99 ? 300 : 340,
        cardPadding: range.max <= 99 ? 22 : 18,
        maxWidth: range.max <= 99 ? 360 : 560,
        minHeight: range.max <= 99 ? 230 : 260,
        marginBottom: 0,
      },
    },
    solution: {
      sections: [
        { type: 'text', content: `The number **${targetNumber}** has ${placeSummary(targetNumber)}.` },
        { type: 'svg', content: buildPlaceValueSvg(numberToPlaces(targetNumber)) },
      ],
    },
    metadata: {
      task: 'match_blocks_to_number',
      difficulty,
      targetNumber,
      numberRange: range,
      engine: 'blocks',
    },
  };
}
