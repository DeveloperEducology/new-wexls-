/**
 * Adaptive Engine — pure logic, no DB calls.
 * Implements simplified Elo-style theta estimation and question selection.
 */

const LEARNING_RATE = 0.08;
const THETA_MIN = 0.05;
const THETA_MAX = 0.95;

// ── Theta Update ────────────────────────────────────────────────────────
/**
 * Update theta after answering a question.
 * @param {number} theta - Current ability estimate (0–1)
 * @param {boolean} isCorrect
 * @param {number} difficulty - Question difficulty (0–1)
 * @returns {number} Updated theta
 */
export function updateTheta(theta, isCorrect, difficulty) {
  // Delta tapers near edges so theta doesn't get stuck at extremes
  const delta = LEARNING_RATE * (1 - Math.abs(difficulty - theta));
  const newTheta = isCorrect ? theta + delta : theta - delta;
  return Math.min(THETA_MAX, Math.max(THETA_MIN, newTheta));
}

// ── Next Question Selection ─────────────────────────────────────────────
/**
 * Pick the best next question from candidates.
 * Prefers:
 *   - difficulty closest to current theta
 *   - topics the user is weakest in (50% weight)
 *   - not recently used (caller filters usedIds before passing candidates)
 *
 * @param {number} theta
 * @param {object} topicMastery - { 'fractions': 0.6, 'percentages': 0.3 }
 * @param {Array} candidates - question docs
 * @returns {object|null} selected question
 */
export function selectNextQuestion(theta, topicMastery = {}, candidates = []) {
  if (!candidates.length) return null;

  // Score each candidate (lower = better)
  const scored = candidates.map(q => {
    const diffGap = Math.abs(q.difficulty - theta);
    const mastery = topicMastery[q.topic] ?? 0.5; // unknown = medium
    const weakBonus = (1 - mastery) * 0.15; // weak topics get priority
    return { q, score: diffGap - weakBonus };
  });

  scored.sort((a, b) => a.score - b.score);
  return scored[0].q;
}

// ── Topic Mastery Update ────────────────────────────────────────────────
/**
 * Update per-topic mastery based on a single answer.
 */
export function updateTopicMastery(topicMastery, topic, isCorrect) {
  const current = topicMastery[topic] ?? 0.5;
  const delta = isCorrect ? 0.1 : -0.1;
  return {
    ...topicMastery,
    [topic]: Math.min(1, Math.max(0, current + delta)),
  };
}

// ── Session Report ──────────────────────────────────────────────────────
/**
 * Compute a full session report from the responses array.
 */
export function computeSessionReport(responses, finalTheta) {
  const total = responses.length;
  const correct = responses.filter(r => r.isCorrect).length;
  const wrong = responses.filter(r => !r.isCorrect && r.selectedOption !== null).length;
  const skipped = responses.filter(r => r.selectedOption === null).length;
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  const avgTimeMs = total > 0
    ? Math.round(responses.reduce((s, r) => s + (r.timeTakenMs || 0), 0) / total)
    : 0;

  // Topic breakdown
  const topicMap = {};
  for (const r of responses) {
    if (!topicMap[r.topic]) topicMap[r.topic] = { correct: 0, total: 0 };
    topicMap[r.topic].total++;
    if (r.isCorrect) topicMap[r.topic].correct++;
  }
  const topicBreakdown = Object.entries(topicMap).map(([topic, data]) => ({
    topic,
    correct: data.correct,
    total: data.total,
    accuracy: Math.round((data.correct / data.total) * 100),
  }));

  // Weak = accuracy < 50%, Strong = accuracy > 75%
  const weakTopics = topicBreakdown.filter(t => t.accuracy < 50).map(t => t.topic);
  const strongTopics = topicBreakdown.filter(t => t.accuracy > 75).map(t => t.topic);

  // Estimated exam score: linear mapping theta(0.05–0.95) → score(0–100)
  const estimatedScore = Math.round(((finalTheta - 0.05) / 0.9) * 100);

  return {
    total, correct, wrong, skipped, accuracy,
    avgTimeSec: Math.round(avgTimeMs / 1000),
    topicBreakdown,
    weakTopics,
    strongTopics,
    finalTheta,
    estimatedScore,
  };
}

// ── Difficulty Label ────────────────────────────────────────────────────
export function difficultyLabel(d) {
  if (d < 0.33) return 'Easy';
  if (d < 0.66) return 'Medium';
  return 'Hard';
}

// ── Estimated Score Label ───────────────────────────────────────────────
export function scoreLabel(theta) {
  const score = Math.round(((theta - 0.05) / 0.9) * 100);
  if (score >= 80) return { label: 'Excellent', color: '#16a34a' };
  if (score >= 65) return { label: 'Good — On Track', color: '#0284c7' };
  if (score >= 50) return { label: 'Average — Needs Practice', color: '#d97706' };
  return { label: 'Needs Work', color: '#dc2626' };
}
