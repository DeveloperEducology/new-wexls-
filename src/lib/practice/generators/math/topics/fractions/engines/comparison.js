/**
 * Comparison Engine Family
 * Powers: Which fraction is greater/lesser, comparing fractions with visual models.
 * Configured via engineParams.
 */

import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';
import { buildIdentifyShapeSvg } from '../shared/svgLibrary/shapes.js';

// uid helper: prevents id collisions in batch generation
let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const comparisonEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `comparison_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'visual_compare';

  if (subType === 'visual_compare') {
    return generateVisualCompare(params, random);
  } else if (subType === 'sorting') {
    return generateSortingFractions(params, random);
  } else {
    throw new Error(`[ComparisonEngine] Unsupported subType: ${subType}`);
  }
};

// ============================================================================
// Core Generator Logics
// ============================================================================

function generateSortingFractions(params, random) {
  const count = params.count || 4; // Number of fractions to sort
  
  // Map modes like 'greater' or 'lesser' (from MCQ) to sorting equivalents if needed
  let mode = params.mode || (random() > 0.5 ? 'largest_to_smallest' : 'smallest_to_largest');
  if (mode === 'greater') mode = 'largest_to_smallest';
  if (mode === 'lesser') mode = 'smallest_to_largest';
  
  // Complexity types: 'like_denominators', 'unlike_denominators', 'same_numerator'
  const complexity = params.complexity || (random() > 0.5 ? 'like_denominators' : 'unlike_denominators');
  const minDenom = params.minDenominator || 2;
  const maxDenom = params.maxDenominator || 12;

  let fractions = [];
  
  if (complexity === 'same_numerator') {
    const num = getRandomInt(1, 6, random);
    const denoms = [];
    while (denoms.length < count) {
      const d = getRandomInt(Math.max(num + 1, minDenom), maxDenom, random);
      if (!denoms.includes(d)) denoms.push(d);
    }
    fractions = denoms.map(d => ({ n: num, d }));
  } else if (complexity === 'like_denominators') {
    const denom = getRandomInt(Math.max(count + 1, minDenom), maxDenom, random);
    const nums = [];
    while (nums.length < count) {
      const n = getRandomInt(1, denom - 1, random);
      if (!nums.includes(n)) nums.push(n);
    }
    fractions = nums.map(n => ({ n, d: denom }));
  } else {
    // unlike_denominators / mixed - ensure distinct values
    const values = new Set();
    while (fractions.length < count) {
      const d = getRandomInt(minDenom, maxDenom, random);
      const n = getRandomInt(1, d - 1, random);
      const val = n / d;
      // Ensure distinct values and avoid duplicate fractions
      const key = `${n}/${d}`;
      if (!values.has(val) && !fractions.some(f => `${f.n}/${f.d}` === key)) {
        values.add(val);
        fractions.push({ n, d });
      }
    }
  }

  // Create item objects
  const items = fractions.map((f, i) => ({
    id: `item_${i}`,
    content: `\\frac{${f.n}}{${f.d}}`,
    type: 'latex',
    value: f.n / f.d,
    n: f.n,
    d: f.d
  }));

  // Sort items
  const sortedItems = [...items].sort((a, b) => {
    return mode === 'largest_to_smallest' ? b.value - a.value : a.value - b.value;
  });

  const correctOrderIds = sortedItems.map(item => item.id);
  const correctAnswerText = JSON.stringify(correctOrderIds);

  const modeText = mode.replace(/_/g, ' ');
  const parts = modeText.split(' to ');
  const fromText = parts[0] || 'smallest';
  const toText = parts[1] || 'largest';
  const questionText = `Put these fractions in order from **${fromText}** to **${toText}**.`;

  // Build solution sections
  const visualParts = sortedItems.map(item => {
    const svg = buildIdentifyShapeSvg({
      shapeType: 'circle',
      numerator: item.n,
      denominator: item.d,
      fillColor: '#22c55e', // Green like in the image
      strokeColor: '#166534',
      size: 100
    });
    return {
      type: 'group',
      direction: 'column',
      style: { alignItems: 'center' },
      parts: [
        { type: 'latex', content: `\\frac{${item.n}}{${item.d}}`, style: { fontWeight: 'bold', fontSize: '20px' } },
        { type: 'svg', content: svg }
      ]
    };
  });

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `These shapes show the fractions from ${modeText.replace(/_/g, ' ')}:` },
        { 
          type: 'group', 
          direction: 'row',
          parts: visualParts,
          style: { gap: '2rem', justifyContent: 'center', margin: '2rem 0', alignItems: 'flex-end' }
        },
        { 
          type: 'text', 
          content: complexity === 'same_numerator' 
            ? `Each shape has **${fractions[0].n}** parts shaded. Notice that as the denominator gets larger, the parts get smaller. So, the total shaded area is smaller.`
            : complexity === 'like_denominators'
            ? `All shapes have the same size parts (**${fractions[0].d}** equal parts). More shaded parts means a larger fraction.`
            : `To compare these fractions, you can look at the shaded area in each model. The shapes with more coloured area represent larger fractions.`
        },
        { type: 'text', content: `The fractions in order from ${modeText.replace(/_/g, ' ')} are:` },
        { 
          type: 'group',
          direction: 'row',
          style: { gap: '1rem', justifyContent: 'center', marginTop: '1rem' },
          parts: sortedItems.map(it => ({
            type: 'text',
            content: `$${it.content}$`,
            style: { 
              padding: '0.5rem 1rem', 
              background: '#3b82f6', 
              color: 'white', 
              borderRadius: '4px',
              fontWeight: 'bold'
            }
          }))
        }
      ]
    }
  ];

  return {
    id: `q_frac_sort_${uid()}`,
    type: 'sorting',
    questionText,
    parts: [
      { type: 'text', content: questionText, isVertical: true, hasAudio: true }
    ],
    items: items.map(it => ({
      id: it.id,
      content: it.content,
      type: 'latex',
      value: it.value
    })),
    correctAnswerText,
    solution,
    adaptiveConfig: {
      logic_type: 'comparison_sorting_fractions',
      variables: {
        mode,
        complexity,
        items: items.map(it => ({ n: it.n, d: it.d })),
        correctOrderIds,
        seed: params.seed
      }
    }
  };
}

function generateVisualCompare(params, random) {
  // Generate two fractions to compare
  // For visual comparison, usually we use same denominators or very simple ones
  const denominatorPool = params.denominatorPool || [2, 3, 4, 5, 6, 8];
  const denom = params.denom || params.denominator || denominatorPool[Math.floor(random() * denominatorPool.length)];
  
  let num1 = getRandomInt(1, denom - 1, random);
  let num2 = getRandomInt(1, denom - 1, random);
  
  // Ensure they are different
  while (num1 === num2) {
    num2 = getRandomInt(1, denom - 1, random);
  }

  // Comparison type: greater or lesser
  const mode = params.mode || (random() > 0.5 ? 'greater' : 'lesser');
  
  const fractionLatex = (n, d) => `\\frac{${n}}{${d}}`;

  const questionText = `Which fraction is **${mode}**?`;

  const palette1 = { fill: '#bfdbfe', stroke: '#3b82f6' }; // Blue
  const palette2 = { fill: '#fed7aa', stroke: '#ea580c' }; // Orange

  const svg1 = buildIdentifyShapeSvg({
    shapeType: 'circle',
    numerator: num1,
    denominator: denom,
    fillColor: palette1.fill,
    strokeColor: palette1.stroke,
    size: 120
  });

  const svg2 = buildIdentifyShapeSvg({
    shapeType: 'circle',
    numerator: num2,
    denominator: denom,
    fillColor: palette2.fill,
    strokeColor: palette2.stroke,
    size: 120
  });

  const isCorrect1 = mode === 'greater' ? num1 > num2 : num1 < num2;
  const isCorrect2 = !isCorrect1;

  const rawOptions = [
    { id: 'opt_1', content: fractionLatex(num1, denom), isCorrect: isCorrect1, val: { n: num1, d: denom }, palette: palette1 },
    { id: 'opt_2', content: fractionLatex(num2, denom), isCorrect: isCorrect2, val: { n: num2, d: denom }, palette: palette2 }
  ];

  const correctIdx = rawOptions.findIndex(o => o.isCorrect);

  // Build solution sections
  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'latex', content: fractionLatex(num1, denom) },
        { type: 'svg', content: svg1 },
        { type: 'text', content: `${num1} out of ${denom} equal parts are coloured.` },
        
        { type: 'latex', content: fractionLatex(num2, denom) },
        { type: 'svg', content: svg2 },
        { type: 'text', content: `${num2} out of ${denom} equal parts are coloured.` },
        
        { type: 'text', content: `Both shapes have ${denom} equal parts and are the same size. So, the parts in the first shape are the same size as the parts in the second shape.` },
        { type: 'text', content: `When parts are the same size, ${Math.max(num1, num2)} parts is more than ${Math.min(num1, num2)} parts. So, more of the first shape is coloured.` },
        { 
          type: 'text', 
          content: mode === 'greater' 
            ? `$${fractionLatex(Math.max(num1, num2), denom)}$ is greater than $${fractionLatex(Math.min(num1, num2), denom)}$.`
            : `$${fractionLatex(Math.min(num1, num2), denom)}$ is lesser than $${fractionLatex(Math.max(num1, num2), denom)}$.`
        }
      ]
    }
  ];

  return {
    id: `q_frac_comp_vis_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      {
        type: 'text',
        content: '', // Empty placeholder if needed, but we'll use specific parts
        isVertical: true,
        style: { display: 'none' } 
      },
      // Left Fraction Group
      { type: 'latex', content: fractionLatex(num1, denom), style: { fontSize: '24px' } },
      { type: 'svg', content: svg1 },
      
      // Right Fraction Group
      { type: 'latex', content: fractionLatex(num2, denom), style: { fontSize: '24px' } },
      { type: 'svg', content: svg2 }
    ],
    options: rawOptions.map(o => ({ 
      id: o.id, 
      content: o.content, 
      isCorrect: o.isCorrect, 
      type: 'latex' 
    })),
    correctAnswerId: rawOptions[correctIdx].id,
    correctAnswerIndex: correctIdx,
    solution,
    layoutConfig: { 
      partsDirection: 'row',
      partsWrap: true,
      gap: '2rem'
    },
    adaptiveConfig: {
      logic_type: params.logic_type || 'comparison_visual_compare',
      variables: {
        num1, num2, denom, mode, seed: params.seed
      }
    }
  };
}
