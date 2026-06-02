import { getDifficultyParameters } from './DifficultyEngine.js';
import { selectDistractors } from './DistractorSelector.js';

/**
 * Creates a deterministic pseudo-random number generator from a seed.
 * Handles both string and numeric seeds.
 * 
 * @param {string|number} seed 
 * @returns {function} Pseudo-random number generator returning [0, 1)
 */
export function createSeededRandom(seed) {
  let h = 2166136261 >>> 0;
  const str = String(seed || Date.now());
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  }
  return function() {
    h += 0xe120fc15;
    let z = Math.imul(h ^ (h >>> 16), 0x9e3779b9);
    z = Math.imul(z ^ (z >>> 15), 0x85ebca6b);
    z ^= z >>> 13;
    return ((z >>> 0) & 0x7FFFFFFF) / 0x80000000;
  };
}

/**
 * Shuffles an array deterministically using a seeded random function.
 */
export function seededShuffle(array, prng) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(prng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Main orchestration pipeline for variant generation.
 * Establishes difficulty, selects distractors, and shuffles options.
 * 
 * @param {Object} args
 * @param {Array<Object>} args.pool - Full option pool
 * @param {Object} args.correctAnswer - The correct option
 * @param {string|number} args.seed - The seed value
 * @param {Object} [args.history={}] - Student practice history
 * @param {string} [args.explicitDifficulty] - Explicit difficulty override
 * @param {string} [args.grade='lkg'] - Student grade
 * @param {Object} [args.telemetry={}] - Performance telemetry
 * @returns {Object} { difficultyParams, activeOptions, prng }
 */
export function generateVariant({
  pool,
  correctAnswer,
  seed,
  history = {},
  explicitDifficulty,
  grade = 'lkg',
  telemetry = {}
}) {
  const prng = createSeededRandom(seed);
  
  // 1. Calculate difficulty parameters
  const params = getDifficultyParameters(history, explicitDifficulty, grade);

  // 2. Select visual distractors using the weighted distractor selector
  const distractorCount = params.optionCount - 1;
  const chosenDistractors = selectDistractors(pool, correctAnswer, distractorCount, params, telemetry);

  // 3. Shuffle options list deterministically
  const rawOptions = [correctAnswer, ...chosenDistractors];
  const activeOptions = seededShuffle(rawOptions, prng);

  return {
    difficultyParams: params,
    activeOptions,
    prng
  };
}
