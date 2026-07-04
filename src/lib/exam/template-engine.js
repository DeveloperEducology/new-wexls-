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
function gcd(a, b) {
  a = Math.abs(parseInt(a, 10));
  b = Math.abs(parseInt(b, 10));
  if (isNaN(a) || isNaN(b)) return 1;
  return b === 0 ? a : gcd(b, a % b);
}

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
  if (isNaN(value) || !isFinite(value) || value === correct) return null;
  return Math.round(value);
}

function evalOptionLabel(label, ctx) {
  if (typeof label !== 'string') return label;

  // Step 1: substitute {{variable}} placeholders
  let interpolated = label.replace(/\{\{([^}]+)\}\}/g, (match, name) => {
    const trimmed = name.trim();
    return ctx[trimmed] !== undefined ? String(ctx[trimmed]) : match;
  });

  // Step 2: evaluate {= expr =} inline expressions
  interpolated = interpolated.replace(/\{=\s*(.*?)\s*=\}/g, (match, expr) => {
    try {
      // Substitute variable names in the expression
      let resolved = expr;
      for (const [key, val] of Object.entries(ctx)) {
        resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), String(val));
      }
      const result = new Function(`return (${resolved})`)();
      return result !== undefined && result !== null && !isNaN(result) ? String(Math.round(result * 100) / 100) : match;
    } catch {
      return match;
    }
  });

  // Step 3: if entire string is a math expression, evaluate it
  if (/^[-0-9\s\+\-\*\/\(\)\.]+$/.test(interpolated)) {
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
  const examId = config.examId || template.examId;
  const section = config.section || template.section || config.subject || template.subject;
  const topic = config.topic || template.topic;
  const difficulty = config.difficulty !== undefined ? config.difficulty : (template.difficulty !== undefined ? template.difficulty : 0.5);
  const tags = config.tags || template.tags;

  const { questionTemplate, variables, derivations, explanationTemplate, options: configOptions } = config;

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
        const val = ctx[key];
        const isActuallyNaN = typeof val === 'number' ? Number.isNaN(val) : String(val) === 'NaN';
        if (val === null || isActuallyNaN) { valid = false; break; }
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
      if (correct === undefined || correct === null || correct === '') continue;

      const seenD = new Set([String(correct)]);
      for (const d of [ctx.distractor_1, ctx.distractor_2, ctx.distractor_3]) {
        if (d === undefined || d === null || d === '') continue;
        let val;
        if (typeof d === 'number' || (!isNaN(d) && !isNaN(parseFloat(d)))) {
          val = safeDistractor(Number(d), correct);
        } else {
          val = String(d) === String(correct) ? null : d;
        }
        if (val !== null && !seenD.has(String(val))) {
          seenD.add(String(val));
          distractors.push(val);
        }
      }
    } else if (Array.isArray(configOptions) && configOptions.length > 0) {
      const correctOpt = configOptions.find(o => o.isCorrect);
      if (!correctOpt) continue;

      // Keep the full evaluated label string (preserves units like "meters")
      const correctRaw = evalOptionLabel(correctOpt.label, ctx);
      correct = correctRaw; // keep as string to preserve suffix like " meters"

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

    // Fallback: if we don't have enough distractors, generate unique offsets
    let offsetIdx = 1;
    const seenD = new Set([String(correct), ...distractors.map(String)]);
    
    // Extract numeric core from correct answer (handle "X meters", "-X meters", etc.)
    const correctStr = String(correct);
    const numericMatch = correctStr.match(/^(-?\d+(?:\.\d+)?)/);
    const numericCore = numericMatch ? parseFloat(numericMatch[1]) : NaN;
    const suffix = numericMatch ? correctStr.slice(numericMatch[0].length) : '';

    while (distractors.length < 3) {
      const offset = offsetIdx % 2 === 0 ? Math.ceil(offsetIdx / 2) : -Math.ceil(offsetIdx / 2);
      let fallback;
      if (!isNaN(numericCore)) {
        // Build distractor with same suffix (e.g. " meters")
        const fallbackNum = numericCore + offset;
        fallback = suffix ? `${fallbackNum}${suffix}` : fallbackNum;
      } else {
        fallback = `Option ${offsetIdx}`;
      }
      if (!seenD.has(String(fallback))) {
        seenD.add(String(fallback));
        distractors.push(fallback);
      }
      offsetIdx++;
      if (offsetIdx > 30) break; // safety guard
    }

    const optionValues = shuffle([correct, ...distractors.slice(0, 3)]);
    const optionLabels = ['A', 'B', 'C', 'D'];
    const options = {};
    let correctOption = 'A';
    optionValues.forEach((val, i) => {
      options[optionLabels[i]] = String(val);
      if (String(val) === String(correct)) correctOption = optionLabels[i];
    });

    generated.push({
      examId,
      section,
      topic,
      templateId: String(template._id || template.id || ''),
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
function buildCombinations(variables, maxCombos = 1000) {
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
    // For string, number, or other primitive values, treat as a single-value pool
    return [v];
  });

  // Calculate total Cartesian product size
  let totalSize = 1;
  for (const pool of pools) {
    if (pool.length === 0) return [];
    totalSize *= pool.length;
  }

  // If size is small, build the full Cartesian product
  if (totalSize <= maxCombos) {
    const combos = [{}];
    for (let i = 0; i < keys.length; i++) {
      const expanded = [];
      const pool = pools[i];
      for (const partial of combos) {
        for (const val of pool) {
          expanded.push({ ...partial, [keys[i]]: val });
        }
      }
      combos.splice(0, combos.length, ...expanded);
    }
    return combos;
  }

  // Otherwise, randomly sample unique combinations to prevent Memory/Stack Overflows
  const combos = [];
  const seen = new Set();
  let attempts = 0;
  const maxAttempts = maxCombos * 10;

  while (combos.length < maxCombos && attempts < maxAttempts) {
    attempts++;
    const combo = {};
    const indices = [];
    for (let i = 0; i < keys.length; i++) {
      const pool = pools[i];
      const idx = Math.floor(Math.random() * pool.length);
      indices.push(idx);
      combo[keys[i]] = pool[idx];
    }
    const key = indices.join(',');
    if (!seen.has(key)) {
      seen.add(key);
      combos.push(combo);
    }
  }

  return combos;
}

function escapeDerivationExpression(resolved) {
  let result = '';
  for (let i = 0; i < resolved.length; i++) {
    if (resolved[i] === '\\') {
      if (resolved[i + 1] === '\\') {
        result += '\\\\';
        i++; // skip next backslash
      } else {
        result += '\\\\';
      }
    } else {
      result += resolved[i];
    }
  }
  return result;
}

// ─── Derivation Evaluator ──────────────────────────────────────────────
function evalDerivation(expr, ctx) {
  // expr can be a string like "result * denominator / numerator"
  // or a number
  if (typeof expr === 'number') return expr;

  // Clean curly braces if they are present in expression (e.g. "{{variable_name}}")
  let cleanExpr = expr;
  if (typeof cleanExpr === 'string') {
    cleanExpr = cleanExpr.replace(/\{\{([^}]+)\}\}/g, '$1');
  }

  // Parse fraction variables
  let resolved = cleanExpr;
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

  const safeResolved = escapeDerivationExpression(resolved);
  // eslint-disable-next-line no-new-func
  const result = new Function('gcd', `return (${safeResolved})`)(gcd);
  if (typeof result === 'number' || (!isNaN(result) && !isNaN(parseFloat(result)))) {
    return Math.round(Number(result) * 100) / 100;
  }
  return result;
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
