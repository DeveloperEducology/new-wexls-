/**
 * Number Lines Engine Family
 * Powers: Graph fractions, identify fractions from number line, equivalent fractions on number line.
 * Configured via engineParams.
 */

import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';
import { buildNumberLineSvg, buildEquivalentNumberLinesSvg } from '../shared/svgLibrary/numberLines.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const numberLinesEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  
  // Resolve variables
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  
  // Combine engine params with any overrides from DB
  const params = {
    ...engineParams,
    ...resolvedVars
  };

  // Setup seeded random
  const seed = params.seed || `number_line_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'identify_point';

  if (subType === 'identify_point') {
    return generateIdentifyPoint(params, random);
  } else if (subType === 'graph_fraction_mcq') {
    return generateGraphFractionMCQ(params, random);
  } else if (subType === 'equivalence_number_line') {
    return generateEquivalenceNumberLine(params, random);
  } else {
    throw new Error(`[NumberLinesEngine] Unsupported subType: ${subType}`);
  }
};

// ============================================================================
// Core Generator Logics
// ============================================================================

function generateIdentifyPoint(params, random) {
  // Extract parameters
  const min = params.min || 0;
  const max = params.max || 1;
  const denominatorPool = params.denominatorPool || [2, 3, 4, 5, 6, 8, 10];
  const denominator = params.denominator || denominatorPool[Math.floor(random() * denominatorPool.length)];
  
  const totalSegments = (max - min) * denominator;
  // Pick a random point that is NOT min or max (optional, but better for practice)
  const numerator = params.numerator || getRandomInt(1, totalSegments - 1, random);
  
  const fractionLabel = `${numerator}/${denominator}`;
  const pointName = params.pointName || 'A';
  const questionText = params.questionText || `Which fraction represents point ${pointName} on the number line?`;

  const numberLineSvg = buildNumberLineSvg({
    min,
    max,
    denominator,
    showLabels: params.showLabels === undefined ? false : params.showLabels, // Usually false for this question type
    showTickMarks: true,
    markedPoints: [
      { numerator, label: pointName, color: '#ef4444', size: 10 }
    ],
    width: 700
  });

  // Distractors
  const distractors = new Set();
  while (distractors.size < 3) {
      const dNum = getRandomInt(1, totalSegments, random);
      const dDenom = [denominator, denominator * 2, denominator === 2 ? 4 : denominator === 4 ? 2 : denominator][Math.floor(random() * 3)];
      
      const dVal = dNum / dDenom;
      const cVal = numerator / denominator;
      
      if (Math.abs(dVal - cVal) > 0.01) { // Avoid exact equivalents
         distractors.add(`${dNum}/${dDenom}`);
      }
  }

  const rawOptions = [
    { id: 'opt_correct', content: fractionLabel, isCorrect: true, type: 'text' },
    ...Array.from(distractors).map((d, i) => ({ id: `opt_distractor_${i}`, content: d, isCorrect: false, type: 'text' }))
  ];

  // Shuffle
  for (let i = rawOptions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
  }

  const correctIdx = rawOptions.findIndex((o) => o.id === 'opt_correct');

  return {
    id: `q_frac_nl_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: numberLineSvg }
    ],
    options: rawOptions,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    isGrid: true,
    layoutConfig: { columns: 2, gap: '1rem' },
    adaptiveConfig: {
      logic_type: params.logic_type || 'number_lines_identify',
      variables: {
        numerator,
        denominator,
        min,
        max,
        seed: params.seed
      }
    }
  };
}

function generateGraphFractionMCQ(params, random) {
    const min = params.min || 0;
    const max = params.max || 1;
    const denominatorPool = params.denominatorPool || [2, 3, 4, 5, 6, 8];
    const denominator = params.denominator || denominatorPool[Math.floor(random() * denominatorPool.length)];
    
    const totalSegments = (max - min) * denominator;
    const numerator = params.numerator || getRandomInt(1, totalSegments - 1, random);
    
    const fractionLabel = `${numerator}/${denominator}`;
    const questionText = params.questionText || `Which number line correctly shows the fraction ${fractionLabel}?`;
  
    // Correct Option
    const correctSvg = buildNumberLineSvg({
        min, max, denominator, showLabels: false,
        markedPoints: [{ numerator, color: '#3b82f6', size: 10 }],
        width: 400, height: 100
    });

    // Distractor 1: Off by one tick
    const offset = random() > 0.5 ? 1 : -1;
    let distractor1Num = numerator + offset;
    if (distractor1Num <= 0) distractor1Num = 2;
    if (distractor1Num >= totalSegments) distractor1Num = totalSegments - 1;
    
    const distractor1Svg = buildNumberLineSvg({
        min, max, denominator, showLabels: false,
        markedPoints: [{ numerator: distractor1Num, color: '#3b82f6', size: 10 }],
        width: 400, height: 100
    });

    // Distractor 2: Numerator as denominator logic (e.g. 3/4 -> mark at 4/3 if possible, or just random)
    let distractor2Num = Math.floor(totalSegments / 2);
    if (distractor2Num === numerator) distractor2Num++;
    
    const distractor2Svg = buildNumberLineSvg({
        min, max, denominator, showLabels: false,
        markedPoints: [{ numerator: distractor2Num, color: '#3b82f6', size: 10 }],
        width: 400, height: 100
    });

    const rawOptions = [
      { id: 'opt_correct', content: correctSvg, isCorrect: true, type: 'svg' },
      { id: 'opt_distractor_1', content: distractor1Svg, isCorrect: false, type: 'svg' },
      { id: 'opt_distractor_2', content: distractor2Svg, isCorrect: false, type: 'svg' },
    ];
  
    // Shuffle
    for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
    }
  
    const correctIdx = rawOptions.findIndex((o) => o.id === 'opt_correct');
  
    return {
      id: `q_frac_nl_graph_${uid()}`,
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: rawOptions,
      correctAnswerId: 'opt_correct',
      correctAnswerIndex: correctIdx,
      isGrid: false,
      layoutConfig: { columns: 1, gap: '1.5rem' },
      adaptiveConfig: {
        logic_type: params.logic_type || 'number_lines_graph',
        variables: { numerator, denominator, seed: params.seed }
      }
    };
}

function generateEquivalenceNumberLine(params, random) {
  const baseFractions = [
    { num: 1, den: 2 },
    { num: 1, den: 3 },
    { num: 2, den: 3 },
    { num: 1, den: 4 },
    { num: 3, den: 4 },
    { num: 1, den: 5 },
    { num: 2, den: 5 },
    { num: 3, den: 5 },
    { num: 4, den: 5 }
  ];
  
  const base = baseFractions[Math.floor(random() * baseFractions.length)];
  const num1 = base.num;
  const denom1 = base.den;
  
  const isEquivalent = random() > 0.5;
  
  let num2, denom2;
  
  if (isEquivalent) {
    const k = random() > 0.5 ? 2 : 3;
    num2 = num1 * k;
    denom2 = denom1 * k;
  } else {
    const k = random() > 0.5 ? 2 : 3;
    denom2 = denom1 * k;
    
    const target = num1 * k;
    const offset = random() > 0.5 ? 1 : -1;
    num2 = target + offset;
    
    if (num2 <= 0) num2 = target + 1;
    if (num2 >= denom2) num2 = target - 1;
    
    if (Math.abs((num1 / denom1) - (num2 / denom2)) < 0.001) {
      num2 = (num1 * k) + 1;
    }
  }

  const cleanQuestionText = `Is ${num1}/${denom1} equivalent to ${num2}/${denom2}?`;

  const questionSvg = buildEquivalentNumberLinesSvg({
    min: 0,
    max: 1,
    denom1,
    num1,
    denom2,
    num2,
    highlight: false
  });

  const solutionSvg = buildEquivalentNumberLinesSvg({
    min: 0,
    max: 1,
    denom1,
    num1,
    denom2,
    num2,
    highlight: true
  });

  const options = [
    { id: 'opt_yes', content: 'yes', isCorrect: isEquivalent, type: 'text' },
    { id: 'opt_no', content: 'no', isCorrect: !isEquivalent, type: 'text' }
  ];

  const answer = isEquivalent ? 'opt_yes' : 'opt_no';
  const correctAnswerIndex = isEquivalent ? 0 : 1;

  const fraction1Str = `${num1}/${denom1}`;
  const fraction2Str = `${num2}/${denom2}`;

  const solutionText = isEquivalent 
    ? `Both number lines show numbers between 0 and 1. **${fraction1Str}** and **${fraction2Str}** are at the same place between 0 and 1 on the number line.`
    : `Both number lines show numbers between 0 and 1. **${fraction1Str}** and **${fraction2Str}** are at different places between 0 and 1 on the number line.`;

  const concludingText = isEquivalent
    ? `**${fraction1Str}** and **${fraction2Str}** are equivalent fractions.`
    : `**${fraction1Str}** and **${fraction2Str}** are **not** equivalent fractions.`;

  return {
    id: `q_frac_eq_nl_${uid()}`,
    type: 'mcq',
    questionText: cleanQuestionText,
    parts: [
      { type: 'text', content: cleanQuestionText, isVertical: true, style: { fontSize: '24px', fontWeight: 600, marginBottom: '1rem' } },
      { type: 'svg', content: questionSvg, isVertical: true, style: { maxWidth: '700px', margin: '0 auto 1.5rem' } }
    ],
    options,
    correctAnswerId: answer,
    correctAnswerIndex,
    isGrid: true,
    layoutConfig: { columns: 2, gap: '1rem' },
    solution: {
      sections: [
        { type: 'text', content: 'Equivalent fractions are at the same place on a number line.' },
        { type: 'text', content: solutionText },
        { type: 'svg', content: solutionSvg },
        { type: 'text', content: concludingText }
      ]
    },
    adaptiveConfig: {
      logic_type: params.logic_type || 'equivalence_number_line',
      variables: {
        num1,
        denom1,
        num2,
        denom2,
        isEquivalent,
        seed: params.seed
      }
    }
  };
}

