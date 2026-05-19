import { createSeededRandom, getRandomInt, gcd, lcm, simplifyFraction } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const unlikeDenominatorsEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `unlike_${Date.now()}`;
  const random = createSeededRandom(seed);

  // Generate denominators d1, d2
  // We prefer small visual-friendly examples (LCM <= 24) by default, but support up to 20
  let d1 = params.d1 || params.denom1;
  let d2 = params.d2 || params.denom2;
  
  if (!d1 || !d2) {
    const isHard = params.complexity === 'hard';
    const denomPool = isHard 
      ? [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20]
      : [2, 3, 4, 5, 6, 8, 10, 12];
      
    let attempts = 0;
    while (attempts < 100) {
      const candidate1 = denomPool[Math.floor(random() * denomPool.length)];
      const candidate2 = denomPool[Math.floor(random() * denomPool.length)];
      if (candidate1 !== candidate2) {
        const leastCommon = lcm(candidate1, candidate2);
        // By default keep LCM <= 30 for clear visualization of divisions
        if (isHard || leastCommon <= 30) {
          d1 = candidate1;
          d2 = candidate2;
          break;
        }
      }
      attempts++;
    }
    // Fallbacks
    if (!d1 || !d2) {
      d1 = 3;
      d2 = 4;
    }
  }

  // Generate proper fractions (n1 < d1, n2 < d2)
  let n1 = params.n1 || params.num1;
  let n2 = params.n2 || params.num2;
  
  if (!n1 || !n2) {
    n1 = getRandomInt(1, d1 - 1, random);
    n2 = getRandomInt(1, d2 - 1, random);
  }

  // Determine operator (+ or -)
  const op = params.op || (random() > 0.5 ? '+' : '-');

  // Avoid zero/negative answers for subtraction
  if (op === '-') {
    const val1 = n1 / d1;
    const val2 = n2 / d2;
    if (val1 <= val2) {
      // Swap them to ensure positive result
      const tempN = n1;
      const tempD = d1;
      n1 = n2;
      d1 = d2;
      n2 = tempN;
      d2 = tempD;
    }
  }

  // Calculations
  const D = lcm(d1, d2);
  const m1 = D / d1;
  const m2 = D / d2;
  const N1 = n1 * m1;
  const N2 = n2 * m2;

  let ansNum, ansDen = D;
  if (op === '+') {
    ansNum = N1 + N2;
  } else {
    ansNum = N1 - N2;
  }

  // Simplify the fraction
  const sim = simplifyFraction(ansNum, ansDen);
  const simNum = sim.numerator;
  const simDen = sim.denominator;
  const isSimplifiable = ansNum !== simNum || ansDen !== simDen;

  // Render question text & operator label
  const opText = op === '+' ? 'Add' : 'Subtract';
  const questionText = `${opText}.`;

  // Draw SVGs in the requested vertical layout style
  const questionSvg = drawVerticalAdditionSvg(n1, d1, n2, d2, op);
  const commonDenomSvg = drawVerticalAdditionSvg(N1, D, N2, D, op);
  
  let finalModelSvg = '';
  if (op === '+') {
    if (ansNum <= D) {
      finalModelSvg = drawCombinedFractionSvg(N1, N2, D);
    } else {
      finalModelSvg = drawCombinedFractionTwoWholesSvg(N1, N2, D);
    }
  } else {
    finalModelSvg = drawSubtractedFractionSvg(N1, N2, D);
  }

  // Construct Solution sections
  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `Find the ${op === '+' ? 'sum' : 'difference'}:` },
        { type: 'latex', content: `\\frac{${n1}}{${d1}} ${op} \\frac{${n2}}{${d2}}` },
        { type: 'text', content: 'Rename the fractions using a common denominator.', style: { fontWeight: 'bold', marginTop: '12px' } },
        { type: 'text', content: `The least common multiple of ${d1} and ${d2} is **${D}**.` },
        { type: 'latex', content: `\\frac{${n1}}{${d1}} = \\frac{${n1} \\times ${m1}}{${d1} \\times ${m1}} = \\frac{${N1}}{${D}}` },
        { type: 'latex', content: `\\frac{${n2}}{${d2}} = \\frac{${n2} \\times ${m2}}{${d2} \\times ${m2}} = \\frac{${N2}}{${D}}` },
        { type: 'text', content: `So, rewrite the expression as:` },
        { type: 'latex', content: `\\frac{${N1}}{${D}} ${op} \\frac{${N2}}{${D}}` },
        { type: 'svg', content: commonDenomSvg },
        { type: 'text', content: `Now ${op === '+' ? 'add' : 'subtract'} the numerators and keep the denominator the same.`, style: { fontWeight: 'bold', marginTop: '12px' } },
        { type: 'latex', content: `\\frac{${N1}}{${D}} ${op} \\frac{${N2}}{${D}} = \\frac{${N1} ${op} ${N2}}{${D}} = \\frac{${ansNum}}{${D}}` },
        { type: 'svg', content: finalModelSvg }
      ]
    }
  ];

  if (isSimplifiable) {
    const divisor = gcd(ansNum, ansDen);
    solution[0].parts.push(
      { type: 'text', content: `Simplify the answer by dividing both the numerator and the denominator by their greatest common divisor, which is ${divisor}:`, style: { marginTop: '12px' } },
      { type: 'latex', content: `\\frac{${ansNum}}{${D}} = \\frac{${ansNum} \\div ${divisor}}{${D} \\div ${divisor}} = \\frac{${simNum}}{${simDen}}` }
    );
  }

  // Answer validation (single input block with id 'ans')
  const mainAnswer = {
    ans: `${ansNum}/${ansDen}`
  };

  const altAnswers = [];
  if (isSimplifiable) {
    altAnswers.push({
      ans: `${simNum}/${simDen}`
    });
  }

  return {
    id: `q_frac_unlike_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText, style: { fontWeight: 900 } },
      {
        type: 'row',
        parts: [
          {
            type: 'latex',
            content: `\\frac{${n1}}{${d1}} ${op} \\frac{${n2}}{${d2}} =`,
            style: { width: 'auto', display: 'inline-block', fontSize: 26, marginRight: '8px' }
          },
          {
            type: 'input',
            id: 'ans',
            style: { width: '120px', height: '46px', fontSize: '20px', fontWeight: 900 }
          }
        ],
        style: { margin: '16px 0', justifyContent: 'center', alignItems: 'center' }
      },
      { type: 'text', content: 'Use the model to help you.', style: { fontSize: 18, color: '#475569', marginBottom: '14px', fontWeight: 'bold' } },
      {
        type: 'svg',
        content: questionSvg
      }
    ],
    answer: mainAnswer,
    correctAnswerText: JSON.stringify(mainAnswer),
    validation: {
      type: 'exact',
      answer: mainAnswer,
      altAnswers
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      templateId: 'fractions.unlikeDenominators.addSubtract',
      engine: 'unlikeDenominators',
      d1,
      d2,
      n1,
      n2,
      op,
      seed
    }
  };
};

// ============================================================================
// SVG Rendering Helpers
// ============================================================================

function drawVerticalAdditionSvg(n1, d1, n2, d2, op) {
  const W = 300; // total width representing 1 whole
  const startX = 75;
  const cellH = 50;
  
  const w1 = W / d1;
  const w2 = W / d2;
  
  const cells1 = [];
  for (let i = 0; i < n1; i++) {
    const x = startX + i * w1;
    const y = 10;
    cells1.push(`
      <rect x="${x}" y="${y}" width="${w1}" height="${cellH}" fill="#f87171" stroke="#b91c1c" stroke-width="2" />
      <text x="${x + w1 / 2}" y="${y + 19}" font-size="12" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="#7f1d1d" text-anchor="middle">1</text>
      <line x1="${x + 6}" y1="${y + 25}" x2="${x + w1 - 6}" y2="${y + 25}" stroke="#7f1d1d" stroke-width="1.5" />
      <text x="${x + w1 / 2}" y="${y + 39}" font-size="12" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="#7f1d1d" text-anchor="middle">${d1}</text>
    `);
  }
  
  const cells2 = [];
  for (let i = 0; i < n2; i++) {
    const x = startX + i * w2;
    const y = 70;
    cells2.push(`
      <rect x="${x}" y="${y}" width="${w2}" height="${cellH}" fill="#2dd4bf" stroke="#0f766e" stroke-width="2" />
      <text x="${x + w2 / 2}" y="${y + 19}" font-size="12" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="#115e59" text-anchor="middle">1</text>
      <line x1="${x + 6}" y1="${y + 25}" x2="${x + w2 - 6}" y2="${y + 25}" stroke="#115e59" stroke-width="1.5" />
      <text x="${x + w2 / 2}" y="${y + 39}" font-size="12" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="#115e59" text-anchor="middle">${d2}</text>
    `);
  }
  
  const opX = startX - 35;
  const opY = 70 + cellH / 2 + 7;
  const opMarkup = `<text x="${opX}" y="${opY}" font-size="28" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="#000" text-anchor="middle">${op}</text>`;
  
  const lineEndX = startX + Math.max(n1 * w1, n2 * w2) + 10;
  const lineMarkup = `<line x1="${startX - 40}" y1="130" x2="${lineEndX}" y2="130" stroke="#000" stroke-width="4" stroke-linecap="round" />`;
  
  const svgW = Math.max(lineEndX + 15, 380);
  const svgH = 142;
  
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgW} ${svgH}" width="100%" style="max-width: ${svgW}px; display: block; margin: 12px auto;">
    ${cells1.join('\n')}
    ${cells2.join('\n')}
    ${opMarkup}
    ${lineMarkup}
  </svg>
  `;
}

function drawHorizontalFractionBar(x, y, w, h, numerator, denominator, color, strokeColor, labelText) {
  const cellW = w / denominator;
  const cells = [];
  for (let i = 0; i < denominator; i++) {
    const fill = i < numerator ? color : '#ffffff';
    cells.push(`
      <rect x="${x + i * cellW}" y="${y}" width="${cellW}" height="${h}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
    `);
    
    if (cellW >= 22) {
      const textColor = i < numerator ? strokeColor : '#475569';
      cells.push(`
        <text x="${x + i * cellW + cellW / 2}" y="${y + h / 2 - 4}" font-size="9" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="${textColor}" text-anchor="middle">1</text>
        <line x1="${x + i * cellW + 4}" y1="${y + h / 2}" x2="${x + i * cellW + cellW - 4}" y2="${y + h / 2}" stroke="${textColor}" stroke-width="1" />
        <text x="${x + i * cellW + cellW / 2}" y="${y + h / 2 + 10}" font-size="9" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="${textColor}" text-anchor="middle">${denominator}</text>
      `);
    }
  }
  
  const labelX = x - 35;
  const labelY = y + h / 2 + 5.5;
  const labelMarkup = `<text x="${labelX}" y="${labelY}" font-size="15" font-family="Inter, system-ui, sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">${labelText}</text>`;
  
  return {
    rects: cells.join('\n'),
    label: labelMarkup
  };
}

function drawCombinedFractionBar(x, y, w, h, n1, n2, denominator, colorA, strokeColorA, colorB, strokeColorB, labelText) {
  const cellW = w / denominator;
  const cells = [];
  for (let i = 0; i < denominator; i++) {
    let fill = '#ffffff';
    let strokeColor = '#cbd5e1';
    let textColor = '#475569';
    if (i < n1) {
      fill = colorA;
      strokeColor = strokeColorA;
      textColor = strokeColorA;
    } else if (i < n1 + n2) {
      fill = colorB;
      strokeColor = strokeColorB;
      textColor = strokeColorB;
    }
    cells.push(`
      <rect x="${x + i * cellW}" y="${y}" width="${cellW}" height="${h}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
    `);
    
    if (cellW >= 22) {
      cells.push(`
        <text x="${x + i * cellW + cellW / 2}" y="${y + h / 2 - 4}" font-size="9" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="${textColor}" text-anchor="middle">1</text>
        <line x1="${x + i * cellW + 4}" y1="${y + h / 2}" x2="${x + i * cellW + cellW - 4}" y2="${y + h / 2}" stroke="${textColor}" stroke-width="1" />
        <text x="${x + i * cellW + cellW / 2}" y="${y + h / 2 + 10}" font-size="9" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="${textColor}" text-anchor="middle">${denominator}</text>
      `);
    }
  }
  
  const labelX = x - 35;
  const labelY = y + h / 2 + 5.5;
  const labelMarkup = `<text x="${labelX}" y="${labelY}" font-size="15" font-family="Inter, system-ui, sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">${labelText}</text>`;
  
  return {
    rects: cells.join('\n'),
    label: labelMarkup
  };
}

function drawCombinedFractionSvg(n1, n2, D) {
  const bar = drawCombinedFractionBar(70, 12, 300, 28, n1, n2, D, '#93c5fd', '#2563eb', '#fbcfe8', '#db2777', `${n1 + n2}/${D}`);
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 52" width="100%" style="max-width: 390px; display: block; margin: 8px auto;">
    ${bar.rects}
    ${bar.label}
  </svg>
  `;
}

function drawCombinedFractionTwoWholesSvg(n1, n2, D) {
  // Whole 1: n1 of A, and D - n1 of B
  const bar1 = drawCombinedFractionBar(70, 12, 300, 28, n1, D - n1, D, '#93c5fd', '#2563eb', '#fbcfe8', '#db2777', '1');
  // Whole 2: remaining B (n1 + n2 - D)
  const remB = n1 + n2 - D;
  const bar2 = drawCombinedFractionBar(70, 52, 300, 28, 0, remB, D, '#93c5fd', '#2563eb', '#fbcfe8', '#db2777', `${remB}/${D}`);
  const totalLabel = `<text x="18" y="52" font-size="14" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="#059669" text-anchor="middle">${n1 + n2}/${D}</text>`;
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 92" width="100%" style="max-width: 390px; display: block; margin: 8px auto;">
    ${totalLabel}
    ${bar1.rects}
    ${bar1.label}
    ${bar2.rects}
    ${bar2.label}
  </svg>
  `;
}

function drawSubtractedFractionSvg(n1, n2, D) {
  const cellW = 300 / D;
  const cells = [];
  const diff = n1 - n2;
  for (let i = 0; i < D; i++) {
    let fill = '#ffffff';
    let strokeColor = '#cbd5e1';
    let textColor = '#475569';
    if (i < diff) {
      fill = '#93c5fd';
      strokeColor = '#2563eb';
      textColor = '#2563eb';
    } else if (i < n1) {
      // Shaded originally but now subtracted
      fill = '#f1f5f9';
      strokeColor = '#94a3b8';
      textColor = '#94a3b8';
    }
    
    cells.push(`
      <rect x="${70 + i * cellW}" y="12" width="${cellW}" height="28" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
    `);
    
    // Draw cross over subtracted parts
    if (i >= diff && i < n1) {
      const cx = 70 + i * cellW + cellW / 2;
      const cy = 12 + 14;
      const crossSize = Math.min(cellW, 28) * 0.4;
      cells.push(`
        <line x1="${cx - crossSize}" y1="${cy - crossSize}" x2="${cx + crossSize}" y2="${cy + crossSize}" stroke="#ef4444" stroke-width="2.5" />
        <line x1="${cx + crossSize}" y1="${cy - crossSize}" x2="${cx - crossSize}" y2="${cy + crossSize}" stroke="#ef4444" stroke-width="2.5" />
      `);
    } else if (i < diff && cellW >= 22) {
      cells.push(`
        <text x="${70 + i * cellW + cellW / 2}" y="21" font-size="8" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="${textColor}" text-anchor="middle">1</text>
        <line x1="${70 + i * cellW + 4}" y1="25" x2="${70 + i * cellW + cellW - 4}" y2="25" stroke="${textColor}" stroke-width="1" />
        <text x="${70 + i * cellW + cellW / 2}" y="${35}" font-size="8" font-family="Inter, system-ui, sans-serif" font-weight="900" fill="${textColor}" text-anchor="middle">${D}</text>
      `);
    }
  }
  
  const labelMarkup = `<text x="35" y="31.5" font-size="15" font-family="Inter, system-ui, sans-serif" font-weight="800" fill="#0f172a" text-anchor="middle">${diff}/${D}</text>`;
  
  return `
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 390 52" width="100%" style="max-width: 390px; display: block; margin: 8px auto;">
    ${cells.join('\n')}
    ${labelMarkup}
  </svg>
  `;
}
