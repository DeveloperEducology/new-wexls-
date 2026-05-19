/**
 * Visual Models Engine Family (Updated)
 * Powers: Match fraction to model, area model, strip model, pie model, identify fraction.
 * Configured via engineParams.
 */

import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';
import { buildIdentifyShapeSvg, makeRectPicture, buildShapeSetSvg } from '../shared/svgLibrary/shapes.js';

// uid helper: prevents id collisions in batch generation
let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const visualModelsEngine = (config) => {
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
  const seed = params.seed || `visual_model_${Date.now()}`;
  const random = createSeededRandom(seed);

  // Core logic based on sub-type
  const subType = params.subType || 'identify_fraction';

  if (subType === 'identify_fraction') {
    return generateIdentifyFraction(params, random);
  } else if (subType === 'equal_parts') {
    return generateEqualParts(params, random);
  } else if (subType === 'fraction_of_set') {
    return generateFractionOfSet(params, random);
  } else if (subType === 'mixed_numbers') {
    return generateMixedNumbers(params, random);
  } else if (subType === 'visual_models_cut_rectangle_fourths') {
    return generateCutRectangleFourths(params, random);
  } else if (subType === 'visual_models_cut_circle_fourths') {
    return generateCutCircleFourths(params, random);
  } else if (subType === 'visual_models_cut_rectangle_halves_different') {
    return generateCutRectangleHalvesDifferent(params, random);
  } else {
      throw new Error(`[VisualModelsEngine] Unsupported subType: ${subType}`);
  }
};

// ============================================================================
// Core Generator Logics
// ============================================================================

function generateMixedNumbers(params, random) {
  const whole = params.whole || getRandomInt(1, 3, random);
  const denominator = params.denominator || [2, 3, 4, 5, 6, 8][Math.floor(random() * 6)];
  const numerator = params.numerator || getRandomInt(1, denominator - 1, random);
  
  const shapeTypes = params.shapeTypes || ['circle', 'rectangle', 'pentagon', 'kite'];
  const shapeType = params.shapeType || shapeTypes[Math.floor(random() * shapeTypes.length)];

  const palettes = [
    { name: 'orange', fill: '#fed7aa', stroke: '#ea580c' },
    { name: 'green', fill: '#bbf7d0', stroke: '#16a34a' },
    { name: 'purple', fill: '#e9d5ff', stroke: '#9333ea' }
  ];
  const palette = palettes[Math.floor(random() * palettes.length)];

  const questionText = "Write the mixed number (for example, 2 2/3):";

  const wholeSvgs = Array.from({ length: whole }, () => buildIdentifyShapeSvg({
    shapeType,
    numerator: denominator,
    denominator,
    fillColor: palette.fill,
    strokeColor: palette.stroke,
    size: 150
  }));

  const fractionSvg = buildIdentifyShapeSvg({
    shapeType,
    numerator,
    denominator,
    fillColor: palette.fill,
    strokeColor: palette.stroke,
    size: 150
  });

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: "First, count the wholes." },
        {
          type: 'group',
          direction: 'row',
          parts: wholeSvgs.map(svg => ({ type: 'svg', content: svg }))
        },
        { type: 'text', content: `There are ${whole} wholes.` },
        { type: 'text', content: "Now find the fraction part.", style: { marginTop: '20px' } },
        { type: 'svg', content: fractionSvg },
        { type: 'text', content: `There are ${denominator} equal parts. There is ${numerator} coloured part.` },
        { type: 'latex', content: `\\text{The fraction part is } \\frac{${numerator}}{${denominator}}.` },
        { type: 'text', content: "Write the whole-number part and the fraction part together to make the mixed number:", style: { marginTop: '20px' } },
        { type: 'latex', content: `${whole} \\frac{${numerator}}{${denominator}}` }
      ]
    }
  ];

  return {
    id: `q_frac_vis_mixed_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText, isVertical: true },
      {
        type: 'group',
        direction: 'row',
        style: { flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' },
        parts: [
          ...wholeSvgs.map(svg => ({ type: 'svg', content: svg })),
          { type: 'svg', content: fractionSvg }
        ]
      },
      { type: 'input', id: 'ans', size: 'medium', isVertical: true, style: { marginTop: '20px' } }
    ],
    correctAnswerText: JSON.stringify({ ans: `${whole} ${numerator}/${denominator}` }),
    validation: { type: 'exact', answer: { ans: `${whole} ${numerator}/${denominator}` } },
    solution,
    adaptiveConfig: {
      logic_type: 'visual_models_mixed_numbers',
      variables: { whole, numerator, denominator, shapeType, seed: params.seed }
    }
  };
}

function generateIdentifyFraction(params, random) {
  // Extract parameters
  const denominatorPool = params.denominatorPool || [2, 3, 4, 5, 6, 8];
  const denominator = params.denom || params.denominator || denominatorPool[Math.floor(random() * denominatorPool.length)];
  const numerator = params.num || params.numerator || (Math.floor(random() * (denominator - 1)) + 1);
  
  const shapeTypes = params.shapeTypes || ['circle', 'rectangle', 'kite', 'pentagon'];
  const shuffledShapes = [...shapeTypes];
  for (let i = shuffledShapes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledShapes[i], shuffledShapes[j]] = [shuffledShapes[j], shuffledShapes[i]];
  }

  const fractionLabel = `${numerator}/${denominator}`;
  const questionText = params.questionText || `Which shape shows the fraction ${fractionLabel}?`;

  const palettes = [
    { name: 'blue', fill: '#bfdbfe', stroke: '#3b82f6' },
    { name: 'green', fill: '#bbf7d0', stroke: '#16a34a' },
    { name: 'teal', fill: '#99f6e4', stroke: '#0d9488' },
    { name: 'orange', fill: '#fed7aa', stroke: '#ea580c' },
    { name: 'purple', fill: '#e9d5ff', stroke: '#9333ea' },
  ];
  
  const shuffledPalettes = [...palettes];
  for (let i = shuffledPalettes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffledPalettes[i], shuffledPalettes[j]] = [shuffledPalettes[j], shuffledPalettes[i]];
  }

  const distractors = generateIdentifyFractionDistractors(numerator, denominator, random);

  const rawOptions = [
    { id: 'opt_correct', numerator, denominator, isCorrect: true },
    ...distractors.map((d, i) => ({ id: `opt_distractor_${i}`, numerator: d.numerator, denominator: d.denominator, isCorrect: false }))
  ];

  const optionsWithSvg = rawOptions.map((opt, i) => {
    const palette = shuffledPalettes[i % shuffledPalettes.length];
    const shapeType = shuffledShapes[i % shuffledShapes.length];
    const svg = buildIdentifyShapeSvg({
      shapeType,
      numerator: opt.numerator,
      denominator: opt.denominator,
      fillColor: palette.fill,
      strokeColor: palette.stroke,
    });
    return {
      ...opt,
      type: 'svg',
      content: svg,
      label: `${opt.numerator}/${opt.denominator}`,
      meta: { shapeType, numerator: opt.numerator, denominator: opt.denominator, palette: palette.name },
    };
  });

  for (let i = optionsWithSvg.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [optionsWithSvg[i], optionsWithSvg[j]] = [optionsWithSvg[j], optionsWithSvg[i]];
  }
  
  const correctIdx = optionsWithSvg.findIndex((o) => o.id === 'opt_correct');

  return {
    id: `q_frac_vis_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [{ type: 'text', content: questionText }],
    options: optionsWithSvg,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    isGrid: true,
    layoutConfig: { columns: 4, gap: '1rem' },
    adaptiveConfig: {
      logic_type: params.logic_type || 'visual_models_identify',
      variables: {
        num: numerator,
        denom: denominator,
        seed: params.seed
      }
    }
  };
}

function generateIdentifyFractionDistractors(numerator, denominator, random) {
  const used = new Set([`${numerator}/${denominator}`]);
  
  const candidatesA = Array.from({ length: denominator - 1 }, (_, i) => i + 1)
    .filter((n) => n !== numerator);
    
  const altDenoms = [denominator - 1, denominator + 1, denominator - 2, denominator + 2]
    .filter((d) => d >= 2 && d <= 8);

  const pool = [
    ...candidatesA.map((n) => ({ numerator: n, denominator })),
    ...altDenoms.flatMap((d) => [
      { numerator: 1, denominator: d },
      { numerator: Math.floor(d / 2), denominator: d },
    ]),
  ].filter(({ numerator: n, denominator: d }) => {
    const key = `${n}/${d}`;
    if (used.has(key) || n < 1 || n >= d) return false;
    used.add(key);
    return true;
  });

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }

  return pool.slice(0, 3);
}

function generateEqualParts(params, random) {
  const SHAPE_PALETTES = [
    { id: 'purple', fill: '#c9a5f4', stroke: '#9b4de1' },
    { id: 'red', fill: '#fb8b8f', stroke: '#d72323' },
    { id: 'yellow', fill: '#ffe27a', stroke: '#a76500' },
    { id: 'green', fill: '#79d89c', stroke: '#0f7f34' },
  ];

  const SHAPE_VARIANTS = [
    { shape: 'rectangle', orientation: 'vertical', parts: 2 },
    { shape: 'rectangle', orientation: 'horizontal', parts: 2 },
    { shape: 'rectangle', orientation: 'horizontal', parts: 4 },
    { shape: 'rectangle', orientation: 'vertical', parts: 4 },
    { shape: 'square', orientation: 'grid', parts: 4 },
  ];

  const variant = params.variant 
    ? (SHAPE_VARIANTS.find((v) => v.shape === params.variant || `${v.shape}_${v.orientation}_${v.parts}` === params.variant) || SHAPE_VARIANTS[Math.floor(random() * SHAPE_VARIANTS.length)])
    : SHAPE_VARIANTS[Math.floor(random() * SHAPE_VARIANTS.length)];
    
  const correctPalette = SHAPE_PALETTES[Math.floor(random() * SHAPE_PALETTES.length)];
  const remainingPalettes = SHAPE_PALETTES.filter((p) => p.id !== correctPalette.id);
  const distractorPalette = remainingPalettes[Math.floor(random() * remainingPalettes.length)];
  
  const distractorVariant = { ...variant, orientation: params.distractorOrientation || variant.orientation };
  
  const questionText = params.questionText || 'Which picture shows equal parts?';

  const correctOption = {
    id: 'opt_correct', 
    type: 'svg',
    content: makeRectPicture({ variant, palette: correctPalette, isEqual: true }),
    label: 'Equal parts', 
    isCorrect: true,
  };
  
  const distractorOption = {
    id: 'opt_distractor_unequal', 
    type: 'svg',
    content: makeRectPicture({ variant: distractorVariant, palette: distractorPalette, isEqual: false }),
    label: 'Unequal parts', 
    isCorrect: false,
  };

  const options = [correctOption, distractorOption];
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }
  
  const correctIdx = options.findIndex((o) => o.id === 'opt_correct');

  return {
    id: `q_frac_shape_${uid()}`,
    type: 'mcq', 
    questionText, 
    parts: [{ type: 'text', content: questionText }],
    options,
    correctAnswerId: 'opt_correct', 
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    isGrid: true,
    layoutConfig: { columns: 2, gap: '1.5rem' },
    adaptiveConfig: {
      logic_type: params.logic_type || 'visual_models_equal_parts',
      variables: { 
        seed: params.seed, 
        variant: variant.shape, // Changed key to 'variant' for consistency
        orientation: variant.orientation, 
        parts: variant.parts 
      },
    }
  };
}

function generateFractionOfSet(params, random) {
  const denominatorPool = params.denominatorPool || [2, 3, 4, 5, 6];
  const denominator = params.denom || params.denominator || denominatorPool[Math.floor(random() * denominatorPool.length)];
  const numerator = params.num || params.numerator || (Math.floor(random() * (denominator - 1)) + 1);

  const shapeTypes = ['circle', 'square', 'triangle', 'pentagon'];
  const numTargets = params.numTargets || 1; 
  
  // Pick random target shape(s)
  const shuffledShapes = [...shapeTypes].sort(() => random() - 0.5);
  const targetShapeTypes = shuffledShapes.slice(0, numTargets);
  
  // Pick a distractor shape that is not a target
  const remainingShapes = shuffledShapes.slice(numTargets);
  const distractorShapeType = remainingShapes[0];

  const palettes = [
    { fill: '#79d89c', stroke: '#0f7f34' }, // Green
    { fill: '#ff9845', stroke: '#d97706' }, // Orange
    { fill: '#72a0fc', stroke: '#2563eb' }, // Blue
    { fill: '#c9a5f4', stroke: '#9b4de1' }, // Purple
  ];

  const shuffledPalettes = [...palettes].sort(() => random() - 0.5);
  const targetPalette = shuffledPalettes[0];
  const distractorPalette = shuffledPalettes[1];

  // Build the array of shapes
  const shapes = [];
  for (let i = 0; i < numerator; i++) {
    // If multiple targets, alternate between them
    const tShape = targetShapeTypes[i % targetShapeTypes.length];
    shapes.push({ type: tShape, fill: targetPalette.fill, stroke: targetPalette.stroke });
  }
  for (let i = 0; i < (denominator - numerator); i++) {
    shapes.push({ type: distractorShapeType, fill: distractorPalette.fill, stroke: distractorPalette.stroke });
  }

  // Shuffle the shapes randomly
  for (let i = shapes.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shapes[i], shapes[j]] = [shapes[j], shapes[i]];
  }

  const svgContent = buildShapeSetSvg({ shapes, size: 80 });

  const shapeNames = {
    'circle': 'circles',
    'square': 'squares',
    'triangle': 'triangles',
    'pentagon': 'pentagons'
  };

  const targetNames = targetShapeTypes.map(t => shapeNames[t]).join(' or ');
  const questionText = params.questionText || `What fraction of the shapes are ${targetNames}?`;

  if (params.isFillInTheBlank) {
    return {
      id: `q_frac_set_${uid()}`,
      type: 'fill_in_the_blank',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: svgContent }
      ],
      options: [],
      correctAnswerText: `${numerator}/${denominator}`,
      validation: { type: 'exact', answer: `${numerator}/${denominator}` },
      adaptiveConfig: {
        logic_type: params.logic_type || 'visual_models_fraction_of_set',
        variables: { num: numerator, denom: denominator, seed: params.seed }
      }
    };
  }

  const fractionOptionSvg = (num, den) => `<svg width="40" height="70" viewBox="0 0 40 70"><text x="20" y="26" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="500">${num}</text><line x1="2" y1="35" x2="38" y2="35" stroke="black" stroke-width="2"/><text x="20" y="60" text-anchor="middle" font-size="24" font-family="sans-serif" font-weight="500">${den}</text></svg>`;

  const distractors = generateIdentifyFractionDistractors(numerator, denominator, random);

  const rawOptions = [
    { id: 'opt_correct', content: fractionOptionSvg(numerator, denominator), isCorrect: true, type: 'svg' },
    ...distractors.map((d, i) => ({ id: `opt_distractor_${i}`, content: fractionOptionSvg(d.numerator, d.denominator), isCorrect: false, type: 'svg' }))
  ];

  for (let i = rawOptions.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [rawOptions[i], rawOptions[j]] = [rawOptions[j], rawOptions[i]];
  }

  const correctIdx = rawOptions.findIndex((o) => o.id === 'opt_correct');

  return {
    id: `q_frac_set_${uid()}`,
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: questionText },
      { type: 'svg', content: svgContent }
    ],
    options: rawOptions,
    correctAnswerId: 'opt_correct',
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    isGrid: true,
    layoutConfig: { columns: 4, gap: '1rem' },
    adaptiveConfig: {
      logic_type: params.logic_type || 'visual_models_fraction_of_set',
      variables: {
        num: numerator,
        denom: denominator,
        seed: params.seed
      }
    }
  };
}

function generateCutRectangleFourths(params, random) {
  const questionText = "Cut the rectangle into fourths. Connect two dots to make a cut.";
  
  const solutionSvg = `<svg viewBox="0 0 300 300" width="220" height="220"><rect x="50" y="50" width="200" height="200" rx="12" fill="#6ee7b7" stroke="#059669" stroke-width="4" /><line x1="150" y1="50" x2="150" y2="250" stroke="#ffffff" stroke-width="4" /><line x1="50" y1="150" x2="250" y2="150" stroke="#ffffff" stroke-width="4" /><text x="100" y="110" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">1</text><text x="200" y="110" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">2</text><text x="100" y="210" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">3</text><text x="200" y="210" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">4</text></svg>`;

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: "Fourths means 4 equal parts." },
        { type: 'text', content: "This rectangle has 4 equal parts." },
        {
          type: 'group',
          direction: 'row',
          style: { justifyContent: 'center', margin: '14px 0' },
          parts: [{ type: 'svg', content: solutionSvg }]
        },
        { type: 'text', content: "It is cut into fourths." }
      ]
    }
  ];

  return {
    id: `q_frac_cut_rect_4_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: "Cut the rectangle into fourths.", style: { fontWeight: 900 } },
      { type: 'text', content: "Connect two dots to make a cut.", style: { color: '#475569', fontSize: 15 } },
      {
        type: 'interactive_fraction_cutter',
        shape: 'rectangle',
        dots: [
          { id: 'top', x: 150, y: 50 },
          { id: 'bottom', x: 150, y: 250 },
          { id: 'left', x: 50, y: 150 },
          { id: 'right', x: 250, y: 150 }
        ],
        requiredCuts: [
          ['top', 'bottom'],
          ['left', 'right']
        ],
        size: 280
      }
    ],
    correctAnswerText: JSON.stringify({ isCorrect: 'true' }),
    validation: { type: 'exact', answer: { isCorrect: 'true' } },
    solution,
    adaptiveConfig: {
      logic_type: 'visual_models_cut_rectangle_fourths',
      variables: { seed: params.seed }
    }
  };
}

function generateCutCircleFourths(params, random) {
  const questionText = "Cut the circle into fourths. Connect two dots to make a cut.";

  const solutionSvg = `<svg viewBox="0 0 300 300" width="220" height="220"><circle cx="150" cy="150" r="100" fill="#c084fc" stroke="#7c3aed" stroke-width="4" /><line x1="150" y1="50" x2="150" y2="250" stroke="#ffffff" stroke-width="4" /><line x1="50" y1="150" x2="250" y2="150" stroke="#ffffff" stroke-width="4" /><text x="105" y="115" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">1</text><text x="195" y="115" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">2</text><text x="105" y="205" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">3</text><text x="195" y="205" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">4</text></svg>`;

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: "Fourths means 4 equal parts." },
        { type: 'text', content: "This circle has 4 equal parts." },
        {
          type: 'group',
          direction: 'row',
          style: { justifyContent: 'center', margin: '14px 0' },
          parts: [{ type: 'svg', content: solutionSvg }]
        },
        { type: 'text', content: "It is cut into fourths." }
      ]
    }
  ];

  return {
    id: `q_frac_cut_circ_4_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: "Cut the circle into fourths.", style: { fontWeight: 900 } },
      { type: 'text', content: "Connect two dots to make a cut.", style: { color: '#475569', fontSize: 15 } },
      {
        type: 'interactive_fraction_cutter',
        shape: 'circle',
        dots: [
          { id: 'top', x: 150, y: 50 },
          { id: 'bottom', x: 150, y: 250 },
          { id: 'left', x: 50, y: 150 },
          { id: 'right', x: 250, y: 150 }
        ],
        preexistingCuts: [
          ['top', 'bottom']
        ],
        requiredCuts: [
          ['left', 'right']
        ],
        size: 280
      }
    ],
    correctAnswerText: JSON.stringify({ isCorrect: 'true' }),
    validation: { type: 'exact', answer: { isCorrect: 'true' } },
    solution,
    adaptiveConfig: {
      logic_type: 'visual_models_cut_circle_fourths',
      variables: { seed: params.seed }
    }
  };
}

function generateCutRectangleHalvesDifferent(params, random) {
  const questionText = "Cut the rectangle into halves a different way.";

  const preexistingSvg = `<svg viewBox="0 0 300 300" width="180" height="180" style="margin: 10px 0;"><rect x="50" y="50" width="200" height="200" rx="12" fill="#c084fc" stroke="#7c3aed" stroke-width="4" /><line x1="50" y1="250" x2="250" y2="50" stroke="#ffffff" stroke-width="4" /></svg>`;

  const solutionSvg = `<svg viewBox="0 0 300 300" width="220" height="220"><rect x="50" y="50" width="200" height="200" rx="12" fill="#c084fc" stroke="#7c3aed" stroke-width="4" /><line x1="50" y1="50" x2="250" y2="250" stroke="#ffffff" stroke-width="4" /><text x="100" y="180" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">1</text><text x="200" y="130" font-size="28" font-weight="900" fill="#ffffff" text-anchor="middle">2</text></svg>`;

  const solution = [
    {
      type: 'section',
      label: 'solve',
      parts: [
        { type: 'text', content: "Halves means 2 equal parts." },
        { type: 'text', content: "This rectangle is cut into 2 equal parts." },
        {
          type: 'group',
          direction: 'row',
          style: { justifyContent: 'center', margin: '14px 0' },
          parts: [{ type: 'svg', content: solutionSvg }]
        },
        { type: 'text', content: "It is cut into halves a different way." }
      ]
    }
  ];

  return {
    id: `q_frac_cut_rect_half_diff_${uid()}`,
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: "This rectangle is cut into halves.", style: { fontWeight: 600 } },
      { type: 'svg', content: preexistingSvg },
      { type: 'text', content: "Cut the rectangle into halves a different way.", style: { fontWeight: 900, marginTop: 14 } },
      {
        type: 'interactive_fraction_cutter',
        shape: 'rectangle',
        dots: [
          { id: 'top-left', x: 50, y: 50 },
          { id: 'top-right', x: 250, y: 50 },
          { id: 'bottom-left', x: 50, y: 250 },
          { id: 'bottom-right', x: 250, y: 250 }
        ],
        requiredCuts: [
          ['top-left', 'bottom-right']
        ],
        size: 280
      }
    ],
    correctAnswerText: JSON.stringify({ isCorrect: 'true' }),
    validation: { type: 'exact', answer: { isCorrect: 'true' } },
    solution,
    adaptiveConfig: {
      logic_type: 'visual_models_cut_rectangle_halves_different',
      variables: { seed: params.seed }
    }
  };
}
