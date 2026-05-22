import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const comparisonG5Engine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `comp_g5_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'likeFractions';

  if (subType === 'likeFractions' || subType === 'fractions.compare.likeFractions') {
    return generateCompareLike(params, random);
  } else if (subType === 'unlikeFractions' || subType === 'fractions.compare.unlikeFractions') {
    return generateCompareUnlike(params, random);
  } else if (subType === 'properFractions' || subType === 'fractions.compare.properFractions') {
    return generateCompareProper(params, random);
  } else {
    throw new Error(`[ComparisonG5Engine] Unsupported subType: ${subType}`);
  }
};

const PALETTES = [
  { fill: '#c084fc', stroke: '#7c3aed' }, // Purple
  { fill: '#93c5fd', stroke: '#1d4ed8' }, // Blue
  { fill: '#6ee7b7', stroke: '#047857' }, // Emerald
  { fill: '#fde047', stroke: '#ca8a04' }  // Yellow
];

function makeFractionStripsSvg(n1, d1, n2, d2, palette1, palette2) {
  const width = 260;
  const h = 36;
  const xStart = 20;

  const makeStrip = (n, d, y, palette) => {
    const wPart = width / d;
    const rects = [];
    for (let i = 0; i < d; i++) {
      const fill = i < n ? palette.fill : '#ffffff';
      rects.push(`<rect x="${(xStart + i * wPart).toFixed(2)}" y="${y}" width="${wPart.toFixed(2)}" height="${h}" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.5"/>`);
    }
    return rects.join('\n');
  };

  return `<svg viewBox="0 0 300 110" width="300" height="110" xmlns="http://www.w3.org/2000/svg" style="display:block; margin: 12px auto;">
    <rect x="0" y="0" width="300" height="110" fill="#f8fafc" rx="10" stroke="#e2e8f0" stroke-width="1"/>
    ${makeStrip(n1, d1, 15, palette1)}
    ${makeStrip(n2, d2, 60, palette2)}
  </svg>`;
}

function latexPart(content) {
  return {
    type: 'latex',
    content,
    style: {
      display: 'inline-block',
      width: 'auto',
      margin: 0,
      fontSize: 'clamp(26px, 5vw, 34px)',
      flex: '0 0 auto'
    }
  };
}

function comparisonSelect() {
  return {
    type: 'option_select',
    id: 'selected',
    options: ['<', '>', '='],
    style: {
      width: 'auto',
      flex: '0 0 auto',
      gap: 'clamp(6px, 1.6vw, 10px)',
      flexWrap: 'nowrap'
    },
    buttonStyle: {
      minWidth: 'clamp(48px, 10vw, 68px)',
      minHeight: 'clamp(42px, 8vw, 54px)',
      padding: '8px clamp(12px, 2vw, 18px)',
      fontSize: 'clamp(20px, 5vw, 28px)',
      borderRadius: 6
    }
  };
}

function comparisonRow(left, right) {
  return {
    type: 'group',
    direction: 'row',
    style: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 'clamp(10px, 2vw, 16px)',
      margin: 'clamp(18px, 3vw, 28px) 0',
      width: '100%',
      flexWrap: 'wrap'
    },
    parts: [latexPart(left), comparisonSelect(), latexPart(right)]
  };
}

function generateCompareLike(params, random) {
  const d = getRandomInt(3, 12, random);
  const n1 = getRandomInt(1, d - 1, random);
  let n2 = getRandomInt(1, d - 1, random);
  while (n1 === n2) {
    n2 = getRandomInt(1, d - 1, random);
  }

  const symbol = n1 > n2 ? '>' : '<';
  const palette1 = PALETTES[0];
  const palette2 = PALETTES[1];
  const svgContent = makeFractionStripsSvg(n1, d, n2, d, palette1, palette2);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `Both fractions have the same denominator, **${d}**.` },
        { type: 'text', content: `Compare their numerators:` },
        { type: 'latex', content: `${n1} ${symbol === '>' ? '>' : '<'} ${n2}` },
        { type: 'text', content: `Since the numerators compare this way, the fractions compare the same way:` },
        { type: 'latex', content: `\\frac{${n1}}{${d}} ${symbol} \\frac{${n2}}{${d}}` }
      ]
    }
  ];

  return {
    id: `q_g5_comp_like_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `Compare ${n1}/${d} and ${n2}/${d}.`,
    parts: [
      { type: 'text', content: `Compare the fractions below:`, style: { fontWeight: 900 } },
      { type: 'svg', content: svgContent },
      comparisonRow(`\\frac{${n1}}{${d}}`, `\\frac{${n2}}{${d}}`)
    ],
    answer: { selected: symbol },
    validation: {
      type: 'exact',
      answer: { selected: symbol }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-compare-like-fractions',
      templateId: 'fractions.compare.likeFractions',
      engine: 'comparison',
      grade: 5,
      competencyId: 'fractions_comparison'
    },
    adaptiveConfig: {
      logic_type: 'fractions.compare.likeFractions',
      variables: { n1, n2, d, symbol, seed: params.seed }
    }
  };
}

function generateCompareUnlike(params, random) {
  // Configurable complexity or limits
  const maxDen = params.denominatorMax || 12;
  const d1 = getRandomInt(3, maxDen, random);
  let d2 = getRandomInt(3, maxDen, random);
  while (d1 === d2) {
    d2 = getRandomInt(3, maxDen, random);
  }

  const n1 = getRandomInt(1, d1 - 1, random);
  const n2 = getRandomInt(1, d2 - 1, random);

  const val1 = n1 / d1;
  const val2 = n2 / d2;
  const symbol = val1 > val2 ? '>' : (val1 < val2 ? '<' : '=');

  const palette1 = PALETTES[2];
  const palette2 = PALETTES[3];
  const svgContent = makeFractionStripsSvg(n1, d1, n2, d2, palette1, palette2);

  // Common denominator calculation
  const gcd = (a, b) => b ? gcd(b, a % b) : a;
  const lcm = (d1 * d2) / gcd(d1, d2);
  const m1 = lcm / d1;
  const m2 = lcm / d2;
  const eqN1 = n1 * m1;
  const eqN2 = n2 * m2;

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `The denominators are different. Find a common denominator to compare them.` },
        { type: 'text', content: `The least common multiple of **${d1}** and **${d2}** is **${lcm}**.` },
        { type: 'text', content: `Convert both fractions:` },
        { type: 'latex', content: `\\frac{${n1}}{${d1}} = \\frac{${n1} \\times ${m1}}{${d1} \\times ${m1}} = \\frac{${eqN1}}{${lcm}}` },
        { type: 'latex', content: `\\frac{${n2}}{${d2}} = \\frac{${n2} \\times ${m2}}{${d2} \\times ${m2}} = \\frac{${eqN2}}{${lcm}}` },
        { type: 'text', content: `Now compare the like fractions:` },
        { type: 'latex', content: `\\frac{${eqN1}}{${lcm}} ${symbol} \\frac{${eqN2}}{${lcm}}` },
        { type: 'text', content: `Therefore:` },
        { type: 'latex', content: `\\frac{${n1}}{${d1}} ${symbol} \\frac{${n2}}{${d2}}` }
      ]
    }
  ];

  return {
    id: `q_g5_comp_unlike_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `Compare ${n1}/${d1} and ${n2}/${d2}.`,
    parts: [
      { type: 'text', content: `Compare the fractions below:`, style: { fontWeight: 900 } },
      { type: 'svg', content: svgContent },
      comparisonRow(`\\frac{${n1}}{${d1}}`, `\\frac{${n2}}{${d2}}`)
    ],
    answer: { selected: symbol },
    validation: {
      type: 'exact',
      answer: { selected: symbol }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-compare-unlike-fractions',
      templateId: 'fractions.compare.unlikeFractions',
      engine: 'comparison',
      grade: 5,
      competencyId: 'fractions_comparison'
    },
    adaptiveConfig: {
      logic_type: 'fractions.compare.unlikeFractions',
      variables: { n1, d1, n2, d2, symbol, seed: params.seed }
    }
  };
}

function generateCompareProper(params, random) {
  // Compare two proper fractions (can be like or unlike)
  const isLike = random() > 0.5;
  if (isLike) {
    return generateCompareLike(params, random);
  } else {
    return generateCompareUnlike(params, random);
  }
}
