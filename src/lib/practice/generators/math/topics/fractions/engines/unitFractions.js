/**
 * Unit Fractions Decompositions Engine (LaTeX/KaTeX Only)
 * Generates highly adaptive visual and numeric decompositions of fractions
 * into unit fractions using only standard LaTeX/KaTeX math representations.
 */

import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

const fractionLatex = (num, den) => `\\frac{${num}}{${den}}`;

export const unitFractionsEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};

  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };

  const params = {
    ...engineParams,
    ...resolvedVars
  };

  const seed = params.seed || `unit_frac_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'standard_mcq';

  // Randomize fraction: denom in [3, 4, 5, 6, 8, 10], num in [2, denom - 1]
  const denoms = [3, 4, 5, 6, 7, 8, 9, 10];
  const denominator = params.denominator || denoms[Math.floor(random() * denoms.length)];
  const numerator = params.numerator || getRandomInt(2, denominator - 1, random);

  if (subType === 'standard_mcq') {
    return generateStandardMcq(numerator, denominator, params, random);
  } else if (subType === 'visual_strip_mcq') {
    return generateVisualStripMcq(numerator, denominator, params, random);
  } else if (subType === 'count_unit_fractions') {
    return generateCountUnitFractions(numerator, denominator, params, random);
  } else if (subType === 'missing_unit_fraction') {
    return generateMissingUnitFraction(numerator, denominator, params, random);
  } else if (subType === 'true_or_false') {
    return generateTrueOrFalse(numerator, denominator, params, random);
  } else if (subType === 'error_analysis') {
    return generateErrorAnalysis(numerator, denominator, params, random);
  } else if (subType === 'select_all') {
    return generateSelectAll(numerator, denominator, params, random);
  } else if (subType === 'build_from_words') {
    return generateBuildFromWords(numerator, denominator, params, random);
  } else if (subType === 'puzzle_style') {
    return generatePuzzleStyle(numerator, denominator, params, random);
  } else if (subType === 'fill_in_the_blank') {
    return generateFillInTheBlank(numerator, denominator, params, random);
  } else {
    throw new Error(`[UnitFractionsEngine] Unsupported subType: ${subType}`);
  }
};

// ============================================================================
// Helper Visual Strip Builder
// ============================================================================
function buildFractionStripSvg(numerator, denominator, size = 300) {
  const width = 280;
  const cellW = width / denominator;
  
  // Shaded parts are light blue, remaining parts are white
  let dividedCells = '';
  for (let i = 0; i < denominator; i++) {
    const isShaded = i < numerator;
    const fill = isShaded ? '#60a5fa' : '#ffffff';
    const textFill = isShaded ? '#1e3a8a' : '#64748b';
    dividedCells += `
      <g>
        <rect x="${10 + i * cellW}" y="65" width="${cellW}" height="40" fill="${fill}" stroke="#2563eb" stroke-width="1.5" />
        <text x="${10 + i * cellW + cellW / 2}" y="90" text-anchor="middle" font-size="13" font-family="sans-serif" font-weight="600" fill="${textFill}">1/${denominator}</text>
      </g>
    `;
  }

  // Draw the bottom bracket indicating numerator/denominator sum
  const bracketW = numerator * cellW;
  const bracketSvg = numerator > 0 ? `
    <path d="M 10 115 L 10 123 M 10 120 L ${10 + bracketW} 120 M ${10 + bracketW} 115 L ${10 + bracketW} 123" stroke="#475569" stroke-width="1.5" fill="none" />
    <text x="${10 + bracketW / 2}" y="142" text-anchor="middle" font-size="14" font-weight="800" font-family="sans-serif" fill="#475569">${numerator}/${denominator}</text>
  ` : '';

  return `
    <svg viewBox="0 0 300 160" width="${size}" height="${(size / 300) * 160}" style="margin: 8px 0;">
      <!-- Whole Strip -->
      <rect x="10" y="15" width="${width}" height="40" fill="#fef08a" stroke="#eab308" stroke-width="2" rx="4" />
      <text x="150" y="40" text-anchor="middle" font-size="15" font-family="sans-serif" font-weight="700" fill="#854d0e">1</text>
      
      <!-- Divided Cells -->
      ${dividedCells}

      <!-- Bracket -->
      ${bracketSvg}
    </svg>
  `;
}

// ============================================================================
// Sub-Type Question Generators
// ============================================================================

function generateStandardMcq(numerator, denominator, params, random) {
  const fractionStr = fractionLatex(numerator, denominator);
  const questionText = `How do you write ${numerator}/${denominator} as a sum of unit fractions?`;

  const unitSum = Array(numerator).fill(fractionLatex(1, denominator)).join(' + ');

  const correctOption = {
    id: 'opt_correct',
    type: 'latex',
    content: unitSum,
    isCorrect: true
  };

  const distractors = [
    // 1. Denominator confusion (1/numerator + 1/numerator + ...)
    {
      id: 'opt_dist_denom',
      type: 'latex',
      content: Array(numerator).fill(fractionLatex(1, numerator)).join(' + '),
      isCorrect: false
    },
    // 2. Numerator copied (numerator/denominator + 1/denominator)
    {
      id: 'opt_dist_num_copy',
      type: 'latex',
      content: `${fractionLatex(numerator, denominator)} + ${fractionLatex(1, denominator)}`,
      isCorrect: false
    },
    // 3. Whole misunderstanding (1/2 + 1/2 + ...)
    {
      id: 'opt_dist_whole',
      type: 'latex',
      content: Array(numerator).fill(fractionLatex(1, 2)).join(' + '),
      isCorrect: false
    }
  ];

  const options = [correctOption, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'remember',
      parts: [
        { type: 'text', content: "A unit fraction has a numerator of 1.", style: { fontWeight: 800 } }
      ]
    },
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `To write $${fractionStr}$ as a sum of unit fractions, we add the unit fraction $${fractionLatex(1, denominator)}$ a total of ${numerator} times.` },
        { type: 'latex', content: `${fractionStr} = ${unitSum}` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_std_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: "How do you write this fraction as a sum of unit fractions?", style: { fontWeight: 900 } },
      { type: 'latex', content: fractionStr, style: { fontSize: 26, margin: '12px 0' } }
    ],
    options,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_into_unit_fractions',
      variables: { subType: 'standard_mcq', numerator, denominator, seed: params.seed }
    }
  };
}

function generateVisualStripMcq(numerator, denominator, params, random) {
  const fractionStr = fractionLatex(numerator, denominator);
  const questionText = `How do you write ${numerator}/${denominator} as a sum of unit fractions? Use the fraction strips to help.`;
  const stripSvg = buildFractionStripSvg(numerator, denominator, 280);

  const unitSum = Array(numerator).fill(fractionLatex(1, denominator)).join(' + ');

  const correctOption = {
    id: 'opt_correct',
    type: 'latex',
    content: unitSum,
    isCorrect: true
  };

  const distractors = [
    {
      id: 'opt_dist_denom',
      type: 'latex',
      content: Array(numerator).fill(fractionLatex(1, numerator)).join(' + '),
      isCorrect: false
    },
    {
      id: 'opt_dist_whole',
      type: 'latex',
      content: Array(numerator).fill(fractionLatex(1, 2)).join(' + '),
      isCorrect: false
    },
    {
      id: 'opt_dist_off_one',
      type: 'latex',
      content: Array(Math.max(1, numerator - 1)).fill(fractionLatex(1, denominator)).join(' + '),
      isCorrect: false
    }
  ];

  const options = [correctOption, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'remember',
      parts: [
        { type: 'text', content: "A unit fraction has a numerator of 1.", style: { fontWeight: 800 } }
      ]
    },
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `This model shows 1 whole divided into ${denominator} equal parts. Each equal part shows the unit fraction $${fractionLatex(1, denominator)}$.` },
        {
          type: 'group',
          direction: 'row',
          style: { justifyContent: 'center', margin: '10px 0' },
          parts: [{ type: 'svg', content: stripSvg }]
        },
        { type: 'text', content: `Together, ${numerator} of the $${fractionLatex(1, denominator)}$ parts make $${fractionStr}$.` },
        { type: 'text', content: "So, this is how you write the fraction as a sum of unit fractions:", style: { marginTop: 10 } },
        { type: 'latex', content: `${unitSum}` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_vis_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: `How do you write $${fractionStr}$ as a sum of unit fractions? Use the fraction strips to help.`, style: { fontWeight: 900 } },
      { type: 'svg', content: stripSvg }
    ],
    options,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_into_unit_fractions',
      variables: { subType: 'visual_strip_mcq', numerator, denominator, seed: params.seed }
    }
  };
}

function generateCountUnitFractions(numerator, denominator, params, random) {
  const fractionStr = fractionLatex(numerator, denominator);
  const questionText = `How many ${fractionLatex(1, denominator)} pieces make ${fractionStr}?`;

  const correctOption = {
    id: 'opt_correct',
    type: 'text',
    content: String(numerator),
    isCorrect: true
  };

  const distractors = [
    {
      id: 'opt_dist_off_one',
      type: 'text',
      content: String(numerator + 1),
      isCorrect: false
    },
    {
      id: 'opt_dist_denom',
      type: 'text',
      content: String(denominator),
      isCorrect: false
    },
    {
      id: 'opt_dist_sub',
      type: 'text',
      content: String(Math.max(1, numerator - 1)),
      isCorrect: false
    }
  ];

  const options = [correctOption, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `The numerator of $${fractionStr}$ is ${numerator}, which tells us the number of parts.` },
        { type: 'text', content: `The denominator is ${denominator}, which tells us each piece is $${fractionLatex(1, denominator)}$.` },
        { type: 'latex', content: `${fractionStr} = ${numerator} \\times ${fractionLatex(1, denominator)}` },
        { type: 'text', content: `So, there are exactly ${numerator} pieces of size $${fractionLatex(1, denominator)}$.` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_count_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'row', parts: [
        { type: 'text', content: "How many ", style: { fontWeight: 900, fontSize: 18 } },
        { type: 'latex', content: fractionLatex(1, denominator) },
        { type: 'text', content: " pieces make ", style: { fontWeight: 900, fontSize: 18 } },
        { type: 'latex', content: fractionStr },
        { type: 'text', content: "?", style: { fontWeight: 900, fontSize: 18 } }
      ]}
    ],
    options,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_count_unit_fraction_pieces',
      variables: { subType: 'count_unit_fractions', numerator, denominator, seed: params.seed }
    }
  };
}

function generateMissingUnitFraction(numerator, denominator, params, random) {
  const fractionStr = fractionLatex(numerator, denominator);
  const questionText = `Find the missing fraction to complete the sum.`;

  // Draw equation like: 4/7 = 1/7 + 1/7 + ▢ + 1/7
  const sumTerms = Array(numerator).fill(fractionLatex(1, denominator));
  const missingIdx = Math.floor(random() * numerator);
  sumTerms[missingIdx] = '\\square';

  const equationStr = `${fractionStr} = ${sumTerms.join(' + ')}`;

  const correctOption = {
    id: 'opt_correct',
    type: 'latex',
    content: fractionLatex(1, denominator),
    isCorrect: true
  };

  const distractors = [
    {
      id: 'opt_dist_whole',
      type: 'latex',
      content: fractionLatex(1, numerator),
      isCorrect: false
    },
    {
      id: 'opt_dist_half',
      type: 'latex',
      content: fractionLatex(1, 2),
      isCorrect: false
    },
    {
      id: 'opt_dist_num',
      type: 'latex',
      content: fractionStr,
      isCorrect: false
    }
  ];

  const options = [correctOption, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `To make the fraction $${fractionStr}$, we decompose it into exactly ${numerator} equal unit fractions of size $${fractionLatex(1, denominator)}$.` },
        { type: 'latex', content: `${fractionStr} = ${Array(numerator).fill(fractionLatex(1, denominator)).join(' + ')}` },
        { type: 'text', content: `The missing term in the box is $${fractionLatex(1, denominator)}$.` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_missing_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: "Find the missing fraction to make the equation true:", style: { fontWeight: 900 } },
      { type: 'latex', content: equationStr, style: { fontSize: 24, margin: '14px 0' } }
    ],
    options,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_missing_unit_fraction',
      variables: { subType: 'missing_unit_fraction', numerator, denominator, seed: params.seed }
    }
  };
}

function generateTrueOrFalse(numerator, denominator, params, random) {
  const isCorrectTrue = random() > 0.5;
  let equationStr = '';
  const fractionStr = fractionLatex(numerator, denominator);
  
  if (isCorrectTrue) {
    equationStr = `${fractionStr} = ${Array(numerator).fill(fractionLatex(1, denominator)).join(' + ')}`;
  } else {
    // Generate a wrong sum (e.g. off by one count, or wrong denominator)
    const wrongType = random() > 0.5 ? 'count' : 'denom';
    if (wrongType === 'count') {
      const wrongCount = random() > 0.5 ? numerator + 1 : Math.max(1, numerator - 1);
      equationStr = `${fractionStr} = ${Array(wrongCount).fill(fractionLatex(1, denominator)).join(' + ')}`;
    } else {
      equationStr = `${fractionStr} = ${Array(numerator).fill(fractionLatex(1, numerator)).join(' + ')}`;
    }
  }

  const questionText = `Is the equation true or false?`;

  const options = [
    { id: 'opt_true', type: 'text', content: 'True', isCorrect: isCorrectTrue },
    { id: 'opt_false', type: 'text', content: 'False', isCorrect: !isCorrectTrue }
  ];

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `Let's write $${fractionStr}$ as a sum of unit fractions:` },
        { type: 'latex', content: `${fractionStr} = ${Array(numerator).fill(fractionLatex(1, denominator)).join(' + ')}` },
        { type: 'text', content: `Looking at the equation shown, the statement is ${isCorrectTrue ? 'True' : 'False'}.` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_tf_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: "Is the equation true or false?", style: { fontWeight: 900 } },
      { type: 'latex', content: equationStr, style: { fontSize: 24, margin: '14px 0' } }
    ],
    options,
    correctAnswerId: options[correctIdx].id,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_into_unit_fractions',
      variables: { subType: 'true_or_false', numerator, denominator, seed: params.seed }
    }
  };
}

function generateErrorAnalysis(numerator, denominator, params, random) {
  const questionText = `Identify the student's mistake.`;
  const fractionStr = fractionLatex(numerator, denominator);

  const errorType = random() > 0.5 ? 'denom' : 'num';
  let equationStr = '';
  let correctExplanation = '';
  let correctLabel = '';
  
  if (errorType === 'denom') {
    equationStr = `${fractionStr} = ${Array(numerator).fill(fractionLatex(1, numerator)).join(' + ')}`;
    correctExplanation = `The student used the numerator ${numerator} as the denominator of the unit fractions. The denominator should remain ${denominator}.`;
    correctLabel = 'Wrong denominator';
  } else {
    equationStr = `${fractionStr} = ${Array(denominator).fill(fractionLatex(1, numerator)).join(' + ')}`;
    correctExplanation = `The student confused the numerator and denominator and wrote too many unit fractions.`;
    correctLabel = 'Wrong count of fractions';
  }

  const correctOption = {
    id: 'opt_correct',
    type: 'text',
    content: correctLabel,
    isCorrect: true
  };

  const distractors = [
    {
      id: 'opt_dist_1',
      type: 'text',
      content: errorType === 'denom' ? 'Wrong count of fractions' : 'Wrong denominator',
      isCorrect: false
    },
    {
      id: 'opt_dist_2',
      type: 'text',
      content: 'Fractions should multiply',
      isCorrect: false
    },
    {
      id: 'opt_dist_3',
      type: 'text',
      content: 'Too many parts shaded',
      isCorrect: false
    }
  ];

  const options = [correctOption, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `The correct decomposition is:` },
        { type: 'latex', content: `${fractionStr} = ${Array(numerator).fill(fractionLatex(1, denominator)).join(' + ')}` },
        { type: 'text', content: correctExplanation, style: { marginTop: 10 } }
      ]
    }
  ];

  return {
    id: `q_unit_frac_err_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: "A student writes this equation:", style: { color: '#475569' } },
      { type: 'latex', content: equationStr, style: { fontSize: 24, margin: '10px 0' } },
      { type: 'text', content: "What is the mistake?", style: { fontWeight: 900, marginTop: 12 } }
    ],
    options,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_error_analysis',
      variables: { subType: 'error_analysis', numerator, denominator, seed: params.seed }
    }
  };
}

function generateSelectAll(numerator, denominator, params, random) {
  const questionText = `Which expressions equal ${fractionLatex(numerator, denominator)}? Select all that apply.`;
  const fractionStr = fractionLatex(numerator, denominator);

  const unitSum = Array(numerator).fill(fractionLatex(1, denominator)).join(' + ');

  const rawOptions = [
    { id: 'opt_correct_1', content: unitSum, isCorrect: true, type: 'latex' },
    { id: 'opt_correct_2', content: fractionStr, isCorrect: true, type: 'latex' },
    { id: 'opt_dist_1', content: Array(numerator).fill(fractionLatex(1, numerator)).join(' + '), isCorrect: false, type: 'latex' },
    { id: 'opt_dist_2', content: Array(denominator).fill(fractionLatex(1, denominator)).join(' + '), isCorrect: false, type: 'latex' }
  ];

  for (let i = rawOptions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
  }

  const correctIdx = rawOptions.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `Let's find the values of each option:` },
        { type: 'text', content: `Decomposing $${fractionStr}$ gives:` },
        { type: 'latex', content: `${unitSum} = ${fractionStr}` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_sel_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'row', parts: [
        { type: 'text', content: "Which expression equals ", style: { fontWeight: 900 } },
        { type: 'latex', content: fractionStr },
        { type: 'text', content: "?", style: { fontWeight: 900 } }
      ]}
    ],
    options: rawOptions.map(opt => ({ ...opt, label: opt.content })),
    correctAnswerId: rawOptions[correctIdx].id,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_select_all_sums',
      variables: { subType: 'select_all', numerator, denominator, seed: params.seed }
    }
  };
}

function generateBuildFromWords(numerator, denominator, params, random) {
  const numberWords = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten', 'eleven', 'twelve'];
  const ordinalWords = {
    2: 'half', 3: 'third', 4: 'fourth', 5: 'fifth', 6: 'sixth', 7: 'seventh', 8: 'eighth', 9: 'ninth', 10: 'tenth'
  };

  const wordNum = numberWords[numerator];
  const wordDenom = ordinalWords[denominator] + (numerator > 1 ? 's' : '');

  const questionText = `Write ${wordNum} ${wordDenom} as a fraction.`;
  const fractionStr = fractionLatex(numerator, denominator);

  const correctOption = {
    id: 'opt_correct',
    type: 'latex',
    content: fractionStr,
    isCorrect: true
  };

  const distractors = [
    {
      id: 'opt_dist_rev',
      type: 'latex',
      content: fractionLatex(denominator, numerator),
      isCorrect: false
    },
    {
      id: 'opt_dist_unit',
      type: 'latex',
      content: fractionLatex(1, denominator),
      isCorrect: false
    },
    {
      id: 'opt_dist_num',
      type: 'latex',
      content: fractionLatex(1, numerator),
      isCorrect: false
    }
  ];

  const options = [correctOption, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `"${wordNum} ${wordDenom}" means we have exactly ${numerator} pieces of size $${fractionLatex(1, denominator)}$.` },
        { type: 'latex', content: `${numerator} \\times ${fractionLatex(1, denominator)} = ${fractionStr}` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_word_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: `Write ${wordNum} ${wordDenom} as a fraction:`, style: { fontWeight: 900, fontSize: 18 } }
    ],
    options,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_build_from_words',
      variables: { subType: 'build_from_words', numerator, denominator, seed: params.seed }
    }
  };
}

function generatePuzzleStyle(numerator, denominator, params, random) {
  const ordinalSingular = {
    2: 'half', 3: 'one-third', 4: 'one-fourth', 5: 'one-fifth', 6: 'one-sixth', 7: 'one-seventh', 8: 'one-eighth', 9: 'one-ninth', 10: 'one-tenth'
  };

  const pieceName = ordinalSingular[denominator];
  const fractionStr = fractionLatex(numerator, denominator);
  const questionText = `I used ${numerator} equal unit fractions. Each one is a ${pieceName}. What fraction did I make?`;

  const correctOption = {
    id: 'opt_correct',
    type: 'latex',
    content: fractionStr,
    isCorrect: true
  };

  const distractors = [
    {
      id: 'opt_dist_rev',
      type: 'latex',
      content: fractionLatex(denominator, numerator),
      isCorrect: false
    },
    {
      id: 'opt_dist_unit',
      type: 'latex',
      content: fractionLatex(1, denominator),
      isCorrect: false
    },
    {
      id: 'opt_dist_add',
      type: 'latex',
      content: fractionLatex(numerator - 1, denominator),
      isCorrect: false
    }
  ];

  const options = [correctOption, ...distractors];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `We are adding ${numerator} unit fractions of size $${fractionLatex(1, denominator)}$:` },
        { type: 'latex', content: `${Array(numerator).fill(fractionLatex(1, denominator)).join(' + ')} = ${fractionStr}` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_puz_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'row', parts: [
        { type: 'text', content: `I used ${numerator} equal unit fractions. Each one is `, style: { color: '#475569' } },
        { type: 'latex', content: fractionLatex(1, denominator) },
        { type: 'text', content: ".", style: { color: '#475569' } }
      ]},
      { type: 'text', content: "What fraction did I make?", style: { fontWeight: 900, marginTop: 8 } }
    ],
    options,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_puzzle_style',
      variables: { subType: 'puzzle_style', numerator, denominator, seed: params.seed }
    }
  };
}

function generateFillInTheBlank(numerator, denominator, params, random) {
  const questionText = `Find the missing fraction to make the equation true.`;
  const fractionStr = fractionLatex(numerator, denominator);

  // 4/6 = 1/6 + 1/6 + 1/6 + ?
  const sumTerms = Array(numerator - 1).fill(fractionLatex(1, denominator));
  
  const equationStr = `${fractionStr} = ${sumTerms.join(' + ')} + \\square`;

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: `To write $${fractionStr}$ as a sum of unit fractions, we add the unit fraction $${fractionLatex(1, denominator)}$ exactly ${numerator} times.` },
        { type: 'latex', content: `${fractionStr} = ${Array(numerator).fill(fractionLatex(1, denominator)).join(' + ')}` },
        { type: 'text', content: `Comparing both sides, the missing unit fraction in the box is $${fractionLatex(1, denominator)}$.` }
      ]
    }
  ];

  return {
    id: `q_unit_frac_blank_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: "Decompose this fraction. Find the missing unit fraction:", style: { fontWeight: 900 } },
      { type: 'latex', content: equationStr, style: { fontSize: 24, margin: '14px 0' } },
      { type: 'input', id: 'ans', size: 'small', isVertical: true }
    ],
    correctAnswerText: JSON.stringify({ ans: `1/${denominator}` }),
    validation: { type: 'exact', answer: { ans: `1/${denominator}` } },
    solution,
    adaptiveConfig: {
      logic_type: 'fractions_decompose_missing_unit_fraction',
      variables: { subType: 'fill_in_the_blank', numerator, denominator, seed: params.seed }
    }
  };
}
