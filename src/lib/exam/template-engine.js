/**
 * Template Engine
 * Handles:
 *   1. Parameterized templates → deterministic question generation
 *   2. AI-expanded templates → Gemini-drafted questions for review
 */

// ─── Parameterized Engine ──────────────────────────────────────────────

/**
 * Compute GCD for fraction simplification
 */
function gcd(a, b) { return b === 0 ? a : gcd(b, a % b); }

/**
 * Shuffle array (Fisher-Yates)
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Resolve a distractor expression safely.
 * Returns null if the result equals correct answer or NaN.
 */
function safeDistractor(value, correct) {
  if (isNaN(value) || !isFinite(value) || value === correct || value <= 0) return null;
  return Math.round(value);
}

function evalOptionLabel(label, ctx) {
  if (typeof label !== 'string') return label;
  let interpolated = label;
  interpolated = interpolated.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
    const trimmed = name.trim();
    return ctx[trimmed] !== undefined ? String(ctx[trimmed]) : match;
  });
  if (/^[0-9\s\+\-\*\/\(\)\.]+$/.test(interpolated)) {
    try {
      return new Function(`return (${interpolated})`)();
    } catch {
      return interpolated;
    }
  }
  return interpolated;
}

/**
 * Main instantiation function for parameterized templates.
 * Returns array of question-ready objects.
 */
export function instantiateParameterized(template, count) {
  let config = template.config || {};
  if (config.config && (!config.variables || Array.isArray(config.variables))) {
    config = { ...config, ...config.config };
  }
  const { questionTemplate, variables, derivations, explanationTemplate, examId, section, topic, difficulty, tags, options: configOptions } = config;

  const generated = [];
  const seen = new Set();

  // Build all valid combinations of variables
  const varKeys = Object.keys(variables);
  const combos = buildCombinations(variables);
  const shuffled = shuffle(combos);

  for (const combo of shuffled) {
    if (generated.length >= count) break;

    // Compute derived values
    const ctx = { ...combo };
    let valid = true;

    for (const [key, expr] of Object.entries(derivations)) {
      try {
        ctx[key] = evalDerivation(expr, ctx);
        if (ctx[key] === null || isNaN(ctx[key])) { valid = false; break; }
      } catch { valid = false; break; }
    }
    if (!valid) continue;

    const sigKey = JSON.stringify(combo);
    if (seen.has(sigKey)) continue;
    seen.add(sigKey);

    // Fill templates
    const questionText = fillTemplate(questionTemplate, ctx);
    const explanationText = fillTemplate(explanationTemplate, ctx);

    // Build options (correct + 3 distractors), shuffle
    let correct;
    let distractors = [];

    if (derivations.correct_answer !== undefined) {
      correct = ctx.correct_answer;
      if (!correct || isNaN(correct)) continue;

      const seenD = new Set([String(correct)]);
      for (const d of [ctx.distractor_1, ctx.distractor_2, ctx.distractor_3]) {
        const val = safeDistractor(d, correct);
        if (val !== null && !seenD.has(String(val))) {
          seenD.add(String(val));
          distractors.push(val);
        }
      }
    } else if (Array.isArray(configOptions) && configOptions.length > 0) {
      const correctOpt = configOptions.find(o => o.isCorrect);
      if (!correctOpt) continue;

      const correctRaw = evalOptionLabel(correctOpt.label, ctx);
      correct = typeof correctRaw === 'number' ? correctRaw : parseFloat(correctRaw);
      if (isNaN(correct)) {
        correct = correctRaw;
      }

      const seenD = new Set([String(correct)]);
      const distOpts = configOptions.filter(o => !o.isCorrect);
      for (const opt of distOpts) {
        const valRaw = evalOptionLabel(opt.label, ctx);
        const valStr = String(valRaw);
        if (!seenD.has(valStr)) {
          seenD.add(valStr);
          distractors.push(valRaw);
        }
      }
    }

    if (correct === undefined) continue;

    // Fallback: if we have duplicate distractors, generate unique offsets to guarantee 4 options
    let offsetIdx = 1;
    const seenD = new Set([String(correct), ...distractors.map(String)]);
    while (distractors.length < 3) {
      const numericCorrect = Number(correct);
      const fallback = (isNaN(numericCorrect) ? 0 : numericCorrect) + (offsetIdx % 2 === 0 ? Math.ceil(offsetIdx / 2) : -Math.ceil(offsetIdx / 2));
      if (!seenD.has(String(fallback)) && fallback > 0) {
        seenD.add(String(fallback));
        distractors.push(fallback);
      }
      offsetIdx++;
    }

    const optionValues = shuffle([correct, ...distractors.slice(0, 3)]);
    const optionLabels = ['A', 'B', 'C', 'D'];
    const options = {};
    let correctOption = 'A';
    optionValues.forEach((val, i) => {
      options[optionLabels[i]] = String(val);
      if (val === correct) correctOption = optionLabels[i];
    });

    generated.push({
      examId,
      section,
      topic,
      difficulty,
      questionText,
      options,
      correctOption,
      explanationText,
      isPYQ: false,
      tags: tags || [topic],
      templateVariables: combo,
      status: 'active',
    });
  }

  return generated;
}

// ─── Variable Combination Builder ─────────────────────────────────────
function buildCombinations(variables) {
  const keys = Object.keys(variables);
  const pools = keys.map(k => {
    const v = variables[k];
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (v.pool || v.values) return v.pool || v.values;
    if (v.items && Array.isArray(v.items)) return v.items;
    if (typeof v === 'object') {
      const minVal = v.min !== undefined ? Number(v.min) : NaN;
      const maxVal = v.max !== undefined ? Number(v.max) : NaN;
      if (!isNaN(minVal) && !isNaN(maxVal)) {
        const step = Math.max(1, Math.floor((maxVal - minVal) / 15));
        const pool = [];
        for (let i = minVal; i <= maxVal; i += step) pool.push(i);
        return pool;
      }
      return Object.values(v);
    }
    return [];
  });
  const combos = [{}];
  for (let i = 0; i < keys.length; i++) {
    const expanded = [];
    for (const partial of combos) {
      for (const val of pools[i]) {
        expanded.push({ ...partial, [keys[i]]: val });
      }
    }
    combos.splice(0, combos.length, ...expanded);
  }
  return combos;
}

// ─── Derivation Evaluator ──────────────────────────────────────────────
function evalDerivation(expr, ctx) {
  // expr can be a string like "result * denominator / numerator"
  // or a number
  if (typeof expr === 'number') return expr;

  // Parse fraction variables
  let resolved = expr;
  for (const [key, val] of Object.entries(ctx)) {
    if (typeof val === 'string' && val.includes('/')) {
      const [num, den] = val.split('/').map(Number);
      resolved = resolved.replace(new RegExp(`${key}_numerator`, 'g'), String(num));
      resolved = resolved.replace(new RegExp(`${key}_denominator`, 'g'), String(den));
      resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${num}/${den})`);
    } else {
      resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
    }
  }

  // eslint-disable-next-line no-new-func
  const result = new Function('gcd', `return (${resolved})`)(gcd);
  return Math.round(result * 100) / 100;
}

// ─── Template String Filler ────────────────────────────────────────────
function fillTemplate(template, ctx) {
  let result = template;
  for (const [key, val] of Object.entries(ctx)) {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(val));
  }
  return result;
}

// ─── AI-Expanded Template Prompt Builder ──────────────────────────────
/**
 * Build the Gemini prompt for an AI-expanded template.
 * Returns a prompt string. Caller sends to Gemini.
 */
export function buildAiExpandedPrompt(template, count, alreadyUsed = []) {
  const { promptTemplate, qualityRules } = template.config;

  const difficultyLabel = {
    easy: template.difficulty < 0.33,
    medium: template.difficulty >= 0.33 && template.difficulty < 0.66,
    hard: template.difficulty >= 0.66,
  };
  const diffLabel = difficultyLabel.easy ? 'easy' : difficultyLabel.medium ? 'medium' : 'hard';

  const basePrompt = fillTemplate(promptTemplate, {
    difficulty_label: diffLabel,
    already_used: alreadyUsed.slice(-5).join('; ') || 'none',
    count,
  });

  const rulesText = qualityRules?.map((r, i) => `${i + 1}. ${r}`).join('\n') || '';

  return `You are a question writer for JNVST (Class 6 entrance exam). 

Generate EXACTLY ${count} questions of type: ${template.name}

Quality rules:
${rulesText}

${basePrompt}

Return ONLY a valid JSON array. Each object must have:
{
  "questionText": "...",
  "options": { "A": "...", "B": "...", "C": "...", "D": "..." },
  "correctOption": "A" | "B" | "C" | "D",
  "explanationText": "...",
  "topic": "${template.section}",
  "difficulty": ${template.difficulty}
}

No markdown, no extra text. Just the JSON array.`;
}

/**
 * Parse Gemini's JSON response into question-ready objects.
 */
export function parseAiGeneratedQuestions(rawText, template) {
  try {
    const cleaned = rawText.replace(/```json|```/g, '').trim();
    const arr = JSON.parse(cleaned);
    return arr.map(q => ({
      examId: template.examId,
      section: template.section,
      topic: q.topic || template.section,
      difficulty: q.difficulty ?? template.difficulty,
      questionText: q.questionText,
      options: q.options,
      correctOption: q.correctOption,
      explanationText: q.explanationText,
      isPYQ: false,
      tags: template.config.tags || [template.section],
      templateId: String(template._id),
      status: 'draft', // requires admin review
    }));
  } catch {
    return [];
  }
}
