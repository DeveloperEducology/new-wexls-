/**
 * Utility functions for Ratio Chapter Templates
 */

export function gcd(a, b) {
  a = Math.abs(a);
  b = Math.abs(b);
  while (b) {
    const t = b;
    b = a % b;
    a = t;
  }
  return a;
}

export function gcdArray(arr) {
  if (!arr || arr.length === 0) return 1;
  return arr.reduce((acc, val) => gcd(acc, val), arr[0]);
}

export function lcm(a, b) {
  if (a === 0 || b === 0) return 0;
  return Math.abs(a * b) / gcd(a, b);
}

export function lcmArray(arr) {
  if (!arr || arr.length === 0) return 1;
  return arr.reduce((acc, val) => lcm(acc, val), arr[0]);
}

export function simplifyRatio(arr) {
  const commonDivisor = gcdArray(arr);
  if (commonDivisor === 0) return arr;
  return arr.map(val => val / commonDivisor);
}

export function areEquivalentRatio(r1, r2) {
  const s1 = simplifyRatio(r1);
  const s2 = simplifyRatio(r2);
  if (s1.length !== s2.length) return false;
  for (let i = 0; i < s1.length; i++) {
    if (s1[i] !== s2[i]) return false;
  }
  return true;
}

export function scaleRatio(arr, factor) {
  return arr.map(val => val * factor);
}

export function randomInt(min, max, seedRng = null) {
  const rng = seedRng || Math.random;
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function pickRandom(array, seedRng = null) {
  const rng = seedRng || Math.random;
  if (!array || array.length === 0) return null;
  return array[Math.floor(rng() * array.length)];
}

export function shuffle(array, seedRng = null) {
  const rng = seedRng || Math.random;
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function buildOptions(correctAnswer, distractors, seedRng = null) {
  const uniqueDistractors = Array.from(new Set(distractors)).filter(
    d => String(d).trim().toLowerCase() !== String(correctAnswer).trim().toLowerCase()
  );
  const shuffledDistractors = shuffle(uniqueDistractors, seedRng);
  const selectedDistractors = shuffledDistractors.slice(0, 3);
  return shuffle([correctAnswer, ...selectedDistractors], seedRng);
}

export function parseRatioString(str) {
  if (!str) return [];
  return str.split(':').map(val => parseInt(val.trim(), 10)).filter(val => !isNaN(val));
}

// DETERMINISTIC SEED SYSTEM UPGRADE
export function createSeededRng(seed) {
  let h = 0;
  if (typeof seed === 'string') {
    for (let i = 0; i < seed.length; i++) {
      h = Math.imul(31, h) + seed.charCodeAt(i) | 0;
    }
  } else if (typeof seed === 'number') {
    h = seed | 0;
  } else {
    h = Date.now() | 0;
  }
  return function() {
    let t = h + 0x6D2B79F5 | 0;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61) | 0;
    h = t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function seededRandomInt(rng, min, max) {
  return Math.floor(rng() * (max - min + 1)) + min;
}

export function seededPick(rng, array) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(rng() * array.length)];
}

export function seededShuffle(rng, array) {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
