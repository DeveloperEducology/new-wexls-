/**
 * Rational Numbers Engine Family
 * Powers: Add, Subtract, Multiply, Divide, Compare, Order, Powers, Conversions
 */

import { createSeededRandom, getRandomInt, simplifyFraction } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const rationalNumbersEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `rat_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType;

  switch(subType) {
    case 'add-and-subtract-rational-numbers':
      return generateAddSubtract(params, random);
    case 'add-and-subtract-rational-numbers-word-problems':
      return generateAddSubtractWordProblems(params, random);
    case 'compare-rational-numbers':
      return generateCompare(params, random);
    case 'convert-between-decimals-and-fractions-or-mixed-numbers':
      return generateConvertDecimalsFractions(params, random);
    case 'convert-between-percents-fractions-and-decimals':
      return generateConvertPercents(params, random);
    case 'evaluate-numerical-expressions-involving-rational-numbers':
      return generateEvaluateExpressions(params, random);
    case 'multiply-and-divide-rational-numbers':
      return generateMultiplyDivide(params, random);
    case 'multiply-and-divide-rational-numbers-word-problems':
      return generateMultiplyDivideWordProblems(params, random);
    case 'powers-with-decimal-and-fractional-bases':
      return generatePowers(params, random);
    case 'put-rational-numbers-in-order':
      return generateOrder(params, random);
    case 'reciprocals-and-multiplicative-inverses':
      return generateReciprocals(params, random);
    case 'round-decimals-and-mixed-numbers':
      return generateRounding(params, random);
    default:
      throw new Error(`[RationalNumbersEngine] Unsupported subType: ${subType}`);
  }
};

function generateAddSubtract(params, random) {
  const complexity = params.complexity || 'simple';
  const maxWhole = params.maxWhole || (complexity === 'hard' ? 10 : 0);
  const denomPool = params.denominatorPool || [2, 3, 4, 5, 6, 8, 10, 12];
  
  const d1 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n1 = getRandomInt(1, d1 * (maxWhole || 1), random);
  const d2 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n2 = getRandomInt(1, d2 * (maxWhole || 1), random);
  
  // Decide whether to format as mixed numbers or improper fractions
  const formatFraction = (n, d) => {
    if (n > d && maxWhole > 0) {
      const w = Math.floor(n / d);
      const rem = n % d;
      if (rem === 0) return String(w);
      return `${w} \\frac{${rem}}{${d}}`;
    }
    return `\\frac{${n}}{${d}}`;
  };
  
  const isAdd = params.forceOp === 'add' ? true : (params.forceOp === 'sub' ? false : random() > 0.5);
  const op = isAdd ? '+' : '-';
  const questionText = isAdd ? 'Add.' : 'Subtract.';
  
  return {
    id: `q_rat_addsub_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      {
        type: 'group',
        direction: 'row',
        style: { alignItems: 'center', gap: '0.75rem', marginTop: '20px' },
        parts: [
          { type: 'latex', content: formatFraction(n1, d1) },
          { type: 'text', content: op, style: { fontSize: '24px' } },
          { type: 'latex', content: formatFraction(n2, d2) },
          { type: 'text', content: '=', style: { fontSize: '24px' } },
          { type: 'input', id: 'ans', size: 'small' }
        ]
      }
    ],
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }),
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generateAddSubtractWordProblems(params, random) {
  const maxWhole = params.maxWhole || 5;
  const denomPool = params.denominatorPool || [2, 3, 4, 5, 8, 10];
  
  const isAdd = random() > 0.5;
  const item1 = ['pepperoni', 'flour', 'sugar', 'paint', 'water'][getRandomInt(0, 4, random)];
  const item2 = ['sausage', 'butter', 'salt', 'primer', 'juice'][getRandomInt(0, 4, random)];
  
  const d1 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n1 = getRandomInt(1, d1 * maxWhole, random);
  const d2 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n2 = getRandomInt(1, d2 * maxWhole, random);
  
  const formatTextFraction = (n, d) => {
    if (n > d) return `${Math.floor(n/d)} ${n%d}/${d}`;
    return `${n}/${d}`;
  };
  
  let questionText;
  if (isAdd) {
    questionText = `A recipe calls for ${formatTextFraction(n1, d1)} of a cup of ${item1} and ${formatTextFraction(n2, d2)} of a cup of ${item2}. How many cups of ingredients is that in total?`;
  } else {
    // Ensure n1/d1 > n2/d2 for subtraction to keep it positive
    const val1 = n1 / d1;
    const val2 = n2 / d2;
    const [lgN, lgD, smN, smD] = val1 > val2 ? [n1, d1, n2, d2] : [n2, d2, n1, d1];
    
    questionText = `A chef used ${formatTextFraction(lgN, lgD)} of a package of ${item1} and ${formatTextFraction(smN, smD)} of a package of ${item2}. How much more ${item1} than ${item2} did the chef use?`;
  }
  
  return {
    id: `q_rat_addsub_wp_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'text', content: 'Simplify your answer and write it as a fraction or as a whole or mixed number.', isVertical: true, style: { fontStyle: 'italic', marginBottom: '1rem' } },
      { type: 'input', id: 'ans', size: 'small' }
    ],
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }),
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generateCompare(params, random) {
  const maxWhole = params.maxWhole || 3;
  const denomPool = params.denominatorPool || [2, 3, 4, 5, 8, 10, 12, 15];
  
  const d1 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n1 = getRandomInt(1, d1 * maxWhole, random);
  const d2 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n2 = getRandomInt(1, d2 * maxWhole, random);
  
  // Option to include negatives
  const allowNegatives = params.allowNegatives !== false; // true by default for Class 8
  const sign1 = (allowNegatives && random() > 0.5) ? -1 : 1;
  const sign2 = (allowNegatives && random() > 0.5) ? -1 : 1;
  
  const val1 = (n1 / d1) * sign1;
  const val2 = (n2 / d2) * sign2;
  
  let correctSign = '=';
  if (val1 > val2) correctSign = '>';
  if (val1 < val2) correctSign = '<';
  
  const formatLatex = (n, d, s) => s === -1 ? `-\\frac{${n}}{${d}}` : `\\frac{${n}}{${d}}`;
  
  return {
    id: `q_rat_comp_${uid()}`,
    type: 'mcq',
    questionText: 'Which sign makes the statement true?',
    parts: [
      { type: 'text', content: 'Which sign makes the statement true?', isVertical: true },
      { 
        type: 'group', direction: 'row', style: { alignItems: 'center', gap: '1rem', marginTop: '1rem', fontSize: '24px' },
        parts: [
          { type: 'latex', content: formatLatex(n1, d1, sign1) },
          { type: 'text', content: '?', style: { display: 'inline-block', width: '30px', height: '30px', borderRadius: '50%', background: '#6b7280', color: 'white', textAlign: 'center', lineHeight: '30px', fontSize: '18px' } },
          { type: 'latex', content: formatLatex(n2, d2, sign2) }
        ]
      }
    ],
    options: [
      { id: 'opt1', type: 'text', content: '>', isCorrect: correctSign === '>' },
      { id: 'opt2', type: 'text', content: '<', isCorrect: correctSign === '<' },
      { id: 'opt3', type: 'text', content: '=', isCorrect: correctSign === '=' }
    ],
    correctAnswerId: correctSign === '>' ? 'opt1' : (correctSign === '<' ? 'opt2' : 'opt3')
  };
}

function generateConvertDecimalsFractions(params, random) {
  const isDecToFrac = random() > 0.5;
  const maxWhole = params.maxWhole || 10;
  const decimalPlaces = params.decimalPlaces || 2; // 1, 2, or 3
  
  const multiplier = Math.pow(10, decimalPlaces);
  const whole = getRandomInt(0, maxWhole, random);
  const fracPart = getRandomInt(1, multiplier - 1, random);
  
  const decimalStr = (whole + (fracPart / multiplier)).toFixed(decimalPlaces);
  
  const d = multiplier;
  const n = (whole * multiplier) + fracPart;
  const simplified = simplifyFraction(n, d);
  
  let questionText;
  if (isDecToFrac) {
    questionText = `Write ${decimalStr} as a fraction or mixed number.`;
  } else {
    questionText = `Write $$\\frac{${simplified.n}}{${simplified.d}}$$ as a decimal.`;
  }

  return { 
    id: `q_rat_conv_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText, 
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'input', id: 'ans', size: 'small' }
    ], 
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }), 
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generateConvertPercents(params, random) {
  const decimalPlaces = params.decimalPlaces || getRandomInt(1, 4, random);
  const multiplier = Math.pow(10, decimalPlaces);
  
  const val = getRandomInt(1, multiplier * 2, random) / multiplier;
  const decStr = val.toFixed(decimalPlaces);
  
  const questionText = `How do you write ${decStr} as a percentage?`;
  const percentAns = parseFloat((val * 100).toFixed(6)); // Avoid floating point inaccuracies
  
  return { 
    id: `q_rat_conv_perc_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText, 
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'text', content: 'Write your answer using a percent sign (%).', isVertical: true, style: { fontStyle: 'italic', marginBottom: '1rem' } },
      { type: 'input', id: 'ans', size: 'small' }
    ], 
    correctAnswerText: JSON.stringify({ ans: `${percentAns}%` }), 
    validation: { type: 'exact', answer: { ans: `${percentAns}%` } }
  };
}

function generateEvaluateExpressions(params, random) {
  const maxVal = params.maxVal || 20;
  const allowNegatives = params.allowNegatives !== false;
  
  const getNum = () => {
    let num = (getRandomInt(1, maxVal * 10, random) / 10).toFixed(1);
    if (allowNegatives && random() > 0.5) num = '-' + num;
    return num;
  };

  const num1 = getNum();
  const num2 = getRandomInt(2, params.maxMultiplier || 12, random) * (allowNegatives && random() > 0.5 ? -1 : 1);
  const num3 = getNum();
  
  const questionText = `Evaluate the expression.`;
  return { 
    id: `q_rat_eval_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText, 
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'text', content: `${num1} \\times ${num2 < 0 ? `(${num2})` : num2} - ${num3 < 0 ? `(${num3})` : num3}`, isVertical: true, style: { fontSize: '24px', margin: '1rem 0' } },
      { type: 'text', content: 'Write your answer as an integer or a decimal. Do not round.', isVertical: true, style: { fontStyle: 'italic', marginBottom: '1rem' } },
      { type: 'input', id: 'ans', size: 'small' }
    ], 
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }), 
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generateMultiplyDivide(params, random) {
  const denomPool = params.denominatorPool || [2, 3, 4, 5, 6, 8, 10];
  const maxWhole = params.maxWhole || 3;
  
  const d1 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n1 = getRandomInt(1, d1 * maxWhole, random);
  const d2 = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  const n2 = getRandomInt(1, d2 * maxWhole, random);
  
  const isMultiply = random() > 0.5;
  const opStr = isMultiply ? '\\times' : '\\div';
  const opLabel = isMultiply ? 'Multiply.' : 'Divide.';

  return { 
    id: `q_rat_muldiv_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText: opLabel, 
    parts: [
      { type: 'text', content: opLabel, isVertical: true },
      {
        type: 'group',
        direction: 'row',
        style: { alignItems: 'center', gap: '0.75rem', marginTop: '20px' },
        parts: [
          { type: 'latex', content: `\\frac{${n1}}{${d1}}` },
          { type: 'latex', content: opStr, style: { fontSize: '24px' } },
          { type: 'latex', content: `\\frac{${n2}}{${d2}}` },
          { type: 'text', content: '=', style: { fontSize: '24px' } },
          { type: 'input', id: 'ans', size: 'small' }
        ]
      }
    ], 
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }), 
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generateMultiplyDivideWordProblems(params, random) {
  const maxWhole = params.maxWhole || 5;
  const item1 = ['paint', 'water', 'juice', 'milk', 'flour'][getRandomInt(0, 4, random)];
  const d1 = [2, 3, 4, 5, 8, 10][getRandomInt(0, 5, random)];
  const n1 = getRandomInt(1, d1 * maxWhole, random);
  
  const divider = getRandomInt(2, params.maxDivisor || 6, random);
  
  const questionText = `A container holds ${n1 > d1 ? `${Math.floor(n1/d1)} ${n1%d1}/${d1}` : `${n1}/${d1}`} gallons of ${item1}. If it is divided equally into ${divider} smaller containers, how much ${item1} is in each container?`;
  
  return { 
    id: `q_rat_muldiv_wp_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText, 
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'input', id: 'ans', size: 'small' }
    ], 
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }), 
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generatePowers(params, random) {
  const minBase = params.minBase || 0.1;
  const maxBase = params.maxBase || 2.0;
  const maxExponent = params.maxExponent || 4;
  
  const base = (getRandomInt(minBase * 10, maxBase * 10, random) / 10).toFixed(1);
  const exponent = getRandomInt(2, maxExponent, random);
  
  const questionText = `Evaluate.`;
  return { 
    id: `q_rat_pow_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText, 
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'latex', content: `${base}^${exponent}`, style: { fontSize: '24px', margin: '1rem 0' } },
      { type: 'input', id: 'ans', size: 'small' }
    ], 
    correctAnswerText: JSON.stringify({ ans: Math.pow(parseFloat(base), exponent).toFixed(exponent) }), 
    validation: { type: 'exact', answer: { ans: Math.pow(parseFloat(base), exponent).toFixed(exponent) } }
  };
}

function generateOrder(params, random) {
  const denomPool = params.denominatorPool || [2, 3, 4, 5, 8, 10, 20, 25];
  const maxWhole = params.maxWhole || 4;
  const itemCount = params.itemCount || 3;
  
  const items = [];
  while(items.length < itemCount) {
    if (random() > 0.3) {
      // Fraction
      const d = denomPool[getRandomInt(0, denomPool.length - 1, random)];
      const n = getRandomInt(-d * maxWhole, d * maxWhole, random);
      items.push({ id: `i${items.length+1}`, content: n < 0 ? `-\\frac{${Math.abs(n)}}{${d}}` : `\\frac{${n}}{${d}}`, value: n/d });
    } else {
      // Integer or Decimal
      if (random() > 0.5) {
        const intVal = getRandomInt(-maxWhole, maxWhole, random);
        items.push({ id: `i${items.length+1}`, content: `${intVal}`, value: intVal });
      } else {
        const decVal = (getRandomInt(-maxWhole * 10, maxWhole * 10, random) / 10).toFixed(1);
        items.push({ id: `i${items.length+1}`, content: `${decVal}`, value: parseFloat(decVal) });
      }
    }
  }
  
  const sortedItems = [...items].sort((a, b) => a.value - b.value);
  
  return { 
    id: `q_rat_ord_${uid()}`, 
    type: 'sorting', 
    questionText: 'Put these numbers in order from least to greatest.', 
    parts: [
      { type: 'text', content: 'Put these numbers in order from **least** to **greatest**.', isVertical: true }
    ], 
    items: items.map(i => ({ id: i.id, content: `$$${i.content}$$` })), 
    correctAnswerText: JSON.stringify(sortedItems.map(i => i.id)), 
    validation: { type: 'exact', answer: sortedItems.map(i => i.id) }
  };
}

function generateReciprocals(params, random) {
  const denomPool = params.denominatorPool || [2, 3, 4, 5, 6, 8, 10, 12];
  const maxWhole = params.maxWhole || 5;
  
  const d = denomPool[getRandomInt(0, denomPool.length - 1, random)];
  let n = getRandomInt(1, d * maxWhole, random);
  
  // 10% chance of negative
  if (random() > 0.9) n = -n;
  
  const latexFraction = n < 0 ? `-\\frac{${Math.abs(n)}}{${d}}` : `\\frac{${n}}{${d}}`;
  
  const questionText = `What is the reciprocal of $$${latexFraction}$$?`;
  return { 
    id: `q_rat_recip_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText, 
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'input', id: 'ans', size: 'small' }
    ], 
    correctAnswerText: JSON.stringify({ ans: 'placeholder' }), 
    validation: { type: 'exact', answer: { ans: 'placeholder' } }
  };
}

function generateRounding(params, random) {
  const maxWhole = params.maxWhole || 100;
  const decimalPlaces = params.decimalPlaces || getRandomInt(2, 4, random);
  const targetPlace = params.targetPlace || ['tenth', 'hundredth', 'whole number'][getRandomInt(0, 2, random)];
  
  const whole = getRandomInt(0, maxWhole, random);
  const multiplier = Math.pow(10, decimalPlaces);
  const dec = getRandomInt(1, multiplier - 1, random);
  const numStr = `${whole}.${dec.toString().padStart(decimalPlaces, '0')}`;
  
  const questionText = `Round ${numStr} to the nearest ${targetPlace}.`;
  
  let targetDecimals = 0;
  if (targetPlace === 'tenth') targetDecimals = 1;
  else if (targetPlace === 'hundredth') targetDecimals = 2;
  
  const rounded = (Math.round(parseFloat(numStr) * Math.pow(10, targetDecimals)) / Math.pow(10, targetDecimals)).toFixed(targetDecimals);
  
  return { 
    id: `q_rat_round_${uid()}`, 
    type: 'fillInTheBlank', 
    questionText, 
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      { type: 'input', id: 'ans', size: 'small' }
    ], 
    correctAnswerText: JSON.stringify({ ans: rounded }), 
    validation: { type: 'exact', answer: { ans: rounded } }
  };
}
