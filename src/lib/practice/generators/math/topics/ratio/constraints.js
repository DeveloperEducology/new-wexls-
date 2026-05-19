import { gcdArray } from './utils.js';

export const RATIO_GENERATOR_CONSTRAINTS = {
  avoidZeroTerms: true,
  avoidNegativeTerms: true,
  ensureSimplifiable: false,
  ensureNonSimplifiable: false,
  avoidDuplicateOptions: true,
  avoidAmbiguousRatios: true,
  maxTermValue: 100,
  minHcf: 1,
  maxHcf: 20,
  allowedUnits: ["cm", "m", "kg", "g", "ml", "l", "hours", "minutes", "apples", "oranges"],
  sameKindOnly: true
};

export function applyRatioConstraints(candidate, constraints = {}) {
  const merged = { ...RATIO_GENERATOR_CONSTRAINTS, ...constraints };
  if (!Array.isArray(candidate) || candidate.length === 0) return false;

  // 1. Avoid Zero Terms
  if (merged.avoidZeroTerms && candidate.some(val => val === 0)) {
    return false;
  }

  // 2. Avoid Negative Terms
  if (merged.avoidNegativeTerms && candidate.some(val => val < 0)) {
    return false;
  }

  // 3. Max Term Value
  if (merged.maxTermValue && candidate.some(val => val > merged.maxTermValue)) {
    return false;
  }

  // 4. HCF check
  const hcf = gcdArray(candidate);
  if (merged.ensureSimplifiable && hcf <= 1) {
    return false;
  }
  if (merged.ensureNonSimplifiable && hcf > 1) {
    return false;
  }
  if (merged.minHcf && hcf < merged.minHcf) {
    return false;
  }
  if (merged.maxHcf && hcf > merged.maxHcf) {
    return false;
  }

  return true;
}
