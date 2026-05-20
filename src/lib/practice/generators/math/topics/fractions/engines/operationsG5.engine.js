import { createSeededRandom, getRandomInt, simplifyFraction } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const operationsG5Engine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `oper_g5_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'likeFractions';

  if (subType === 'likeFractions' || subType === 'fractions.addition.likeFractions') {
    return generateAddLike(params, random);
  } else if (subType === 'improperFractions' || subType === 'fractions.addition.improperFractions') {
    return generateAddImproper(params, random);
  } else if (subType === 'fractionAndInteger' || subType === 'fractions.addition.fractionAndInteger') {
    return generateAddFractionAndInteger(params, random);
  } else if (subType === 'missingFractionAddend' || subType === 'fractions.addition.missingFractionAddend') {
    return generateMissingFractionAddend(params, random);
  } else if (subType === 'missingIntegerAddend' || subType === 'fractions.addition.missingIntegerAddend') {
    return generateMissingIntegerAddend(params, random);
  } else if (subType === 'multipleFractions' || subType === 'fractions.addition.multipleFractions') {
    return generateAddMultipleFractions(params, random);
  } else {
    throw new Error(`[OperationsG5Engine] Unsupported subType: ${subType}`);
  }
};

const PALETTES = [
  { fill: '#c084fc', stroke: '#7c3aed' }, // Purple
  { fill: '#93c5fd', stroke: '#1d4ed8' }, // Blue
  { fill: '#6ee7b7', stroke: '#047857' }  // Emerald
];

function makeCombinedStripsSvg(n1, n2, d, palette1, palette2) {
  const width = 260;
  const h = 36;
  const xStart = 20;
  const wPart = width / d;

  const rects = [];
  for (let i = 0; i < d; i++) {
    let fill = '#ffffff';
    let stroke = '#cbd5e1';
    if (i < n1) {
      fill = palette1.fill;
      stroke = palette1.stroke;
    } else if (i < n1 + n2) {
      fill = palette2.fill;
      stroke = palette2.stroke;
    }
    rects.push(`<rect x="${(xStart + i * wPart).toFixed(2)}" y="32" width="${wPart.toFixed(2)}" height="${h}" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>`);
  }

  return `<svg viewBox="0 0 300 90" width="300" height="90" xmlns="http://www.w3.org/2000/svg" style="display:block; margin: 12px auto;">
    <rect x="0" y="0" width="300" height="90" fill="#f8fafc" rx="10" stroke="#e2e8f0" stroke-width="1"/>
    ${rects.join('\n')}
  </svg>`;
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

function generateAddLike(params, random) {
  const d = getRandomInt(4, 12, random);
  const n1 = getRandomInt(1, d - 2, random);
  const n2 = getRandomInt(1, d - n1 - 1, random); // ensure sum is proper fraction

  const sumN = n1 + n2;
  const simplified = simplifyFraction(sumN, d);

  const palette1 = PALETTES[0];
  const palette2 = PALETTES[1];
  const svgContent = makeCombinedStripsSvg(n1, n2, d, palette1, palette2);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `The denominators are the same. Add the numerators and keep the denominator:` },
        { type: 'latex', content: `\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}} = \\frac{${n1} + ${n2}}{${d}} = \\frac{${sumN}}{${d}}` },
        simplified.n !== sumN ? { type: 'text', content: `Simplify by dividing numerator and denominator by their greatest common divisor:` } : null,
        simplified.n !== sumN ? { type: 'latex', content: `\\frac{${sumN}}{${d}} = \\frac{${simplified.n}}{${simplified.d}}` } : null
      ].filter(Boolean)
    }
  ];

  return {
    id: `q_g5_add_like_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `${n1}/${d} + ${n2}/${d} = ?`,
    parts: [
      { type: 'text', content: `Add the fractions:`, style: { fontWeight: 900 } },
      { type: 'svg', content: svgContent },
      mathRow([
        latexPart(`\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}} =`),
        fractionInput()
      ])
    ],
    answer: {
      num: String(simplified.n),
      den: String(simplified.d)
    },
    validation: {
      type: 'exact',
      answer: {
        num: String(simplified.n),
        den: String(simplified.d)
      }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-add-like-fractions',
      templateId: 'fractions.addition.likeFractions',
      engine: 'addition',
      grade: 5,
      competencyId: 'fraction_visual_models'
    },
    adaptiveConfig: {
      logic_type: 'fractions.addition.likeFractions',
      variables: { n1, n2, d, ansN: simplified.n, ansD: simplified.d, seed: params.seed }
    }
  };
}

function generateAddImproper(params, random) {
  const d = getRandomInt(3, 8, random);
  const n1 = getRandomInt(d + 1, 2 * d - 1, random);
  const n2 = getRandomInt(1, d - 1, random);

  const sumN = n1 + n2;
  const simplified = simplifyFraction(sumN, d);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `The denominators are the same. Add the numerators:` },
        { type: 'latex', content: `\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}} = \\frac{${n1} + ${n2}}{${d}} = \\frac{${sumN}}{${d}}` },
        simplified.n !== sumN ? { type: 'latex', content: `\\text{Simplified: } \\frac{${sumN}}{${d}} = \\frac{${simplified.n}}{${simplified.d}}` } : null
      ].filter(Boolean)
    }
  ];

  return {
    id: `q_g5_add_improper_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `${n1}/${d} + ${n2}/${d} = ?`,
    parts: [
      { type: 'text', content: `Add the fractions:`, style: { fontWeight: 900 } },
      mathRow([
        latexPart(`\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}} =`),
        fractionInput()
      ])
    ],
    answer: {
      num: String(simplified.n),
      den: String(simplified.d)
    },
    validation: {
      type: 'exact',
      answer: {
        num: String(simplified.n),
        den: String(simplified.d)
      }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-add-improper-fractions',
      templateId: 'fractions.addition.improperFractions',
      engine: 'addition',
      grade: 5,
      competencyId: 'fraction_visual_models'
    },
    adaptiveConfig: {
      logic_type: 'fractions.addition.improperFractions',
      variables: { n1, n2, d, ansN: simplified.n, ansD: simplified.d, seed: params.seed }
    }
  };
}

function generateAddFractionAndInteger(params, random) {
  const whole = getRandomInt(2, 9, random);
  const d = getRandomInt(3, 10, random);
  const n = getRandomInt(1, d - 1, random);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `When adding a whole number and a fraction, write them together as a mixed number:` },
        { type: 'latex', content: `${whole} + \\frac{${n}}{${d}} = ${whole} \\frac{${n}}{${d}}` }
      ]
    }
  ];

  return {
    id: `q_g5_add_frac_int_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `${whole} + ${n}/${d} = ?`,
    parts: [
      { type: 'text', content: `Add the integer and fraction:`, style: { fontWeight: 900 } },
      mathRow([
        latexPart(`${whole} + \\frac{${n}}{${d}} =`),
        compactInput('whole', 64),
        fractionInput()
      ])
    ],
    answer: {
      whole: String(whole),
      num: String(n),
      den: String(d)
    },
    validation: {
      type: 'exact',
      answer: {
        whole: String(whole),
        num: String(n),
        den: String(d)
      }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-add-fraction-and-integer',
      templateId: 'fractions.addition.fractionAndInteger',
      engine: 'addition',
      grade: 5,
      competencyId: 'fraction_visual_models'
    },
    adaptiveConfig: {
      logic_type: 'fractions.addition.fractionAndInteger',
      variables: { whole, n, d, seed: params.seed }
    }
  };
}

function generateMissingFractionAddend(params, random) {
  const d = getRandomInt(4, 12, random);
  const n1 = getRandomInt(1, d - 2, random);
  const nSum = getRandomInt(n1 + 1, d - 1, random);
  const nMissing = nSum - n1;

  const isFirstMissing = random() > 0.5;

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `To find the missing fraction, subtract the known addend from the sum:` },
        { type: 'latex', content: `\\frac{${nSum}}{${d}} - \\frac{${n1}}{${d}} = \\frac{${nSum} - ${n1}}{${d}} = \\frac{${nMissing}}{${d}}` }
      ]
    }
  ];

  return {
    id: `q_g5_missing_frac_add_${uid()}`,
    type: 'fillInTheBlank',
    questionText: isFirstMissing ? `? + ${n1}/${d} = ${nSum}/${d}` : `${n1}/${d} + ? = ${nSum}/${d}`,
    parts: [
      { type: 'text', content: `Find the missing fraction:`, style: { fontWeight: 900 } },
      mathRow(isFirstMissing ? [
        fractionInput(),
        latexPart(`+ \\frac{${n1}}{${d}} = \\frac{${nSum}}{${d}}`)
      ] : [
        latexPart(`\\frac{${n1}}{${d}} +`),
        fractionInput(),
        latexPart(`= \\frac{${nSum}}{${d}}`)
      ])
    ],
    answer: {
      num: String(nMissing),
      den: String(d)
    },
    validation: {
      type: 'exact',
      answer: {
        num: String(nMissing),
        den: String(d)
      }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-missing-fraction-addend',
      templateId: 'fractions.addition.missingFractionAddend',
      engine: 'addition',
      grade: 5,
      competencyId: 'fraction_visual_models'
    },
    adaptiveConfig: {
      logic_type: 'fractions.addition.missingFractionAddend',
      variables: { n1, nSum, nMissing, d, isFirstMissing, seed: params.seed }
    }
  };
}

function generateMissingIntegerAddend(params, random) {
  // Support either missing whole number or missing fraction part
  const d = getRandomInt(3, 10, random);
  const whole = getRandomInt(2, 9, random);
  const n = getRandomInt(1, d - 1, random);

  const isWholeMissing = random() > 0.5;

  if (isWholeMissing) {
    const solution = [
      {
        type: 'section',
        label: 'explanation',
        parts: [
          { type: 'text', content: `Compare the whole parts and fraction parts:` },
          { type: 'latex', content: `? + \\frac{${n}}{${d}} = ${whole} \\frac{${n}}{${d}}` },
          { type: 'text', content: `The missing whole number is **${whole}**.` }
        ]
      }
    ];

    return {
      id: `q_g5_missing_int_add_w_${uid()}`,
      type: 'fillInTheBlank',
      questionText: `? + ${n}/${d} = ${whole} ${n}/${d}`,
      parts: [
        { type: 'text', content: `Find the missing number:`, style: { fontWeight: 900 } },
        mathRow([
          compactInput('ans', 64),
          latexPart(`+ \\frac{${n}}{${d}} = ${whole} \\frac{${n}}{${d}}`)
        ])
      ],
      answer: { ans: String(whole) },
      validation: {
        type: 'exact',
        answer: { ans: String(whole) }
      },
      solution,
      metadata: {
        subject: 'math',
        topic: 'fractions',
        skillId: params.skillId || 'fractions-g5-missing-integer-addend',
        templateId: 'fractions.addition.missingIntegerAddend',
        engine: 'addition',
        grade: 5,
        competencyId: 'fraction_visual_models'
      },
      adaptiveConfig: {
        logic_type: 'fractions.addition.missingIntegerAddend',
        variables: { whole, n, d, isWholeMissing, seed: params.seed }
      }
    };
  } else {
    const solution = [
      {
        type: 'section',
        label: 'explanation',
        parts: [
          { type: 'text', content: `Compare the whole parts and fraction parts:` },
          { type: 'latex', content: `${whole} + ? = ${whole} \\frac{${n}}{${d}}` },
          { type: 'text', content: `The missing fraction part is **\\frac{${n}}{${d}}**.` }
        ]
      }
    ];

    return {
      id: `q_g5_missing_int_add_f_${uid()}`,
      type: 'fillInTheBlank',
      questionText: `${whole} + ? = ${whole} ${n}/${d}`,
      parts: [
        { type: 'text', content: `Find the missing fraction:`, style: { fontWeight: 900 } },
        mathRow([
          latexPart(`${whole} +`),
          fractionInput(),
          latexPart(`= ${whole} \\frac{${n}}{${d}}`)
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
        skillId: params.skillId || 'fractions-g5-missing-integer-addend',
        templateId: 'fractions.addition.missingIntegerAddend',
        engine: 'addition',
        grade: 5,
        competencyId: 'fraction_visual_models'
      },
      adaptiveConfig: {
        logic_type: 'fractions.addition.missingIntegerAddend',
        variables: { whole, n, d, isWholeMissing, seed: params.seed }
      }
    };
  }
}

function generateAddMultipleFractions(params, random) {
  const d = getRandomInt(5, 12, random);
  const n1 = getRandomInt(1, d - 4, random);
  const n2 = getRandomInt(1, d - n1 - 2, random);
  const n3 = getRandomInt(1, d - n1 - n2 - 1, random);

  const sumN = n1 + n2 + n3;
  const simplified = simplifyFraction(sumN, d);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `The denominators are all the same. Add the numerators together:` },
        { type: 'latex', content: `\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}} + \\frac{${n3}}{${d}} = \\frac{${n1} + ${n2} + ${n3}}{${d}} = \\frac{${sumN}}{${d}}` },
        simplified.n !== sumN ? { type: 'latex', content: `\\text{Simplified: } \\frac{${sumN}}{${d}} = \\frac{${simplified.n}}{${simplified.d}}` } : null
      ].filter(Boolean)
    }
  ];

  return {
    id: `q_g5_add_mult_${uid()}`,
    type: 'fillInTheBlank',
    questionText: `${n1}/${d} + ${n2}/${d} + ${n3}/${d} = ?`,
    parts: [
      { type: 'text', content: `Add the fractions:`, style: { fontWeight: 900 } },
      mathRow([
        latexPart(`\\frac{${n1}}{${d}} + \\frac{${n2}}{${d}} + \\frac{${n3}}{${d}} =`),
        fractionInput()
      ])
    ],
    answer: {
      num: String(simplified.n),
      den: String(simplified.d)
    },
    validation: {
      type: 'exact',
      answer: {
        num: String(simplified.n),
        den: String(simplified.d)
      }
    },
    solution,
    metadata: {
      subject: 'math',
      topic: 'fractions',
      skillId: params.skillId || 'fractions-g5-add-multiple-fractions',
      templateId: 'fractions.addition.multipleFractions',
      engine: 'addition',
      grade: 5,
      competencyId: 'fraction_visual_models'
    },
    adaptiveConfig: {
      logic_type: 'fractions.addition.multipleFractions',
      variables: { n1, n2, n3, d, ansN: simplified.n, ansD: simplified.d, seed: params.seed }
    }
  };
}
