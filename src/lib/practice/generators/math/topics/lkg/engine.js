import { lkgCountingObjects } from './assets.js';
import { lkgMicroSkillRegistry } from './registry.js';

// Seeded random number generator
function getSeededRandom(seed) {
  let s = 1;
  if (typeof seed === 'string') {
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      hash = seed.charCodeAt(i) + ((hash << 5) - hash);
    }
    s = hash;
  } else if (typeof seed === 'number') {
    s = seed;
  }
  return function() {
    let x = Math.sin(s++) * 10000;
    return x - Math.floor(x);
  };
}

// Helper SVG build routines
const buildDotsSvg = (count) => {
  let circles = '';
  for (let i = 0; i < count; i++) {
    const cx = 25 + (i % 5) * 44;
    const cy = 25 + Math.floor(i / 5) * 44;
    circles += `<circle cx="${cx}" cy="${cy}" r="12" fill="#000000"/>`;
  }
  const height = 50 + Math.floor((count - 1) / 5) * 44;
  return `<svg width="240" height="${height}" viewBox="0 0 240 ${height}">${circles}</svg>`;
};

const buildShapesSvg = (count, shapeType) => {
  let itemsSvg = '';
  for (let i = 0; i < count; i++) {
    const x = 12 + (i % 5) * 44;
    const y = 12 + Math.floor(i / 5) * 44;
    if (shapeType === 'circle') {
      itemsSvg += `<circle cx="${x+15}" cy="${y+15}" r="15" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>`;
    } else if (shapeType === 'square') {
      itemsSvg += `<rect x="${x}" y="${y}" width="30" height="30" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2" rx="2"/>`;
    } else {
      // triangle
      itemsSvg += `<polygon points="${x+15},${y} ${x},${y+30} ${x+30},${y+30}" fill="#10b981" stroke="#047857" stroke-width="2"/>`;
    }
  }
  const height = 44 + Math.floor((count - 1) / 5) * 44;
  return `<svg width="240" height="${height}" viewBox="0 0 240 ${height}">${itemsSvg}</svg>`;
};

const buildTenFrameSvg = (count) => {
  let cells = '';
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 5; col++) {
      const x = 10 + col * 44;
      const y = 10 + row * 44;
      cells += `<rect x="${x}" y="${y}" width="44" height="44" fill="none" stroke="#475569" stroke-width="2"/>`;
    }
  }
  let dots = '';
  for (let i = 0; i < count; i++) {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const cx = 32 + col * 44;
    const cy = 32 + row * 44;
    dots += `<circle cx="${cx}" cy="${cy}" r="11" fill="#dc2626"/>`;
  }
  return `<svg width="240" height="110" viewBox="0 0 240 110">${cells}${dots}</svg>`;
};

// SVG loaders for Positions engine
const buildInsideOutsideSvg = () => {
  return `<svg width="240" height="120" viewBox="0 0 240 120">
    <rect x="20" y="30" width="80" height="70" fill="none" stroke="#475569" stroke-width="3" stroke-dasharray="4"/>
    <text x="36" y="76" font-size="36">🐱</text>
    <text x="140" y="76" font-size="36">🐶</text>
    <text x="30" y="20" font-size="12" font-weight="bold" fill="#64748b">INSIDE</text>
    <text x="135" y="20" font-size="12" font-weight="bold" fill="#64748b">OUTSIDE</text>
  </svg>`;
};

const buildAboveBelowSvg = () => {
  return `<svg width="240" height="120" viewBox="0 0 240 120">
    <line x1="20" y1="60" x2="220" y2="60" stroke="#0f172a" stroke-width="4"/>
    <text x="100" y="46" font-size="36">🍎</text>
    <text x="100" y="106" font-size="36">🍌</text>
  </svg>`;
};

const buildBesideNextSvg = () => {
  return `<svg width="240" height="120" viewBox="0 0 240 120">
    <text x="40" y="80" font-size="50">🌲</text>
    <text x="110" y="80" font-size="36">🐰</text>
    <text x="180" y="80" font-size="36">🦊</text>
  </svg>`;
};

const buildLeftRightSvg = () => {
  return `<svg width="240" height="100" viewBox="0 0 240 100">
    <text x="40" y="66" font-size="36">🍎</text>
    <text x="160" y="66" font-size="36">🍓</text>
    <line x1="120" y1="10" x2="120" y2="90" stroke="#cbd5e1" stroke-width="2" stroke-dasharray="4"/>
  </svg>`;
};

const buildLeftMiddleRightSvg = () => {
  return `<svg width="240" height="100" viewBox="0 0 240 100">
    <text x="30" y="66" font-size="36">🍇</text>
    <text x="100" y="66" font-size="36">🍊</text>
    <text x="170" y="66" font-size="36">🍐</text>
  </svg>`;
};

const buildTopBottomSvg = () => {
  return `<svg width="240" height="140" viewBox="0 0 240 140">
    <line x1="80" y1="10" x2="80" y2="130" stroke="#94a3b8" stroke-width="4"/>
    <line x1="120" y1="10" x2="120" y2="130" stroke="#94a3b8" stroke-width="4"/>
    <line x1="80" y1="35" x2="120" y2="35" stroke="#94a3b8" stroke-width="3"/>
    <line x1="80" y1="65" x2="120" y2="65" stroke="#94a3b8" stroke-width="3"/>
    <line x1="80" y1="95" x2="120" y2="95" stroke="#94a3b8" stroke-width="3"/>
    <text x="90" y="30" font-size="32">🐦</text>
    <text x="140" y="125" font-size="32">🐱</text>
  </svg>`;
};

const buildTopMiddleBottomSvg = () => {
  return `<svg width="240" height="150" viewBox="0 0 240 150">
    <text x="100" y="40" font-size="32">🎈</text>
    <text x="100" y="90" font-size="32">⚽</text>
    <text x="100" y="140" font-size="32">📦</text>
  </svg>`;
};

// SVG loaders for Pattern/Size engines
const buildColorPatternSvg = () => {
  return `<svg width="280" height="80" viewBox="0 0 280 80">
    <circle cx="30" cy="40" r="20" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
    <circle cx="85" cy="40" r="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    <circle cx="140" cy="40" r="20" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
    <circle cx="195" cy="40" r="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/>
    <rect x="230" y="20" width="40" height="40" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4"/>
    <text x="245" y="48" font-size="24" fill="#64748b">?</text>
  </svg>`;
};

const buildSizePatternSvg = () => {
  return `<svg width="280" height="80" viewBox="0 0 280 80">
    <text x="15" y="52" font-size="38">⭐️</text>
    <text x="75" y="52" font-size="20">⭐️</text>
    <text x="115" y="52" font-size="38">⭐️</text>
    <text x="175" y="52" font-size="20">⭐️</text>
    <rect x="220" y="15" width="50" height="50" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4"/>
    <text x="238" y="48" font-size="24" fill="#64748b">?</text>
  </svg>`;
};

const buildShapePatternSvg = () => {
  return `<svg width="280" height="80" viewBox="0 0 280 80">
    <circle cx="30" cy="40" r="18" fill="#10b981" stroke="#047857" stroke-width="2"/>
    <rect x="68" y="22" width="36" height="36" fill="#10b981" stroke="#047857" stroke-width="2" rx="2"/>
    <circle cx="135" cy="40" r="18" fill="#10b981" stroke="#047857" stroke-width="2"/>
    <rect x="173" y="22" width="36" height="36" fill="#10b981" stroke="#047857" stroke-width="2" rx="2"/>
    <rect x="230" y="20" width="40" height="40" fill="none" stroke="#64748b" stroke-width="2" stroke-dasharray="4"/>
    <text x="245" y="48" font-size="24" fill="#64748b">?</text>
  </svg>`;
};

const buildLongShortSvg = () => {
  return `<svg width="240" height="100" viewBox="0 0 240 100">
    <rect x="20" y="20" width="180" height="16" fill="#3b82f6" rx="4"/>
    <rect x="20" y="60" width="60" height="16" fill="#3b82f6" rx="4"/>
    <text x="210" y="33" font-size="13" font-weight="bold">A</text>
    <text x="90" y="73" font-size="13" font-weight="bold">B</text>
  </svg>`;
};

const buildTallShortSvg = () => {
  return `<svg width="240" height="120" viewBox="0 0 240 120">
    <g transform="translate(40, 10)">
      <rect x="15" y="60" width="10" height="40" fill="#78350f"/>
      <circle cx="20" cy="40" r="30" fill="#22c55e"/>
      <text x="-5" y="115" font-size="12" font-weight="bold">Tree A</text>
    </g>
    <g transform="translate(140, 45)">
      <rect x="15" y="40" width="8" height="25" fill="#78350f"/>
      <circle cx="19" cy="25" r="18" fill="#22c55e"/>
      <text x="-5" y="80" font-size="12" font-weight="bold">Tree B</text>
    </g>
  </svg>`;
};

const buildWideNarrowSvg = () => {
  return `<svg width="240" height="100" viewBox="0 0 240 100">
    <rect x="20" y="15" width="200" height="30" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
    <rect x="20" y="60" width="200" height="10" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2"/>
    <text x="225" y="35" font-size="12" font-weight="bold">A</text>
    <text x="225" y="68" font-size="12" font-weight="bold">B</text>
  </svg>`;
};

const buildCoinSvg = (val) => {
  return `<svg width="80" height="80" viewBox="0 0 80 80">
    <circle cx="40" cy="40" r="36" fill="#cbd5e1" stroke="#64748b" stroke-width="4"/>
    <circle cx="40" cy="40" r="30" fill="none" stroke="#94a3b8" stroke-width="2" stroke-dasharray="4"/>
    <text x="50%" y="58%" font-size="24" font-weight="900" fill="#334155" text-anchor="middle">₹${val}</text>
  </svg>`;
};

// 8 Core Engine Function Implementations

function lkgShapesEngine(config, params, random) {
  const shapes = [
    { id: 'circle', name: 'circle', svg: '<svg width="120" height="120" viewBox="0 0 120 120"><circle cx="60" cy="60" r="48" fill="#3b82f6" stroke="#1d4ed8" stroke-width="4"/></svg>' },
    { id: 'square', name: 'square', svg: '<svg width="120" height="120" viewBox="0 0 120 120"><rect x="15" y="15" width="90" height="90" fill="#ef4444" stroke="#b91c1c" stroke-width="4" rx="4"/></svg>' },
    { id: 'triangle', name: 'triangle', svg: '<svg width="120" height="120" viewBox="0 0 120 120"><polygon points="60,15 15,100 105,100" fill="#10b981" stroke="#047857" stroke-width="4"/></svg>' },
    { id: 'rectangle', name: 'rectangle', svg: '<svg width="120" height="120" viewBox="0 0 120 120"><rect x="10" y="25" width="100" height="70" fill="#f59e0b" stroke="#b45309" stroke-width="4" rx="4"/></svg>' }
  ];

  let subType = params.subType;
  if (subType === 'mixed') {
    subType = random() > 0.5 ? 'name' : 'identify';
  }

  if (subType === 'name') {
    const target = shapes[Math.floor(random() * shapes.length)];
    const questionText = "What shape is this?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: target.svg }
      ],
      options: shapes.map(s => ({ id: s.id, label: s.name.charAt(0).toUpperCase() + s.name.slice(1) })),
      answer: target.id,
      correctAnswerIndex: shapes.findIndex(s => s.id === target.id),
      solution: { sections: [{ type: 'text', content: `This shape is a ${target.name}.` }] }
    };
  } else {
    const targetShape = params.targetShape || shapes[Math.floor(random() * shapes.length)].id;
    const target = shapes.find(s => s.id === targetShape);
    const otherShapes = shapes.filter(s => s.id !== targetShape);
    const decoy = otherShapes[Math.floor(random() * otherShapes.length)];

    const isMatch = random() > 0.5;
    const displayShape = isMatch ? target : decoy;

    const questionText = `Is this a ${target.name}?`;
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: displayShape.svg }
      ],
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ],
      answer: isMatch ? 'yes' : 'no',
      correctAnswerIndex: isMatch ? 0 : 1,
      solution: { sections: [{ type: 'text', content: isMatch ? `Yes, this is a ${target.name}.` : `No, this is a ${displayShape.name}.` }] }
    };
  }
}

function lkgCountingEngine(config, params, random) {
  const limit = params.limit || 5;
  const subType = params.subType || 'objects';
  const count = Math.floor(random() * limit) + 1;
  const item = lkgCountingObjects[Math.floor(random() * lkgCountingObjects.length)];

  const options = Array.from({ length: limit }, (_, i) => ({
    id: String(i + 1),
    label: String(i + 1),
    value: i + 1
  }));

  if (subType === 'learn' || subType === 'objects') {
    const instruction = `Count the ${item.plural}. Click each ${item.name} to keep track as you count.`;
    const questionText = `How many ${item.plural} are there?`;
    return {
      type: 'mcq',
      questionText,
      parts: [
        {
          type: 'interactive_counting',
          instruction,
          subInstruction: questionText,
          image: item.image,
          count,
          itemLabel: item.name
        }
      ],
      options,
      answer: count,
      correctAnswerIndex: count - 1,
      solution: { sections: [{ type: 'text', content: `There are exactly ${count} ${count === 1 ? item.name : item.plural}.` }] }
    };
  }

  if (subType === 'dots') {
    const questionText = "How many dots are there?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildDotsSvg(count) }
      ],
      options,
      answer: count,
      correctAnswerIndex: count - 1,
      solution: { sections: [{ type: 'text', content: `There are ${count} dots.` }] }
    };
  }

  if (subType === 'shapes') {
    const shapeTypes = ['circle', 'square', 'triangle'];
    const chosenShape = shapeTypes[Math.floor(random() * shapeTypes.length)];
    const questionText = `How many ${chosenShape}s are there?`;
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildShapesSvg(count, chosenShape) }
      ],
      options,
      answer: count,
      correctAnswerIndex: count - 1,
      solution: { sections: [{ type: 'text', content: `There are exactly ${count} ${chosenShape}s.` }] }
    };
  }

  if (subType === 'ten_frames') {
    const questionText = "How many dots are on the ten-frame?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildTenFrameSvg(count) }
      ],
      options,
      answer: count,
      correctAnswerIndex: count - 1,
      solution: { sections: [{ type: 'text', content: `The ten-frame contains exactly ${count} dot${count === 1 ? '' : 's'}.` }] }
    };
  }

  if (subType === 'show_ten_frames') {
    const targetCount = count;
    let decoyCount = Math.floor(random() * limit) + 1;
    while (decoyCount === targetCount) {
      decoyCount = Math.floor(random() * limit) + 1;
    }

    const isTargetFirst = random() > 0.5;
    const optionA = isTargetFirst ? buildTenFrameSvg(targetCount) : buildTenFrameSvg(decoyCount);
    const optionB = isTargetFirst ? buildTenFrameSvg(decoyCount) : buildTenFrameSvg(targetCount);

    const questionText = `Which ten-frame shows ${targetCount}?`;
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        { id: 'opt_a', label: 'Option A', svg: optionA },
        { id: 'opt_b', label: 'Option B', svg: optionB }
      ],
      answer: isTargetFirst ? 'opt_a' : 'opt_b',
      correctAnswerIndex: isTargetFirst ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `Option ${isTargetFirst ? 'A' : 'B'} has exactly ${targetCount} dot${targetCount === 1 ? '' : 's'}.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'represent') {
    const targetCount = count;
    let decoyCount = Math.floor(random() * limit) + 1;
    while (decoyCount === targetCount) {
      decoyCount = Math.floor(random() * limit) + 1;
    }

    const isTargetFirst = random() > 0.5;
    const optionA = isTargetFirst ? buildShapesSvg(targetCount, 'circle') : buildShapesSvg(decoyCount, 'circle');
    const optionB = isTargetFirst ? buildShapesSvg(decoyCount, 'circle') : buildShapesSvg(targetCount, 'circle');

    const questionText = `Which group shows ${targetCount} circles?`;
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        { id: 'opt_a', label: 'Option A', svg: optionA },
        { id: 'opt_b', label: 'Option B', svg: optionB }
      ],
      answer: isTargetFirst ? 'opt_a' : 'opt_b',
      correctAnswerIndex: isTargetFirst ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `Option ${isTargetFirst ? 'A' : 'B'} contains exactly ${targetCount} circle${targetCount === 1 ? '' : 's'}.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }
}

function lkgComparingEngine(config, params, random) {
  const subType = params.subType === 'mixed' 
    ? (random() > 0.5 ? 'more' : 'enough') 
    : (params.subType || 'more');

  const pairs = [
    { nameA: 'puppy', pluralA: 'puppies', emojiA: '🐶', nameB: 'bone', pluralB: 'bones', emojiB: '🦴' },
    { nameA: 'rabbit', pluralA: 'rabbits', emojiA: '🐰', nameB: 'carrot', pluralB: 'carrots', emojiB: '🥕' },
    { nameA: 'monkey', pluralA: 'monkeys', emojiA: '🐵', nameB: 'banana', pluralB: 'bananas', emojiB: '🍌' },
    { nameA: 'bee', pluralA: 'bees', emojiA: '🐝', nameB: 'flower', pluralB: 'flowers', emojiB: '🌸' }
  ];
  const chosenPair = pairs[Math.floor(random() * pairs.length)];

  if (subType === 'enough') {
    const countA = Math.floor(random() * 4) + 2; 
    let countB = Math.floor(random() * 4) + 2; 
    const isEnough = countA <= countB; // if pets <= food, then yes there is enough food for all pets

    const questionText = `Are there enough ${chosenPair.pluralB} for all the ${chosenPair.pluralA}?`;
    
    const buildEmojiSvg = (emoji, count) => {
      let emojis = '';
      for (let i = 0; i < count; i++) {
        emojis += emoji + ' ';
      }
      return `<svg width="220" height="50"><text x="10" y="36" font-size="28">${emojis.trim()}</text></svg>`;
    };

    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        {
          type: 'side_by_side_display',
          groupA: { count: countA, itemLabel: chosenPair.pluralA, image: `data:image/svg+xml;utf8,${encodeURIComponent(buildEmojiSvg(chosenPair.emojiA, countA))}` },
          groupB: { count: countB, itemLabel: chosenPair.pluralB, image: `data:image/svg+xml;utf8,${encodeURIComponent(buildEmojiSvg(chosenPair.emojiB, countB))}` }
        }
      ],
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ],
      answer: isEnough ? 'yes' : 'no',
      correctAnswerIndex: isEnough ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `There are ${countA} ${chosenPair.pluralA} and ${countB} ${chosenPair.pluralB}. Since ${countA} is ${isEnough ? 'less than or equal to' : 'greater than'} ${countB}, the answer is ${isEnough ? 'Yes' : 'No'}.` }] }
    };
  } else {
    const itemA = lkgCountingObjects[Math.floor(random() * lkgCountingObjects.length)];
    let itemB = lkgCountingObjects[Math.floor(random() * lkgCountingObjects.length)];
    while (itemA.name === itemB.name) {
      itemB = lkgCountingObjects[Math.floor(random() * lkgCountingObjects.length)];
    }

    let countA = Math.floor(random() * 5) + 1;
    let countB = Math.floor(random() * 5) + 1;
    while (countA === countB) {
      countB = Math.floor(random() * 5) + 1;
    }

    const comparison = subType === 'fewer' ? 'fewer' : 'more';
    const isFirstCorrect = comparison === 'more' ? (countA > countB) : (countA < countB);

    const questionText = `Which group has ${comparison}?`;
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        {
          type: 'side_by_side_display',
          groupA: { count: countA, itemLabel: itemA.plural, image: itemA.image },
          groupB: { count: countB, itemLabel: itemB.plural, image: itemB.image }
        }
      ],
      options: [
        { id: 'group_a', label: `Group of ${itemA.plural}` },
        { id: 'group_b', label: `Group of ${itemB.plural}` }
      ],
      answer: isFirstCorrect ? 'group_a' : 'group_b',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `Group A has ${countA} and Group B has ${countB}. Therefore, Group ${isFirstCorrect ? 'A' : 'B'} has ${comparison} items.` }] }
    };
  }
}

function lkgPositionsEngine(config, params, random) {
  const subType = params.subType;

  if (subType === 'inside_outside') {
    const questionText = "Which animal is inside the box?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildInsideOutsideSvg() }
      ],
      options: [
        { id: 'cat', label: 'Cat 🐱' },
        { id: 'dog', label: 'Dog 🐶' }
      ],
      answer: 'cat',
      correctAnswerIndex: 0,
      solution: { sections: [{ type: 'text', content: "The Cat 🐱 is inside the dashed box. The Dog 🐶 is outside the box." }] }
    };
  }

  if (subType === 'above_below') {
    const isAbove = random() > 0.5;
    const questionText = isAbove ? "Which fruit is above the line?" : "Which fruit is below the line?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildAboveBelowSvg() }
      ],
      options: [
        { id: 'apple', label: 'Apple 🍎' },
        { id: 'banana', label: 'Banana 🍌' }
      ],
      answer: isAbove ? 'apple' : 'banana',
      correctAnswerIndex: isAbove ? 0 : 1,
      solution: { sections: [{ type: 'text', content: isAbove ? "The Apple 🍎 is above the line." : "The Banana 🍌 is below the line." }] }
    };
  }

  if (subType === 'beside_next') {
    const questionText = "Which animal is beside the tree?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildBesideNextSvg() }
      ],
      options: [
        { id: 'rabbit', label: 'Rabbit 🐰' },
        { id: 'fox', label: 'Fox 🦊' }
      ],
      answer: 'rabbit',
      correctAnswerIndex: 0,
      solution: { sections: [{ type: 'text', content: "The Rabbit 🐰 is sitting right beside the tree 🌲." }] }
    };
  }

  if (subType === 'left_right') {
    const isLeft = random() > 0.5;
    const questionText = isLeft ? "Which fruit is on the left?" : "Which fruit is on the right?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildLeftRightSvg() }
      ],
      options: [
        { id: 'apple', label: 'Apple 🍎' },
        { id: 'strawberry', label: 'Strawberry 🍓' }
      ],
      answer: isLeft ? 'apple' : 'strawberry',
      correctAnswerIndex: isLeft ? 0 : 1,
      solution: { sections: [{ type: 'text', content: isLeft ? "The Apple 🍎 is on the left side of the dotted line." : "The Strawberry 🍓 is on the right side." }] }
    };
  }

  if (subType === 'left_middle_right') {
    const choices = [
      { id: 'grape', name: 'Grape 🍇', position: 'left', index: 0 },
      { id: 'orange', name: 'Orange 🍊', position: 'middle', index: 1 },
      { id: 'pear', name: 'Pear 🍐', position: 'right', index: 2 }
    ];
    const target = choices[Math.floor(random() * choices.length)];
    const questionText = `Which fruit is in the ${target.position}?`;
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildLeftMiddleRightSvg() }
      ],
      options: choices.map(c => ({ id: c.id, label: c.name })),
      answer: target.id,
      correctAnswerIndex: target.index,
      solution: { sections: [{ type: 'text', content: `The Grape 🍇 is on the left, the Orange 🍊 is in the middle, and the Pear 🍐 is on the right.` }] }
    };
  }

  if (subType === 'top_bottom') {
    const isTop = random() > 0.5;
    const questionText = isTop ? "Which animal is at the top?" : "Which animal is at the bottom?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildTopBottomSvg() }
      ],
      options: [
        { id: 'bird', label: 'Bird 🐦' },
        { id: 'cat', label: 'Cat 🐱' }
      ],
      answer: isTop ? 'bird' : 'cat',
      correctAnswerIndex: isTop ? 0 : 1,
      solution: { sections: [{ type: 'text', content: isTop ? "The Bird 🐦 is sitting at the top of the ladder." : "The Cat 🐱 is at the bottom." }] }
    };
  }

  if (subType === 'top_middle_bottom') {
    const choices = [
      { id: 'balloon', name: 'Balloon 🎈', position: 'top', index: 0 },
      { id: 'ball', name: 'Ball ⚽', position: 'middle', index: 1 },
      { id: 'box', name: 'Box 📦', position: 'bottom', index: 2 }
    ];
    const target = choices[Math.floor(random() * choices.length)];
    const questionText = `Which item is at the ${target.position}?`;
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildTopMiddleBottomSvg() }
      ],
      options: choices.map(c => ({ id: c.id, label: c.name })),
      answer: target.id,
      correctAnswerIndex: target.index,
      solution: { sections: [{ type: 'text', content: `The Balloon 🎈 is at the top, the Ball ⚽ is in the middle, and the Box 📦 is at the bottom.` }] }
    };
  }
}

function lkgClassifyEngine(config, params, random) {
  let subType = params.subType;
  if (subType === 'same_different') {
    subType = random() > 0.5 ? 'same' : 'different';
  }

  if (subType === 'same') {
    const targetSvg = `<svg width="80" height="80" viewBox="0 0 80 80"><circle cx="40" cy="40" r="30" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/></svg>`; 
    const decoySvg = `<svg width="80" height="80" viewBox="0 0 80 80"><rect x="15" y="15" width="50" height="50" fill="#ef4444" stroke="#b91c1c" stroke-width="3" rx="2"/></svg>`; 

    const isFirstCorrect = random() > 0.5;
    const questionText = "Which shape is the same as this blue circle?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: targetSvg }
      ],
      options: [
        { id: 'opt_a', label: 'Option A', svg: isFirstCorrect ? targetSvg : decoySvg },
        { id: 'opt_b', label: 'Option B', svg: isFirstCorrect ? decoySvg : targetSvg }
      ],
      answer: isFirstCorrect ? 'opt_a' : 'opt_b',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `The blue circle matches Option ${isFirstCorrect ? 'A' : 'B'}.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'different') {
    const appleSvg = `<svg width="60" height="60"><text x="10" y="45" font-size="36">🍎</text></svg>`;
    const bananaSvg = `<svg width="60" height="60"><text x="10" y="45" font-size="36">🍌</text></svg>`;

    const isFirstCorrect = random() > 0.5;
    const optionASvg = isFirstCorrect ? bananaSvg : appleSvg;
    const optionBSvg = isFirstCorrect ? appleSvg : bananaSvg;

    const questionText = "Which one is different?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: `<svg width="240" height="70" viewBox="0 0 240 70">
          <text x="10" y="50" font-size="36">🍎</text>
          <text x="70" y="50" font-size="36">🍎</text>
          <text x="130" y="50" font-size="36">🍎</text>
          <text x="190" y="50" font-size="36">🍌</text>
        </svg>` }
      ],
      options: [
        { id: 'banana', label: 'Banana 🍌', svg: optionASvg },
        { id: 'apple', label: 'Apple 🍎', svg: optionBSvg }
      ],
      answer: isFirstCorrect ? 'banana' : 'apple',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "The Banana 🍌 is different because all other items are Apples 🍎." }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'shapes_color') {
    const redCircle = `<svg width="80" height="80"><circle cx="40" cy="40" r="30" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/></svg>`;
    const blueCircle = `<svg width="80" height="80"><circle cx="40" cy="40" r="30" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/></svg>`;

    const isFirstCorrect = random() > 0.5;
    const questionText = "Which shape is red?";
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        { id: 'opt_a', label: 'Option A', svg: isFirstCorrect ? redCircle : blueCircle },
        { id: 'opt_b', label: 'Option B', svg: isFirstCorrect ? blueCircle : redCircle }
      ],
      answer: isFirstCorrect ? 'opt_a' : 'opt_b',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `The red circle is Option ${isFirstCorrect ? 'A' : 'B'}.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'sort_color' || subType === 'sort_shape') {
    const isSortColor = subType === 'sort_color';
    const targetGroup = isSortColor 
      ? `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
          <rect x="110" y="16" width="48" height="48" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3" rx="2"/>
        </svg>`
      : `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
          <circle cx="130" cy="40" r="24" fill="#ef4444" stroke="#b91c1c" stroke-width="3"/>
        </svg>`;

    const decoyGroup = isSortColor
      ? `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
          <rect x="110" y="16" width="48" height="48" fill="#ef4444" stroke="#b91c1c" stroke-width="3" rx="2"/>
        </svg>`
      : `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3"/>
          <rect x="110" y="16" width="48" height="48" fill="#3b82f6" stroke="#1d4ed8" stroke-width="3" rx="2"/>
        </svg>`;

    const isFirstCorrect = random() > 0.5;
    const questionText = isSortColor 
      ? "Which group has only blue shapes?" 
      : "Which group has only circles?";

    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        { id: 'opt_a', label: 'Group A', svg: isFirstCorrect ? targetGroup : decoyGroup },
        { id: 'opt_b', label: 'Group B', svg: isFirstCorrect ? decoyGroup : targetGroup }
      ],
      answer: isFirstCorrect ? 'opt_a' : 'opt_b',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `Group ${isFirstCorrect ? 'A' : 'B'} meets the classification criteria.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }
}

function lkgPatternsEngine(config, params, random) {
  let subType = params.subType;
  if (subType === 'next') {
    const types = ['color', 'size', 'shape'];
    subType = types[Math.floor(random() * types.length)];
  }

  if (subType === 'color') {
    const redCircle = `<svg width="60" height="60"><circle cx="30" cy="30" r="20" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/></svg>`;
    const blueCircle = `<svg width="60" height="60"><circle cx="30" cy="30" r="20" fill="#3b82f6" stroke="#1d4ed8" stroke-width="2"/></svg>`;

    const isFirstCorrect = random() > 0.5;
    const questionText = "Which circle comes next in the pattern?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildColorPatternSvg() }
      ],
      options: [
        { id: 'red', label: 'Red Circle', svg: isFirstCorrect ? redCircle : blueCircle },
        { id: 'blue', label: 'Blue Circle', svg: isFirstCorrect ? blueCircle : redCircle }
      ],
      answer: 'red',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "The pattern alternates Red, Blue. The next color is Red." }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'size') {
    const bigStar = `<svg width="60" height="60"><text x="10" y="45" font-size="38">⭐️</text></svg>`;
    const smallStar = `<svg width="60" height="60"><text x="20" y="40" font-size="20">⭐️</text></svg>`;

    const isFirstCorrect = random() > 0.5;
    const questionText = "Which star comes next in the pattern?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildSizePatternSvg() }
      ],
      options: [
        { id: 'big', label: 'Big Star', svg: isFirstCorrect ? bigStar : smallStar },
        { id: 'small', label: 'Small Star', svg: isFirstCorrect ? smallStar : bigStar }
      ],
      answer: 'big',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "The sequence goes Big, Small, Big, Small. The next is Big." }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'shape') {
    const circle = `<svg width="60" height="60"><circle cx="30" cy="30" r="18" fill="#10b981" stroke="#047857" stroke-width="2"/></svg>`;
    const square = `<svg width="60" height="60"><rect x="12" y="12" width="36" height="36" fill="#10b981" stroke="#047857" stroke-width="2" rx="2"/></svg>`;

    const isFirstCorrect = random() > 0.5;
    const questionText = "Which shape comes next in the pattern?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildShapePatternSvg() }
      ],
      options: [
        { id: 'circle', label: 'Circle', svg: isFirstCorrect ? circle : square },
        { id: 'square', label: 'Square', svg: isFirstCorrect ? square : circle }
      ],
      answer: 'circle',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "The pattern alternates Circle, Square. The next shape is a Circle." }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }
}

function lkgSizeEngine(config, params, random) {
  const subType = params.subType;

  if (subType === 'long_short') {
    const isLonger = random() > 0.5;
    const questionText = isLonger ? "Which line is longer?" : "Which line is shorter?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildLongShortSvg() }
      ],
      options: [
        { id: 'a', label: 'Line A' },
        { id: 'b', label: 'Line B' }
      ],
      answer: isLonger ? 'a' : 'b',
      correctAnswerIndex: isLonger ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "Line A is longer than Line B." }] }
    };
  }

  if (subType === 'tall_short') {
    const isTaller = random() > 0.5;
    const questionText = isTaller ? "Which tree is taller?" : "Which tree is shorter?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildTallShortSvg() }
      ],
      options: [
        { id: 'a', label: 'Tree A' },
        { id: 'b', label: 'Tree B' }
      ],
      answer: isTaller ? 'a' : 'b',
      correctAnswerIndex: isTaller ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "Tree A is taller than Tree B." }] }
    };
  }

  if (subType === 'wide_narrow') {
    const isWider = random() > 0.5;
    const questionText = isWider ? "Which path is wider?" : "Which path is narrower?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: buildWideNarrowSvg() }
      ],
      options: [
        { id: 'a', label: 'Path A' },
        { id: 'b', label: 'Path B' }
      ],
      answer: isWider ? 'a' : 'b',
      correctAnswerIndex: isWider ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "Path A is wider than Path B." }] }
    };
  }

  if (subType === 'light_heavy') {
    const isHeavier = random() > 0.5;
    const questionText = isHeavier ? "Which is heavier?" : "Which is lighter?";
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        { id: 'elephant', label: 'Elephant 🐘' },
        { id: 'feather', label: 'Feather 🪶' }
      ],
      answer: isHeavier ? 'elephant' : 'feather',
      correctAnswerIndex: isHeavier ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "An Elephant 🐘 is heavy, whereas a Feather 🪶 is very light." }] }
    };
  }
}

function lkgMoneyEngine(config, params, random) {
  const subType = params.subType;

  if (subType === 'coin_values') {
    const targetVal = [1, 2, 5, 10][Math.floor(random() * 4)];
    let decoyVal = [1, 2, 5, 10][Math.floor(random() * 4)];
    while (decoyVal === targetVal) {
      decoyVal = [1, 2, 5, 10][Math.floor(random() * 4)];
    }

    const isFirstCorrect = random() > 0.5;
    const coinA = buildCoinSvg(isFirstCorrect ? targetVal : decoyVal);
    const coinB = buildCoinSvg(isFirstCorrect ? decoyVal : targetVal);

    const questionText = `Which coin is a ${targetVal}-rupee coin?`;
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        { id: 'opt_a', label: 'Option A', svg: coinA },
        { id: 'opt_b', label: 'Option B', svg: coinB }
      ],
      answer: isFirstCorrect ? 'opt_a' : 'opt_b',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `The coin displaying ₹${targetVal} is the ${targetVal}-rupee coin.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'count_coins') {
    const count = Math.floor(random() * 5) + 1;
    const questionText = "How many 1-rupee coins are there?";

    let coinsSvg = '';
    for (let i = 0; i < count; i++) {
      const x = 10 + i * 48;
      coinsSvg += `<g transform="translate(${x}, 5)">
        <circle cx="20" cy="20" r="18" fill="#cbd5e1" stroke="#64748b" stroke-width="2"/>
        <text x="50%" y="65%" font-size="14" font-weight="900" fill="#334155" text-anchor="middle">₹1</text>
      </g>`;
    }
    const width = 20 + count * 48;
    const finalSvg = `<svg width="${width}" height="50" viewBox="0 0 ${width} 50">${coinsSvg}</svg>`;

    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: finalSvg }
      ],
      options: Array.from({ length: 5 }, (_, i) => ({
        id: String(i + 1),
        label: String(i + 1),
        value: i + 1
      })),
      answer: count,
      correctAnswerIndex: count - 1,
      solution: { sections: [{ type: 'text', content: `There are exactly ${count} coins.` }] }
    };
  }
}

// Orchestrator generateLkgQuestion entrypoint

export function generateLkgQuestion(config = {}) {
  const logicType = config.logic_type || 'lkg-count5-objects';
  const entry = lkgMicroSkillRegistry[logicType] || lkgMicroSkillRegistry['lkg-count5-objects'];

  const seed = config.variables?.seed || String(Date.now());
  const random = getSeededRandom(seed);
  
  const templateId = entry.templateId;
  const params = entry.params || {};

  let rawQuestion;
  if (templateId === 'lkg.shapes') {
    rawQuestion = lkgShapesEngine(config, params, random);
  } else if (templateId === 'lkg.counting') {
    rawQuestion = lkgCountingEngine(config, params, random);
  } else if (templateId === 'lkg.comparing') {
    rawQuestion = lkgComparingEngine(config, params, random);
  } else if (templateId === 'lkg.positions') {
    rawQuestion = lkgPositionsEngine(config, params, random);
  } else if (templateId === 'lkg.classify') {
    rawQuestion = lkgClassifyEngine(config, params, random);
  } else if (templateId === 'lkg.patterns') {
    rawQuestion = lkgPatternsEngine(config, params, random);
  } else if (templateId === 'lkg.size') {
    rawQuestion = lkgSizeEngine(config, params, random);
  } else if (templateId === 'lkg.money') {
    rawQuestion = lkgMoneyEngine(config, params, random);
  } else {
    // Default fallback
    rawQuestion = lkgCountingEngine(config, { subType: 'objects', limit: 5 }, random);
  }

  // Inject metaConfig reader controls by default for LKG questions
  return {
    ...rawQuestion,
    metaConfig: {
      readable: true,
      readOptions: true,
      ...(rawQuestion.metaConfig || {})
    },
    metadata: {
      ...(rawQuestion.metadata || {}),
      topic: 'lkg',
      templateId,
      subject: 'math',
      grade: 'LKG',
      skillId: logicType,
      competencyId: 'lkg_counting_5',
      seed
    }
  };
}

export function generateLkgCompareQuestion(config = {}) {
  return generateLkgQuestion({
    ...config,
    logic_type: config.logic_type || 'lkg-compare-more'
  });
}