// Gateway wrapper for the refactored modular Universal Template Evaluator pipeline
import { seededRandom, evaluateTemplate as baseEvaluateTemplate } from './universal/evaluator.js';
import { resolveExpression } from './universal/expressionParser.js';
import { interpolateString, resolveLabelOrExpression, getCleanNameFromUrl, parseLabeledEntry } from './universal/interpolator.js';
import { renderTenFrame } from './universal/components/TenFrame.js';
import { renderJarOfMarbles } from './universal/components/JarOfMarbles.js';
import { renderSpinner } from './universal/components/Spinner.js';
import { renderItemCounter } from './universal/components/ItemCounter.js';
import { drawVisualChoicePanel } from './universal/components/VisualChoice.js';
import { renderPlaceValue } from './universal/components/PlaceValue.js';
import { COMPONENT_REGISTRY } from './universal/components/index.js';

// Legacy positional wrappers for backward compatibility
export function drawPlaceValue(thousands, hundreds, tens, ones, showChart = true, color = undefined) {
  return renderPlaceValue({ thousands, hundreds, tens, ones, showChart, color });
}

export function drawBaseTenBlocks(rodsCount, blocksCount, flatsCount = 0, cubesCount = 0, color = undefined) {
  return renderPlaceValue({ tens: rodsCount, ones: blocksCount, hundreds: flatsCount, thousands: cubesCount, showChart: false, color });
}

export function drawTenFrame(filledCount, crossedOutCount = 0, color = 'red') {
  return renderTenFrame({ filledCount, crossedOutCount, color });
}

export function drawJarOfMarbles(colorA, countA, colorB, countB, seed) {
  return renderJarOfMarbles({ colorA, countA, colorB, countB }, seededRandom(seed));
}

export function drawSpinner(colorA, sectorsA, colorB, sectorsB) {
  return renderSpinner({ colorA, sectorsA, colorB, sectorsB });
}

export function drawItemCounter(itemCount, itemType = 'cupcake') {
  return renderItemCounter({ count: itemCount, itemType });
}

function hashSeed(seed) {
  let h = 5381;
  for (let i = 0; i < seed.length; i++) h = ((h << 5) + h) + seed.charCodeAt(i);
  return Math.abs(h);
}

function buildCombinations(variables) {
  const keys = Object.keys(variables);
  if (keys.length === 0) return [{}];
  
  const pools = keys.map(k => {
    const v = variables[k];
    if (!v) return [];
    if (Array.isArray(v)) return v;
    if (v.pool || v.values) return v.pool || v.values;
    if (v.items && Array.isArray(v.items)) return v.items;
    
    if (typeof v === 'object') {
      if (typeof v.min === 'number' && typeof v.max === 'number') {
        const step = Math.max(1, Math.floor((v.max - v.min) / 15));
        const pool = [];
        for (let i = v.min; i <= v.max; i += step) pool.push(i);
        return pool;
      }
      const minVal = Number(v.min);
      const maxVal = Number(v.max);
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
  
  let combos = [{}];
  for (let i = 0; i < keys.length; i++) {
    const expanded = [];
    const pool = pools[i] || [];
    for (const partial of combos) {
      if (pool.length > 0) {
        for (const val of pool) {
          expanded.push({ ...partial, [keys[i]]: val });
        }
      } else {
        expanded.push({ ...partial, [keys[i]]: null });
      }
    }
    combos = expanded;
  }
  return combos;
}


function evalDerivation(expr, ctx) {
  if (typeof expr === 'number') return expr;
  let resolved = String(expr);
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
  const result = new Function(`return (${resolved})`)();
  return Math.round(result * 100) / 100;
}

function fillTemplate(tmpl, ctx) {
  let result = tmpl;
  for (const [key, val] of Object.entries(ctx)) {
    // Replace {{key}}
    result = result.replace(new RegExp(`\\{\\{(\\s*)${key}(\\s*)\\}\\}`, 'g'), String(val));
    // Replace [key]
    result = result.replace(new RegExp(`\\[(\\s*)${key}(\\s*)\\]`, 'g'), String(val));
  }

  // Evaluate any math expressions wrapped in {= expression =}
  result = result.replace(/\{=\s*(.*?)\s*=\}/g, (match, expr) => {
    try {
      return String(evalDerivation(expr, ctx));
    } catch {
      return match;
    }
  });

  // Evaluate any math expressions wrapped in [expression]
  result = result.replace(/\[\s*(.*?)\s*\]/g, (match, expr) => {
    if (ctx[expr] !== undefined) return String(ctx[expr]);
    try {
      return String(evalDerivation(expr, ctx));
    } catch {
      return match;
    }
  });

  return result;
}

function seededShuffle(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function evaluateTemplate(template, seed) {
  let config = template?.config || template || {};
  if (config.config && (!config.variables || Array.isArray(config.variables))) {
    config = { ...config, ...config.config };
  }

  if (template?.type === 'universal' || config.type === 'universal') {
    return baseEvaluateTemplate(config, seed);
  }

  const isParameterized = template?.type === 'parameterized' ||
    (template?.examId === 'jnvst' || template?.exam === 'jnvst') ||
    (config.variables && !Array.isArray(config.variables));

  if (isParameterized) {
    let variables = config.variables || {};
    let derivations = config.derivations || {};
    
    if (Array.isArray(variables)) {
      const varObj = {};
      variables.forEach(v => {
        if (v && v.name) {
          const { name, ...rest } = v;
          if (rest.type === 'computed' || rest.formula) {
            derivations[name] = rest.formula;
          } else {
            varObj[name] = rest;
          }
        }
      });
      variables = varObj;
    }

    const questionTemplate = config.questionTemplate || config.questionText || '';
    const explanationTemplate = config.explanationTemplate || config.explanation?.sections?.[0]?.content || '';
    const optionDefs = config.options || config.interaction?.options || [];

    const combos = buildCombinations(variables);
    if (!combos.length) return { questionText: '', options: [], correctAnswerIndex: -1 };

    // Filter combinations to only keep those that produce integer-only outputs for all derivations
    let validCombos = [];
    for (const combo of combos) {
      const tempCtx = { ...combo };
      let hasDecimal = false;
      for (const [key, expr] of Object.entries(derivations)) {
        try {
          const val = evalDerivation(expr, tempCtx);
          tempCtx[key] = val;
          if (typeof val === 'number' && !Number.isInteger(val)) {
            hasDecimal = true;
          }
        } catch {
          // ignore
        }
      }
      if (!hasDecimal) {
        validCombos.push(tempCtx);
      }
    }

    const finalCombos = validCombos.length > 0 ? validCombos : combos;

    const rng = seededRandom(seed);
    const idx = Math.floor(rng() * finalCombos.length);
    const combo = finalCombos[idx];
    
    // Compute/populate derivations
    const ctx = { ...combo };
    for (const [key, expr] of Object.entries(derivations)) {
      try { 
        ctx[key] = evalDerivation(expr, ctx); 
      } catch { 
        ctx[key] = null; 
      }
    }

    const questionText = fillTemplate(questionTemplate, ctx);
    const explanationText = fillTemplate(explanationTemplate, ctx);

    // Build options array
    let options = [];
    
    if (Array.isArray(optionDefs) && optionDefs.length > 0) {
      options = optionDefs.map(opt => {
        let isCorrect = false;
        if (typeof opt.isCorrect === 'boolean') {
          isCorrect = opt.isCorrect;
        } else if (typeof opt.isCorrect === 'string') {
          try {
            const resolved = evalDerivation(opt.isCorrect, ctx);
            isCorrect = resolved === true || resolved === 1 || String(resolved) === 'true';
          } catch {
            isCorrect = false;
          }
        }
        return {
          label: fillTemplate(String(opt.label ?? opt.value ?? opt.text ?? ''), ctx),
          isCorrect,
          misconception: opt.misconception ? fillTemplate(opt.misconception, ctx) : undefined,
          feedback: opt.feedback ? fillTemplate(opt.feedback, ctx) : undefined,
          remediationHint: opt.remediationHint ? fillTemplate(opt.remediationHint, ctx) : undefined
        };
      });
    } else {
      // Fallback: build from correct_answer + distractor_N
      const correct = Number(ctx.correct_answer);
      if (isNaN(correct)) {
        options = [
          { label: 'Option A', isCorrect: true },
          { label: 'Option B', isCorrect: false },
          { label: 'Option C', isCorrect: false },
          { label: 'Option D', isCorrect: false }
        ];
      } else {
        const seenD = new Set([correct]);
        const distractors = [];
        
        for (const d of [ctx.distractor_1, ctx.distractor_2, ctx.distractor_3]) {
          if (d === undefined || d === null) continue;
          const numD = Number(d);
          if (isNaN(numD) || !isFinite(numD) || numD === correct || numD <= 0) continue;
          const val = Math.round(numD);
          if (!seenD.has(val)) {
            seenD.add(val);
            distractors.push(val);
          }
        }

        // Generate unique offsets if distractors have duplicates or aren't enough
        let offsetIdx = 1;
        while (distractors.length < 3 && offsetIdx < 100) {
          const fallback = correct + (offsetIdx % 2 === 0 ? Math.ceil(offsetIdx / 2) : -Math.ceil(offsetIdx / 2));
          if (!seenD.has(fallback) && fallback > 0) {
            seenD.add(fallback);
            distractors.push(fallback);
          }
          offsetIdx++;
        }

        options = [
          { label: String(correct), isCorrect: true },
          ...distractors.slice(0, 3).map(d => ({ label: String(d), isCorrect: false }))
        ];
      }
    }

    const shuffledOptions = seededShuffle(options, rng);
    const correctAnswerIndex = shuffledOptions.findIndex(o => o.isCorrect);

    // ── Resolve visuals array → SVG parts (same logic as base evaluator) ────
    const parts = [];
    if (Array.isArray(config.visuals || template.visuals)) {
      const visualDefs = config.visuals || template.visuals;
      for (const v of visualDefs) {
        if (!v || !v.component) continue;
        const builder = COMPONENT_REGISTRY[v.component];
        if (!builder) continue;
        const resolvedProps = {};
        for (const [key, val] of Object.entries(v.props || {})) {
          if (typeof val === 'string' && ctx[val] !== undefined) {
            resolvedProps[key] = ctx[val];
          } else {
            const num = Number(val);
            resolvedProps[key] = Number.isFinite(num) ? num : val;
          }
        }
        try {
          const result = builder(resolvedProps, rng);
          if (result && typeof result === 'object' && result.type) {
            parts.push(result);
          } else if (typeof result === 'string') {
            parts.push({ type: 'svg', content: result });
          }
        } catch (err) {
          console.error(`[universalEvaluator] Failed to render visual ${v.component}:`, err);
        }
      }
    }

    // Determine interaction engine (fill_blank vs mcq)
    const interactionEngine =
      (typeof config.interaction === 'object' ? config.interaction.engine : null) ||
      config.optionsType || 'mcq';
    const validationRules = config.validationRules || [];
    const answer = config.answer || null;

    const result = {
      questionText,
      options: shuffledOptions,
      correctAnswerIndex,
      explanation: explanationText ? { sections: [{ type: 'text', content: explanationText }] } : null,
      parts,
    };

    // Attach fill-in-the-blank fields so QuestionRenderer picks the right renderer
    if (interactionEngine === 'fill_blank' || interactionEngine === 'fillInTheBlank' || interactionEngine === 'number_input') {
      result.interaction = { engine: 'fill_blank', inputMode: 'number' };
      result.validationRules = validationRules;
      if (answer) result.answer = answer;
    }

    return result;
  }

  // Fallback to the base template evaluator
  return baseEvaluateTemplate(config, seed);
}

export {
  seededRandom,
  resolveExpression,
  interpolateString,
  resolveLabelOrExpression,
  getCleanNameFromUrl,
  parseLabeledEntry,
  drawVisualChoicePanel
};

