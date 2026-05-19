/**
 * Engine for generating and validating Ratio Chapter Questions
 */

import {
  gcd,
  gcdArray,
  lcm,
  lcmArray,
  simplifyRatio,
  areEquivalentRatio,
  scaleRatio,
  randomInt,
  pickRandom,
  shuffle,
  buildOptions,
  parseRatioString,
  createSeededRng,
  seededRandomInt,
  seededPick,
  seededShuffle
} from './utils.js';

import { RATIO_MISCONCEPTIONS } from './misconceptions.js';
import { RATIO_THEMES, SAME_KIND_PAIRS, UNLIKE_KIND_PAIRS, ERROR_ANALYSIS_NAMES, ERROR_MISTAKES, SCENARIOS_WORD_PROBLEMS } from './data.js';

import { RATIO_MICRO_SKILLS } from './microSkills.js';
import { RATIO_COMPETENCY_GRAPH } from './competencyGraph.js';
import { RATIO_LEARNING_PROGRESSION } from './progression.js';
import { RATIO_DIFFICULTY_PROFILES, mapDifficultyToProfile } from './difficulty.js';
import { buildObjectCountVisual, buildRatioBarVisual, buildRatioTableVisual, buildNumberLineVisual } from './visualSchemas.js';
import { RATIO_GENERATOR_CONSTRAINTS, applyRatioConstraints } from './constraints.js';
import { RATIO_REMEDIATION_LADDERS } from './remediationLadders.js';
import { buildMCQInteraction, buildFillBlankInteraction, buildMatchingInteraction, buildSortingInteraction, buildDragDropInteraction } from './interactionSchemas.js';
import { buildAttemptAnalytics } from './analytics.js';

// Local helpers to avoid circular dependencies with registry.js
function localGetSkillByTemplate(templateId) {
  for (const [skillId, skill] of Object.entries(RATIO_MICRO_SKILLS)) {
    if (skill.templates.includes(templateId)) {
      return skillId;
    }
  }
  return null;
}

function localGetNextSkill(currentSkillId, result = {}) {
  if (!result.isCorrect && result.detectedMisconception) {
    return "ratio_remediation";
  }
  const progression = RATIO_LEARNING_PROGRESSION;
  let currentLevelIndex = -1;
  for (let i = 0; i < progression.length; i++) {
    if (progression[i].microSkills.includes(currentSkillId)) {
      currentLevelIndex = i;
      break;
    }
  }
  if (currentLevelIndex === -1) {
    return progression[0].microSkills[0];
  }
  if (result.isCorrect) {
    const currentLevelSkills = progression[currentLevelIndex].microSkills;
    const currentSkillIndexInLevel = currentLevelSkills.indexOf(currentSkillId);
    if (currentSkillIndexInLevel < currentLevelSkills.length - 1) {
      return currentLevelSkills[currentSkillIndexInLevel + 1];
    } else {
      const nextLevelIndex = currentLevelIndex + 1;
      if (nextLevelIndex < progression.length) {
        return progression[nextLevelIndex].microSkills[0];
      }
    }
  }
  return currentSkillId;
}

// Seeded random helper mapping to createSeededRng
function createSeededRandom(seed) {
  return createSeededRng(seed);
}

// Helper to format solutions
function makeSolution(steps) {
  return {
    sections: steps.map(step => ({ type: "text", content: step }))
  };
}

// -------------------------------------------------------------
// TEMPLATE GENERATORS
// -------------------------------------------------------------

// 1. ratio_identify_from_words
export function ratio_identify_from_words(rng, difficulty) {
  const theme = pickRandom(RATIO_THEMES, rng);
  let countA, countB;
  if (difficulty === 'easy') {
    countA = randomInt(2, 10, rng);
    countB = randomInt(2, 10, rng);
  } else if (difficulty === 'medium') {
    countA = randomInt(10, 30, rng);
    countB = randomInt(10, 30, rng);
  } else {
    countA = randomInt(30, 90, rng);
    countB = randomInt(30, 90, rng);
  }
  while (countA === countB) {
    countB = randomInt(2, 90, rng);
  }

  const questionText = `There are ${countA} ${theme.pluralA} and ${countB} ${theme.pluralB} in a bag. What is the ratio of ${theme.pluralA} to ${theme.pluralB}?`;
  const correctAnswer = `${countA}:${countB}`;
  
  const distractors = [
    `${countB}:${countA}`, // Order confusion
    `${countA}:${countA + countB}`, // Part-to-whole
    `${countA + countB}:${countB}`, // Whole-to-part
    `${countA}+${countB}`,
    `${countA}-${countB}`
  ];

  const options = buildOptions(correctAnswer, distractors, rng);
  const parts = [];
  if (difficulty === 'easy') {
    parts.push({
      type: 'text',
      content: `**${theme.pluralA} (${theme.emojiA}):** ${Array(countA).fill(theme.emojiA).join('  ')}\n\n**${theme.pluralB} (${theme.emojiB}):** ${Array(countB).fill(theme.emojiB).join('  ')}\n\n`
    });
  }

  return {
    type: 'mcq',
    questionText,
    parts,
    options,
    correctAnswer,
    explanation: `To find the ratio of ${theme.pluralA} to ${theme.pluralB}, we write the number of ${theme.pluralA} first (${countA}), followed by a colon (:), and then the number of ${theme.pluralB} second (${countB}). This gives us ${countA}:${countB}.`,
    solutionSteps: [
      `1. Identify the number of ${theme.pluralA}: ${countA}`,
      `2. Identify the number of ${theme.pluralB}: ${countB}`,
      `3. Write them as a ratio in the requested order: ${countA}:${countB}`
    ],
    visualData: {
      type: "object_count",
      items: [
        { label: theme.pluralA, emoji: theme.emojiA, count: countA },
        { label: theme.pluralB, emoji: theme.emojiB, count: countB }
      ]
    },
    metadata: {
      numbers: [countA, countB],
      misconceptionCode: RATIO_MISCONCEPTIONS.ORDER_CONFUSION,
      level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      estimatedTime: 30,
      tags: ["ratio", "words", "identification"]
    }
  };
}

// 2. ratio_same_kind_check
export function ratio_same_kind_check(rng, difficulty) {
  const isSame = rng() > 0.5;
  const pair = isSame ? pickRandom(SAME_KIND_PAIRS, rng) : pickRandom(UNLIKE_KIND_PAIRS, rng);

  const questionText = `Can we express the comparison of ${pair.valA} ${pair.unitA} and ${pair.valB} ${pair.unitB} as a ratio?`;
  const correctAnswer = pair.sameKind ? "Yes" : "No, because the quantities are not of the same kind";
  
  const options = [
    "Yes",
    "No, because the quantities are not of the same kind",
    "No, because ratios must have different units",
    "Yes, but only if we multiply them first"
  ];

  return {
    type: 'mcq',
    questionText,
    options: shuffle(options, rng),
    correctAnswer,
    explanation: pair.sameKind 
      ? `Yes. Ratios compare quantities of the same kind. Here, both ${pair.unitA} and ${pair.unitB} represent the same kind of physical quantity (${pair.reason}).`
      : `No. A ratio compares two quantities of the *same* kind. Since ${pair.unitA} and ${pair.unitB} represent different kinds of quantities (${pair.reason}), we cannot compare them using a ratio.`,
    solutionSteps: [
      `1. Check the unit of the first quantity: ${pair.unitA}`,
      `2. Check the unit of the second quantity: ${pair.unitB}`,
      `3. Check if they measure the same kind of quantity: ${pair.sameKind ? "Yes" : "No"}`,
      `4. Conclusion: ${correctAnswer}`
    ],
    visualData: null,
    metadata: {
      numbers: [pair.valA, pair.valB],
      misconceptionCode: RATIO_MISCONCEPTIONS.UNLIKE_QUANTITIES_CONFUSION,
      level: difficulty === 'easy' ? 1 : 2,
      estimatedTime: 25,
      tags: ["ratio", "kind", "comparison"]
    }
  };
}

// 3. ratio_subtraction_vs_division
export function ratio_subtraction_vs_division(rng, difficulty) {
  const isSubtraction = rng() > 0.5;
  let valA, valB, diff, times;
  
  if (difficulty === 'easy') {
    valA = 12;
    valB = 8;
  } else {
    valA = randomInt(15, 40, rng);
    valB = randomInt(5, 14, rng);
  }
  diff = valA - valB;
  times = (valA / valB).toFixed(1);

  const statement = isSubtraction 
    ? `"${valA} is ${diff} more than ${valB}."`
    : `"${valA} is ${times} times as much as ${valB}."`;
    
  const questionText = `The comparison statement ${statement} is a comparison by:`;
  const correctAnswer = isSubtraction ? "Subtraction (Difference)" : "Division (Ratio)";
  
  const options = ["Subtraction (Difference)", "Division (Ratio)"];

  return {
    type: 'mcq',
    questionText,
    options,
    correctAnswer,
    explanation: isSubtraction 
      ? `This statement compares the two numbers by subtraction because it tells us the difference (${diff}) between them.`
      : `This statement compares the two numbers by division because it tells us how many times (ratio of ${times}) one contains the other.`,
    solutionSteps: [
      `1. Look at the statement: ${statement}`,
      `2. Determine if it uses the difference (addition/subtraction) or a multiplier (multiplication/division).`,
      `3. Statement describes: ${isSubtraction ? "difference" : "ratio / division"}`,
      `4. Correct comparison method: ${correctAnswer}`
    ],
    visualData: null,
    metadata: {
      numbers: [valA, valB],
      misconceptionCode: RATIO_MISCONCEPTIONS.SUBTRACTION_VS_RATIO_CONFUSION,
      level: difficulty === 'easy' ? 1 : 2,
      estimatedTime: 25,
      tags: ["ratio", "comparison", "difference"]
    }
  };
}

// 4. ratio_terms_antecedent_consequent
export function ratio_terms_antecedent_consequent(rng, difficulty) {
  const ant = randomInt(2, 15, rng);
  const cons = randomInt(2, 15, rng);
  const isAntecedent = rng() > 0.5;

  const questionText = isAntecedent 
    ? `In the ratio ${ant}:${cons}, what is the antecedent?`
    : `In the ratio ${ant}:${cons}, what is the consequent?`;
  
  const correctAnswer = isAntecedent ? String(ant) : String(cons);
  const options = buildOptions(correctAnswer, [String(ant), String(cons), String(ant + cons), "1"], rng);

  return {
    type: 'mcq',
    questionText,
    options,
    correctAnswer,
    explanation: isAntecedent 
      ? `In any ratio a:b, the first term 'a' is called the antecedent. Therefore, in the ratio ${ant}:${cons}, the antecedent is ${ant}.`
      : `In any ratio a:b, the second term 'b' is called the consequent. Therefore, in the ratio ${ant}:${cons}, the consequent is ${cons}.`,
    solutionSteps: [
      `1. Write down the terms of the ratio: First term (antecedent) = ${ant}, Second term (consequent) = ${cons}.`,
      `2. Identify the requested term: ${isAntecedent ? "Antecedent (first term)" : "Consequent (second term)"}.`,
      `3. The correct answer is ${correctAnswer}.`
    ],
    visualData: null,
    metadata: {
      numbers: [ant, cons],
      misconceptionCode: RATIO_MISCONCEPTIONS.ANTECEDENT_CONSEQUENT_CONFUSION,
      level: 1,
      estimatedTime: 20,
      tags: ["ratio", "terms", "vocabulary"]
    }
  };
}

// 5. ratio_simplify_two_terms
export function ratio_simplify_two_terms(rng, difficulty) {
  let a, b, factor;
  if (difficulty === 'easy') {
    a = randomInt(1, 5, rng);
    b = randomInt(1, 5, rng);
    while (gcd(a, b) > 1 || a === b) {
      b = randomInt(1, 5, rng);
    }
    factor = randomInt(2, 6, rng);
  } else if (difficulty === 'medium') {
    a = randomInt(3, 12, rng);
    b = randomInt(3, 12, rng);
    while (gcd(a, b) > 1 || a === b) {
      b = randomInt(3, 12, rng);
    }
    factor = randomInt(4, 9, rng);
  } else {
    a = randomInt(10, 25, rng);
    b = randomInt(10, 25, rng);
    while (gcd(a, b) > 1 || a === b) {
      b = randomInt(10, 25, rng);
    }
    factor = randomInt(8, 15, rng);
  }

  const origA = a * factor;
  const origB = b * factor;

  const questionText = `Simplify the ratio ${origA}:${origB} to its simplest form.`;

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: `Simplify ${origA}:${origB} = [blank:ant] : [blank:cons]` }
    ],
    correctAnswer: {
      ant: String(a),
      cons: String(b)
    },
    explanation: `To simplify a ratio, we divide both terms by their Highest Common Factor (HCF). The HCF of ${origA} and ${origB} is ${factor}. Dividing both terms by ${factor} gives ${a}:${b}.`,
    solutionSteps: [
      `1. Find the Highest Common Factor (HCF) of ${origA} and ${origB}: HCF = ${factor}`,
      `2. Divide the first term: ${origA} ÷ ${factor} = ${a}`,
      `3. Divide the second term: ${origB} ÷ ${factor} = ${b}`,
      `4. The simplified ratio is ${a}:${b}.`
    ],
    visualData: null,
    metadata: {
      numbers: [origA, origB, factor],
      misconceptionCode: RATIO_MISCONCEPTIONS.HCF_NOT_USED,
      level: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 2 : 3,
      estimatedTime: 35,
      tags: ["ratio", "simplification", "HCF"]
    }
  };
}

// 6. ratio_simplify_three_terms
export function ratio_simplify_three_terms(rng, difficulty) {
  let a, b, c, factor;
  if (difficulty === 'easy') {
    a = 2; b = 3; c = 4;
    factor = randomInt(2, 4, rng);
  } else if (difficulty === 'medium') {
    a = randomInt(1, 5, rng);
    b = randomInt(2, 6, rng);
    c = randomInt(3, 8, rng);
    while (gcdArray([a, b, c]) > 1 || a === b || b === c) {
      b = randomInt(2, 6, rng);
      c = randomInt(3, 8, rng);
    }
    factor = randomInt(3, 6, rng);
  } else {
    a = randomInt(4, 10, rng);
    b = randomInt(5, 12, rng);
    c = randomInt(6, 15, rng);
    while (gcdArray([a, b, c]) > 1 || a === b || b === c) {
      b = randomInt(5, 12, rng);
      c = randomInt(6, 15, rng);
    }
    factor = randomInt(5, 12, rng);
  }

  const origA = a * factor;
  const origB = b * factor;
  const origC = c * factor;

  const questionText = `Simplify the ratio ${origA}:${origB}:${origC} to its simplest form.`;

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: `Simplify ${origA}:${origB}:${origC} = [blank:t1] : [blank:t2] : [blank:t3]` }
    ],
    correctAnswer: {
      t1: String(a),
      t2: String(b),
      t3: String(c)
    },
    explanation: `To simplify a three-term ratio, divide all three terms by their Highest Common Factor (HCF). The HCF of ${origA}, ${origB}, and ${origC} is ${factor}. Dividing each term by ${factor} gives ${a}:${b}:${c}.`,
    solutionSteps: [
      `1. Find the HCF of the three terms ${origA}, ${origB}, and ${origC}: HCF = ${factor}`,
      `2. Divide each term by the HCF:`,
      `   - ${origA} ÷ ${factor} = ${a}`,
      `   - ${origB} ÷ ${factor} = ${b}`,
      `   - ${origC} ÷ ${factor} = ${c}`,
      `3. Write the simplified ratio: ${a}:${b}:${c}`
    ],
    visualData: null,
    metadata: {
      numbers: [origA, origB, origC, factor],
      misconceptionCode: RATIO_MISCONCEPTIONS.PARTIAL_SIMPLIFICATION,
      level: difficulty === 'easy' ? 2 : 3,
      estimatedTime: 45,
      tags: ["ratio", "three-terms", "simplification"]
    }
  };
}

// 7. ratio_equivalent_find
export function ratio_equivalent_find(rng, difficulty) {
  const a = randomInt(2, 6, rng);
  const b = randomInt(3, 9, rng);
  const factor = randomInt(3, 8, rng);

  const targetA = a * factor;
  const targetB = b * factor;

  const questionText = `Find an equivalent ratio of ${a}:${b} by multiplying both terms by ${factor}.`;

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: `Equivalent ratio: [blank:ant] : [blank:cons]` }
    ],
    correctAnswer: {
      ant: String(targetA),
      cons: String(targetB)
    },
    explanation: `To find an equivalent ratio by multiplying, multiply both the first term (antecedent) and the second term (consequent) by the given number. Thus, ${a} × ${factor} = ${targetA} and ${b} × ${factor} = ${targetB}, giving the equivalent ratio ${targetA}:${targetB}.`,
    solutionSteps: [
      `1. Start with the ratio ${a}:${b} and the multiplier ${factor}.`,
      `2. Multiply the antecedent: ${a} × ${factor} = ${targetA}`,
      `3. Multiply the consequent: ${b} × ${factor} = ${targetB}`,
      `4. Write the new ratio: ${targetA}:${targetB}`
    ],
    visualData: null,
    metadata: {
      numbers: [a, b, factor],
      misconceptionCode: RATIO_MISCONCEPTIONS.EQUIVALENT_RATIO_SCALING_ERROR,
      level: 1,
      estimatedTime: 30,
      tags: ["ratio", "equivalence", "multiplication"]
    }
  };
}

// 8. ratio_equivalent_check
export function ratio_equivalent_check(rng, difficulty) {
  const isEquivalent = rng() > 0.5;
  const a = randomInt(2, 6, rng);
  const b = randomInt(3, 9, rng);

  let c, d;
  if (isEquivalent) {
    const factor = randomInt(2, 6, rng);
    c = a * factor;
    d = b * factor;
  } else {
    c = randomInt(2, 20, rng);
    d = randomInt(2, 20, rng);
    while (areEquivalentRatio([a, b], [c, d])) {
      d = randomInt(2, 20, rng);
    }
  }

  const questionText = `Are the ratios ${a}:${b} and ${c}:${d} equivalent?`;
  const correctAnswer = isEquivalent ? "Yes" : "No";

  return {
    type: 'mcq',
    questionText,
    options: ["Yes", "No"],
    correctAnswer,
    explanation: isEquivalent
      ? `Yes. If we simplify both ratios, we get the same simplified ratio. Both ${a}:${b} and ${c}:${d} simplify to ${simplifyRatio([a, b]).join(':')}.`
      : `No. If we simplify both ratios, they do not match. ${a}:${b} simplifies to ${simplifyRatio([a, b]).join(':')}, while ${c}:${d} simplifies to ${simplifyRatio([c, d]).join(':')}.`,
    solutionSteps: [
      `1. Find the simplest form of the first ratio ${a}:${b}: ${simplifyRatio([a, b]).join(':')}`,
      `2. Find the simplest form of the second ratio ${c}:${d}: ${simplifyRatio([c, d]).join(':')}`,
      `3. Check if the simplest forms are equal: ${isEquivalent ? "Yes, they are equal" : "No, they are different"}`,
      `4. Conclusion: ${correctAnswer}`
    ],
    visualData: null,
    metadata: {
      numbers: [a, b, c, d],
      misconceptionCode: RATIO_MISCONCEPTIONS.EQUIVALENT_RATIO_SCALING_ERROR,
      level: difficulty === 'easy' ? 1 : 2,
      estimatedTime: 30,
      tags: ["ratio", "equivalence", "check"]
    }
  };
}

// 9. ratio_missing_value
export function ratio_missing_value(rng, difficulty) {
  const a = randomInt(2, 8, rng);
  const b = randomInt(3, 11, rng);
  const factor = randomInt(2, 8, rng);

  const A = a * factor;
  const B = b * factor;

  const blankPosition = randomInt(1, 4, rng); // 1: top-left, 2: bottom-left, 3: top-right, 4: bottom-right
  let questionText = "";
  let correctAnswer = "";

  if (blankPosition === 1) {
    questionText = `Solve for the missing value: __ : ${b} = ${A} : ${B}`;
    correctAnswer = String(a);
  } else if (blankPosition === 2) {
    questionText = `Solve for the missing value: ${a} : __ = ${A} : ${B}`;
    correctAnswer = String(b);
  } else if (blankPosition === 3) {
    questionText = `Solve for the missing value: ${a} : ${b} = __ : ${B}`;
    correctAnswer = String(A);
  } else {
    questionText = `Solve for the missing value: ${a} : ${b} = ${A} : __`;
    correctAnswer = String(B);
  }

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText.replace("__", "[blank:ans]") }
    ],
    correctAnswer: { ans: correctAnswer },
    explanation: `To find the missing value, we determine the multiplier between the known corresponding terms. Since ${A} ÷ ${a} = ${factor}, the scaling factor is ${factor}. Thus, multiplying the other term by ${factor} gives us the missing value: ${correctAnswer}.`,
    solutionSteps: [
      `1. Find the known pair of corresponding terms.`,
      `2. Calculate the scaling factor by dividing: e.g., ${A} ÷ ${a} = ${factor}`,
      `3. Apply the same scaling factor to find the missing term: ${correctAnswer}`
    ],
    visualData: null,
    metadata: {
      numbers: [a, b, A, B, factor],
      misconceptionCode: RATIO_MISCONCEPTIONS.MISSING_VALUE_CROSS_MULTIPLY_ERROR,
      level: difficulty === 'easy' ? 2 : 3,
      estimatedTime: 40,
      tags: ["ratio", "missing-value", "equivalence"]
    }
  };
}

// 10. ratio_fraction_to_whole
export function ratio_fraction_to_whole(rng, difficulty) {
  // Generate simple fraction ratios
  let d1 = randomInt(2, 6, rng);
  let d2 = randomInt(2, 6, rng);
  while (d1 === d2) {
    d2 = randomInt(2, 6, rng);
  }
  let n1 = randomInt(1, d1 - 1, rng);
  let n2 = randomInt(1, d2 - 1, rng);

  const denomLcm = lcm(d1, d2);
  const term1 = (denomLcm / d1) * n1;
  const term2 = (denomLcm / d2) * n2;
  const simplified = simplifyRatio([term1, term2]);

  const questionText = `Simplify the ratio of fractions \\frac{${n1}}{${d1}} : \\frac{${n2}}{${d2}} to its simplest whole number form.`;

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: `$$\\frac{${n1}}{${d1}} : \\frac{${n2}}{${d2}} =$$ [blank:ant] : [blank:cons]` }
    ],
    correctAnswer: {
      ant: String(simplified[0]),
      cons: String(simplified[1])
    },
    explanation: `To simplify a ratio of fractions, first find the Lowest Common Multiple (LCM) of the denominators (${d1} and ${d2}), which is ${denomLcm}. Multiply both fractions by this LCM to convert them to whole numbers: \\frac{${n1}}{${d1}} × ${denomLcm} = ${term1} and \\frac{${n2}}{${d2}} × ${denomLcm} = ${term2}. This gives the ratio ${term1}:${term2}. Finally, simplify it to get ${simplified[0]}:${simplified[1]}.`,
    solutionSteps: [
      `1. Find the LCM of the denominators ${d1} and ${d2}: LCM = ${denomLcm}`,
      `2. Multiply both terms by the LCM:`,
      `   - Term 1: ( ${n1} / ${d1} ) × ${denomLcm} = ${term1}`,
      `   - Term 2: ( ${n2} / ${d2} ) × ${denomLcm} = ${term2}`,
      `3. Simplify the resulting ratio ${term1}:${term2} using their HCF:`,
      `   - Simplified: ${simplified[0]}:${simplified[1]}`
    ],
    visualData: null,
    metadata: {
      numbers: [n1, d1, n2, d2, denomLcm],
      misconceptionCode: RATIO_MISCONCEPTIONS.FRACTION_RATIO_LCM_ERROR,
      level: 3,
      estimatedTime: 50,
      tags: ["ratio", "fractions", "lcm"]
    }
  };
}

// 11. ratio_visual_count
export function ratio_visual_count(rng, difficulty) {
  const theme = pickRandom(RATIO_THEMES, rng);
  const countA = randomInt(2, 6, rng);
  const countB = randomInt(2, 6, rng);
  
  const simplified = simplifyRatio([countA, countB]);

  const questionText = `What is the ratio of ${theme.pluralA} to ${theme.pluralB} in simplest form?`;

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { 
        type: 'text', 
        content: `**${theme.pluralA} (${theme.emojiA}):** ${Array(countA).fill(theme.emojiA).join('  ')}\n\n**${theme.pluralB} (${theme.emojiB}):** ${Array(countB).fill(theme.emojiB).join('  ')}\n\n` 
      },
      { type: 'text', content: `Ratio: [blank:ant] : [blank:cons]` }
    ],
    correctAnswer: {
      ant: String(simplified[0]),
      cons: String(simplified[1])
    },
    explanation: `Counting the items in the visual model, we see ${countA} ${theme.pluralA} and ${countB} ${theme.pluralB}. The raw ratio is ${countA}:${countB}. Simplifying by dividing both terms by their HCF of ${gcd(countA, countB)} gives the final answer of ${simplified[0]}:${simplified[1]}.`,
    solutionSteps: [
      `1. Count the number of ${theme.pluralA}: ${countA}`,
      `2. Count the number of ${theme.pluralB}: ${countB}`,
      `3. Write the raw ratio: ${countA}:${countB}`,
      `4. Divide both terms by their HCF to get the simplest form: ${simplified[0]}:${simplified[1]}`
    ],
    visualData: {
      type: "object_count",
      items: [
        { label: theme.pluralA, emoji: theme.emojiA, count: countA },
        { label: theme.pluralB, emoji: theme.emojiB, count: countB }
      ]
    },
    metadata: {
      numbers: [countA, countB],
      misconceptionCode: RATIO_MISCONCEPTIONS.HCF_NOT_USED,
      level: 1,
      estimatedTime: 25,
      tags: ["ratio", "visual", "counting"]
    }
  };
}

// 12. ratio_word_problem_basic
export function ratio_word_problem_basic(rng, difficulty) {
  const scenario = pickRandom(SCENARIOS_WORD_PROBLEMS, rng);
  let valA, valB;
  if (difficulty === 'easy') {
    valA = randomInt(2, 10, rng);
    valB = randomInt(2, 10, rng);
  } else {
    valA = randomInt(10, 40, rng);
    valB = randomInt(10, 40, rng);
  }
  while (valA === valB) {
    valB = randomInt(2, 40, rng);
  }

  const questionText = scenario.template.replace("{valA}", valA).replace("{valB}", valB) + " (Write the ratio in simplest form)";
  const simplified = simplifyRatio([valA, valB]);

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: `Simplest ratio: [blank:ant] : [blank:cons]` }
    ],
    correctAnswer: {
      ant: String(simplified[0]),
      cons: String(simplified[1])
    },
    explanation: `The count of ${scenario.typeA} is ${valA} and the count of ${scenario.typeB} is ${valB}. This forms the initial ratio of ${valA}:${valB}. Dividing by their HCF of ${gcd(valA, valB)} simplifies the ratio to ${simplified[0]}:${simplified[1]}.`,
    solutionSteps: [
      `1. Find quantity of first item: ${valA}`,
      `2. Find quantity of second item: ${valB}`,
      `3. Simplify the ratio of ${valA}:${valB}:`,
      `   - Final simplified ratio: ${simplified[0]}:${simplified[1]}`
    ],
    visualData: null,
    metadata: {
      numbers: [valA, valB],
      misconceptionCode: RATIO_MISCONCEPTIONS.HCF_NOT_USED,
      level: difficulty === 'easy' ? 1 : 2,
      estimatedTime: 35,
      tags: ["ratio", "word-problem", "simplification"]
    }
  };
}

// 13. ratio_error_analysis
export function ratio_error_analysis(rng, difficulty) {
  const name = pickRandom(ERROR_ANALYSIS_NAMES, rng);
  const mistake = pickRandom(ERROR_MISTAKES, rng);
  
  let a = 18, b = 24; // Base example
  if (difficulty !== 'easy') {
    a = randomInt(12, 36, rng);
    b = randomInt(12, 36, rng);
    while (gcd(a, b) <= 2) {
      b = randomInt(12, 36, rng);
    }
  }

  const wrongAnswer = mistake.wrongSolve(a, b, 2);
  const correctAnswer = simplifyRatio([a, b]).join(':');
  
  const questionText = `${name} was asked to simplify the ratio ${a}:${b}. They wrote ${wrongAnswer} as their answer. What mistake did ${name} make?`;
  
  const correctOption = mistake.text;
  const distractors = ERROR_MISTAKES.filter(m => m.type !== mistake.type).map(m => m.text);
  
  const options = buildOptions(correctOption, distractors, rng);

  return {
    type: 'mcq',
    questionText,
    options,
    correctAnswer: correctOption,
    explanation: `The ratio ${a}:${b} simplified completely is ${correctAnswer}. ${name} wrote ${wrongAnswer}, which matches the error where they ${mistake.text}`,
    solutionSteps: [
      `1. Simplify the original ratio ${a}:${b} to its correct simplest form: ${correctAnswer}.`,
      `2. Compare the student's answer (${wrongAnswer}) with the correct answer.`,
      `3. Identify the student's mathematical error: ${correctOption}`
    ],
    visualData: null,
    metadata: {
      numbers: [a, b],
      misconceptionCode: mistake.type,
      level: 2,
      estimatedTime: 40,
      tags: ["ratio", "error-analysis", "debugging"]
    }
  };
}

// 14. ratio_table_completion
export function ratio_table_completion(rng, difficulty) {
  const baseAnt = randomInt(2, 5, rng);
  const baseCons = randomInt(3, 7, rng);
  
  const col1 = [baseAnt, baseCons];
  const col2 = [baseAnt * 2, baseCons * 2];
  const col3 = [baseAnt * 3, baseCons * 3];

  const blankRow = randomInt(0, 1, rng); // 0: top row, 1: bottom row
  let missingVal;
  
  if (blankRow === 0) {
    missingVal = col2[0];
    col2[0] = "__";
  } else {
    missingVal = col2[1];
    col2[1] = "__";
  }

  const tableMarkdown = `
| Category | Value 1 | Value 2 | Value 3 |
| :--- | :---: | :---: | :---: |
| **A** | ${col1[0]} | ${col2[0]} | ${col3[0]} |
| **B** | ${col1[1]} | ${col2[1]} | ${col3[1]} |
`;

  const questionText = `Complete the ratio table so that the relationship remains equivalent:`;

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: questionText },
      { type: 'text', content: tableMarkdown.replace("__", "[blank:ans]") }
    ],
    correctAnswer: { ans: String(missingVal) },
    explanation: `A ratio table represents equivalent ratios. Looking at the columns, the values are scaled by multiplying the first column by 2. Thus, the missing value is ${blankRow === 0 ? baseAnt : baseCons} × 2 = ${missingVal}.`,
    solutionSteps: [
      `1. Find the ratio of the first column: ${col1[0]}:${col1[1]}`,
      `2. Find the multiplier for the second column: multiplier is 2`,
      `3. Multiply the corresponding value in the first column by 2 to get the missing term: ${missingVal}`
    ],
    visualData: null,
    metadata: {
      numbers: [baseAnt, baseCons, missingVal],
      misconceptionCode: RATIO_MISCONCEPTIONS.MISSING_VALUE_CROSS_MULTIPLY_ERROR,
      level: 2,
      estimatedTime: 35,
      tags: ["ratio", "table", "equivalence"]
    }
  };
}

// 15. ratio_sorting
export function ratio_sorting(rng, difficulty) {
  const baseAnt = randomInt(2, 4, rng);
  const baseCons = randomInt(3, 5, rng);

  const targetRatioStr = `${baseAnt}:${baseCons}`;

  const eq1 = `${baseAnt * 2}:${baseCons * 2}`;
  const eq2 = `${baseAnt * 3}:${baseCons * 3}`;
  
  const neq1 = `${baseAnt}:${baseCons + 1}`;
  const neq2 = `${baseCons}:${baseAnt}`; // inverted order

  const items = [
    { id: "i1", content: eq1, category: `Equivalent to ${targetRatioStr}` },
    { id: "i2", content: eq2, category: `Equivalent to ${targetRatioStr}` },
    { id: "i3", content: neq1, category: `Not Equivalent to ${targetRatioStr}` },
    { id: "i4", content: neq2, category: `Not Equivalent to ${targetRatioStr}` }
  ];

  const shuffledItems = shuffle(items, rng).map(it => ({
    id: it.id,
    content: it.content,
    type: 'text'
  }));

  const questionText = `Sort the ratios into the correct categories based on whether they are equivalent to ${targetRatioStr}.`;

  return {
    type: 'sorting',
    questionText,
    parts: [
      { type: 'text', content: questionText }
    ],
    items: shuffledItems,
    categories: [
      `Equivalent to ${targetRatioStr}`,
      `Not Equivalent to ${targetRatioStr}`
    ],
    correctAnswer: {
      "i1": `Equivalent to ${targetRatioStr}`,
      "i2": `Equivalent to ${targetRatioStr}`,
      "i3": `Not Equivalent to ${targetRatioStr}`,
      "i4": `Not Equivalent to ${targetRatioStr}`
    },
    explanation: `Simplifying each ratio: ${eq1} and ${eq2} simplify to ${targetRatioStr}, so they are equivalent. Ratios ${neq1} and ${neq2} do not simplify to ${targetRatioStr}, so they are not equivalent.`,
    solutionSteps: [
      `1. Simplify each ratio to its simplest form.`,
      `2. Compare with the target ratio ${targetRatioStr}.`,
      `3. Group them into 'Equivalent' and 'Not Equivalent' categories accordingly.`
    ],
    visualData: null,
    metadata: {
      numbers: [baseAnt, baseCons],
      misconceptionCode: RATIO_MISCONCEPTIONS.EQUIVALENT_RATIO_SCALING_ERROR,
      level: 2,
      estimatedTime: 45,
      tags: ["ratio", "sorting", "equivalence"]
    }
  };
}

// 16. ratio_matching
export function ratio_matching(rng, difficulty) {
  const candidateRatios = [
    { a: 1, b: 2 },
    { a: 1, b: 3 },
    { a: 1, b: 4 },
    { a: 2, b: 3 },
    { a: 2, b: 5 },
    { a: 3, b: 4 },
    { a: 3, b: 5 },
    { a: 4, b: 5 },
    { a: 5, b: 6 },
    { a: 3, b: 7 },
    { a: 5, b: 7 },
    { a: 5, b: 8 }
  ];

  const chosenBases = shuffle(candidateRatios, rng).slice(0, 3);
  const distinctPairs = [];
  const correctAnswer = {};

  chosenBases.forEach((base, index) => {
    const multiplier = randomInt(2, 6, rng);
    const unsimplifiedAnt = base.a * multiplier;
    const unsimplifiedCons = base.b * multiplier;

    const leftContent = `${unsimplifiedAnt}:${unsimplifiedCons}`;
    const rightContent = `${base.a}:${base.b}`;

    distinctPairs.push({
      id: `p${index + 1}`,
      left: { content: leftContent },
      right: { content: rightContent }
    });

    correctAnswer[leftContent] = rightContent;
  });

  const questionText = "Match each ratio with its simplest form.";

  return {
    type: 'matching',
    questionText,
    parts: [
      { type: 'text', content: questionText }
    ],
    pairs: shuffle(distinctPairs, rng),
    correctAnswer,
    explanation: `Simplifying each ratio by dividing by their HCF: ` +
      distinctPairs.map(p => {
        const parts = p.left.content.split(':');
        const hcf = gcd(Number(parts[0]), Number(parts[1]));
        return `${p.left.content} (HCF = ${hcf}) reduces to ${p.right.content}`;
      }).join(', ') + '.',
    solutionSteps: [
      `1. Take each left-side ratio and find its HCF.`,
      `2. Divide both terms by their HCF to get the simplified ratio.`,
      `3. Drag each unsimplified ratio to its correct simplified form.`
    ],
    visualData: null,
    metadata: {
      numbers: [],
      misconceptionCode: RATIO_MISCONCEPTIONS.HCF_NOT_USED,
      level: 2,
      estimatedTime: 40,
      tags: ["ratio", "matching", "simplification"]
    }
  };
}

// 17. ratio_units_concept
export function ratio_units_concept(rng, difficulty) {
  const valA = randomInt(2, 6, rng) * 5;
  const valB = valA * 2;
  const unit = pickRandom(["m", "cm", "kg", "litres"], rng);

  const questionText = `What is the ratio of ${valA} ${unit} to ${valB} ${unit}?`;
  const correctAnswer = `1:2`;

  const distractors = [
    `1:2 ${unit}`,
    `${valA}:${valB} ${unit}`,
    `1 ${unit} : 2 ${unit}`
  ];

  const options = buildOptions(correctAnswer, distractors, rng);

  return {
    type: 'mcq',
    questionText,
    options,
    correctAnswer,
    explanation: `A ratio is a comparison of two quantities of the same kind. Since both quantities are measured in the same unit (${unit}), the units cancel out during division. Therefore, a ratio has no units. The ratio is simply 1:2.`,
    solutionSteps: [
      `1. Write the initial comparison: ${valA} ${unit} : ${valB} ${unit}`,
      `2. Notice that the units are the same and cancel out.`,
      `3. Simplify the numbers: ${valA} ÷ ${valA} = 1, and ${valB} ÷ ${valA} = 2.`,
      `4. Write the final unit-less ratio: 1:2.`
    ],
    visualData: null,
    metadata: {
      numbers: [valA, valB],
      misconceptionCode: RATIO_MISCONCEPTIONS.UNIT_ATTACHED_TO_RATIO,
      level: 1,
      estimatedTime: 20,
      tags: ["ratio", "units", "concept"]
    }
  };
}

// 18. ratio_greater_comparison
export function ratio_greater_comparison(rng, difficulty) {
  // Compare 2:3 and 3:5
  // 2/3 = 0.666, 3/5 = 0.6
  // Or 3:4 (0.75) and 4:5 (0.8)
  const caseId = rng() > 0.5 ? 1 : 2;
  
  let r1, r2, correctGreater;
  if (caseId === 1) {
    r1 = "2:3";
    r2 = "3:5";
    correctGreater = "2:3";
  } else {
    r1 = "3:4";
    r2 = "4:5";
    correctGreater = "4:5";
  }

  const questionText = `Which ratio is greater: ${r1} or ${r2}?`;
  const options = [r1, r2, "They are equal"];

  return {
    type: 'mcq',
    questionText,
    options,
    correctAnswer: correctGreater,
    explanation: `To compare ratios, convert them to fractions: ${r1} = \\frac{${r1.split(':')[0]}}{${r1.split(':')[1]}} and ${r2} = \\frac{${r2.split(':')[0]}}{${r2.split(':')[1]}}. Express them with a common denominator to find which is larger. Thus, ${correctGreater} is the greater ratio.`,
    solutionSteps: [
      `1. Write the ratios as fractions: e.g., ${r1} = ${r1.replace(':', '/')}, and ${r2} = ${r2.replace(':', '/')}`,
      `2. Convert fractions to common denominators or decimals to compare.`,
      `3. Compare the values to find the greater one: ${correctGreater}`
    ],
    visualData: null,
    metadata: {
      numbers: [],
      misconceptionCode: RATIO_MISCONCEPTIONS.SUBTRACTION_VS_RATIO_CONFUSION,
      level: 3,
      estimatedTime: 40,
      tags: ["ratio", "comparison", "fractions"]
    }
  };
}

// 19. ratio_pattern_completion
export function ratio_pattern_completion(rng, difficulty) {
  const ant = randomInt(2, 4, rng);
  const cons = randomInt(3, 5, rng);

  const term1 = `${ant}:${cons}`;
  const term2 = `${ant * 2}:${cons * 2}`;
  const term3 = `${ant * 3}:${cons * 3}`;
  const targetTerm = `${ant * 4}:${cons * 4}`;

  const questionText = `Complete the equivalent ratio pattern: ${term1}, ${term2}, ${term3}, __`;

  return {
    type: 'fillInTheBlank',
    questionText,
    parts: [
      { type: 'text', content: `Complete the pattern: ${term1}, ${term2}, ${term3}, [blank:ans]` }
    ],
    correctAnswer: { ans: targetTerm },
    explanation: `The sequence lists equivalent ratios multiplied by 1, 2, 3, and so on. The next ratio is obtained by multiplying both terms by 4, giving ${ant * 4}:${cons * 4}.`,
    solutionSteps: [
      `1. Study the pattern: ${term1} (×1), ${term2} (×2), ${term3} (×3)`,
      `2. The next term must be scaled by multiplying both terms by 4.`,
      `3. Antecedent: ${ant} × 4 = ${ant * 4}. Consequent: ${cons} × 4 = ${cons * 4}.`,
      `4. The missing pattern term is ${targetTerm}.`
    ],
    visualData: null,
    metadata: {
      numbers: [ant, cons],
      misconceptionCode: RATIO_MISCONCEPTIONS.EQUIVALENT_RATIO_SCALING_ERROR,
      level: 2,
      estimatedTime: 30,
      tags: ["ratio", "pattern", "equivalence"]
    }
  };
}

// 20. ratio_remediation
export function ratio_remediation(rng, difficulty, misconceptionCode = null) {
  const code = misconceptionCode || pickRandom(Object.values(RATIO_MISCONCEPTIONS), rng);
  
  let questionText = "";
  let options = [];
  let correctAnswer = "";
  let explanation = "";

  if (code === RATIO_MISCONCEPTIONS.ORDER_CONFUSION) {
    questionText = "If you want the ratio of stars to triangles, which quantity must be written first in the ratio?";
    options = ["Number of stars", "Number of triangles", "Either one is fine"];
    correctAnswer = "Number of stars";
    explanation = "In ratios, order is extremely important. The term mentioned first in the question must be written first in the ratio.";
  } else if (code === RATIO_MISCONCEPTIONS.UNIT_ATTACHED_TO_RATIO) {
    questionText = "Does a ratio like 3:5 have a unit of measurement (such as kg or cm)?";
    options = ["No, ratios have no units", "Yes, it always takes the unit of the first term", "Yes, it combines both units"];
    correctAnswer = "No, ratios have no units";
    explanation = "Ratios are comparisons of similar quantities, so the units cancel out. A ratio is just a number and has no units.";
  } else {
    // Default fallback simple scaffolding
    questionText = "Which operation is used to compare two numbers as a ratio?";
    options = ["Division", "Subtraction", "Addition", "Multiplication"];
    correctAnswer = "Division";
    explanation = "Ratios represent comparison of two quantities by division.";
  }

  return {
    type: 'mcq',
    questionText,
    options: shuffle(options, rng),
    correctAnswer,
    explanation,
    solutionSteps: [
      `1. Read the conceptual question.`,
      `2. Recall the definition: ${explanation}`,
      `3. Choose the correct option: ${correctAnswer}`
    ],
    visualData: null,
    metadata: {
      numbers: [],
      misconceptionCode: code,
      level: 1,
      estimatedTime: 20,
      tags: ["ratio", "remediation", "scaffolding"]
    }
  };
}

const SHAPE_DEFS = {
  circle: {
    draw: (x, y, size, fill, stroke) => `<circle cx="${x + size/2}" cy="${y + size/2}" r="${size/2 - 4}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
  },
  square: {
    draw: (x, y, size, fill, stroke) => `<rect x="${x + 4}" y="${y + 4}" width="${size - 8}" height="${size - 8}" rx="6" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
  },
  rectangle: {
    draw: (x, y, size, fill, stroke) => `<rect x="${x + 4}" y="${y + size/4 + 2}" width="${size - 8}" height="${size/2 - 4}" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
  },
  triangle: {
    draw: (x, y, size, fill, stroke) => `<polygon points="${x + size/2},${y + 4} ${x + 4},${y + size - 4} ${x + size - 4},${y + size - 4}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
  },
  pentagon: {
    draw: (x, y, size, fill, stroke) => `<polygon points="${x + size/2},${y + 4} ${x + size - 4},${y + size * 0.4} ${x + size * 0.8},${y + size - 4} ${x + size * 0.2},${y + size - 4} ${x + 4},${y + size * 0.4}" fill="${fill}" stroke="${stroke}" stroke-width="2" />`
  }
};

const SHAPE_COLORS = {
  circle: { fill: "#d1fae5", stroke: "#059669" }, // emerald green
  triangle: { fill: "#e0f2fe", stroke: "#0284c7" }, // sky blue
  square: { fill: "#f3e8ff", stroke: "#9333ea" }, // purple
  rectangle: { fill: "#dbeafe", stroke: "#2563eb" }, // blue
  pentagon: { fill: "#fef9c3", stroke: "#ca8a04" } // yellow
};

export function generateVisualShapesSvg(items) {
  const size = 40;
  const gap = 10;
  const margin = 12;
  const rowHeight = 56;
  
  const maxCount = Math.max(...items.map(item => item.count));
  const svgWidth = margin * 2 + maxCount * (size + gap) - gap;
  const svgHeight = margin * 2 + items.length * rowHeight - (rowHeight - size);

  let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="max-width:100%; height:auto; display:block; margin: 12px 0;">`;

  items.forEach((item, rowIdx) => {
    const y = margin + rowIdx * rowHeight;
    const shapeDef = SHAPE_DEFS[item.shape] || SHAPE_DEFS.circle;
    for (let colIdx = 0; colIdx < item.count; colIdx++) {
      const x = margin + colIdx * (size + gap);
      svgContent += shapeDef.draw(x, y, size, item.fill, item.stroke);
    }
  });

  svgContent += `</svg>`;
  return svgContent;
}

export function generateOptionSvg(shapeA, countA, shapeB, countB) {
  const size = 30;
  const colorA = SHAPE_COLORS[shapeA] || SHAPE_COLORS.circle;
  const colorB = SHAPE_COLORS[shapeB] || SHAPE_COLORS.circle;
  const shapeDefA = SHAPE_DEFS[shapeA] || SHAPE_DEFS.circle;
  const shapeDefB = SHAPE_DEFS[shapeB] || SHAPE_DEFS.circle;

  const svgWidth = 260;
  const svgHeight = 50;

  const drawA = shapeDefA.draw(10, 10, size, colorA.fill, colorA.stroke);
  const drawB = shapeDefB.draw(130, 10, size, colorB.fill, colorB.stroke);

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${svgWidth} ${svgHeight}" width="${svgWidth}" height="${svgHeight}" style="display:inline-block; vertical-align:middle;">
    ${drawA}
    <text x="50" y="30" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#334155">(${countA}) and</text>
    ${drawB}
    <text x="170" y="30" font-family="system-ui, sans-serif" font-size="16" font-weight="600" fill="#334155">(${countB})</text>
  </svg>`;
}

const SHAPE_THEMES = [
  { itemA: "circle", itemB: "triangle", pluralA: "circles", pluralB: "triangles", emojiA: "🟢", emojiB: "📐" },
  { itemA: "square", itemB: "circle", pluralA: "squares", pluralB: "circles", emojiA: "🟪", emojiB: "🟠" },
  { itemA: "rectangle", itemB: "circle", pluralA: "rectangles", pluralB: "circles", emojiA: "🟦", emojiB: "🟢" },
  { itemA: "circle", itemB: "pentagon", pluralA: "circles", pluralB: "pentagons", emojiA: "🟠", emojiB: "🔷" }
];

// 21. ratio_write_part_to_part_mcq
export function ratio_write_part_to_part_mcq(rng, difficulty) {
  const theme = pickRandom(SHAPE_THEMES, rng);
  const countA = randomInt(1, 5, rng);
  const countB = randomInt(1, 5, rng);

  const colorA = SHAPE_COLORS[theme.itemA] || SHAPE_COLORS.circle;
  const colorB = SHAPE_COLORS[theme.itemB] || SHAPE_COLORS.circle;
  const svgContent = generateVisualShapesSvg([
    { shape: theme.itemA, count: countA, fill: colorA.fill, stroke: colorA.stroke },
    { shape: theme.itemB, count: countB, fill: colorB.fill, stroke: colorB.stroke }
  ]);

  const questionText = `What is the ratio of ${theme.pluralA} to ${theme.pluralB}?`;
  const correctAnswer = `${countA} to ${countB}`;
  const options = [
    correctAnswer,
    `${countB} to ${countA}`,
    `1 to ${countA + countB}`,
    `${countA} to ${countA + countB}`
  ];

  const uniqueOptions = [...new Set(options)];
  while (uniqueOptions.length < 4) {
    const rA = randomInt(1, 9, rng);
    const rB = randomInt(1, 9, rng);
    if (rA !== rB) {
      const candidate = `${rA} to ${rB}`;
      if (!uniqueOptions.includes(candidate)) {
        uniqueOptions.push(candidate);
      }
    }
  }

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'svg', content: svgContent },
      { type: 'text', content: `What is the ratio of ${theme.pluralA} to ${theme.pluralB}?` }
    ],
    options: shuffle(uniqueOptions, rng),
    correctAnswer,
    explanation: `There are ${countA} ${theme.pluralA} and ${countB} ${theme.pluralB}, so the ratio of ${theme.pluralA} to ${theme.pluralB} is ${countA} to ${countB}.`,
    solutionSteps: [
      `1. Count the number of ${theme.pluralA}: ${countA}`,
      `2. Count the number of ${theme.pluralB}: ${countB}`,
      `3. Write the part-to-part ratio: ${countA} to ${countB}`
    ],
    visualData: {
      type: "object_count",
      items: [
        { emoji: theme.emojiA, count: countA, label: theme.pluralA },
        { emoji: theme.emojiB, count: countB, label: theme.pluralB }
      ]
    },
    metadata: {
      numbers: [countA, countB],
      misconceptionCode: RATIO_MISCONCEPTIONS.ORDER_CONFUSION,
      level: 1,
      estimatedTime: 15,
      tags: ["ratio", "visual", "mcq"]
    }
  };
}

// 22. ratio_write_colon_single_blank
export function ratio_write_colon_single_blank(rng, difficulty) {
  const theme = pickRandom(SHAPE_THEMES, rng);
  const countA = randomInt(1, 6, rng);
  const countB = randomInt(1, 6, rng);

  const colorA = SHAPE_COLORS[theme.itemA] || SHAPE_COLORS.circle;
  const colorB = SHAPE_COLORS[theme.itemB] || SHAPE_COLORS.circle;
  const svgContent = generateVisualShapesSvg([
    { shape: theme.itemA, count: countA, fill: colorA.fill, stroke: colorA.stroke },
    { shape: theme.itemB, count: countB, fill: colorB.fill, stroke: colorB.stroke }
  ]);

  const questionText = `What is the ratio of ${theme.pluralA} to ${theme.pluralB}?`;
  const blankAntecedent = rng() < 0.5;

  let parts, correctAnswer;
  if (blankAntecedent) {
    parts = [
      { type: 'svg', content: svgContent },
      { type: 'text', content: `[blank:ant] : ${countB}` }
    ];
    correctAnswer = { ant: String(countA) };
  } else {
    parts = [
      { type: 'svg', content: svgContent },
      { type: 'text', content: `${countA} : [blank:cons]` }
    ];
    correctAnswer = { cons: String(countB) };
  }

  return {
    type: 'fillInTheBlank',
    questionText,
    parts,
    correctAnswer,
    explanation: `There are ${countA} ${theme.pluralA} and ${countB} ${theme.pluralB}, so the ratio of ${theme.pluralA} to ${theme.pluralB} is ${countA}:${countB}.`,
    solutionSteps: [
      `1. Count the number of ${theme.pluralA}: ${countA}`,
      `2. Count the number of ${theme.pluralB}: ${countB}`,
      `3. Fill in the missing value in the ratio ${countA}:${countB}.`
    ],
    visualData: {
      type: "object_count",
      items: [
        { emoji: theme.emojiA, count: countA, label: theme.pluralA },
        { emoji: theme.emojiB, count: countB, label: theme.pluralB }
      ]
    },
    metadata: {
      numbers: [countA, countB],
      misconceptionCode: RATIO_MISCONCEPTIONS.ORDER_CONFUSION,
      level: 1,
      estimatedTime: 15,
      tags: ["ratio", "visual", "colon"]
    }
  };
}

// 23. ratio_write_fraction_single_blank
export function ratio_write_fraction_single_blank(rng, difficulty) {
  const theme = pickRandom(SHAPE_THEMES, rng);
  const countA = randomInt(1, 6, rng);
  const countB = randomInt(1, 6, rng);

  const colorA = SHAPE_COLORS[theme.itemA] || SHAPE_COLORS.circle;
  const colorB = SHAPE_COLORS[theme.itemB] || SHAPE_COLORS.circle;
  const svgContent = generateVisualShapesSvg([
    { shape: theme.itemA, count: countA, fill: colorA.fill, stroke: colorA.stroke },
    { shape: theme.itemB, count: countB, fill: colorB.fill, stroke: colorB.stroke }
  ]);

  const questionText = `What is the ratio of ${theme.pluralA} to ${theme.pluralB}?`;
  const blankNumerator = rng() < 0.5;

  let parts, correctAnswer;
  if (blankNumerator) {
    parts = [
      { type: 'svg', content: svgContent },
      {
        type: 'fraction',
        numerator: { type: 'input', id: 'num', size: 'small' },
        denominator: String(countB)
      }
    ];
    correctAnswer = { num: String(countA) };
  } else {
    parts = [
      { type: 'svg', content: svgContent },
      {
        type: 'fraction',
        numerator: String(countA),
        denominator: { type: 'input', id: 'den', size: 'small' }
      }
    ];
    correctAnswer = { den: String(countB) };
  }

  return {
    type: 'fillInTheBlank',
    questionText,
    parts,
    correctAnswer,
    explanation: `The ratio of ${theme.pluralA} to ${theme.pluralB} is \\frac{${countA}}{${countB}}.`,
    solutionSteps: [
      `1. Count the number of ${theme.pluralA}: ${countA}`,
      `2. Count the number of ${theme.pluralB}: ${countB}`,
      `3. A ratio of A to B can be written as the fraction A/B. Therefore, the ratio is ${countA}/${countB}.`
    ],
    visualData: {
      type: "object_count",
      items: [
        { emoji: theme.emojiA, count: countA, label: theme.pluralA },
        { emoji: theme.emojiB, count: countB, label: theme.pluralB }
      ]
    },
    metadata: {
      numbers: [countA, countB],
      misconceptionCode: RATIO_MISCONCEPTIONS.ORDER_CONFUSION,
      level: 1,
      estimatedTime: 15,
      tags: ["ratio", "visual", "fraction"]
    }
  };
}

// 24. ratio_which_model_represents_mcq
export function ratio_which_model_represents_mcq(rng, difficulty) {
  const theme = pickRandom(SHAPE_THEMES, rng);
  const countA = randomInt(1, 4, rng);
  const countB = randomInt(2, 7, rng);

  const questionText = `Which model represents the ratio of ${countA} ${theme.itemA}${countA > 1 ? 's' : ''} to ${countB} ${theme.itemB}${countB > 1 ? 's' : ''}?`;

  const optionCorrect = {
    id: 'correct',
    content: generateOptionSvg(theme.itemA, countA, theme.itemB, countB),
    label: `${countA} ${theme.pluralA} and ${countB} ${theme.pluralB}`,
    isCorrect: true
  };
  const optionIncorrect = {
    id: 'incorrect_1',
    content: generateOptionSvg(theme.itemA, countA, theme.itemB, countB + 1),
    label: `${countA} ${theme.pluralA} and ${countB + 1} ${theme.pluralB}`,
    isCorrect: false
  };
  const optionIncorrect2 = {
    id: 'incorrect_2',
    content: generateOptionSvg(theme.itemA, countA + 1, theme.itemB, countB),
    label: `${countA + 1} ${theme.pluralA} and ${countB} ${theme.pluralB}`,
    isCorrect: false
  };

  const options = [optionCorrect, optionIncorrect, optionIncorrect2];

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'text', content: questionText }
    ],
    options: shuffle(options, rng),
    correctAnswer: optionCorrect.label,
    explanation: `The target ratio is ${countA} to ${countB}, which corresponds to the model containing exactly ${countA} ${theme.pluralA} and ${countB} ${theme.pluralB}.`,
    solutionSteps: [
      `1. Read the target ratio: ${countA} ${theme.pluralA} to ${countB} ${theme.pluralB}.`,
      `2. Identify the option that displays exactly ${countA} of the first shape and ${countB} of the second shape.`
    ],
    visualData: null,
    metadata: {
      numbers: [countA, countB],
      misconceptionCode: RATIO_MISCONCEPTIONS.ORDER_CONFUSION,
      level: 1,
      estimatedTime: 20,
      tags: ["ratio", "visual", "mcq-model"]
    }
  };
}

// -------------------------------------------------------------
// CORE HANDLERS
// -------------------------------------------------------------

export function generateRatioQuestion(config = {}) {
  const seed = config.seed || config.variables?.seed || Date.now().toString();
  const seedRng = createSeededRng(seed);

  // Map template IDs to generators
  const generators = {
    "ratio_identify_from_words": ratio_identify_from_words,
    "ratio_same_kind_check": ratio_same_kind_check,
    "ratio_subtraction_vs_division": ratio_subtraction_vs_division,
    "ratio_terms_antecedent_consequent": ratio_terms_antecedent_consequent,
    "ratio_simplify_two_terms": ratio_simplify_two_terms,
    "ratio_simplify_three_terms": ratio_simplify_three_terms,
    "ratio_equivalent_find": ratio_equivalent_find,
    "ratio_equivalent_check": ratio_equivalent_check,
    "ratio_missing_value": ratio_missing_value,
    "ratio_fraction_to_whole": ratio_fraction_to_whole,
    "ratio_visual_count": ratio_visual_count,
    "ratio_word_problem_basic": ratio_word_problem_basic,
    "ratio_error_analysis": ratio_error_analysis,
    "ratio_table_completion": ratio_table_completion,
    "ratio_sorting": ratio_sorting,
    "ratio_matching": ratio_matching,
    "ratio_units_concept": ratio_units_concept,
    "ratio_greater_comparison": ratio_greater_comparison,
    "ratio_pattern_completion": ratio_pattern_completion,
    "ratio_remediation": ratio_remediation,
    "ratio_write_part_to_part_mcq": ratio_write_part_to_part_mcq,
    "ratio_write_colon_single_blank": ratio_write_colon_single_blank,
    "ratio_write_fraction_single_blank": ratio_write_fraction_single_blank,
    "ratio_which_model_represents_mcq": ratio_which_model_represents_mcq
  };

  // Selection Rules
  let chosenId = config.templateId || config.forcedTask || null;
  let resolvedSkillId = config.skillId || null;
  let resolvedCompetencyId = config.competencyId || null;

  if (!chosenId) {
    if (resolvedSkillId && RATIO_MICRO_SKILLS[resolvedSkillId]) {
      const templates = RATIO_MICRO_SKILLS[resolvedSkillId].templates;
      chosenId = seededPick(seedRng, templates);
    } else if (config.misconceptionCode && config.mode === "remediation") {
      const ladderInfo = RATIO_REMEDIATION_LADDERS[config.misconceptionCode];
      if (ladderInfo) {
        const stepNum = config.step || 1;
        const stepObj = ladderInfo.ladder.find(s => s.step === stepNum) || ladderInfo.ladder[0];
        chosenId = stepObj.templateId;
        resolvedSkillId = stepObj.microSkillId;
      }
    } else if (config.level) {
      const progressionObj = RATIO_LEARNING_PROGRESSION.find(p => p.level === config.level);
      if (progressionObj) {
        chosenId = seededPick(seedRng, progressionObj.allowedTemplates);
        resolvedSkillId = seededPick(seedRng, progressionObj.microSkills);
      }
    }
  }

  // Fallback mixed practice
  if (!chosenId || !generators[chosenId]) {
    const allTemplates = Object.keys(generators).filter(id => id !== "ratio_remediation");
    chosenId = seededPick(seedRng, allTemplates);
  }

  if (!resolvedSkillId) {
    resolvedSkillId = localGetSkillByTemplate(chosenId) || `ratio-skill-${chosenId}`;
  }
  if (!resolvedCompetencyId) {
    resolvedCompetencyId = RATIO_MICRO_SKILLS[resolvedSkillId]?.competencyId || "ratio_reasoning";
  }

  // Resolve Difficulty Profile
  let profileKey = config.difficultyProfile || null;
  if (!profileKey) {
    if (chosenId && (chosenId.includes("visual") || chosenId.includes("model") || chosenId.includes("blank") || chosenId.includes("part_to_part"))) {
      profileKey = "easy_visual";
    } else if (config.difficulty) {
      const diffStr = String(config.difficulty).toLowerCase();
      if (diffStr === "easy") profileKey = "easy_numeric";
      else if (diffStr === "medium") profileKey = "medium_simplify";
      else if (diffStr === "hard") profileKey = "hard_word_problem";
    } else {
      profileKey = "easy_numeric";
    }
  }
  const profile = RATIO_DIFFICULTY_PROFILES[profileKey] || RATIO_DIFFICULTY_PROFILES.easy_numeric;

  // Map to core generator difficulty string for backward compatibility
  let generatorDifficulty = "easy";
  if (profileKey.startsWith("medium")) generatorDifficulty = "medium";
  if (profileKey.startsWith("hard") || profileKey.startsWith("mastery")) generatorDifficulty = "hard";

  // Generate with constraints retries
  let question = null;
  let attempts = 0;
  const maxAttempts = 30;
  const mergedConstraints = { ...RATIO_GENERATOR_CONSTRAINTS, ...config.constraints };

  while (attempts < maxAttempts) {
    question = generators[chosenId](seedRng, generatorDifficulty, config.misconceptionCode);
    const candidateTerms = question.metadata?.numbers || [];
    if (applyRatioConstraints(candidateTerms, mergedConstraints)) {
      break;
    }
    attempts++;
  }

  // Build standard visual schema if visual support is active
  let finalVisualData = question.visualData;
  if (finalVisualData) {
    if (finalVisualData.type === "object_count" && Array.isArray(finalVisualData.items)) {
      const formattedItems = finalVisualData.items.map((item, idx) => ({
        id: `item_${idx + 1}`,
        type: "symbol",
        value: item.emoji || item.value || "🍎",
        color: "#000000",
        count: item.count || 1,
        label: item.label || ""
      }));
      finalVisualData = buildObjectCountVisual(formattedItems, { title: finalVisualData.title || "Visual Ratio Count" });
    }
  } else if (profile.visualSupport && question.metadata?.numbers?.length >= 2) {
    // Inject fallback visual support (ratio bar)
    const nums = question.metadata.numbers;
    const parts = [
      { id: "p1", label: "Part A", value: nums[0], color: "#3b82f6" },
      { id: "p2", label: "Part B", value: nums[1], color: "#ef4444" }
    ];
    finalVisualData = buildRatioBarVisual(parts, { title: "Visual Ratio Support" });
  }

  // Format table completion visual if table markdown is generated
  if (chosenId === "ratio_table_completion" && question.parts) {
    const baseAnt = question.metadata?.numbers?.[0] || 2;
    const baseCons = question.metadata?.numbers?.[1] || 3;
    const rows = [
      { id: "row_a", label: "Category A", values: [baseAnt, baseAnt * 2, baseAnt * 3] },
      { id: "row_b", label: "Category B", values: [baseCons, baseCons * 2, baseCons * 3] }
    ];
    finalVisualData = buildRatioTableVisual(rows, { labels: ["Category", "Col 1", "Col 2", "Col 3"] });
  }

  // Interaction builder
  let interaction;
  if (question.type === "mcq") {
    interaction = buildMCQInteraction({ retryPolicy: { maxAttempts: 1 } });
  } else if (question.type === "fillInTheBlank") {
    const blanks = {};
    if (question.correctAnswer && typeof question.correctAnswer === "object") {
      Object.keys(question.correctAnswer).forEach(key => {
        blanks[key] = { type: "numeric" };
      });
    } else {
      blanks["ans"] = { type: "numeric" };
    }
    interaction = buildFillBlankInteraction(blanks);
  } else if (question.type === "matching") {
    interaction = buildMatchingInteraction(question.pairs || []);
  } else if (question.type === "sorting") {
    interaction = buildSortingInteraction(question.items || [], question.categories || []);
  } else {
    interaction = buildMCQInteraction();
  }

  // Pedagogy metadata
  const skillInfo = RATIO_MICRO_SKILLS[resolvedSkillId] || {};
  let bloomLevel = 1; // Remembering
  if (resolvedSkillId.includes("simplify") || resolvedSkillId.includes("equivalent")) bloomLevel = 3; // Applying
  if (resolvedSkillId.includes("word_problem") || resolvedSkillId.includes("error")) bloomLevel = 4; // Analyzing

  const pedagogy = {
    microSkillId: resolvedSkillId,
    competencyId: resolvedCompetencyId,
    prerequisiteSkills: skillInfo.prerequisiteSkills || [],
    bloomLevel,
    strategyType: chosenId.includes("visual") ? "visual" : "numerical",
    cognitiveLoad: profile.stepsRequired || 2,
    expectedMisconceptions: skillInfo.misconceptionTargets || [],
    remediationSkillIds: ["ratio_remediation"]
  };

  // Adaptive metadata
  const adaptive = {
    masteryWeight: profileKey.startsWith("hard") ? 15 : 10,
    confidenceWeight: profileKey.startsWith("hard") ? 20 : 12,
    misconceptionRisk: profile.misconceptionRisk || 0.3,
    expectedMistakes: skillInfo.misconceptionTargets || [],
    nextIfCorrect: localGetNextSkill(resolvedSkillId, { isCorrect: true }),
    nextIfIncorrect: localGetNextSkill(resolvedSkillId, { isCorrect: false }),
    remediationTemplates: ["ratio_remediation"]
  };

  return {
    id: `ratio_${chosenId}_${seed}`,
    subject: "math",
    topic: "ratio",
    skillId: resolvedSkillId,
    competencyId: resolvedCompetencyId,
    templateId: chosenId,
    type: question.type,
    difficulty: generatorDifficulty,
    difficultyProfile: profileKey,
    questionText: question.questionText,
    parts: question.parts || [{ type: "text", content: question.questionText }],
    options: question.options || [],
    items: question.items,
    pairs: question.pairs,
    categories: question.categories,
    correctAnswer: question.correctAnswer,
    explanation: question.explanation,
    solution: makeSolution(question.solutionSteps || [question.explanation]),
    solutionSteps: question.solutionSteps || [question.explanation],
    visualData: finalVisualData,
    interaction,
    pedagogy,
    adaptive,
    metadata: {
      ...question.metadata,
      seed,
      generatorVersion: "2.0.0",
      generatorRevision: "adaptive",
      createdAt: new Date().toISOString()
    }
  };
}

export function generateRatioQuestionSet(count, config = {}) {
  const questions = [];
  for (let i = 0; i < count; i++) {
    const seed = `${config.seed || Date.now()}_${i}`;
    questions.push(generateRatioQuestion({ ...config, seed }));
  }
  return questions;
}

export function generateRatioRemediation(misconceptionCode, step = 1) {
  const seed = Date.now().toString();
  return generateRatioQuestion({
    misconceptionCode,
    step,
    mode: "remediation",
    seed
  });
}

export function generateRatioMasteryCheck(skillId) {
  const seed = Date.now().toString();
  return generateRatioQuestion({
    skillId,
    difficultyProfile: "mastery_mixed",
    mode: "mastery",
    seed
  });
}

export function validateRatioAnswer(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null) {
    return {
      isCorrect: false,
      normalizedUserAnswer: "",
      normalizedCorrectAnswer: "",
      detectedMisconception: null,
      feedback: "No answer was provided.",
      partialCredit: 0,
      nextAction: "retry"
    };
  }

  const type = question.type;
  let isCorrect = false;
  let detectedMisconception = null;
  let normalizedUserAnswer = "";
  let normalizedCorrectAnswer = "";
  let feedback = "";
  
  const cleanStr = (s) => String(s || "").trim().toLowerCase();

  // 1. MCQ
  if (type === 'mcq') {
    const userStr = cleanStr(userAnswer);
    const correctStr = cleanStr(question.correctAnswer);
    normalizedUserAnswer = userStr;
    normalizedCorrectAnswer = correctStr;

    if (userStr === correctStr) {
      isCorrect = true;
    } else {
      const numericIndex = parseInt(userAnswer, 10);
      if (!isNaN(numericIndex) && Array.isArray(question.options) && numericIndex >= 0 && numericIndex < question.options.length) {
        const opt = question.options[numericIndex];
        const selected = typeof opt === 'object' ? (opt.label || opt.content) : opt;
        const selectedClean = cleanStr(selected);
        normalizedUserAnswer = selectedClean;
        if (opt.isCorrect || selectedClean === correctStr) {
          isCorrect = true;
        }
      }
    }

    if (!isCorrect) {
      if (question.metadata?.misconceptionCode) {
        detectedMisconception = question.metadata.misconceptionCode;
      }
    }
  }
  
  // 2. Fill in the Blank
  else if (type === 'fillInTheBlank') {
    const correctMap = question.correctAnswer;
    
    if (typeof correctMap === 'object' && correctMap !== null) {
      normalizedCorrectAnswer = Object.keys(correctMap).map(k => `${k}:${correctMap[k]}`).join(', ');
      
      let userObj = {};
      if (typeof userAnswer === 'object' && userAnswer !== null) {
        userObj = { ...userAnswer };
      } else {
        const parts = String(userAnswer).split(':');
        if (parts.length === 2) {
          userObj = { ant: parts[0].trim(), cons: parts[1].trim() };
        } else {
          userObj = { ans: String(userAnswer) };
        }
      }
      
      normalizedUserAnswer = Object.keys(userObj).map(k => `${k}:${userObj[k]}`).join(', ');

      // Check unit attached misconception
      let attachedUnit = false;
      const unitRegex = /[a-zA-Z]/;
      for (const key of Object.keys(userObj)) {
        if (unitRegex.test(userObj[key])) {
          attachedUnit = true;
          userObj[key] = userObj[key].replace(/[a-zA-Z]/g, '').trim();
        }
      }
      if (attachedUnit) {
        detectedMisconception = RATIO_MISCONCEPTIONS.UNIT_ATTACHED_TO_RATIO;
      }

      const uAnt = parseInt(userObj.ant || userObj.t1 || userObj.ans || '', 10);
      const uCons = parseInt(userObj.cons || userObj.t2 || '', 10);
      const cAnt = parseInt(correctMap.ant || correctMap.t1 || '', 10);
      const cCons = parseInt(correctMap.cons || correctMap.t2 || '', 10);

      if (!isNaN(uAnt) && !isNaN(uCons) && !isNaN(cAnt) && !isNaN(cCons)) {
        if (uAnt === cAnt && uCons === cCons) {
          isCorrect = !attachedUnit;
        } else {
          // Check order confusion
          if (uAnt === cCons && uCons === cAnt) {
            detectedMisconception = RATIO_MISCONCEPTIONS.ORDER_CONFUSION;
          }
          // Check equivalence
          else if (areEquivalentRatio([uAnt, uCons], [cAnt, cCons])) {
            const uGcd = gcd(uAnt, uCons);
            const cGcd = gcd(cAnt, cCons);
            if (uGcd > cGcd) {
              if (cGcd === 1) {
                detectedMisconception = RATIO_MISCONCEPTIONS.HCF_NOT_USED;
              } else {
                detectedMisconception = RATIO_MISCONCEPTIONS.PARTIAL_SIMPLIFICATION;
              }
            } else {
              detectedMisconception = RATIO_MISCONCEPTIONS.PARTIAL_SIMPLIFICATION;
            }
          } else {
            if (question.metadata?.misconceptionCode) {
              detectedMisconception = question.metadata.misconceptionCode;
            }
          }
        }
      } else {
        const singleKey = Object.keys(correctMap)[0];
        const userVal = cleanStr(userObj[singleKey] || userObj.ans || '');
        const correctVal = cleanStr(correctMap[singleKey]);
        if (userVal === correctVal) {
          isCorrect = !attachedUnit;
        } else {
          if (question.metadata?.misconceptionCode) {
            detectedMisconception = question.metadata.misconceptionCode;
          }
        }
      }
    } else {
      const userStr = cleanStr(userAnswer);
      const correctStr = cleanStr(correctMap);
      normalizedUserAnswer = userStr;
      normalizedCorrectAnswer = correctStr;

      if (userStr === correctStr) {
        isCorrect = true;
      } else {
        if (question.metadata?.misconceptionCode) {
          detectedMisconception = question.metadata.misconceptionCode;
        }
      }
    }
  }

  // 3. Sorting
  else if (type === 'sorting') {
    const correctMap = question.correctAnswer;
    normalizedCorrectAnswer = JSON.stringify(correctMap);
    normalizedUserAnswer = JSON.stringify(userAnswer);

    if (typeof userAnswer === 'object' && userAnswer !== null) {
      isCorrect = true;
      for (const itemId of Object.keys(correctMap)) {
        if (cleanStr(userAnswer[itemId]) !== cleanStr(correctMap[itemId])) {
          isCorrect = false;
          break;
        }
      }
    }
    if (!isCorrect) {
      detectedMisconception = RATIO_MISCONCEPTIONS.EQUIVALENT_RATIO_SCALING_ERROR;
    }
  }

  // 4. Matching
  else if (type === 'matching') {
    const correctMap = question.correctAnswer;
    normalizedCorrectAnswer = JSON.stringify(correctMap);
    normalizedUserAnswer = JSON.stringify(userAnswer);

    if (typeof userAnswer === 'object' && userAnswer !== null) {
      isCorrect = true;
      for (const leftVal of Object.keys(correctMap)) {
        if (cleanStr(userAnswer[leftVal]) !== cleanStr(correctMap[leftVal])) {
          isCorrect = false;
          break;
        }
      }
    }
    if (!isCorrect) {
      detectedMisconception = RATIO_MISCONCEPTIONS.HCF_NOT_USED;
    }
  }

  // Feedback generation
  if (isCorrect) {
    feedback = "Correct! Well done.";
  } else {
    if (detectedMisconception === RATIO_MISCONCEPTIONS.ORDER_CONFUSION) {
      feedback = "It seems you reversed the order of terms. Remember, the first item in the word description must be the first number in the ratio.";
    } else if (detectedMisconception === RATIO_MISCONCEPTIONS.HCF_NOT_USED) {
      feedback = "Your ratio is equivalent, but it is not in simplest form. Divide both terms by their Highest Common Factor (HCF).";
    } else if (detectedMisconception === RATIO_MISCONCEPTIONS.PARTIAL_SIMPLIFICATION) {
      feedback = "Your ratio is partially simplified. Check if both terms can be divided further by a common factor.";
    } else if (detectedMisconception === RATIO_MISCONCEPTIONS.UNIT_ATTACHED_TO_RATIO) {
      feedback = "Do not include units (like kg, cm, m) in your ratio. A ratio is a unitless comparison of values.";
    } else {
      feedback = `Incorrect. The correct answer is: ${question.explanation || normalizedCorrectAnswer}.`;
    }
  }

  return {
    isCorrect,
    normalizedUserAnswer,
    normalizedCorrectAnswer,
    detectedMisconception,
    feedback,
    partialCredit: isCorrect ? 1 : 0,
    nextAction: isCorrect ? "advance" : "remediate"
  };
}
