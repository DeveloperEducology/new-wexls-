import { lkgCountingObjects, lkgSizeImageAssets } from './assets.js';
import { lkgMicroSkillRegistry } from './registry.js';
import fs from 'fs';
import path from 'path';

// Helper to load and embed local SVG files as nested SVGs with precise tap highlight zones
function loadNestedSvg(filename, x, y, width, height, optionIndex) {
  try {
    const filePath = path.join(process.cwd(), 'public/images', filename);
    const rawContent = fs.readFileSync(filePath, 'utf8');
    
    // Extract the inner content of the SVG
    const innerContentMatch = rawContent.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    if (!innerContentMatch) return '';
    const innerContent = innerContentMatch[1];
    
    return `<svg x="${x}" y="${y}" width="${width}" height="${height}" viewBox="0 0 1024 1024" class="interactive-hotspot" data-option-index="${optionIndex}">
      <rect class="hotspot-highlight" x="20" y="20" width="984" height="984" rx="80" fill="none" stroke="transparent" stroke-width="25"/>
      ${innerContent}
    </svg>`;
  } catch (err) {
    console.error(`Failed to load nested SVG: ${filename}`, err);
    return '';
  }
}

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

// Helper to resolve the correct image URL (preferring a remote sampleUrl if it starts with http/https)
function resolveAssetImage(item) {
  if (!item) return '';
  if (item.sampleUrl && (item.sampleUrl.startsWith('http://') || item.sampleUrl.startsWith('https://'))) {
    return item.sampleUrl;
  }
  if (item.image && (item.image.startsWith('http://') || item.image.startsWith('https://'))) {
    return item.image;
  }
  const VALID_LOCAL_IMAGES = [
    "/images/lkg/apple.png",
    "/images/lkg/ball.png",
    "/images/lkg/butterfly.png",
    "/images/lkg/car.png",
    "/images/lkg/duck.png",
    "/images/lkg/frog.png",
    "/images/lkg/flower.png",
    "/images/lkg/flowers.png",
    "/images/lkg/hippo.png"
  ];
  if (item.image && VALID_LOCAL_IMAGES.includes(item.image)) {
    return item.image;
  }
  return '';
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
// SVG loaders for Positions engine (Interactive SVG mode)
const buildInsideOutsideSvg = (insideEmoji = '🐱', outsideEmoji = '🐶') => {
  return `<svg width="240" height="130" viewBox="0 0 240 130">
    <rect x="20" y="25" width="90" height="85" fill="none" stroke="#475569" stroke-width="3" stroke-dasharray="4" rx="8"/>
    <text x="65" y="18" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">INSIDE</text>
    <text x="175" y="18" font-size="11" font-weight="bold" fill="#64748b" text-anchor="middle">OUTSIDE</text>
    <g class="interactive-hotspot" data-option-index="0">
      <rect class="hotspot-highlight" x="25" y="30" width="80" height="75" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="65" y="72" font-size="38" text-anchor="middle" dominant-baseline="central">${insideEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="1">
      <rect class="hotspot-highlight" x="135" y="30" width="80" height="75" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="175" y="72" font-size="38" text-anchor="middle" dominant-baseline="central">${outsideEmoji}</text>
    </g>
  </svg>`;
};

const buildAboveBelowSvg = (aboveEmoji = '🍎', belowEmoji = '🍌') => {
  return `<svg width="240" height="150" viewBox="0 0 240 150">
    <line x1="20" y1="75" x2="220" y2="75" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
    <g class="interactive-hotspot" data-option-index="0">
      <rect class="hotspot-highlight" x="80" y="10" width="80" height="50" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="120" y="47" font-size="38" text-anchor="middle" dominant-baseline="central">${aboveEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="1">
      <rect class="hotspot-highlight" x="80" y="90" width="80" height="50" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="120" y="127" font-size="38" text-anchor="middle" dominant-baseline="central">${belowEmoji}</text>
    </g>
  </svg>`;
};

const buildBesideNextSvg = (centerEmoji = '🌲', besideEmoji = '🐰', farEmoji = '🦊', isCenterLeft = true) => {
  const centerX = isCenterLeft ? 45 : 195;
  const besideX = 120;
  const farX = isCenterLeft ? 195 : 45;
  return `<svg width="240" height="130" viewBox="0 0 240 130">
    <text x="${centerX}" y="70" font-size="52" text-anchor="middle" dominant-baseline="central">${centerEmoji}</text>
    <g class="interactive-hotspot" data-option-index="0">
      <rect class="hotspot-highlight" x="${besideX - 35}" y="25" width="70" height="80" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="${besideX}" y="70" font-size="38" text-anchor="middle" dominant-baseline="central">${besideEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="1">
      <rect class="hotspot-highlight" x="${farX - 35}" y="25" width="70" height="80" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="${farX}" y="70" font-size="38" text-anchor="middle" dominant-baseline="central">${farEmoji}</text>
    </g>
  </svg>`;
};

const buildLeftRightSvg = (leftEmoji = '🍎', rightEmoji = '🍓') => {
  return `<svg width="240" height="130" viewBox="0 0 240 130">
    <line x1="120" y1="15" x2="120" y2="115" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="4"/>
    <g class="interactive-hotspot" data-option-index="0">
      <rect class="hotspot-highlight" x="20" y="25" width="80" height="80" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="60" y="70" font-size="38" text-anchor="middle" dominant-baseline="central">${leftEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="1">
      <rect class="hotspot-highlight" x="140" y="25" width="80" height="80" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="180" y="70" font-size="38" text-anchor="middle" dominant-baseline="central">${rightEmoji}</text>
    </g>
  </svg>`;
};

const buildLeftMiddleRightSvg = (leftEmoji = '🍇', middleEmoji = '🍊', rightEmoji = '🍐') => {
  return `<svg width="240" height="110" viewBox="0 0 240 110">
    <g class="interactive-hotspot" data-option-index="0">
      <rect class="hotspot-highlight" x="10" y="15" width="70" height="80" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="45" y="58" font-size="38" text-anchor="middle" dominant-baseline="central">${leftEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="1">
      <rect class="hotspot-highlight" x="85" y="15" width="70" height="80" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="120" y="58" font-size="38" text-anchor="middle" dominant-baseline="central">${middleEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="2">
      <rect class="hotspot-highlight" x="160" y="15" width="70" height="80" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="195" y="58" font-size="38" text-anchor="middle" dominant-baseline="central">${rightEmoji}</text>
    </g>
  </svg>`;
};

const buildTopBottomSvg = (topEmoji = '🐦', bottomEmoji = '🐱') => {
  return `<svg width="240" height="150" viewBox="0 0 240 150">
    <line x1="80" y1="10" x2="80" y2="140" stroke="#94a3b8" stroke-width="4"/>
    <line x1="120" y1="10" x2="120" y2="140" stroke="#94a3b8" stroke-width="4"/>
    <line x1="80" y1="35" x2="120" y2="35" stroke="#94a3b8" stroke-width="3"/>
    <line x1="80" y1="75" x2="120" y2="75" stroke="#94a3b8" stroke-width="3"/>
    <line x1="80" y1="115" x2="120" y2="115" stroke="#94a3b8" stroke-width="3"/>
    <g class="interactive-hotspot" data-option-index="0">
      <rect class="hotspot-highlight" x="135" y="10" width="75" height="55" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="172" y="38" font-size="34" text-anchor="middle" dominant-baseline="central">${topEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="1">
      <rect class="hotspot-highlight" x="135" y="85" width="75" height="55" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="172" y="113" font-size="34" text-anchor="middle" dominant-baseline="central">${bottomEmoji}</text>
    </g>
  </svg>`;
};

const buildTopMiddleBottomSvg = (topEmoji = '🎈', middleEmoji = '⚽', bottomEmoji = '📦') => {
  return `<svg width="240" height="180" viewBox="0 0 240 180">
    <g class="interactive-hotspot" data-option-index="0">
      <rect class="hotspot-highlight" x="80" y="5" width="80" height="50" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="120" y="30" font-size="34" text-anchor="middle" dominant-baseline="central">${topEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="1">
      <rect class="hotspot-highlight" x="80" y="65" width="80" height="50" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="120" y="90" font-size="34" text-anchor="middle" dominant-baseline="central">${middleEmoji}</text>
    </g>
    <g class="interactive-hotspot" data-option-index="2">
      <rect class="hotspot-highlight" x="80" y="125" width="80" height="50" rx="12" fill="none" stroke="transparent" stroke-width="2.5" />
      <text x="120" y="150" font-size="34" text-anchor="middle" dominant-baseline="central">${bottomEmoji}</text>
    </g>
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
          image: resolveAssetImage(item),
          emoji: item.emoji,
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
          groupA: { count: countA, itemLabel: itemA.plural, image: resolveAssetImage(itemA), emoji: itemA.emoji },
          groupB: { count: countB, itemLabel: itemB.plural, image: resolveAssetImage(itemB), emoji: itemB.emoji }
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

  if (subType === 'interactive_demo') {
    // ── All available image assets for interactive demo ──────────────────────────
    // SVG files are embedded inline; PNG files are referenced via <image href>
    const allAssets = [
      { name: 'rabbit',    label: 'Rabbit',    emoji: '🐰', type: 'svg', file: 'rabbit.svg' },
      { name: 'penguin',   label: 'Penguin',   emoji: '🐧', type: 'svg', file: 'penguin.svg' },
      { name: 'duck',      label: 'Duck',      emoji: '🦆', type: 'png', url: '/images/lkg/duck.png' },
      { name: 'frog',      label: 'Frog',      emoji: '🐸', type: 'png', url: '/images/lkg/frog.png' },
      { name: 'butterfly', label: 'Butterfly', emoji: '🦋', type: 'png', url: '/images/lkg/butterfly.png' },
      { name: 'hippo',     label: 'Hippo',     emoji: '🦛', type: 'png', url: '/images/lkg/hippo.png' },
      { name: 'flower',    label: 'Flower',    emoji: '🌸', type: 'png', url: '/images/lkg/flower.png' },
      { name: 'apple',     label: 'Apple',     emoji: '🍎', type: 'png', url: '/images/lkg/apple.png' },
      { name: 'ball',      label: 'Ball',      emoji: '⚽', type: 'png', url: '/images/lkg/ball.png' },
      { name: 'car',       label: 'Car',       emoji: '🚗', type: 'png', url: '/images/lkg/car.png' },
    ];

    // Pick 2 different assets
    const idx1 = Math.floor(random() * allAssets.length);
    let idx2 = Math.floor(random() * allAssets.length);
    while (idx2 === idx1) idx2 = Math.floor(random() * allAssets.length);
    const assetA = allAssets[idx1];
    const assetB = allAssets[idx2];

    // Render an asset as a clickable hotspot group at the given SVG coordinates
    function renderHotspot(asset, x, y, w, h, optionIndex) {
      if (asset.type === 'svg') {
        return loadNestedSvg(asset.file, x, y, w, h, optionIndex);
      }
      // PNG: use SVG <image> element wrapped in a hotspot <g>
      return `<g class="interactive-hotspot" data-option-index="${optionIndex}">
        <rect class="hotspot-highlight" x="${x - 6}" y="${y - 6}" width="${w + 12}" height="${h + 12}" rx="18" fill="none" stroke="transparent" stroke-width="2.5"/>
        <image href="${asset.url}" x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet"/>
      </g>`;
    }

    // Randomly pick one of 3 scene types
    const scenes = ['left_right', 'above_below', 'inside_outside'];
    const scene = scenes[Math.floor(random() * scenes.length)];

    // Randomise which asset goes in position A and which in B
    const [assetFirst, assetSecond] = random() > 0.5 ? [assetA, assetB] : [assetB, assetA];
    const askFirst = random() > 0.5;   // ask about position 0 (first slot) or position 1 (second slot)

    let svgContent, questionText, options, correctAnswerIndex, solutionText;

    // ── Scene 1: LEFT vs RIGHT ─────────────────────────────────────────────────
    if (scene === 'left_right') {
      questionText = askFirst ? 'Which one is on the left?' : 'Which one is on the right?';
      const leftEl  = renderHotspot(assetFirst,  30,  15, 130, 130, 0);
      const rightEl = renderHotspot(assetSecond, 245, 15, 130, 130, 1);
      svgContent = `<svg width="420" height="170" viewBox="0 0 420 170">
        <line x1="210" y1="8" x2="210" y2="162" stroke="#cbd5e1" stroke-width="3" stroke-dasharray="5,4"/>
        <text x="100" y="160" font-size="12" fill="#94a3b8" text-anchor="middle" font-family="sans-serif" font-weight="600">LEFT</text>
        <text x="320" y="160" font-size="12" fill="#94a3b8" text-anchor="middle" font-family="sans-serif" font-weight="600">RIGHT</text>
        ${leftEl}
        ${rightEl}
      </svg>`;
      options = [
        { id: assetFirst.name,  label: `${assetFirst.label} ${assetFirst.emoji}` },
        { id: assetSecond.name, label: `${assetSecond.label} ${assetSecond.emoji}` },
      ];
      correctAnswerIndex = askFirst ? 0 : 1;
      solutionText = `The ${assetFirst.label} ${assetFirst.emoji} is on the left. The ${assetSecond.label} ${assetSecond.emoji} is on the right.`;

    // ── Scene 2: ABOVE vs BELOW ────────────────────────────────────────────────
    } else if (scene === 'above_below') {
      questionText = askFirst ? 'Which one is above the line?' : 'Which one is below the line?';
      const topEl    = renderHotspot(assetFirst,  120,  5,  120, 120, 0);
      const bottomEl = renderHotspot(assetSecond, 120, 175, 120, 120, 1);
      svgContent = `<svg width="360" height="310" viewBox="0 0 360 310">
        <line x1="20" y1="148" x2="340" y2="148" stroke="#0f172a" stroke-width="4" stroke-linecap="round"/>
        <text x="20" y="142" font-size="12" fill="#94a3b8" font-family="sans-serif" font-weight="600">ABOVE</text>
        <text x="20" y="166" font-size="12" fill="#94a3b8" font-family="sans-serif" font-weight="600">BELOW</text>
        ${topEl}
        ${bottomEl}
      </svg>`;
      options = [
        { id: assetFirst.name,  label: `${assetFirst.label} ${assetFirst.emoji}` },
        { id: assetSecond.name, label: `${assetSecond.label} ${assetSecond.emoji}` },
      ];
      correctAnswerIndex = askFirst ? 0 : 1;
      solutionText = `The ${assetFirst.label} ${assetFirst.emoji} is above the line. The ${assetSecond.label} ${assetSecond.emoji} is below the line.`;

    // ── Scene 3: INSIDE vs OUTSIDE a dashed box ────────────────────────────────
    } else {
      questionText = askFirst ? `Which one is inside the box?` : `Which one is outside the box?`;
      const insideEl  = renderHotspot(assetFirst,  60,  35, 115, 115, 0);
      const outsideEl = renderHotspot(assetSecond, 255, 35, 115, 115, 1);
      svgContent = `<svg width="410" height="185" viewBox="0 0 410 185">
        <rect x="25" y="15" width="165" height="155" fill="none" stroke="#475569" stroke-width="3" stroke-dasharray="8,5" rx="12"/>
        <text x="107" y="12" font-size="11" fill="#64748b" text-anchor="middle" font-family="sans-serif" font-weight="700">INSIDE</text>
        <text x="315" y="12" font-size="11" fill="#64748b" text-anchor="middle" font-family="sans-serif" font-weight="700">OUTSIDE</text>
        ${insideEl}
        ${outsideEl}
      </svg>`;
      options = [
        { id: assetFirst.name,  label: `${assetFirst.label} ${assetFirst.emoji}` },
        { id: assetSecond.name, label: `${assetSecond.label} ${assetSecond.emoji}` },
      ];
      correctAnswerIndex = askFirst ? 0 : 1;
      solutionText = `The ${assetFirst.label} ${assetFirst.emoji} is inside the box. The ${assetSecond.label} ${assetSecond.emoji} is outside the box.`;
    }

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: svgContent }
      ],
      options,
      answer: askFirst ? assetFirst.name : assetSecond.name,
      correctAnswerIndex,
      solution: { sections: [{ type: 'text', content: solutionText }] }
    };
  }

  if (subType === 'inside_outside') {
    const pairs = [
      { inside: { name: 'cat', emoji: '🐱', label: 'Cat 🐱' }, outside: { name: 'dog', emoji: '🐶', label: 'Dog 🐶' } },
      { inside: { name: 'bird', emoji: '🐦', label: 'Bird 🐦' }, outside: { name: 'rabbit', emoji: '🐰', label: 'Rabbit 🐰' } },
      { inside: { name: 'monkey', emoji: '🐵', label: 'Monkey 🐵' }, outside: { name: 'lion', emoji: '🦁', label: 'Lion 🦁' } },
      { inside: { name: 'fish', emoji: '🐟', label: 'Fish 🐟' }, outside: { name: 'frog', emoji: '🐸', label: 'Frog 🐸' } }
    ];
    const pair = pairs[Math.floor(random() * pairs.length)];
    const askInside = random() > 0.5;

    const questionText = askInside 
      ? `Which animal is inside the box?` 
      : `Which animal is outside the box?`;
      
    const target = askInside ? pair.inside : pair.outside;

    const options = [
      { id: pair.inside.name, label: pair.inside.label },
      { id: pair.outside.name, label: pair.outside.label }
    ];
    const correctAnswerIndex = askInside ? 0 : 1;

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: buildInsideOutsideSvg(pair.inside.emoji, pair.outside.emoji) }
      ],
      options,
      answer: target.name,
      correctAnswerIndex,
      solution: { sections: [{ type: 'text', content: `The ${pair.inside.label} is inside the dashed box. The ${pair.outside.label} is outside the box.` }] }
    };
  }

  if (subType === 'above_below') {
    const pairs = [
      { above: { name: 'apple', emoji: '🍎', label: 'Apple 🍎' }, below: { name: 'banana', emoji: '🍌', label: 'Banana 🍌' } },
      { above: { name: 'sun', emoji: '☀️', label: 'Sun ☀️' }, below: { name: 'flower', emoji: '🌻', label: 'Flower 🌻' } },
      { above: { name: 'bird', emoji: '🐦', label: 'Bird 🐦' }, below: { name: 'cat', emoji: '🐱', label: 'Cat 🐱' } },
      { above: { name: 'cloud', emoji: '☁️', label: 'Cloud ☁️' }, below: { name: 'tree', emoji: '🌳', label: 'Tree 🌳' } }
    ];
    const pair = pairs[Math.floor(random() * pairs.length)];
    const isAbove = random() > 0.5;
    const questionText = isAbove ? "Which one is above the line?" : "Which one is below the line?";
    const target = isAbove ? pair.above : pair.below;

    const options = [
      { id: pair.above.name, label: pair.above.label },
      { id: pair.below.name, label: pair.below.label }
    ];
    const correctAnswerIndex = isAbove ? 0 : 1;

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: buildAboveBelowSvg(pair.above.emoji, pair.below.emoji) }
      ],
      options,
      answer: target.name,
      correctAnswerIndex,
      solution: { sections: [{ type: 'text', content: `The ${pair.above.label} is above the line. The ${pair.below.label} is below the line.` }] }
    };
  }

  if (subType === 'beside_next') {
    const centers = [
      { name: 'tree', emoji: '🌲', label: 'tree 🌲' },
      { name: 'house', emoji: '🏠', label: 'house 🏠' },
      { name: 'car', emoji: '🚗', label: 'car 🚗' },
      { name: 'flower', emoji: '🌸', label: 'flower 🌸' }
    ];
    const besides = [
      { name: 'rabbit', emoji: '🐰', label: 'Rabbit 🐰' },
      { name: 'dog', emoji: '🐶', label: 'Dog 🐶' },
      { name: 'cat', emoji: '🐱', label: 'Cat 🐱' },
      { name: 'monkey', emoji: '🐵', label: 'Monkey 🐵' }
    ];
    const fars = [
      { name: 'fox', emoji: '🦊', label: 'Fox 🦊' },
      { name: 'lion', emoji: '🦁', label: 'Lion 🦁' },
      { name: 'frog', emoji: '🐸', label: 'Frog 🐸' },
      { name: 'bear', emoji: '🐻', label: 'Bear 🐻' }
    ];

    const center = centers[Math.floor(random() * centers.length)];
    const beside = besides[Math.floor(random() * besides.length)];
    let far = fars[Math.floor(random() * fars.length)];
    while (far.name === beside.name) {
      far = fars[Math.floor(random() * fars.length)];
    }

    const isCenterLeft = random() > 0.5;
    const questionText = `Which animal is beside the ${center.name}?`;

    const options = [
      { id: beside.name, label: beside.label },
      { id: far.name, label: far.label }
    ];

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: buildBesideNextSvg(center.emoji, beside.emoji, far.emoji, isCenterLeft) }
      ],
      options,
      answer: beside.name,
      correctAnswerIndex: 0,
      solution: { sections: [{ type: 'text', content: `The ${beside.label} is sitting right next to (beside) the ${center.label}.` }] }
    };
  }

  if (subType === 'left_right') {
    const pairs = [
      { left: { name: 'apple', emoji: '🍎', label: 'Apple 🍎' }, right: { name: 'strawberry', emoji: '🍓', label: 'Strawberry 🍓' } },
      { left: { name: 'orange', emoji: '🍊', label: 'Orange 🍊' }, right: { name: 'grape', emoji: '🍇', label: 'Grape 🍇' } },
      { left: { name: 'pear', emoji: '🍐', label: 'Pear 🍐' }, right: { name: 'cherry', emoji: '🍒', label: 'Cherry 🍒' } }
    ];
    const pair = pairs[Math.floor(random() * pairs.length)];
    const isLeft = random() > 0.5;
    const questionText = isLeft ? "Which fruit is on the left?" : "Which fruit is on the right?";
    const target = isLeft ? pair.left : pair.right;

    const options = [
      { id: pair.left.name, label: pair.left.label },
      { id: pair.right.name, label: pair.right.label }
    ];
    const correctAnswerIndex = isLeft ? 0 : 1;

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: buildLeftRightSvg(pair.left.emoji, pair.right.emoji) }
      ],
      options,
      answer: target.name,
      correctAnswerIndex,
      solution: { sections: [{ type: 'text', content: isLeft ? `The ${pair.left.label} is on the left side of the dotted line.` : `The ${pair.right.label} is on the right side.` }] }
    };
  }

  if (subType === 'left_middle_right') {
    const items = [
      { id: 'grape', name: 'Grape 🍇', emoji: '🍇' },
      { id: 'orange', name: 'Orange 🍊', emoji: '🍊' },
      { id: 'pear', name: 'Pear 🍐', emoji: '🍐' },
      { id: 'apple', name: 'Apple 🍎', emoji: '🍎' },
      { id: 'banana', name: 'Banana 🍌', emoji: '🍌' },
      { id: 'strawberry', name: 'Strawberry 🍓', emoji: '🍓' }
    ];
    const selected = [];
    while (selected.length < 3) {
      const it = items[Math.floor(random() * items.length)];
      if (!selected.find(x => x.id === it.id)) {
        selected.push(it);
      }
    }

    const positions = ['left', 'middle', 'right'];
    const targetPosIndex = Math.floor(random() * 3);
    const targetPos = positions[targetPosIndex];
    const targetItem = selected[targetPosIndex];

    const questionText = `Which fruit is in the ${targetPos}?`;

    const options = selected.map((item, index) => ({
      id: item.id,
      label: item.name
    }));

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: buildLeftMiddleRightSvg(selected[0].emoji, selected[1].emoji, selected[2].emoji) }
      ],
      options,
      answer: targetItem.id,
      correctAnswerIndex: targetPosIndex,
      solution: { sections: [{ type: 'text', content: `The ${selected[0].name} is on the left, the ${selected[1].name} is in the middle, and the ${selected[2].name} is on the right.` }] }
    };
  }

  if (subType === 'top_bottom') {
    const items = [
      { name: 'bird', emoji: '🐦', label: 'Bird 🐦' },
      { name: 'cat', emoji: '🐱', label: 'Cat 🐱' },
      { name: 'squirrel', emoji: '🐿️', label: 'Squirrel 🐿️' },
      { name: 'dog', emoji: '🐶', label: 'Dog 🐶' }
    ];
    const topItem = items[Math.floor(random() * items.length)];
    let bottomItem = items[Math.floor(random() * items.length)];
    while (bottomItem.name === topItem.name) {
      bottomItem = items[Math.floor(random() * items.length)];
    }

    const isTop = random() > 0.5;
    const questionText = isTop ? "Which animal is at the top?" : "Which animal is at the bottom?";
    const target = isTop ? topItem : bottomItem;

    const options = [
      { id: topItem.name, label: topItem.label },
      { id: bottomItem.name, label: bottomItem.label }
    ];
    const correctAnswerIndex = isTop ? 0 : 1;

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: buildTopBottomSvg(topItem.emoji, bottomItem.emoji) }
      ],
      options,
      answer: target.name,
      correctAnswerIndex,
      solution: { sections: [{ type: 'text', content: isTop ? `The ${topItem.label} is at the top of the ladder.` : `The ${bottomItem.label} is at the bottom.` }] }
    };
  }

  if (subType === 'top_middle_bottom') {
    const items = [
      { id: 'balloon', name: 'Balloon 🎈', emoji: '🎈' },
      { id: 'ball', name: 'Ball ⚽', emoji: '⚽' },
      { id: 'box', name: 'Box 📦', emoji: '📦' },
      { id: 'gift', name: 'Gift 🎁', emoji: '🎁' },
      { id: 'book', name: 'Book 📖', emoji: '📖' },
      { id: 'hat', name: 'Hat 🎩', emoji: '🎩' }
    ];
    const selected = [];
    while (selected.length < 3) {
      const it = items[Math.floor(random() * items.length)];
      if (!selected.find(x => x.id === it.id)) {
        selected.push(it);
      }
    }

    const positions = ['top', 'middle', 'bottom'];
    const targetPosIndex = Math.floor(random() * 3);
    const targetPos = positions[targetPosIndex];
    const targetItem = selected[targetPosIndex];

    const questionText = `Which item is at the ${targetPos}?`;

    const options = selected.map((item, index) => ({
      id: item.id,
      label: item.name
    }));

    return {
      type: 'mcq',
      interaction: 'interactive_svg',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'interactive_svg', content: buildTopMiddleBottomSvg(selected[0].emoji, selected[1].emoji, selected[2].emoji) }
      ],
      options,
      answer: targetItem.id,
      correctAnswerIndex: targetPosIndex,
      solution: { sections: [{ type: 'text', content: `The ${selected[0].name} is at the top, the ${selected[1].name} is in the middle, and the ${selected[2].name} is at the bottom.` }] }
    };
  }
}

function lkgClassifyEngine(config, params, random) {
  let subType = params.subType;
  if (subType === 'same_different') {
    subType = random() > 0.5 ? 'same' : 'different';
  }

  const shapes = [
    { type: 'circle', svg: (color) => `<svg width="80" height="80"><circle cx="40" cy="40" r="30" fill="${color.value}" stroke="${color.stroke}" stroke-width="3"/></svg>` },
    { type: 'square', svg: (color) => `<svg width="80" height="80"><rect x="15" y="15" width="50" height="50" fill="${color.value}" stroke="${color.stroke}" stroke-width="3" rx="2"/></svg>` },
    { type: 'triangle', svg: (color) => `<svg width="80" height="80"><polygon points="40,15 15,65 65,65" fill="${color.value}" stroke="${color.stroke}" stroke-width="3"/></svg>` }
  ];
  const colors = [
    { name: 'blue', value: '#3b82f6', stroke: '#1d4ed8' },
    { name: 'red', value: '#ef4444', stroke: '#b91c1c' },
    { name: 'green', value: '#10b981', stroke: '#047857' },
    { name: 'yellow', value: '#eab308', stroke: '#a16207' }
  ];

  if (subType === 'same') {
    const chosenShape = shapes[Math.floor(random() * shapes.length)];
    const color = colors[Math.floor(random() * colors.length)];
    
    const decoyShape = shapes.find(s => s.type !== chosenShape.type);
    const decoyColor = colors.find(c => c.name !== color.name);

    const targetSvg = chosenShape.svg(color);
    const decoySvg = decoyShape.svg(decoyColor);

    const isFirstCorrect = random() > 0.5;
    const questionText = `Which shape is the same as this ${color.name} ${chosenShape.type}?`;
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
      solution: { sections: [{ type: 'text', content: `The ${color.name} ${chosenShape.type} matches Option ${isFirstCorrect ? 'A' : 'B'}.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'different') {
    const items = [
      { name: 'Apple', emoji: '🍎' },
      { name: 'Banana', emoji: '🍌' },
      { name: 'Grape', emoji: '🍇' },
      { name: 'Orange', emoji: '🍊' },
      { name: 'Strawberry', emoji: '🍓' },
      { name: 'Watermelon', emoji: '🍉' },
      { name: 'Cherry', emoji: '🍒' }
    ];
    const targetItem = items[Math.floor(random() * items.length)];
    let decoyItem = items[Math.floor(random() * items.length)];
    while (decoyItem.name === targetItem.name) {
      decoyItem = items[Math.floor(random() * items.length)];
    }

    const isFirstCorrect = random() > 0.5;
    const optionASvg = isFirstCorrect ? `<svg width="60" height="60"><text x="10" y="45" font-size="36">${decoyItem.emoji}</text></svg>` : `<svg width="60" height="60"><text x="10" y="45" font-size="36">${targetItem.emoji}</text></svg>`;
    const optionBSvg = isFirstCorrect ? `<svg width="60" height="60"><text x="10" y="45" font-size="36">${targetItem.emoji}</text></svg>` : `<svg width="60" height="60"><text x="10" y="45" font-size="36">${decoyItem.emoji}</text></svg>`;

    const questionText = "Which one is different?";
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: `<svg width="240" height="70" viewBox="0 0 240 70">
          <text x="10" y="50" font-size="36">${targetItem.emoji}</text>
          <text x="70" y="50" font-size="36">${targetItem.emoji}</text>
          <text x="130" y="50" font-size="36">${targetItem.emoji}</text>
          <text x="190" y="50" font-size="36">${decoyItem.emoji}</text>
        </svg>` }
      ],
      options: [
        { id: decoyItem.name.toLowerCase(), label: `${decoyItem.name} ${decoyItem.emoji}`, svg: optionASvg },
        { id: targetItem.name.toLowerCase(), label: `${targetItem.name} ${targetItem.emoji}`, svg: optionBSvg }
      ],
      answer: isFirstCorrect ? decoyItem.name.toLowerCase() : targetItem.name.toLowerCase(),
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `The ${decoyItem.name} ${decoyItem.emoji} is different because all other items are ${targetItem.name}s ${targetItem.emoji}.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'shapes_color') {
    const targetColor = colors[Math.floor(random() * colors.length)];
    const decoyColor = colors.filter(c => c.name !== targetColor.name)[Math.floor(random() * (colors.length - 1))];
    const chosenShape = shapes[Math.floor(random() * shapes.length)];

    const targetSvg = chosenShape.svg(targetColor);
    const decoySvg = chosenShape.svg(decoyColor);

    const isFirstCorrect = random() > 0.5;
    const questionText = `Which shape is ${targetColor.name}?`;
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: [
        { id: 'opt_a', label: 'Option A', svg: isFirstCorrect ? targetSvg : decoySvg },
        { id: 'opt_b', label: 'Option B', svg: isFirstCorrect ? decoySvg : targetSvg }
      ],
      answer: isFirstCorrect ? 'opt_a' : 'opt_b',
      correctAnswerIndex: isFirstCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `The ${targetColor.name} shape is Option ${isFirstCorrect ? 'A' : 'B'}.` }] },
      layoutConfig: { variant: 'pictureSentence', columns: 2 }
    };
  }

  if (subType === 'sort_color' || subType === 'sort_shape') {
    const isSortColor = subType === 'sort_color';
    
    const targetColor = colors[Math.floor(random() * colors.length)];
    const decoyColor = colors.filter(c => c.name !== targetColor.name)[Math.floor(random() * (colors.length - 1))];
    
    const chosenShape = shapes[Math.floor(random() * shapes.length)];
    const decoyShape = shapes.filter(s => s.type !== chosenShape.type)[Math.floor(random() * (shapes.length - 1))];

    const targetGroup = isSortColor 
      ? `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="${targetColor.value}" stroke="${targetColor.stroke}" stroke-width="3"/>
          <rect x="110" y="16" width="48" height="48" fill="${targetColor.value}" stroke="${targetColor.stroke}" stroke-width="3" rx="2"/>
        </svg>`
      : `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="${targetColor.value}" stroke="${targetColor.stroke}" stroke-width="3"/>
          <circle cx="130" cy="40" r="24" fill="${decoyColor.value}" stroke="${decoyColor.stroke}" stroke-width="3"/>
        </svg>`;

    const decoyGroup = isSortColor
      ? `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="${targetColor.value}" stroke="${targetColor.stroke}" stroke-width="3"/>
          <rect x="110" y="16" width="48" height="48" fill="${decoyColor.value}" stroke="${decoyColor.stroke}" stroke-width="3" rx="2"/>
        </svg>`
      : `<svg width="180" height="80" viewBox="0 0 180 80">
          <circle cx="40" cy="40" r="24" fill="${targetColor.value}" stroke="${targetColor.stroke}" stroke-width="3"/>
          <rect x="110" y="16" width="48" height="48" fill="${targetColor.value}" stroke="${targetColor.stroke}" stroke-width="3" rx="2"/>
        </svg>`;

    const isFirstCorrect = random() > 0.5;
    const questionText = isSortColor 
      ? `Which group has only ${targetColor.name} shapes?` 
      : `Which group has only ${chosenShape.type}s?`;

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
    const questionText = isLonger ? "Which is longer?" : "Which is shorter?";
    
    const longItem = lkgSizeImageAssets.find(x => x.id === 'pencil_long') || { image: '/images/lkg/size/pencil_long.png', emoji: '✏️' };
    const shortItem = lkgSizeImageAssets.find(x => x.id === 'pencil_short') || { image: '/images/lkg/size/pencil_short.png', emoji: '✏️' };

    const isFirstLong = random() > 0.5;
    const groupA = isFirstLong ? longItem : shortItem;
    const groupB = isFirstLong ? shortItem : longItem;
    
    const answerId = isLonger 
      ? (isFirstLong ? 'group_a' : 'group_b')
      : (isFirstLong ? 'group_b' : 'group_a');

    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText }
      ],
      options: [
        {
          id: 'group_a',
          label: 'Item A',
          imageUrl: resolveAssetImage(groupA),
          emoji: groupA.emoji,
          width: isFirstLong ? '160px' : '80px',
          height: '60px',
          fontSize: isFirstLong ? '56px' : '28px',
          hideLabel: true
        },
        {
          id: 'group_b',
          label: 'Item B',
          imageUrl: resolveAssetImage(groupB),
          emoji: groupB.emoji,
          width: isFirstLong ? '80px' : '160px',
          height: '60px',
          fontSize: isFirstLong ? '28px' : '56px',
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'group_a' ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `Item A is ${isFirstLong ? 'longer' : 'shorter'} and Item B is ${isFirstLong ? 'shorter' : 'longer'}.` }] }
    };
  }

  if (subType === 'tall_short') {
    const isTaller = random() > 0.5;
    const questionText = isTaller ? "Which tree is taller?" : "Which tree is shorter?";
    
    const tallItem = lkgSizeImageAssets.find(x => x.id === 'tree_tall') || { image: '/images/lkg/size/tree_tall.png', emoji: '🌲' };
    const shortItem = lkgSizeImageAssets.find(x => x.id === 'tree_short') || { image: '/images/lkg/size/tree_short.png', emoji: '🌳' };

    const isFirstTall = random() > 0.5;
    const groupA = isFirstTall ? tallItem : shortItem;
    const groupB = isFirstTall ? shortItem : tallItem;
    
    const answerId = isTaller 
      ? (isFirstTall ? 'group_a' : 'group_b')
      : (isFirstTall ? 'group_b' : 'group_a');

    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText }
      ],
      options: [
        {
          id: 'group_a',
          label: 'Tree A',
          imageUrl: resolveAssetImage(groupA),
          emoji: groupA.emoji,
          width: '70px',
          height: isFirstTall ? '140px' : '70px',
          fontSize: isFirstTall ? '72px' : '36px',
          hideLabel: true
        },
        {
          id: 'group_b',
          label: 'Tree B',
          imageUrl: resolveAssetImage(groupB),
          emoji: groupB.emoji,
          width: '70px',
          height: isFirstTall ? '70px' : '140px',
          fontSize: isFirstTall ? '36px' : '72px',
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'group_a' ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `Tree A is ${isFirstTall ? 'taller' : 'shorter'} and Tree B is ${isFirstTall ? 'shorter' : 'taller'}.` }] }
    };
  }

  if (subType === 'wide_narrow') {
    const isWider = random() > 0.5;
    const questionText = isWider ? "Which path is wider?" : "Which path is narrower?";
    
    const wideItem = lkgSizeImageAssets.find(x => x.id === 'path_wide') || { image: '/images/lkg/size/path_wide.png', emoji: '🛣️' };
    const narrowItem = lkgSizeImageAssets.find(x => x.id === 'path_narrow') || { image: '/images/lkg/size/path_narrow.png', emoji: '👣' };

    const isFirstWide = random() > 0.5;
    const groupA = isFirstWide ? wideItem : narrowItem;
    const groupB = isFirstWide ? narrowItem : wideItem;
    
    const answerId = isWider 
      ? (isFirstWide ? 'group_a' : 'group_b')
      : (isFirstWide ? 'group_b' : 'group_a');

    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText }
      ],
      options: [
        {
          id: 'group_a',
          label: 'Path A',
          imageUrl: resolveAssetImage(groupA),
          emoji: groupA.emoji,
          width: isFirstWide ? '160px' : '80px',
          height: '60px',
          fontSize: isFirstWide ? '56px' : '28px',
          hideLabel: true
        },
        {
          id: 'group_b',
          label: 'Path B',
          imageUrl: resolveAssetImage(groupB),
          emoji: groupB.emoji,
          width: isFirstWide ? '80px' : '160px',
          height: '60px',
          fontSize: isFirstWide ? '28px' : '56px',
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'group_a' ? 0 : 1,
      solution: { sections: [{ type: 'text', content: `Path A is ${isFirstWide ? 'wider' : 'narrower'} and Path B is ${isFirstWide ? 'narrower' : 'wider'}.` }] }
    };
  }

  if (subType === 'light_heavy') {
    const isHeavier = random() > 0.5;
    const questionText = isHeavier ? "Which is heavier?" : "Which is lighter?";

    const heavyItem = lkgSizeImageAssets.find(x => x.id === 'stone_heavy') || { image: '/images/lkg/size/stone_heavy.png', emoji: '🪨' };
    const lightItem = lkgSizeImageAssets.find(x => x.id === 'feather_light') || { image: '/images/lkg/size/feather_light.png', emoji: '🪶' };

    const isFirstHeavy = random() > 0.5;
    const groupA = isFirstHeavy ? heavyItem : lightItem;
    const groupB = isFirstHeavy ? lightItem : heavyItem;

    const answerId = isHeavier 
      ? (isFirstHeavy ? 'group_a' : 'group_b')
      : (isFirstHeavy ? 'group_b' : 'group_a');

    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText }
      ],
      options: [
        {
          id: 'group_a',
          label: isFirstHeavy ? 'Stone' : 'Feather',
          imageUrl: resolveAssetImage(groupA),
          emoji: groupA.emoji,
          width: isFirstHeavy ? '110px' : '55px',
          height: isFirstHeavy ? '110px' : '55px',
          fontSize: isFirstHeavy ? '64px' : '32px',
          hideLabel: true
        },
        {
          id: 'group_b',
          label: isFirstHeavy ? 'Feather' : 'Stone',
          imageUrl: resolveAssetImage(groupB),
          emoji: groupB.emoji,
          width: isFirstHeavy ? '55px' : '110px',
          height: isFirstHeavy ? '55px' : '110px',
          fontSize: isFirstHeavy ? '32px' : '64px',
          hideLabel: true
        }
      ],
      answer: answerId,
      correctAnswerIndex: answerId === 'group_a' ? 0 : 1,
      solution: { sections: [{ type: 'text', content: "The heavy stone weighs more than the light feather." }] }
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