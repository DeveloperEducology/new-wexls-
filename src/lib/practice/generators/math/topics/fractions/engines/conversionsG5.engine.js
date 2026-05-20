import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const conversionsG5Engine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `conv_g5_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'improperToMixed';

  if (subType === 'improperToMixed' || subType === 'fractions.conversion.improperToMixed') {
    return generateImproperToMixed(params, random);
  } else if (subType === 'mixedToImproper' || subType === 'fractions.conversion.mixedToImproper') {
    return generateMixedToImproper(params, random);
  } else {
    throw new Error(`[ConversionsG5Engine] Unsupported subType: ${subType}`);
  }
};

const PALETTES = [
  { fill: '#c084fc', stroke: '#7c3aed' }, // Purple
  { fill: '#93c5fd', stroke: '#1d4ed8' }, // Blue
  { fill: '#6ee7b7', stroke: '#047857' }, // Emerald
  { fill: '#fde047', stroke: '#ca8a04' }  // Yellow
];

function makeCircleSvg(n, d, palette, size = 90) {
  const cx = 50, cy = 50, r = 40;
  const wedges = [];
  for (let i = 0; i < d; i++) {
    const startAngle = (i / d) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const fill = i < n ? palette.fill : '#ffffff';
    wedges.push(`<path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${fill}" stroke="${palette.stroke}" stroke-width="1.5"/>`);
  }
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="display:inline-block; margin: 4px;">
    ${wedges.join('')}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.stroke}" stroke-width="2"/>
  </svg>`;
}

function makeCirclesModelSvg(totalParts, denominator, palette) {
  const parts = [];
  let remaining = totalParts;
  while (remaining > 0) {
    const fillCount = Math.min(remaining, denominator);
    parts.push(makeCircleSvg(fillCount, denominator, palette));
    remaining -= denominator;
  }
  // Add one empty circle if totalParts was a clean multiple to show divisions? 
  // No, just show the circles.
  return `<div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 12px 0;">
    ${parts.join('')}
  </div>`;
}

function compactInput(id, width = 64) {
  return {
    type: 'input',
    id,
    style: {
      width: `clamp(46px, 10vw, ${width}px)`,
      height: 'clamp(32px, 7vw, 40px)',
      padding: '0 6px',
      fontSize: 'clamp(17px, 4vw, 21px)',
      fontWeight: 500
    }
  };
}

function latexPart(content, fontSize = 'clamp(26px, 5vw, 34px)') {
  return {
    type: 'latex',
    content,
    style: {
      display: 'inline-block',
      width: 'auto',
      margin: 0,
      fontSize,
      flex: '0 0 auto'
    }
  };
}

function fractionInput(numId = 'num', denId = 'den') {
  return {
    type: 'fraction',
    numerator: compactInput(numId, 68),
    denominator: compactInput(denId, 68),
    style: {
      margin: '0 2px',
      minWidth: 'clamp(58px, 12vw, 76px)',
      flex: '0 0 auto'
    }
  };
}

function mathRow(parts, style = {}) {
  return {
    type: 'group',
    direction: 'row',
    style: {
      alignItems: 'center',
      justifyContent: 'flex-start',
      gap: 'clamp(8px, 2vw, 14px)',
      margin: 'clamp(18px, 3vw, 28px) 0',
      width: '100%',
      flexWrap: 'wrap',
      ...style
    },
    parts
  };
}

function generateImproperToMixed(params, random) {
  const d = getRandomInt(2, 9, random);
  // generate improper fraction
  const whole = getRandomInt(1, 3, random);
  const n_rem = getRandomInt(1, d - 1, random);
  const n = whole * d + n_rem;

  const palette = PALETTES[Math.floor(random() * PALETTES.length)];
  const svgContent = makeCirclesModelSvg(n, d, palette);

  const questionText = `Convert 7/3 to a mixed number.`; // fallback string for listing
  const actualText = `Convert $\\frac{${n}}{${d}}$ to a mixed number.`;

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `To convert an improper fraction to a mixed number, divide the numerator by the denominator:` },
        { type: 'latex', content: `${n} \\div ${d} = ${whole} \\text{ remainder } ${n_rem}` },
        { type: 'text', content: `* The quotient **${whole}** becomes the whole number.` },
        { type: 'text', content: `* The remainder **${n_rem}** becomes the numerator.` },
        { type: 'text', content: `* The denominator stays **${d}**.` },
        { type: 'text', content: `So, $\\frac{${n}}{${d}} = ${whole} \\frac{${n_rem}}{${d}}$.` }
      ]
    }
  ];

  return {
    id: `q_g5_imp_to_mix_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `Convert ${n}/${d} to a mixed number.`,
    parts: [
      { type: 'text', content: actualText, style: { fontWeight: 900 } },
      { type: 'svg', content: svgContent },
      mathRow([
        latexPart(`\\frac{${n}}{${d}} =`),
        compactInput('whole', 64),
        fractionInput()
      ])
    ],
    answer: {
      whole: String(whole),
      num: String(n_rem),
      den: String(d)
    },
    validation: {
      type: 'exact',
      answer: {
        whole: String(whole),
        num: String(n_rem),
        den: String(d)
      }
    },
    solution,
    layoutConfig: { partsDirection: 'column' },
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-convert-improper-to-mixed',
      templateId: 'fractions.conversion.improperToMixed',
      engine: 'conversion',
      grade: 5,
      competencyId: 'fractions_conversion'
    },
    adaptiveConfig: {
      logic_type: 'fractions.conversion.improperToMixed',
      variables: { n, d, whole, n_rem, seed: params.seed }
    }
  };
}

function generateMixedToImproper(params, random) {
  const d = getRandomInt(2, 9, random);
  const whole = getRandomInt(1, 3, random);
  const n_rem = getRandomInt(1, d - 1, random);
  const n = whole * d + n_rem;

  const palette = PALETTES[Math.floor(random() * PALETTES.length)];
  const svgContent = makeCirclesModelSvg(n, d, palette);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `To convert a mixed number to an improper fraction:` },
        { type: 'text', content: `1. Multiply the whole number by the denominator: **${whole} × ${d} = ${whole * d}**.` },
        { type: 'text', content: `2. Add the numerator: **${whole * d} + ${n_rem} = ${n}**.` },
        { type: 'text', content: `3. Keep the denominator: **${d}**.` },
        { type: 'text', content: `So, $${whole} \\frac{${n_rem}}{${d}} = \\frac{${n}}{${d}}$.` }
      ]
    }
  ];

  return {
    id: `q_g5_mix_to_imp_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `Convert ${whole} ${n_rem}/${d} to an improper fraction.`,
    parts: [
      { type: 'text', content: `Convert $${whole} \\frac{${n_rem}}{${d}}$ to an improper fraction.`, style: { fontWeight: 900 } },
      { type: 'svg', content: svgContent },
      mathRow([
        latexPart(`${whole} \\frac{${n_rem}}{${d}} =`),
        fractionInput()
      ])
    ],
    answer: {
      num: String(n),
      den: String(d)
    },
    validation: {
      type: 'exact',
      answer: {
        num: String(n),
        den: String(d)
      }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-convert-mixed-to-improper',
      templateId: 'fractions.conversion.mixedToImproper',
      engine: 'conversion',
      grade: 5,
      competencyId: 'fractions_conversion'
    },
    adaptiveConfig: {
      logic_type: 'fractions.conversion.mixedToImproper',
      variables: { n, d, whole, n_rem, seed: params.seed }
    }
  };
}
