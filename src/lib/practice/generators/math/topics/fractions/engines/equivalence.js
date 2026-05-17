/**
 * Equivalence Engine Family (Updated)
 * Powers: Simplify fractions, find missing numerator/denominator, equivalent fractions.
 * Configured via engineParams.
 */

import { createSeededRandom, getRandomInt, simplifyFraction, generateEquivalents } from '../shared/mathCore.js';
import { buildNumberLineSvg } from '../shared/svgLibrary/numberLines.js';

const fractionLatex = (num, den) => `\\frac{${num}}{${den}}`;

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const equivalenceEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `equivalence_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'simplify';

  if (subType === 'simplify') {
    return generateSimplify(params, random);
  } else if (subType === 'missing_value') {
    return generateMissingValue(params, random);
  } else if (subType === 'identify_equivalent') {
    return generateEquivalentFractionsModel(params, random);
  } else if (subType === 'patterns') {
    return generateEquivalencePatterns(params, random);
  } else {
    throw new Error(`[EquivalenceEngine] Unsupported subType: ${subType}`);
  }
};

// ============================================================================
// Core Generator Logics
// ============================================================================

function generateEquivalencePatterns(params, random) {
  const minDenom = params.minDenominator || 2;
  const maxDenom = params.maxDenominator || 10;
  const baseDenom = params.baseDenom || getRandomInt(minDenom, maxDenom, random);
  const baseNum = params.baseNum || getRandomInt(1, baseDenom - 1, random);
  
  const count = params.count || 6;
  const missingIdx = params.missingIdx !== undefined ? params.missingIdx : 1; // 0-indexed, default is 2nd fraction (k=2)

  const sequence = [];
  for (let k = 1; k <= count; k++) {
    sequence.push({ n: baseNum * k, d: baseDenom * k, k });
  }

  const missingItem = sequence[missingIdx];
  const isMissingNumerator = params.isMissingNumerator !== undefined ? params.isMissingNumerator : true;
  const correctAnswer = isMissingNumerator ? missingItem.n : missingItem.d;

  const fractionLatex = (n, d) => `\\frac{${n}}{${d}}`;

  const buildFractionItem = (n, d, isMissing) => {
    if (!isMissing) return { type: 'latex', content: `\\frac{${n}}{${d}}` };
    return {
      type: 'fraction',
      numerator: isMissingNumerator ? { type: 'input', id: 'ans', size: 'small' } : String(n),
      denominator: !isMissingNumerator ? { type: 'input', id: 'ans', size: 'small' } : String(d)
    };
  };

  const questionParts = [
    { type: 'text', content: 'Type the missing number to complete the equivalent fraction.', isVertical: true },
    {
      type: 'group',
      direction: 'row',
      style: { alignItems: 'center', gap: '0.75rem', marginTop: '20px', flexWrap: 'wrap' },
      parts: sequence.flatMap((item, idx) => {
        const parts = [buildFractionItem(item.n, item.d, idx === missingIdx)];
        if (idx < sequence.length - 1) {
          parts.push({ type: 'text', content: '=', style: { fontSize: '20px' } });
        }
        return parts;
      })
    }
  ];

  // Build solution
  const solutionParts = [
    { type: 'text', content: 'You can multiply the numerator and denominator by the same number to find an equivalent fraction.', isVertical: true },
    { type: 'text', content: `Start with $${fractionLatex(baseNum, baseDenom)}$. Multiply the numerator and denominator by the same number to find equivalent fractions:`, isVertical: true, style: { marginTop: '20px' } },
  ];

  sequence.slice(1).forEach(item => {
    solutionParts.push({
      type: 'group',
      direction: 'row',
      style: { alignItems: 'center', gap: '0.5rem', margin: '10px 0' },
      parts: [
        { type: 'latex', content: fractionLatex(baseNum, baseDenom) },
        { type: 'text', content: '×' },
        { type: 'latex', content: fractionLatex(item.k, item.k) },
        { type: 'text', content: '=' },
        { type: 'latex', content: fractionLatex(item.n, item.d) }
      ]
    });
  });

  solutionParts.push({ type: 'text', content: 'Now complete the equivalent fraction:', isVertical: true, style: { marginTop: '20px' } });
  
  // Final solution display with answer bolded
  solutionParts.push({
    type: 'group',
    direction: 'row',
    style: { alignItems: 'center', gap: '0.5rem', marginTop: '10px', fontSize: '20px' },
    parts: sequence.map((item, idx) => {
      const parts = [];
      if (idx === missingIdx) {
        parts.push({ 
          type: 'latex', 
          content: fractionLatex(item.n, item.d),
          style: { padding: '5px', border: '2px solid #bfdbfe', borderRadius: '4px', background: '#eff6ff' }
        });
      } else {
        parts.push({ type: 'latex', content: fractionLatex(item.n, item.d) });
      }
      
      if (idx < sequence.length - 1) {
        parts.push({ type: 'text', content: '=' });
      }
      return parts;
    }).flat()
  });

  return {
    id: `q_frac_equiv_pat_${uid()}`,
    type: 'fillInTheBlank',
    questionText: 'Type the missing number to complete the equivalent fraction.',
    parts: questionParts,
    correctAnswerText: JSON.stringify({ ans: String(correctAnswer) }),
    solution: [
      {
        type: 'section',
        label: 'explanation',
        parts: solutionParts
      }
    ],
    adaptiveConfig: {
      logic_type: 'equivalence_patterns',
      variables: {
        baseNum,
        baseDenom,
        missingIdx,
        isMissingNumerator,
        seed: params.seed
      }
    }
  };
}

function generateSimplify(params, random) {
  // Use existing values if provided (Hydration), otherwise generate random ones
  let num = params.numerator;
  let denom = params.denominator;
  let simplified;

  if (num && denom) {
    simplified = simplifyFraction(num, denom);
  } else {
    const maxDenominator = params.maxDenominator || 20;
    // Try up to 20 times to find a simplifiable fraction
    for(let i=0; i<20; i++) {
       denom = getRandomInt(4, maxDenominator, random);
       num = getRandomInt(2, denom - 1, random);
       simplified = simplifyFraction(num, denom);
       if (simplified.denominator !== denom) {
           break; // Found one!
       }
    }

    // Fallback if we somehow didn't find one
    if (simplified.denominator === denom) {
        num = 2; denom = 4;
        simplified = { numerator: 1, denominator: 2 };
    }
  }

  const fractionStr = `${num}/${denom}`;
  const answerStr = `${simplified.numerator}/${simplified.denominator}`;
  const questionContent = params.questionText || `Simplify the fraction: $${fractionLatex(num, denom)}$`;

  return {
    id: `q_frac_equiv_simp_${uid()}`,
    type: 'fillInTheBlank',
    questionText: questionContent.replace(/\$/g, ''),
    parts: [
        { type: 'text', content: questionContent, isVertical: true },
        {
            type: 'text',
            content: 'Use a forward slash ( / ) to separate the numerator and denominator.',
            isVertical: true,
            style: { fontStyle: 'italic', marginTop: '10px', fontSize: '0.9rem', color: '#64748b' }
        },
        { type: 'input', id: 'ans', size: 'medium', isVertical: true, style: { marginTop: '1rem' } }
    ],
    options: [],
    correctAnswerText: JSON.stringify({ ans: answerStr }),
    validation: { type: 'exact', answer: { ans: answerStr } },
    solution: [
        {
            type: 'section',
            label: 'solve',
            parts: [
                { type: 'text', content: `To simplify $${fractionLatex(num, denom)}$, find the greatest common divisor of ${num} and ${denom}.` },
                { type: 'text', content: `The simplified fraction is **$${fractionLatex(simplified.numerator, simplified.denominator)}$**.` }
            ]
        }
    ],
    adaptiveConfig: {
      logic_type: params.logic_type || 'equivalence_simplify',
      variables: {
        numerator: num,
        denominator: denom,
        seed: params.seed
      }
    }
  };
}

function generateMissingValue(params, random) {
  // e.g. 1/2 = ?/4
  const maxMultiplier = params.maxMultiplier || 5;
  const maxBaseDenom = params.maxBaseDenom || 10;
  
  const baseDenom = params.baseDenom || getRandomInt(2, maxBaseDenom, random);
  const baseNum = params.baseNum || getRandomInt(1, baseDenom - 1, random);
  const multiplier = params.multiplier || getRandomInt(2, maxMultiplier, random);
  
  const scaledNum = baseNum * multiplier;
  const scaledDenom = baseDenom * multiplier;
  
  const isMissingNumerator = params.isMissingNumerator !== undefined 
    ? params.isMissingNumerator 
    : random() > 0.5;
  
  const isMissingOnLeft = params.isMissingOnLeft !== undefined
    ? params.isMissingOnLeft
    : random() > 0.5;

  let correctAnswer;
  if (isMissingNumerator) {
    correctAnswer = isMissingOnLeft ? baseNum : scaledNum;
  } else {
    correctAnswer = isMissingOnLeft ? baseDenom : scaledDenom;
  }
  const buildFractionItem = (n, d, isMissing, missingId) => {
    return {
      type: 'fraction',
      numerator: isMissing && isMissingNumerator ? { type: 'input', id: missingId, size: 'small' } : String(n),
      denominator: isMissing && !isMissingNumerator ? { type: 'input', id: missingId, size: 'small' } : String(d)
    };
  };

  const questionParts = [
    { type: 'text', content: 'Complete the equivalent fraction:', isVertical: true },
    {
      type: 'group',
      direction: 'row',
      style: { alignItems: 'center', gap: '0.75rem', marginTop: '20px', fontSize: '24px' },
      parts: [
        buildFractionItem(baseNum, baseDenom, isMissingOnLeft, 'ans'),
        { type: 'text', content: '=', style: { fontSize: '24px', fontWeight: 'bold' } },
        buildFractionItem(scaledNum, scaledDenom, !isMissingOnLeft, 'ans')
      ]
    }
  ];

  return {
    id: `q_frac_equiv_miss_${uid()}`,
    type: 'fillInTheBlank', 
    questionText: 'Complete the equivalent fraction.',
    parts: questionParts,
    options: [],
    correctAnswerText: JSON.stringify({ ans: String(correctAnswer) }),
    validation: { type: 'exact', answer: { ans: String(correctAnswer) } },
    solution: [
        {
            type: 'section',
            label: 'solve',
            parts: [
                { type: 'text', content: 'To find the missing value, look for the scale factor between the known numerators or denominators.' },
                { 
                  type: 'text', 
                  content: `In this case, the missing value is **${correctAnswer}**.` 
                }
            ]
        }
    ],
    adaptiveConfig: {
      logic_type: params.logic_type || 'equivalence_missing_value',
      variables: {
        baseNum, 
        baseDenom, 
        multiplier, 
        isMissingNumerator, 
        isMissingOnLeft,
        seed: params.seed
      }
    }
  };
}

function generateEquivalentFractionsModel(params, random) {
  // E.g., base: 1/4, correct equivalent: 2/8, distractors: 1/6, 1/5, 1/3
  const pool = [
    { base: {n: 1, d: 2}, eq: {n: 2, d: 4}, dist: [{n: 3, d: 8}, {n: 2, d: 6}, {n: 3, d: 4}] },
    { base: {n: 1, d: 3}, eq: {n: 2, d: 6}, dist: [{n: 1, d: 4}, {n: 2, d: 5}, {n: 1, d: 2}] },
    { base: {n: 1, d: 4}, eq: {n: 2, d: 8}, dist: [{n: 1, d: 6}, {n: 1, d: 5}, {n: 1, d: 3}] },
    { base: {n: 2, d: 3}, eq: {n: 4, d: 6}, dist: [{n: 3, d: 4}, {n: 5, d: 8}, {n: 3, d: 5}] },
    { base: {n: 3, d: 4}, eq: {n: 6, d: 8}, dist: [{n: 2, d: 3}, {n: 4, d: 5}, {n: 5, d: 6}] },
  ];

  const scenarioIndex = params.scenario_index !== undefined 
    ? params.scenario_index 
    : Math.floor(random() * pool.length);
  const scenario = pool[scenarioIndex];

  const rawOptions = [
    { id: 'opt_correct', content: fractionLatex(scenario.eq.n, scenario.eq.d), isCorrect: true, type: 'latex', val: scenario.eq },
    ...scenario.dist.map((d, i) => ({ id: `opt_dist_${i}`, content: fractionLatex(d.n, d.d), isCorrect: false, type: 'latex', val: d }))
  ];

  // Shuffle - Use Seeded Random for stability
  for (let i = rawOptions.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
  }

  const correctIdx = rawOptions.findIndex(o => o.isCorrect);

  // Build solution steps
  const solutionSteps = [];
  solutionSteps.push({ type: 'text', content: `You can use number lines. First show ` });
  solutionSteps.push({ type: 'latex', content: fractionLatex(scenario.base.n, scenario.base.d) });
  solutionSteps.push({ type: 'text', content: `.` });
  
  // Base SVG
  solutionSteps.push({ type: 'svg', content: buildNumberLineSvg({
    min: 0, max: 1, denominator: scenario.base.d, showLabels: false, showWholeNumbersOnly: true, height: 100,
    markedPoints: [{ numerator: scenario.base.n, color: '#0f766e', size: 6, labelPosition: 'bottom', labelFraction: { num: scenario.base.n, den: scenario.base.d } }]
  })});

  solutionSteps.push({ type: 'text', content: 'Now show the other fractions.' });

  const colors = ['#3b82f6', '#8b5cf6', '#10b981', '#ef4444'];
  
  rawOptions.forEach((opt, idx) => {
    solutionSteps.push({ type: 'svg', content: buildNumberLineSvg({
      min: 0, max: 1, denominator: opt.val.d, showLabels: false, showWholeNumbersOnly: true, height: 100,
      markedPoints: [{ numerator: opt.val.n, color: colors[idx % colors.length], size: 6, labelPosition: 'bottom', labelFraction: { num: opt.val.n, den: opt.val.d } }]
    })});
  });

  solutionSteps.push({ type: 'latex', content: fractionLatex(scenario.eq.n, scenario.eq.d) });
  solutionSteps.push({ type: 'text', content: ` is equivalent to ` });
  solutionSteps.push({ type: 'latex', content: fractionLatex(scenario.base.n, scenario.base.d) });
  solutionSteps.push({ type: 'text', content: `.` });

  return {
    id: `q_frac_equiv_id_${uid()}`,
    type: 'mcq',
    questionText: `Which fraction is equivalent to ${scenario.base.n}/${scenario.base.d}?`,
    parts: [
      { type: 'text', content: `Which fraction is equivalent to `, isVertical: true },
      { type: 'latex', content: fractionLatex(scenario.base.n, scenario.base.d), isVertical: true },
      { type: 'text', content: `?`, isVertical: true }
    ],
    options: rawOptions.map(o => ({ id: o.id, content: o.content, isCorrect: o.isCorrect, type: o.type })),
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    solution: [
        {
            type: 'section',
            label: 'solve',
            parts: solutionSteps
        }
    ],
    layoutConfig: { columns: 4, gap: '1rem', partsDirection: 'row' },
    adaptiveConfig: {
      logic_type: params.logic_type || 'equivalence_identify_equivalent',
      variables: {
        scenario_index: scenarioIndex,
        seed: params.seed
      }
    }
  };
}
