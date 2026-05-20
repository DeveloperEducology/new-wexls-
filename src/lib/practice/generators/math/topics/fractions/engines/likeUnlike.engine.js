import { createSeededRandom, getRandomInt } from '../shared/mathCore.js';

let _uid = 0;
const uid = () => `${Date.now()}_${++_uid}`;

export const likeUnlikeEngine = (config) => {
  const { engineParams = {}, adaptiveConfig = {}, variables = {} } = config || {};
  const safeAdaptiveConfig = adaptiveConfig || {};
  const resolvedVars = { ...variables, ...(safeAdaptiveConfig.variables || {}) };
  const params = { ...engineParams, ...resolvedVars };

  const seed = params.seed || `like_unlike_${Date.now()}`;
  const random = createSeededRandom(seed);

  const subType = params.subType || 'like_unlike';

  if (subType === 'like_unlike' || subType === 'fractions.compare.likeUnlike') {
    return generateLikeUnlikeCompare(params, random);
  } else if (subType === 'identify_like' || subType === 'fractions.identify.likeFractions') {
    return generateIdentifyLike(params, random);
  } else if (subType === 'identify_unlike' || subType === 'fractions.identify.unlikeFractions') {
    return generateIdentifyUnlike(params, random);
  } else {
    throw new Error(`[LikeUnlikeEngine] Unsupported subType: ${subType}`);
  }
};

function generateLikeUnlikeCompare(params, random) {
  const isLike = random() > 0.5;
  const numFractions = getRandomInt(2, 3, random);
  
  let fractionsList = [];
  let explanation = '';

  if (isLike) {
    const denom = getRandomInt(3, 20, random);
    const numerators = new Set();
    while (numerators.size < numFractions) {
      numerators.add(getRandomInt(1, denom - 1, random));
    }
    fractionsList = Array.from(numerators).map(num => ({ num, denom }));
    explanation = `Like fractions are fractions that have the same denominator (the bottom number). All of these fractions have a denominator of **${denom}**, so they are **like fractions**.`;
  } else {
    const denoms = new Set();
    while (denoms.size < numFractions) {
      denoms.add(getRandomInt(3, 20, random));
    }
    fractionsList = Array.from(denoms).map(denom => ({
      num: getRandomInt(1, denom - 1, random),
      denom
    }));
    explanation = `Unlike fractions are fractions that have different denominators (the bottom number). These fractions have denominators of **${fractionsList.map(f => f.denom).join(', ')}**, which are different, so they are **unlike fractions**.`;
  }

  const latexList = fractionsList.map(f => `\\frac{${f.num}}{${f.denom}}`).join(', \\quad ');

  const options = [
    { id: 'opt_like', label: 'Like fractions', isCorrect: isLike },
    { id: 'opt_unlike', label: 'Unlike fractions', isCorrect: !isLike }
  ];

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: explanation }
      ]
    }
  ];

  return {
    id: `q_frac_like_unlike_comp_${uid()}`,
    type: 'mcq',
    questionText: 'Are these like or unlike fractions?',
    parts: [
      { type: 'text', content: 'Are these like or unlike fractions?', style: { fontWeight: 900 } },
      { type: 'latex', content: latexList, style: { margin: '20px 0' } }
    ],
    options,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    layoutConfig: { partsDirection: 'column' },
    adaptiveConfig: {
      logic_type: 'fractions.compare.likeUnlike',
      variables: { isLike, numFractions, seed: params.seed }
    }
  };
}

function generateIdentifyLike(params, random) {
  const targetDenom = getRandomInt(3, 20, random);
  const targetNum = getRandomInt(1, targetDenom - 1, random);

  // Correct answer: same denominator, different numerator
  let correctNum = getRandomInt(1, targetDenom - 1, random);
  while (correctNum === targetNum) {
    correctNum = getRandomInt(1, targetDenom - 1, random);
  }

  // 3 distractors: different denominators
  const distractorDenoms = new Set();
  while (distractorDenoms.size < 3) {
    const d = getRandomInt(3, 20, random);
    if (d !== targetDenom) {
      distractorDenoms.add(d);
    }
  }

  const distractors = Array.from(distractorDenoms).map(d => ({
    num: getRandomInt(1, d - 1, random),
    denom: d
  }));

  const options = [
    {
      id: 'opt_correct',
      type: 'latex',
      label: `\\frac{${correctNum}}{${targetDenom}}`,
      isCorrect: true
    },
    ...distractors.map((dist, idx) => ({
      id: `opt_distractor_${idx}`,
      type: 'latex',
      label: `\\frac{${dist.num}}{${dist.denom}}`,
      isCorrect: false
    }))
  ];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `Like fractions have the **same denominator** (the bottom number).` },
        { type: 'text', content: `The target fraction is $\\frac{${targetNum}}{${targetDenom}}$ which has a denominator of **${targetDenom}**.` },
        { type: 'text', content: `Look at the options to find the one with the denominator of **${targetDenom}**:` },
        { type: 'latex', content: `\\frac{${correctNum}}{${targetDenom}}` }
      ]
    }
  ];

  return {
    id: `q_frac_id_like_${uid()}`,
    type: 'mcq',
    questionText: `Which fraction is a like fraction to \\frac{${targetNum}}{${targetDenom}}?`,
    parts: [
      { type: 'text', content: 'Which fraction is a like fraction to:', style: { fontWeight: 900 } },
      { type: 'latex', content: `\\frac{${targetNum}}{${targetDenom}}`, style: { margin: '12px 0' } }
    ],
    options,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    layoutConfig: { partsDirection: 'column' },
    adaptiveConfig: {
      logic_type: 'fractions.identify.likeFractions',
      variables: { targetNum, targetDenom, correctNum, seed: params.seed }
    }
  };
}

function generateIdentifyUnlike(params, random) {
  const targetDenom = getRandomInt(3, 20, random);
  const targetNum = getRandomInt(1, targetDenom - 1, random);

  // Correct answer: different denominator
  let correctDenom = getRandomInt(3, 20, random);
  while (correctDenom === targetDenom) {
    correctDenom = getRandomInt(3, 20, random);
  }
  const correctNum = getRandomInt(1, correctDenom - 1, random);

  // 3 distractors: same denominator, different numerators
  const distractorNums = new Set();
  while (distractorNums.size < 3 && distractorNums.size < targetDenom - 2) {
    const n = getRandomInt(1, targetDenom - 1, random);
    if (n !== targetNum) {
      distractorNums.add(n);
    }
  }
  // Fallback if denominator is too small to have 3 distinct numerators
  while (distractorNums.size < 3) {
    distractorNums.add(getRandomInt(1, 100, random)); // allow improper/larger values if needed, or we just pad
  }

  const options = [
    {
      id: 'opt_correct',
      type: 'latex',
      label: `\\frac{${correctNum}}{${correctDenom}}`,
      isCorrect: true
    },
    ...Array.from(distractorNums).map((num, idx) => ({
      id: `opt_distractor_${idx}`,
      type: 'latex',
      label: `\\frac{${num}}{${targetDenom}}`,
      isCorrect: false
    }))
  ];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  const correctIdx = options.findIndex(o => o.isCorrect);

  const solution = [
    {
      type: 'section',
      label: 'explanation',
      parts: [
        { type: 'text', content: `Unlike fractions have **different denominators** (the bottom number).` },
        { type: 'text', content: `The target fraction is $\\frac{${targetNum}}{${targetDenom}}$ which has a denominator of **${targetDenom}**.` },
        { type: 'text', content: `Look at the options to find the one with a denominator **other than ${targetDenom}**:` },
        { type: 'latex', content: `\\frac{${correctNum}}{${correctDenom}}` }
      ]
    }
  ];

  return {
    id: `q_frac_id_unlike_${uid()}`,
    type: 'mcq',
    questionText: `Which fraction is an unlike fraction to \\frac{${targetNum}}{${targetDenom}}?`,
    parts: [
      { type: 'text', content: 'Which fraction is an unlike fraction to:', style: { fontWeight: 900 } },
      { type: 'latex', content: `\\frac{${targetNum}}{${targetDenom}}`, style: { margin: '12px 0' } }
    ],
    options,
    correctAnswerIndex: correctIdx,
    validation: { type: 'exact', answer: correctIdx },
    solution,
    layoutConfig: { partsDirection: 'column' },
    adaptiveConfig: {
      logic_type: 'fractions.identify.unlikeFractions',
      variables: { targetNum, targetDenom, correctDenom, correctNum, seed: params.seed }
    }
  };
}
