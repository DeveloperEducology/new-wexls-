import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const typesEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `types_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'identify';

  if (subType === 'identify' || subType === 'fractions.types.identify') {
    return generateIdentifyType(params, random);
  } else if (subType === 'proper' || subType === 'fractions.types.proper') {
    return generateFindProper(params, random);
  } else if (subType === 'improper' || subType === 'fractions.types.improper') {
    return generateFindImproper(params, random);
  } else if (subType === 'mixed' || subType === 'fractions.types.mixed') {
    return generateFindMixed(params, random);
  } else {
    throw new Error(`[TypesEngine] Unsupported subType: ${subType}`);
  }
};

function makeCircleSvg(n, d, palette, size = 100) {
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

function makeMixedModelSvg(whole, n, d, palette) {
  const parts = [];
  for (let i = 0; i < whole; i++) {
    parts.push(makeCircleSvg(d, d, palette));
  }
  if (n > 0) {
    parts.push(makeCircleSvg(n, d, palette));
  }
  return `<div style="display: flex; gap: 8px; justify-content: center; flex-wrap: wrap; margin: 12px 0;">
    ${parts.join('')}
  </div>`;
}

function generateIdentifyType(params, random) {
  const types = ['proper', 'improper', 'mixed'];
  const chosenType = types[Math.floor(random() * types.length)];

  const PALETTES = [
    { fill: '#c084fc', stroke: '#7c3aed' }, // Purple
    { fill: '#93c5fd', stroke: '#1d4ed8' }, // Blue
    { fill: '#6ee7b7', stroke: '#047857' }  // Emerald
  ];
  const palette = PALETTES[Math.floor(random() * PALETTES.length)];

  let questionText = '';
  let svgContent = '';
  let latexRepresentation = '';
  let explanation = '';

  if (chosenType === 'proper') {
    const d = getRandomInt(3, 10, random);
    const n = getRandomInt(1, d - 1, random);
    svgContent = makeCircleSvg(n, d, palette, 150);
    latexRepresentation = `\\frac{${n}}{${d}}`;
    questionText = `What type of fraction is $${latexRepresentation}$?`;
    explanation = `A **proper fraction** is a fraction where the numerator (top number) is less than the denominator (bottom number). Here, ${n} is less than ${d}, so it is a proper fraction.`;
  } else if (chosenType === 'improper') {
    const d = getRandomInt(2, 6, random);
    const n = getRandomInt(d + 1, d * 2 - 1, random);
    // Visualise improper fraction
    svgContent = makeMixedModelSvg(1, n - d, d, palette);
    latexRepresentation = `\\frac{${n}}{${d}}`;
    questionText = `What type of fraction is $${latexRepresentation}$?`;
    explanation = `An **improper fraction** is a fraction where the numerator (top number) is greater than or equal to the denominator (bottom number). Here, ${n} is greater than ${d}, so it is an improper fraction.`;
  } else {
    const whole = getRandomInt(1, 2, random);
    const d = getRandomInt(3, 8, random);
    const n = getRandomInt(1, d - 1, random);
    svgContent = makeMixedModelSvg(whole, n, d, palette);
    latexRepresentation = `${whole} \\frac{${n}}{${d}}`;
    questionText = `What type of fraction is $${latexRepresentation}$?`;
    explanation = `A **mixed number** consists of a whole number and a proper fraction written together. Here, we have a whole number part (${whole}) and a proper fraction part ($\\frac{${n}}{${d}}$), so it is a mixed number.`;
  }

  const options = [
    { id: 'opt_proper', label: 'Proper fraction', isCorrect: chosenType === 'proper' },
    { id: 'opt_improper', label: 'Improper fraction', isCorrect: chosenType === 'improper' },
    { id: 'opt_mixed', label: 'Mixed number', isCorrect: chosenType === 'mixed' }
  ];

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: explanation }
      ]
    }
  ];

  return {
    id: `q_frac_types_id_${uid()}`,
    type: 'mcq',
    questionText: questionText.replace(/\$/g, ''),
    parts: [
      { type: 'text', content: 'What type of fraction is this?', style: { fontWeight: 900 } },
      { type: 'latex', content: latexRepresentation, style: { margin: '14px 0' } },
      { type: 'svg', content: svgContent }
    ],
    options,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    layoutConfig: { partsDirection: 'column' },
    adaptiveConfig: {
      logic_type: 'fractions.types.identify',
      variables: { chosenType, latexRepresentation, seed: params.seed }
    }
  };
}

function generateFindProper(params, random) {
  // 1 correct proper fraction
  const d_prop = getRandomInt(3, 12, random);
  const n_prop = getRandomInt(1, d_prop - 1, random);

  // 1 improper fraction
  const d_imp = getRandomInt(2, 8, random);
  const n_imp = getRandomInt(d_imp + 1, d_imp * 2, random);

  // 1 mixed number
  const w_mix = getRandomInt(1, 3, random);
  const d_mix = getRandomInt(2, 6, random);
  const n_mix = getRandomInt(1, d_mix - 1, random);

  // 1 whole number
  const whole_val = getRandomInt(2, 9, random);

  const options = [
    { id: 'opt_correct', type: 'latex', label: `\\frac{${n_prop}}{${d_prop}}`, isCorrect: true },
    { id: 'opt_dist_1', type: 'latex', label: `\\frac{${n_imp}}{${d_imp}}`, isCorrect: false },
    { id: 'opt_dist_2', type: 'latex', label: `${w_mix} \\frac{${n_mix}}{${d_mix}}`, isCorrect: false },
    { id: 'opt_dist_3', type: 'latex', label: `${whole_val}`, isCorrect: false }
  ];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `A **proper fraction** has a numerator (top number) that is smaller than its denominator (bottom number).` },
        { type: 'latex', content: `\\text{In } \\frac{${n_prop}}{${d_prop}}, \\text{ the numerator } ${n_prop} \\text{ is smaller than the denominator } ${d_prop}.` },
        { type: 'text', content: `So, $\\frac{${n_prop}}{${d_prop}}$ is a proper fraction.` }
      ]
    }
  ];

  return {
    id: `q_frac_find_prop_${uid()}`,
    type: 'mcq',
    questionText: 'Which of the following is a proper fraction?',
    parts: [
      { type: 'text', content: 'Which of the following is a proper fraction?', style: { fontWeight: 900 } }
    ],
    options,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    layoutConfig: { partsDirection: 'column' },
    adaptiveConfig: {
      logic_type: 'fractions.types.proper',
      variables: { seed: params.seed }
    }
  };
}

function generateFindImproper(params, random) {
  // 1 correct improper fraction
  const d_imp = getRandomInt(2, 8, random);
  const n_imp = getRandomInt(d_imp + 1, d_imp * 2, random);

  // 1 proper fraction
  const d_prop = getRandomInt(3, 12, random);
  const n_prop = getRandomInt(1, d_prop - 1, random);

  // 1 mixed number
  const w_mix = getRandomInt(1, 3, random);
  const d_mix = getRandomInt(2, 6, random);
  const n_mix = getRandomInt(1, d_mix - 1, random);

  // 1 whole number
  const whole_val = getRandomInt(2, 9, random);

  const options = [
    { id: 'opt_correct', type: 'latex', label: `\\frac{${n_imp}}{${d_imp}}`, isCorrect: true },
    { id: 'opt_dist_1', type: 'latex', label: `\\frac{${n_prop}}{${d_prop}}`, isCorrect: false },
    { id: 'opt_dist_2', type: 'latex', label: `${w_mix} \\frac{${n_mix}}{${d_mix}}`, isCorrect: false },
    { id: 'opt_dist_3', type: 'latex', label: `${whole_val}`, isCorrect: false }
  ];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `An **improper fraction** has a numerator (top number) that is greater than or equal to its denominator (bottom number).` },
        { type: 'latex', content: `\\text{In } \\frac{${n_imp}}{${d_imp}}, \\text{ the numerator } ${n_imp} \\text{ is greater than the denominator } ${d_imp}.` },
        { type: 'text', content: `So, $\\frac{${n_imp}}{${d_imp}}$ is an improper fraction.` }
      ]
    }
  ];

  return {
    id: `q_frac_find_imp_${uid()}`,
    type: 'mcq',
    questionText: 'Which of the following is an improper fraction?',
    parts: [
      { type: 'text', content: 'Which of the following is an improper fraction?', style: { fontWeight: 900 } }
    ],
    options,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    layoutConfig: { partsDirection: 'column' },
    adaptiveConfig: {
      logic_type: 'fractions.types.improper',
      variables: { seed: params.seed }
    }
  };
}

function generateFindMixed(params, random) {
  // 1 correct mixed number
  const w_mix = getRandomInt(1, 3, random);
  const d_mix = getRandomInt(2, 6, random);
  const n_mix = getRandomInt(1, d_mix - 1, random);

  // 1 proper fraction
  const d_prop = getRandomInt(3, 12, random);
  const n_prop = getRandomInt(1, d_prop - 1, random);

  // 1 improper fraction
  const d_imp = getRandomInt(2, 8, random);
  const n_imp = getRandomInt(d_imp + 1, d_imp * 2, random);

  // 1 whole number
  const whole_val = getRandomInt(2, 9, random);

  const options = [
    { id: 'opt_correct', type: 'latex', label: `${w_mix} \\frac{${n_mix}}{${d_mix}}`, isCorrect: true },
    { id: 'opt_dist_1', type: 'latex', label: `\\frac{${n_prop}}{${d_prop}}`, isCorrect: false },
    { id: 'opt_dist_2', type: 'latex', label: `\\frac{${n_imp}}{${d_imp}}`, isCorrect: false },
    { id: 'opt_dist_3', type: 'latex', label: `${whole_val}`, isCorrect: false }
  ];

  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `A **mixed number** is a combination of a whole number part and a proper fraction part.` },
        { type: 'latex', content: `\\text{In } ${w_mix} \\frac{${n_mix}}{${d_mix}}, \\text{ the whole number part is } ${w_mix} \\text{ and the fraction part is } \\frac{${n_mix}}{${d_mix}}.` },
        { type: 'text', content: `So, $${w_mix} \\frac{${n_mix}}{${d_mix}}$ is a mixed number.` }
      ]
    }
  ];

  return {
    id: `q_frac_find_mixed_${uid()}`,
    type: 'mcq',
    questionText: 'Which of the following is a mixed number?',
    parts: [
      { type: 'text', content: 'Which of the following is a mixed number?', style: { fontWeight: 900 } }
    ],
    options,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    layoutConfig: { partsDirection: 'column' },
    adaptiveConfig: {
      logic_type: 'fractions.types.mixed',
      variables: { seed: params.seed }
    }
  };
}
