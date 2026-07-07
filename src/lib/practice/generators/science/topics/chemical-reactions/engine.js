/**
 * Engine – Chemical Reactions & Equations (Grade 10)
 *
 * Adaptive logic:
 *   - Picks a question from the correct difficulty tier
 *   - Avoids repeating recently-seen question IDs
 *   - Attaches adaptiveRules so the mastery engine in
 *     /src/lib/mastery/index.js knows where to go next
 */

import {
  CHEMICAL_REACTIONS_POOL,
  ADAPTIVE_FALLBACK_MAP,
  ADAPTIVE_PROMOTE_MAP,
} from './pool.js';

function seededRng(seed) {
  let s = seed;
  return function () {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

function pickQuestion(pool, recentIds = []) {
  // Prefer unseen questions; fall back to all if all have been seen
  const fresh = pool.filter((q) => !recentIds.includes(q.id));
  const candidates = fresh.length > 0 ? fresh : pool;
  const rng = seededRng(Date.now());
  return candidates[Math.floor(rng() * candidates.length)];
}

/**
 * Main generator function.
 *
 * @param {object} template  – template config (carries metadata, config, etc.)
 * @param {object} variables – runtime variables: { difficulty, recentIds, seed }
 * @returns {object} A fully-formed question object
 */
export function generateChemicalReactionQuestion(template = {}, variables = {}) {
  const difficulty = variables.difficulty || template.config?.defaultDifficulty || 'easy';
  const recentIds = variables.recentIds || [];

  const pool = CHEMICAL_REACTIONS_POOL[difficulty] || CHEMICAL_REACTIONS_POOL.easy;
  const base = pickQuestion(pool, recentIds);

  if (!base) {
    return null;
  }

  // Attach adaptive rules so the mastery engine can navigate
  const fallbackDifficulty = ADAPTIVE_FALLBACK_MAP[difficulty];
  const promoteDifficulty  = ADAPTIVE_PROMOTE_MAP[difficulty];

  const fallbackSkillId = fallbackDifficulty
    ? `cr-g10-${fallbackDifficulty}`
    : base.metadata.skillId;

  const promoteTarget = promoteDifficulty
    ? `cr-g10-${promoteDifficulty}`
    : null;

  const adaptiveRules = {
    incorrect: {
      targetSkillId: fallbackSkillId,
    },
    ...(promoteTarget
      ? {
          masteryAchieved: {
            threshold: 100,
            target: promoteTarget,
          },
        }
      : {}),
  };

  return {
    ...base,
    adaptiveRules,
    metadata: {
      ...base.metadata,
      skillId: base.metadata.skillId,
      templateId: template.id || 'chemical-reactions.mcq.adaptive',
      subject: 'science',
      topic: 'chemical-reactions',
      difficulty,
    },
  };
}
