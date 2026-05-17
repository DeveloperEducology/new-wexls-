/**
 * Conversions Engine Family
 * Powers: Decimal to Fraction, Decimal to Mixed Number, etc.
 */

import { createSeededRandom, getRandomInt, simplifyFraction } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const conversionsEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `conv_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'decimal_to_mixed';

  if (subType === 'decimal_to_mixed' || subType === 'decimal_to_fraction') {
    return generateDecimalToFraction(params, random);
  } else if (subType === 'fraction_to_decimal') {
    return generateFractionToDecimal(params, random);
  } else {
    throw new Error(`[ConversionsEngine] Unsupported subType: ${subType}`);
  }
};

function generateFractionToDecimal(params, random) {
  const complexity = params.complexity || 'simple';
  const type = params.type || 'mcq';

  // Pool of conversion pairs
  const pairs = [
    { n: 1, d: 2, dec: '0.5' },
    { n: 1, d: 4, dec: '0.25' },
    { n: 3, d: 4, dec: '0.75' },
    { n: 1, d: 5, dec: '0.2' },
    { n: 2, d: 5, dec: '0.4' },
    { n: 4, d: 5, dec: '0.8' },
    { n: 1, d: 10, dec: '0.1' },
    { n: 1, d: 8, dec: '0.125' },
    { n: 1, d: 20, dec: '0.05' },
    { n: 1, d: 25, dec: '0.04' },
    { n: 1, d: 50, dec: '0.02' }
  ];

  const pair = pairs[getRandomInt(0, pairs.length - 1, random)];
  const whole = complexity === 'simple' ? 0 : getRandomInt(1, 10, random);
  const decimalValue = (whole + parseFloat(pair.dec)).toString();

  const questionText = whole === 0 
    ? `How do you write $$\\frac{${pair.n}}{${pair.d}}$$ as a decimal?`
    : `How do you write $${whole} \\frac{${pair.n}}{${pair.d}}$$ as a decimal?`;

  if (type === 'mcq') {
    const distractors = [];
    while (distractors.length < 3) {
      const dVal = (whole + parseFloat(pairs[getRandomInt(0, pairs.length - 1, random)].dec) + (random() > 0.8 ? 0.1 : 0)).toFixed(random() > 0.5 ? 2 : 1);
      if (dVal !== decimalValue && !distractors.includes(dVal)) distractors.push(dVal);
    }

    const options = [
      { id: 'opt1', type: 'text', content: decimalValue, isCorrect: true },
      ...distractors.map((d, i) => ({ id: `opt${i+2}`, type: 'text', content: d, isCorrect: false }))
    ].sort(() => random() - 0.5);

    return {
      id: `q_conv_frac_dec_${uid()}`,
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText, isVertical: true }],
      options,
      correctAnswerId: options.find(o => o.isCorrect).id,
      solution: [
        {
          type: 'section',
          parts: [
            { type: 'text', content: `To convert a fraction to a decimal, divide the numerator by the denominator.` },
            { type: 'text', content: `$$\\frac{${pair.n}}{${pair.d}} = ${pair.dec}$$` },
            { type: 'text', content: `The final answer is **${decimalValue}**.` }
          ]
        }
      ]
    };
  } else {
    return {
      id: `q_conv_frac_dec_fib_${uid()}`,
      type: 'fillInTheBlank',
      questionText,
      parts: [
        { type: 'text', content: questionText, isVertical: true },
        { type: 'input', id: 'ans', size: 'small' }
      ],
      correctAnswerText: JSON.stringify({ ans: decimalValue }),
      validation: { type: 'exact', answer: { ans: decimalValue } },
      solution: [
        {
          type: 'section',
          parts: [
            { type: 'text', content: `The decimal value of $\\frac{${pair.n}}{${pair.d}}$ is ${pair.dec}.` },
            { type: 'text', content: `Adding the whole number **${whole}** gives **${decimalValue}**.` }
          ]
        }
      ]
    };
  }
}


function generateDecimalToFraction(params, random) {
  const complexity = params.complexity || 'simple'; // simple, medium, hard
  const type = params.type || 'mcq'; // mcq, fillInTheBlank
  
  // Configurable ranges
  const minWhole = params.minWhole !== undefined ? params.minWhole : (complexity === 'simple' ? 0 : (complexity === 'medium' ? 1 : 100));
  const maxWhole = params.maxWhole !== undefined ? params.maxWhole : (complexity === 'simple' ? 0 : (complexity === 'medium' ? 20 : 999));
  
  const whole = getRandomInt(minWhole, maxWhole, random);
  
  // Common fractions for decimals
  const fractionPool = [
    { n: 1, d: 2, dec: 0.5 },
    { n: 1, d: 4, dec: 0.25 },
    { n: 3, d: 4, dec: 0.75 },
    { n: 1, d: 5, dec: 0.2 },
    { n: 2, d: 5, dec: 0.4 },
    { n: 3, d: 5, dec: 0.6 },
    { n: 4, d: 5, dec: 0.8 },
    { n: 1, d: 10, dec: 0.1 },
    { n: 3, d: 10, dec: 0.3 },
    { n: 7, d: 10, dec: 0.7 },
    { n: 9, d: 10, dec: 0.9 },
    { n: 1, d: 8, dec: 0.125 },
    { n: 3, d: 8, dec: 0.375 },
    { n: 1, d: 20, dec: 0.05 },
    { n: 1, d: 25, dec: 0.04 },
    { n: 1, d: 100, dec: 0.01 },
  ];

  // If complexity is hard, allow more random decimals
  let f;
  if (complexity === 'hard' && random() > 0.5) {
    const d = random() > 0.5 ? 100 : 50;
    const n = getRandomInt(1, d - 1, random);
    const simplified = simplifyFraction(n, d);
    f = { n: simplified.n, d: simplified.d, dec: n / d };
  } else {
    f = fractionPool[getRandomInt(0, fractionPool.length - 1, random)];
  }

  const decimalValue = (whole + f.dec).toString();
  const decimalLabel = (whole + f.dec).toFixed(f.dec.toString().split('.')[1]?.length || 1);

  const questionText = whole === 0 
    ? `How do you write ${decimalLabel} as a fraction?`
    : `How do you write ${decimalLabel} as a mixed number?`;

  const correctAnswer = {
    whole: whole > 0 ? whole : null,
    n: f.n,
    d: f.d
  };

  const formatMixed = (w, n, d) => {
    if (w) return `${w} \\frac{${n}}{${d}}`;
    return `\\frac{${n}}{${d}}`;
  };

  if (type === 'mcq') {
    // Generate distractors
    const distractors = [];
    while (distractors.length < 3) {
      const dw = whole > 0 ? (random() > 0.8 ? whole + getRandomInt(-1, 1, random) : whole) : 0;
      const df = fractionPool[getRandomInt(0, fractionPool.length - 1, random)];
      
      if (dw === whole && df.n === f.n && df.d === f.d) continue;
      
      const dStr = formatMixed(dw > 0 ? dw : null, df.n, df.d);
      if (!distractors.includes(dStr)) distractors.push(dStr);
    }

    const options = [
      { id: 'opt1', type: 'latex', content: formatMixed(correctAnswer.whole, correctAnswer.n, correctAnswer.d), isCorrect: true },
      ...distractors.map((d, i) => ({ id: `opt${i+2}`, type: 'latex', content: d, isCorrect: false }))
    ].sort(() => random() - 0.5);

    return {
      id: `q_conv_dec_${uid()}`,
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText, isVertical: true }],
      options,
      correctAnswerId: options.find(o => o.isCorrect).id,
      solution: [
        {
          type: 'section',
          label: 'solve',
          parts: [
            { type: 'text', content: `To convert ${decimalLabel} to a fraction:` },
            { type: 'text', content: `1. The digits after the decimal point represent the fractional part.` },
            { type: 'text', content: `2. ${decimalLabel} is equal to ${whole > 0 ? `${whole} and ` : ''} ${f.dec}.` },
            { type: 'text', content: `3. ${f.dec} can be written as $${formatMixed(null, f.n, f.d)}$.` },
            { type: 'text', content: `The final answer is $${formatMixed(correctAnswer.whole, correctAnswer.n, correctAnswer.d)}$.` }
          ]
        }
      ],
      adaptiveConfig: {
        logic_type: params.logic_type || 'conversions_decimal_to_mixed',
        variables: { whole, n: f.n, d: f.d, decimalLabel, seed: params.seed }
      }
    };
  } else {
    // Fill in the blank
    // For simplicity in this demo, let's use a single input that accepts "whole n/d" or similar
    // But ideally we want the interactive mixed fraction layout.
    
    const questionParts = [
      { type: 'text', content: questionText, isVertical: true },
      {
        type: 'group',
        direction: 'row',
        style: { marginTop: '20px', alignItems: 'center', gap: '0.5rem' },
        parts: [
          whole > 0 ? { type: 'input', id: 'w', size: 'small' } : null,
          {
            type: 'fraction',
            numerator: { type: 'input', id: 'n', size: 'small' },
            denominator: { type: 'input', id: 'd', size: 'small' }
          }
        ].filter(Boolean)
      }
    ];

    const ansObj = whole > 0 ? { w: String(whole), n: String(f.n), d: String(f.d) } : { n: String(f.n), d: String(f.d) };

    return {
      id: `q_conv_dec_fib_${uid()}`,
      type: 'fillInTheBlank',
      questionText,
      parts: questionParts,
      correctAnswerText: JSON.stringify(ansObj),
      validation: { type: 'exact', answer: ansObj },
      solution: [
        {
          type: 'section',
          label: 'solve',
          parts: [
            { type: 'text', content: `The decimal ${decimalLabel} consists of a whole number part **${whole}** and a decimal part **${f.dec}**.` },
            { type: 'text', content: `Converting ${f.dec} to a fraction gives $${formatMixed(null, f.n, f.d)}$.` },
            { type: 'text', content: `So, the mixed number is $${formatMixed(correctAnswer.whole, correctAnswer.n, correctAnswer.d)}$.` }
          ]
        }
      ],
      adaptiveConfig: {
        logic_type: params.logic_type || 'conversions_decimal_to_mixed',
        variables: { whole, n: f.n, d: f.d, decimalLabel, seed: params.seed }
      }
    };
  }
}
