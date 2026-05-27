let _uid = 0;

export const uid = () => `subtraction_topic_${Date.now()}_${++_uid}`;

export function createSeededRandom(seedInput = 'subtraction-topic') {
  const str = String(seedInput);
  let seed = 0;
  for (let i = 0; i < str.length; i += 1) {
    seed = (seed * 31 + str.charCodeAt(i)) % 2147483647;
  }
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}

export const randInt = (min, max, random) => Math.floor(random() * (max - min + 1)) + min;

export function cubeWord(count) {
  return count === 1 ? 'cube' : 'cubes';
}

export function normalizeRange(range) {
  if (Array.isArray(range)) {
    return { min: range[0], max: range[1] };
  }
  return { min: range?.min ?? 1, max: range?.max ?? 10 };
}
