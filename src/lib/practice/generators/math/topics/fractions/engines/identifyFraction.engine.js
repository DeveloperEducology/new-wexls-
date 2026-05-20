import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const identifyFractionEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `id_frac_${Date.now()}`;
  const random = createSeededRandom(seed);
  
  // Choose denominator and numerator
  const denominatorPool = params.denominatorPool || [2, 3, 4, 5, 6, 8, 10, 12];
  const denominator = params.denom || params.denominator || denominatorPool[Math.floor(random() * denominatorPool.length)];
  const numerator = params.num || params.numerator || getRandomInt(1, denominator - 1, random);

  // Choose shape: circle, rectangle, square, strip, or set
  const shapes = params.shapes || ['circle', 'rectangle', 'square', 'strip', 'set'];
  const shape = params.shape || shapes[Math.floor(random() * shapes.length)];

  // Choose palette
  const PALETTES = [
    { fill: '#c084fc', stroke: '#7c3aed', name: 'purple' }, // Purple
    { fill: '#93c5fd', stroke: '#1d4ed8', name: 'blue' },   // Blue
    { fill: '#6ee7b7', stroke: '#047857', name: 'emerald' },// Emerald
    { fill: '#fde047', stroke: '#a16207', name: 'amber' },  // Amber
    { fill: '#fca5a5', stroke: '#b91c1c', name: 'rose' }    // Rose
  ];
  const palette = PALETTES[Math.floor(random() * PALETTES.length)];

  // Choose mode: MCQ or fillInTheBlank
  const difficulty = config.difficulty || 'adaptive';
  let mode = params.type || 'mcq';
  if (params.type === undefined) {
    if (difficulty === 'easy') mode = 'mcq';
    else if (difficulty === 'hard') mode = 'fillInTheBlank';
    else mode = random() > 0.5 ? 'mcq' : 'fillInTheBlank';
  }

  // Generate SVG for the visual model
  let svgContent = '';
  if (shape === 'circle') {
    svgContent = makeCircleSvg(numerator, denominator, palette);
  } else if (shape === 'rectangle' || shape === 'strip') {
    svgContent = makeRectangleSvg(numerator, denominator, palette);
  } else if (shape === 'square') {
    svgContent = makeSquareSvg(numerator, denominator, palette);
  } else {
    svgContent = makeSetSvg(numerator, denominator, palette, random);
  }

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `Count the parts of the visual model:` },
        { type: 'text', content: `1. **Numerator (top number)**: Count the shaded parts. There ${numerator === 1 ? 'is' : 'are'} **${numerator}** shaded ${numerator === 1 ? 'part' : 'parts'}.` },
        { type: 'text', content: `2. **Denominator (bottom number)**: Count the total number of equal parts. There are **${denominator}** parts in total.` },
        { type: 'text', content: `So, the fraction of the shape that is shaded is:` },
        { type: 'latex', content: `\\frac{${numerator}}{${denominator}}` }
      ]
    }
  ];

  if (mode === 'mcq') {
    const distractors = generateIdentifyFractionDistractors(numerator, denominator, random);
    const correctOption = {
      id: 'opt_correct',
      type: 'latex',
      label: `\\frac{${numerator}}{${denominator}}`,
      value: `${numerator}/${denominator}`,
      isCorrect: true
    };
    const options = [
      correctOption,
      ...distractors.map((d, idx) => ({
        id: `opt_distractor_${idx}`,
        type: 'latex',
        label: `\\frac{${d.numerator}}{${d.denominator}}`,
        value: `${d.numerator}/${d.denominator}`,
        isCorrect: false
      }))
    ];

    // Shuffle options
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    const correctIdx = options.findIndex(o => o.isCorrect);

    return {
      id: `q_frac_id_visual_${uid()}`,
      type: 'mcq',
      questionText: 'What fraction is shaded?',
      parts: [
        { type: 'text', content: 'What fraction is shaded?', style: { fontWeight: 900 } },
        { type: 'svg', content: svgContent },
      ],
      options,
      correctAnswerIndex: correctIdx,
      validation: { type: 'exact', answer: correctIdx },
      solution,
      layoutConfig: { partsDirection: 'column' },
      adaptiveConfig: {
        logic_type: params.logic_type || 'fractions.identify.visual',
        variables: { denom: denominator, num: numerator, shape, seed }
      }
    };
  } else {
    // Fill in the Blank mode
    return {
      id: `q_frac_id_visual_${uid()}`,
      type: 'fillInTheBlank',
      questionText: 'What fraction is shaded?',
      parts: [
        { type: 'text', content: 'What fraction is shaded?', style: { fontWeight: 900 } },
        { type: 'svg', content: svgContent },
        { type: 'text', content: 'The fraction is **[blank:num]** / **[blank:den]**.' }
      ],
      correctAnswerText: JSON.stringify({ num: String(numerator), den: String(denominator) }),
      validation: {
        type: 'exact',
        answer: { num: String(numerator), den: String(denominator) }
      },
      solution,
      layoutConfig: { partsDirection: 'column' },
      adaptiveConfig: {
        logic_type: params.logic_type || 'fractions.identify.visual',
        variables: { denom: denominator, num: numerator, shape, seed }
      }
    };
  }
};

function makeCircleSvg(n, d, palette, size = 160) {
  const cx = 100, cy = 100, r = 80;
  const wedges = [];
  for (let i = 0; i < d; i++) {
    const startAngle = (i / d) * 2 * Math.PI - Math.PI / 2;
    const endAngle = ((i + 1) / d) * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const fill = i < n ? palette.fill : '#ffffff';
    wedges.push(`<path d="M ${cx} ${cy} L ${x1.toFixed(2)} ${y1.toFixed(2)} A ${r} ${r} 0 0 1 ${x2.toFixed(2)} ${y2.toFixed(2)} Z" fill="${fill}" stroke="${palette.stroke}" stroke-width="2"/>`);
  }
  return `<svg viewBox="0 0 200 200" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto; display:block; margin: 12px auto;">
    ${wedges.join('')}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="${palette.stroke}" stroke-width="3"/>
  </svg>`;
}

function makeRectangleSvg(n, d, palette, size = 180) {
  const w = 240, h = 60;
  const rx = 10, ry = 10;
  const colW = w / d;
  const cells = [];
  for (let i = 0; i < d; i++) {
    const fill = i < n ? palette.fill : '#ffffff';
    cells.push(`<rect x="${(rx + i * colW).toFixed(2)}" y="${ry}" width="${colW.toFixed(2)}" height="${h}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2"/>`);
  }
  return `<svg viewBox="0 0 260 80" width="${size * 1.5}" height="${size * 0.5}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto; display:block; margin: 12px auto;">
    ${cells.join('')}
    <rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="none" stroke="${palette.stroke}" stroke-width="3" rx="4"/>
  </svg>`;
}

function makeSquareSvg(n, d, palette, size = 160) {
  const w = 140, h = 140;
  const rx = 10, ry = 10;
  const cells = [];
  
  if (d === 4) {
    const side = w / 2;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 2; c++) {
        const idx = r * 2 + c;
        const fill = idx < n ? palette.fill : '#ffffff';
        cells.push(`<rect x="${(rx + c * side).toFixed(2)}" y="${(ry + r * side).toFixed(2)}" width="${side}" height="${side}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2"/>`);
      }
    }
  } else if (d === 9) {
    const side = w / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const idx = r * 3 + c;
        const fill = idx < n ? palette.fill : '#ffffff';
        cells.push(`<rect x="${(rx + c * side).toFixed(2)}" y="${(ry + r * side).toFixed(2)}" width="${side}" height="${side}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2"/>`);
      }
    }
  } else {
    const colW = w / d;
    for (let i = 0; i < d; i++) {
      const fill = i < n ? palette.fill : '#ffffff';
      cells.push(`<rect x="${(rx + i * colW).toFixed(2)}" y="${ry}" width="${colW.toFixed(2)}" height="${h}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2"/>`);
    }
  }
  
  return `<svg viewBox="0 0 160 160" width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto; display:block; margin: 12px auto;">
    ${cells.join('')}
    <rect x="${rx}" y="${ry}" width="${w}" height="${h}" fill="none" stroke="${palette.stroke}" stroke-width="3" rx="4"/>
  </svg>`;
}

function makeSetSvg(n, d, palette, random, size = 160) {
  const shapes = ['circle', 'square', 'triangle'];
  const shapeType = shapes[Math.floor(random() * shapes.length)];
  
  const cols = d <= 5 ? d : Math.ceil(d / 2);
  const rows = Math.ceil(d / cols);
  const itemSize = 40;
  const gap = 15;
  const padding = 10;
  const w = cols * itemSize + (cols - 1) * gap + padding * 2;
  const h = rows * itemSize + (rows - 1) * gap + padding * 2;
  
  const shapesList = [];
  for (let i = 0; i < d; i++) {
    const r = Math.floor(i / cols);
    const c = i % cols;
    const cx = padding + c * (itemSize + gap) + itemSize / 2;
    const cy = padding + r * (itemSize + gap) + itemSize / 2;
    const fill = i < n ? palette.fill : '#ffffff';
    
    if (shapeType === 'circle') {
      shapesList.push(`<circle cx="${cx}" cy="${cy}" r="${itemSize / 2 - 2}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2.5"/>`);
    } else if (shapeType === 'square') {
      const sizeHalf = itemSize / 2 - 2;
      shapesList.push(`<rect x="${cx - sizeHalf}" y="${cy - sizeHalf}" width="${sizeHalf * 2}" height="${sizeHalf * 2}" rx="4" fill="${fill}" stroke="${palette.stroke}" stroke-width="2.5"/>`);
    } else {
      const sizeHalf = itemSize / 2 - 2;
      shapesList.push(`<polygon points="${cx},${cy - sizeHalf} ${cx - sizeHalf},${cy + sizeHalf} ${cx + sizeHalf},${cy + sizeHalf}" fill="${fill}" stroke="${palette.stroke}" stroke-width="2.5" stroke-linejoin="round"/>`);
    }
  }
  return `<svg viewBox="0 0 ${w} ${h}" width="${size * (w / h)}" height="${size}" xmlns="http://www.w3.org/2000/svg" style="max-width:100%; height:auto; display:block; margin: 12px auto;">
    ${shapesList.join('')}
  </svg>`;
}

function generateIdentifyFractionDistractors(numerator, denominator, random) {
  const candidates = new Set();
  const add = (n, d) => {
    if (n > 0 && n < d && !(n === numerator && d === denominator)) {
      candidates.add(`${n}/${d}`);
    }
  };
  
  for (let offset of [-1, 1, -2, 2]) {
    add(numerator + offset, denominator);
  }
  for (let offset of [-1, 1, -2, 2]) {
    add(numerator, denominator + offset);
  }
  add(denominator - numerator, denominator);
  
  const common = [[1, 2], [1, 3], [2, 3], [1, 4], [3, 4], [1, 5], [2, 5], [3, 5], [4, 5]];
  for (let [cn, cd] of common) {
    add(cn, cd);
  }
  
  const pool = Array.from(candidates).map(str => {
    const [n, d] = str.split('/').map(Number);
    return { numerator: n, denominator: d };
  });
  
  const shuffled = pool.sort(() => random() - 0.5);
  return shuffled.slice(0, 3);
}
