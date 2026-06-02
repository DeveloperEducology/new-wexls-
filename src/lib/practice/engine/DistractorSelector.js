/**
 * WEXLS Distractor Intelligence System
 * Calculates weighted scores for candidate distractors based on:
 * 1. Visual/phonetic similarity targets matching the active difficulty
 * 2. Historical student weaknesses (telemetry confusion map)
 * 3. Difficulty weights
 */

// Default visual confusion matrix for lowercase letters (scale 1 - 5)
export const LETTER_SIMILARITY_MATRIX = {
  b: { d: 5, p: 5, q: 5, h: 3, l: 3, t: 3, k: 3 },
  d: { b: 5, p: 5, q: 5, c: 3, q: 3, l: 3, h: 3 },
  p: { b: 5, d: 5, q: 5, g: 5, j: 3, y: 3 },
  q: { b: 5, d: 5, p: 5, g: 5, a: 3, o: 3 },
  m: { n: 5, w: 5, u: 3, v: 3 },
  n: { m: 5, u: 4, h: 3, r: 3, v: 3 },
  u: { n: 4, v: 4, w: 3, y: 3 },
  w: { m: 5, v: 4, u: 3 },
  t: { f: 5, l: 4, i: 3, j: 3 },
  f: { t: 5, j: 3, l: 3 },
  a: { o: 3, e: 3, q: 3, c: 3 },
  o: { a: 3, e: 3, c: 3, q: 3 },
  e: { o: 3, a: 3, c: 3 }
};

/**
 * Returns visual similarity score between two items (1 to 5).
 */
export function getSimilarity(a, b) {
  const charA = String(a.label || a.id || a).toLowerCase();
  const charB = String(b.label || b.id || b).toLowerCase();

  if (charA === charB) return 5;

  // Check explicit similarity score if defined in the option object
  if (a.similarity && typeof a.similarity === 'object') {
    if (Array.isArray(a.similarity)) {
      if (a.similarity.includes(charB)) return 4;
    } else if (a.similarity[charB] !== undefined) {
      return Number(a.similarity[charB]);
    }
  }

  // Check static matrix lookup
  if (LETTER_SIMILARITY_MATRIX[charA] && LETTER_SIMILARITY_MATRIX[charA][charB] !== undefined) {
    return LETTER_SIMILARITY_MATRIX[charA][charB];
  }
  if (LETTER_SIMILARITY_MATRIX[charB] && LETTER_SIMILARITY_MATRIX[charB][charA] !== undefined) {
    return LETTER_SIMILARITY_MATRIX[charB][charA];
  }

  return 1; // Default: low similarity
}

/**
 * Selects the best distractors from the pool for a given correct answer.
 * 
 * @param {Array<Object>} pool - List of all possible options
 * @param {Object} correctAnswer - The selected correct option
 * @param {number} count - Number of distractors to select
 * @param {Object} params - Difficulty parameters (from DifficultyEngine)
 * @param {Object} [telemetry={}] - Student performance telemetry
 * @param {Object} [telemetry.frequentConfusionMap] - Map of correct -> [wrong, wrong] confusions
 * @returns {Array<Object>} Selected distractor options
 */
export function selectDistractors(pool, correctAnswer, count, params, telemetry = {}) {
  // Filter out the correct answer itself
  const candidates = pool.filter(opt => opt.id !== correctAnswer.id);

  const scored = candidates.map(d => {
    // 1. Calculate base similarity alignment relative to target similarity min
    const similarityVal = getSimilarity(correctAnswer, d);
    const targetSim = params.distractorSimilarityMin || 1;
    
    // Score peaks when visual similarity matches the difficulty target
    const simDiff = Math.abs(similarityVal - targetSim);
    const simScore = Math.max(0, 5 - simDiff);

    // 2. Identify if this matches the student's active confusion pattern
    let isWeakness = 0;
    const confusionMap = telemetry.frequentConfusionMap || {};
    const correctId = correctAnswer.id;
    if (confusionMap[correctId] && confusionMap[correctId].includes(d.id)) {
      isWeakness = 3.0;
    }

    // 3. Match difficulty weight limits
    const itemDiffWeight = d.difficultyWeight || 1;
    const diffMatch = itemDiffWeight <= targetSim ? 1.0 : 0.0;

    // Combine scores with weights
    const totalScore = (simScore * 1.5) + (isWeakness * 2.0) + (diffMatch * 1.0);

    return { option: d, score: totalScore };
  });

  // Sort candidates by score descending and slice to the target count
  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(s => s.option);
}
