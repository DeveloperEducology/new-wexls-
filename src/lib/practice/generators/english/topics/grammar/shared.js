export function createSeededRandom(seedInput = 'grammar') {
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

export function randInt(min, max, random) {
  return Math.floor(random() * (max - min + 1)) + min;
}

export function pick(array, random) {
  if (!array || array.length === 0) return null;
  return array[Math.floor(random() * array.length)];
}

export function shuffle(array, random) {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    const temp = copy[i];
    copy[i] = copy[j];
    copy[j] = temp;
  }
  return copy;
}

export function resolveDifficulty(config = {}) {
  const diff = config.difficulty || 'adaptive';
  if (diff === 'easy' || diff === 'medium' || diff === 'hard') {
    return diff;
  }
  
  const level = Number(config.history?.practiceLevel || 1);
  if (level <= 2) return 'easy';
  if (level === 3) return 'medium';
  return 'hard';
}

// ----------------------------------------------------
// Premium Vocabulary & Sentences Lists for English Grammar (Imported from content.js)
// ----------------------------------------------------

export { 
  NOUNS, 
  NOT_NOUNS, 
  PRONOUNS, 
  VERBS, 
  ADJECTIVES 
} from './content.js';
