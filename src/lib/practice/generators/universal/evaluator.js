import { resolveExpression } from './expressionParser.js';
import { interpolateString, getCleanNameFromUrl, parseLabeledEntry, resolveLabelOrExpression } from './interpolator.js';
import { COMPONENT_REGISTRY } from './components/index.js';
import { drawVisualChoicePanel } from './components/VisualChoice.js';
import { generateDynamicSceneSvg } from './components/SceneComposer.js';
import { sanitizeLatexMathText } from '../latexSanitizer.js';


// Seeded RNG
export function seededRandom(seed) {
  let seedVal = 0;
  if (typeof seed === 'number') {
    seedVal = seed;
  } else {
    const text = String(seed || Date.now());
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = (hash * 31 + text.charCodeAt(i)) >>> 0;
    }
    seedVal = hash;
  }
  return function() {
    seedVal = (seedVal * 9301 + 49297) % 233280;
    return seedVal / 233280;
  };
}

// Shuffle helper
function shuffle(array, rng) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * Convert a non-negative integer to its English word form.
 * e.g. 9 → "nine",  21 → "twenty-one",  100 → "one hundred"
 * Used in templates via  toWords(A)  or  [toWords_A]  interpolation.
 */
function numberToWords(num) {
  num = Number(num);
  if (!Number.isFinite(num) || num < 0) return String(num);
  if (num === 0) return 'zero';
  const ONES = ['','one','two','three','four','five','six','seven','eight','nine',
                 'ten','eleven','twelve','thirteen','fourteen','fifteen','sixteen',
                 'seventeen','eighteen','nineteen'];
  const TENS = ['','','twenty','thirty','forty','fifty','sixty','seventy','eighty','ninety'];
  function below1000(n) {
    if (n < 20) return ONES[n];
    if (n < 100) return TENS[Math.floor(n/10)] + (n%10 ? '-' + ONES[n%10] : '');
    return ONES[Math.floor(n/100)] + ' hundred' + (n%100 ? ' ' + below1000(n%100) : '');
  }
  if (num < 1000) return below1000(num);
  if (num < 1000000) {
    const th = Math.floor(num/1000);
    const rem = num % 1000;
    return below1000(th) + ' thousand' + (rem ? ' ' + below1000(rem) : '');
  }
  return String(num); // fallback for very large numbers
}

/**
 * Evaluate inline {= expr =} expressions within a string.
 * Returns an array of parts: each item is either a plain string or { type: 'svg', content: string }.
 * If there are no {= =} blocks, returns [{ type: 'text', content: str }] wrapped in original part.
 */
function resolveInlineExpressions(str, context) {
  const INLINE_RE = /\{=\s*([\s\S]+?)\s*=\}/g;
  if (!INLINE_RE.test(str)) return null; // nothing to process
  INLINE_RE.lastIndex = 0;

  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = INLINE_RE.exec(str)) !== null) {
    const before = str.slice(lastIndex, match.index);
    if (before) parts.push({ type: 'text', content: before });

    const expr = match[1];
    let result;
    try {
      result = resolveExpression(expr, context);
    } catch (e) {
      result = match[0]; // keep as-is on error
    }

    const resultStr = String(result ?? '');
    if (resultStr.includes('<svg')) {
      parts.push({ type: 'svg', content: resultStr });
    } else if (resultStr) {
      parts.push({ type: 'text', content: resultStr });
    }

    lastIndex = match.index + match[0].length;
  }

  const tail = str.slice(lastIndex);
  if (tail) parts.push({ type: 'text', content: tail });

  return parts.length > 0 ? parts : null;
}

function resolvePartStrings(part, resolvedVariables) {
  if (typeof part === 'string') {
    const interpolated = interpolateString(part, resolvedVariables);
    if (typeof interpolated === 'string') {
      const inlineParts = resolveInlineExpressions(interpolated, resolvedVariables);
      if (inlineParts) {
        // If only one svg part, return it directly
        if (inlineParts.length === 1) return inlineParts[0];
        // Otherwise wrap in a section with sub-parts
        return { type: 'section', parts: inlineParts };
      }
    }
    return interpolated;
  }
  if (!part || typeof part !== 'object') {
    return part;
  }
  const resolved = { ...part };
  if (typeof resolved.content === 'string') {
    const interpolated = interpolateString(resolved.content, resolvedVariables);
    if (typeof interpolated === 'string') {
      const inlineParts = resolveInlineExpressions(interpolated, resolvedVariables);
      if (inlineParts) {
        if (inlineParts.length === 1) {
          // Merge the single result into this part
          return { ...resolved, ...inlineParts[0] };
        }
        return { ...resolved, type: 'section', content: undefined, parts: inlineParts };
      }
      resolved.content = interpolated;
    } else {
      resolved.content = interpolated;
    }
  }
  if (typeof resolved.text === 'string') {
    resolved.text = interpolateString(resolved.text, resolvedVariables);
  }
  if (typeof resolved.label === 'string') {
    resolved.label = interpolateString(resolved.label, resolvedVariables);
  }
  if (Array.isArray(resolved.parts)) {
    resolved.parts = resolved.parts.map(p => resolvePartStrings(p, resolvedVariables));
  }
  if (resolved.type === 'arithmeticLayout' && resolved.layout && Array.isArray(resolved.layout.rows)) {
    resolved.layout = {
      ...resolved.layout,
      rows: resolved.layout.rows.map(row => {
        const resRow = { ...row };
        if (typeof resRow.text === 'string') {
          resRow.text = interpolateString(resRow.text, resolvedVariables);
        }
        if (Array.isArray(resRow.cells)) {
          resRow.cells = resRow.cells.map(cell => {
            const resCell = { ...cell };
            if (resCell.expected !== undefined) {
              resCell.expected = interpolateString(String(resCell.expected), resolvedVariables);
            }
            return resCell;
          });
        }
        return resRow;
      })
    };
  }
  return resolved;
}

function pickRandom(items, rng, fallback = '') {
  if (!Array.isArray(items) || items.length === 0) return fallback;
  return items[Math.floor(rng() * items.length)];
}

function pickUnseenIndex(pool, templateVariables, options, rng) {
  if (!Array.isArray(pool) || pool.length === 0) return 0;

  const rawSeen = options?.seenItems
    || options?.searchParams?.get?.('seenItems')
    || options?.historyContext?.seenItems
    || options?.template?._seenItemIds
    || [];

  const seenSet = new Set(
    (Array.isArray(rawSeen) ? rawSeen : String(rawSeen).split(','))
      .map(s => String(s).trim().toLowerCase())
      .filter(Boolean)
  );

  let wordList = null;
  if (Array.isArray(templateVariables)) {
    const wordVar = templateVariables.find(v => {
      const name = String(v?.name || v?.id || '').toLowerCase();
      return name === 'target_word' || name === 'word' || name === 'result' || name === 'answer_letter' || name === 'target_audio' || name === 'target_word_incomplete' || name === 'id';
    });
    if (wordVar?.formula) {
      try {
        const match = wordVar.formula.match(/^\[(.*)\]\[index\]$/s);
        if (match) {
          wordList = JSON.parse(`[${match[1]}]`);
        }
      } catch (e) {}
    }
  }

  // Filter pool for rows that haven't been seen yet, preserving sequential order
  const unseenPool = pool.filter(idx => {
    const idxStr = String(idx).toLowerCase();
    if (seenSet.has(idxStr) || seenSet.has(`idx_${idxStr}`)) return false;
    if (wordList && Array.isArray(wordList) && idx >= 0 && idx < wordList.length) {
      const wordVal = String(wordList[idx]).toLowerCase();
      if (seenSet.has(wordVal)) return false;
    }
    return true;
  });

  // 1. If no seen history exists yet, pick a row based on seed RNG so refresh changes question
  if (seenSet.size === 0) {
    if (typeof rng === 'function') {
      const randIdx = Math.floor(rng() * pool.length);
      return pool[randIdx];
    }
    return pool[0];
  }

  // 2. If there are unseen rows, pick the NEXT unseen row in sequential order
  if (unseenPool.length > 0) {
    return unseenPool[0];
  }

  // 3. If all rows have been seen, cycle back over sequentially
  const cycleIndex = seenSet.size % pool.length;
  return pool[cycleIndex];
}

function pickRandomMany(items, count, rng) {
  if (!Array.isArray(items) || items.length === 0) return [];
  const desiredCount = Math.max(1, Number(count) || 1);
  const shuffled = [...items];
  for (let i = shuffled.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled.slice(0, Math.min(desiredCount, shuffled.length));
}

function isImageLikeUrl(value) {
  return typeof value === 'string' && /^(https?:\/\/|\/|data:image\/)/.test(value.trim());
}

function normalizeDataSourceItems(source) {
  if (!source) return [];
  if (Array.isArray(source.items)) return source.items;
  if (Array.isArray(source.data)) return source.data;
  if (Array.isArray(source.values)) return source.values;
  if (Array.isArray(source.pool)) return source.pool;
  if (typeof source.items === 'string') {
    return source.items.split(',').map(item => item.trim()).filter(Boolean);
  }
  if (typeof source.value === 'string') {
    return source.value.split(',').map(item => item.trim()).filter(Boolean);
  }
  if (typeof source.pool === 'string') {
    return source.pool.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function resolveVariableValue(variable, resolvedVariables, dataSourceMap, rng) {
  if (typeof variable === 'number' || typeof variable === 'boolean') return variable;
  if (typeof variable === 'string') {
    if (variable.includes('[') || variable.includes('{') || /[\+\-\*\/\%()]/.test(variable)) {
      try {
        const exprRes = resolveExpression(variable, resolvedVariables);
        if (exprRes !== undefined && exprRes !== null && !isNaN(exprRes)) return exprRes;
      } catch (e) {}
      return interpolateString(variable, resolvedVariables);
    }
    return variable;
  }

  const type = String(variable?.type || '').toLowerCase();
  const sourceKey = variable?.source || variable?.sourceId;
  const sourceItems = sourceKey ? dataSourceMap[sourceKey] : null;

  if (Array.isArray(variable?.values) && variable.values.length > 0 && type !== 'pool_selection') {
    const idx = resolvedVariables.index !== undefined
      ? Math.abs(Number(resolvedVariables.index)) % variable.values.length
      : 0;
    const rawVal = variable.values[idx];
    return typeof rawVal === 'string' ? interpolateString(rawVal, resolvedVariables) : rawVal;
  }

  if (type === 'integer' || type === 'random_number' || type === 'random_int') {
    const minVal = resolveExpression(variable.min, resolvedVariables);
    const maxVal = resolveExpression(variable.max, resolvedVariables);
    const min = Math.min(minVal, maxVal);
    const max = Math.max(minVal, maxVal);
    return Math.floor(rng() * (max - min + 1)) + min;
  }

  if (type === 'expression' || type === 'computed') {
    return resolveExpression(variable.formula || variable.expression || variable.value, resolvedVariables);
  }

  if (type === 'string_template') {
    return interpolateString(variable.template || variable.value || '', resolvedVariables);
  }

  if (type === 'conditional') {
    const condition = resolveExpression(variable.condition || variable.if || 'false', resolvedVariables);
    const nextValue = condition ? variable.trueValue ?? variable.then : variable.falseValue ?? variable.else;
    return typeof nextValue === 'string' ? interpolateString(nextValue, resolvedVariables) : nextValue;
  }

  if (type === 'array_transform') {
    const items = Array.isArray(sourceItems) ? sourceItems : normalizeDataSourceItems(variable);
    if (variable.transform === 'join') return items.join(variable.separator || ', ');
    if (variable.transform === 'labels') return items.map(item => item?.label ?? item);
    if (variable.pick === 'random') return pickRandom(items, rng);
    return items;
  }

  if (type === 'pool_selection') {
    let items = Array.isArray(sourceItems) ? sourceItems : normalizeDataSourceItems(variable);
    if (!items.length && variable.category && sourceKey && Array.isArray(dataSourceMap[`${sourceKey}:${variable.category}`])) {
      items = dataSourceMap[`${sourceKey}:${variable.category}`];
    }
    return pickRandomMany(items, variable.count, rng);
  }

  if (type === 'choice' || type === 'list' || type === 'random_item' || type === 'array') {
    const items = Array.isArray(sourceItems) ? sourceItems : normalizeDataSourceItems(variable);
    if (items.length > 0) {
      const name = variable.name || variable.id;
      if (name === 'animal' || name === 'image') {
        if (resolvedVariables._sharedChoiceIndex === undefined) {
          resolvedVariables._sharedChoiceIndex = Math.floor(rng() * items.length);
        }
        const idx = resolvedVariables._sharedChoiceIndex % items.length;
        return items[idx];
      }
      return pickRandom(items, rng);
    }
    return '';
  }

  // Fallback: if a formula/expression property exists evaluate it even without an explicit type
  if (variable?.formula || variable?.expression) {
    return resolveExpression(variable.formula || variable.expression, resolvedVariables);
  }

  return variable?.value ?? '';
}

export function resolveValidationRules(rules, resolvedVariables) {
  if (!Array.isArray(rules)) return [];

  const findNonSvgResultFallback = (resolvedVars) => {
    const keys = Object.keys(resolvedVars || {})
      .filter(k => /^Result(_\d+)?$/.test(k))
      .sort((a, b) => {
        const numA = a === 'Result' ? 1 : parseInt(a.split('_')[1], 10);
        const numB = b === 'Result' ? 1 : parseInt(b.split('_')[1], 10);
        return numA - numB;
      });

    for (const key of keys) {
      const val = resolvedVars[key];
      if (val !== undefined && val !== null && !(typeof val === 'string' && val.includes('<svg'))) {
        return val;
      }
    }
    return null;
  };

  const resolveTemplateValue = (value) => {
    if (typeof value === 'string') {
      const resolved = interpolateString(value, resolvedVariables);
      if (typeof resolved === 'string' && resolved.includes('<svg')) {
        const fallback = findNonSvgResultFallback(resolvedVariables);
        if (fallback !== null) return fallback;
      }
      return resolved;
    }
    if (Array.isArray(value)) return value.map(resolveTemplateValue);
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value).map(([key, nestedValue]) => [
          interpolateString(key, resolvedVariables),
          resolveTemplateValue(nestedValue)
        ])
      );
    }
    return value;
  };

  return rules.map(rule => {
    if (!rule || typeof rule !== 'object') return rule;
    const resolved = { ...rule };
    ['value', 'expected', 'answer', 'formula', 'target'].forEach(key => {
      if (resolved[key] !== undefined) {
        resolved[key] = resolveTemplateValue(resolved[key]);
      }
    });
    if (String(resolved.type || '').toLowerCase() === 'custom_formula' && resolved.formula) {
      resolved.resolvedValue = resolveExpression(resolved.formula, resolvedVariables);
      resolved.value = resolved.resolvedValue;
    }
    return resolved;
  });
}

// Main Template Evaluator Engine
export function evaluateTemplate(originalTemplate, seed, difficultyContext = null) {
  if (!originalTemplate || typeof originalTemplate !== 'object') {
    throw new Error('Template document is invalid.');
  }

  let currentLevel = 1; // default fallback (starts at L1 Easy)
  if (difficultyContext) {
    const historyContext = difficultyContext.historyContext || {};
    const searchParams = difficultyContext.searchParams;
    const difficulty = difficultyContext.difficulty || 'adaptive';

    if (historyContext.practiceLevel) {
      currentLevel = Number(historyContext.practiceLevel) || 1;
    } else if (searchParams) {
      const levelParam = searchParams.get('practiceLevel') || searchParams.get('level');
      if (levelParam) {
        currentLevel = Number(levelParam) || 1;
      } else {
        const diffVal = searchParams.get('difficulty');
        if (diffVal && !isNaN(Number(diffVal))) {
          currentLevel = Number(diffVal);
        } else if (diffVal === 'easy') {
          currentLevel = 1;
        } else if (diffVal === 'medium') {
          currentLevel = 2;
        } else if (diffVal === 'hard') {
          currentLevel = 3;
        } else {
          const correctStreak = Number(searchParams.get('correctStreak') || 0);
          const smartScore = Number(searchParams.get('smartScore') || 0);
          if (correctStreak >= 9 || smartScore >= 80) currentLevel = 4;
          else if (correctStreak >= 6 || smartScore >= 60) currentLevel = 3;
          else if (correctStreak >= 3 || smartScore >= 30) currentLevel = 2;
          else currentLevel = 1;
        }
      }
    } else if (!isNaN(Number(difficulty))) {
      currentLevel = Number(difficulty);
    } else if (difficulty === 'easy') {
      currentLevel = 1;
    } else if (difficulty === 'medium') {
      currentLevel = 2;
    } else if (difficulty === 'hard') {
      currentLevel = 3;
    }
  }

  // Level Pool Length helper for sequential progression (L1 -> L2 -> L3 -> L4)
  const getLevelPoolLen = (lvl) => {
    const varName = `index_l${lvl}`;
    if (Array.isArray(originalTemplate.variables)) {
      const v = originalTemplate.variables.find(x => (x?.name || x?.id) === varName);
      if (Array.isArray(v)) return v.length;
      return (v && Array.isArray(v.values || v.value)) ? (v.values || v.value).length : 0;
    } else if (originalTemplate.variables && typeof originalTemplate.variables === 'object') {
      const v = originalTemplate.variables[varName];
      if (Array.isArray(v)) return v.length;
      return (v && Array.isArray(v?.values || v?.value)) ? (v.values || v.value).length : 0;
    }
    return 0;
  };

  const l1Len = getLevelPoolLen(1);
  const l2Len = getLevelPoolLen(2);
  const l3Len = getLevelPoolLen(3);
  const l4Len = getLevelPoolLen(4);

  const searchParams = difficultyContext?.searchParams;
  const qnRaw = difficultyContext?.qn !== undefined && difficultyContext?.qn !== null ? difficultyContext.qn : searchParams?.get?.('qn');
  const qnNum = (qnRaw !== undefined && qnRaw !== null && qnRaw !== '') ? parseInt(qnRaw, 10) : null;

  // If question number (qn) is provided and level pools exist, map qn to currentLevel (L1 -> L2 -> L3 -> L4)
  if (qnNum !== null && !isNaN(qnNum) && qnNum > 0 && l1Len > 0) {
    if (qnNum <= l1Len) {
      currentLevel = 1;
    } else if (qnNum <= l1Len + l2Len) {
      currentLevel = 2;
    } else if (qnNum <= l1Len + l2Len + l3Len) {
      currentLevel = 3;
    } else {
      currentLevel = 4;
    }
  }

  // Normalize universal template format to legacy flat structure for evaluator compatibility
  let template = originalTemplate;
  if (originalTemplate.templateInfo || originalTemplate.layout || originalTemplate.interaction || originalTemplate.feedback) {
    const schemaInteraction = originalTemplate.interaction || {};
    template = {
      ...originalTemplate,
      questionText: originalTemplate.layout?.questionText || originalTemplate.questionText,
      optionsType: schemaInteraction.engine || schemaInteraction.type || originalTemplate.optionsType || 'mcq',
      options: (Array.isArray(schemaInteraction.options) && schemaInteraction.options.length > 0) ? schemaInteraction.options : (originalTemplate.options || []),
      explanation: originalTemplate.feedback?.stepByStepExplanation 
        ? { sections: [{ type: 'text', content: originalTemplate.feedback.stepByStepExplanation }] }
        : originalTemplate.explanation,
    };
  }

  // Smart Level Clamping: If template does not have all levels (e.g. static template with only L1),
  // clamp currentLevel to the available levels instead of scaling beyond existing questions.
  const availableLevels = [];
  if (Array.isArray(template.variables)) {
    template.variables.forEach(v => {
      const name = String(v?.name || v?.id || '');
      const match = name.match(/^index_l(\d+)$/);
      if (match && Array.isArray(v.values || v.value) && (v.values || v.value).length > 0) {
        availableLevels.push(Number(match[1]));
      }
    });
  } else if (template.variables && typeof template.variables === 'object') {
    Object.keys(template.variables).forEach(name => {
      const match = name.match(/^index_l(\d+)$/);
      const v = template.variables[name];
      if (match && Array.isArray(v?.values || v?.value) && (v.values || v.value).length > 0) {
        availableLevels.push(Number(match[1]));
      }
    });
  }

  if (availableLevels.length > 0) {
    if (!availableLevels.includes(currentLevel)) {
      currentLevel = availableLevels.reduce((prev, curr) =>
        Math.abs(curr - currentLevel) < Math.abs(prev - currentLevel) ? curr : prev
      );
    }
  }

  const rng = seededRandom(seed);
  
  function gcd(a, b) {
    a = Math.abs(a); b = Math.abs(b);
    while (b) { let t = b; b = a % b; a = t; }
    return a || 1;
  }
  function lcm(a, b) {
    return Math.abs(a * b) / gcd(a, b);
  }
  function simplifyFraction(n, d) {
    const divisor = gcd(n, d);
    const num = n / divisor;
    const den = d / divisor;
    return { numerator: num, denominator: den, string: den === 1 ? `${num}` : `${num}/${den}` };
  }
  function addFractions(n1, d1, n2, d2) {
    const common = lcm(d1, d2);
    const num = (n1 * (common / d1)) + (n2 * (common / d2));
    return simplifyFraction(num, common);
  }

  let activeTemplate = { ...template };
  // Auto-compile template.rows into activeTemplate.variables with index formulas if template contains rows array
  if (Array.isArray(activeTemplate.rows) && activeTemplate.rows.length > 0 && (!activeTemplate.variables || (Array.isArray(activeTemplate.variables) && activeTemplate.variables.length === 0) || (typeof activeTemplate.variables === 'object' && Object.keys(activeTemplate.variables).length === 0))) {
    const rowCount = activeTemplate.rows.length;
    const indexPool = Array.from({ length: rowCount }, (_, i) => i);
    const compiledVars = [
      { name: 'index', values: indexPool }
    ];

    const keys = Object.keys(activeTemplate.rows[0]);
    keys.forEach(k => {
      const colValues = activeTemplate.rows.map(r => r[k] ?? '');
      compiledVars.push({
        name: k,
        formula: `[${colValues.map(v => typeof v === 'number' ? v : JSON.stringify(String(v))).join(', ')}][index]`
      });
    });

    activeTemplate = { ...activeTemplate, variables: compiledVars };
  }

  // Built-in helper functions available to ALL template expressions & interpolations.
  const resolvedVariables = {
    toWords: numberToWords,
    gcd,
    lcm,
    simplifyFraction,
    addFractions
  };
  const dataSourceMap = {};

  if (Array.isArray(template.dataSources)) {
    for (const source of template.dataSources) {
      const sourceId = source?.id || source?.name;
      if (!sourceId) continue;
      if (source.type === 'pool_selection') {
        const allItems = normalizeDataSourceItems(source);
        const targetCats = source.targetCategories || (source.category ? [source.category] : []);
        if (targetCats.length > 0) {
          dataSourceMap[sourceId] = allItems;
          dataSourceMap[sourceId + ':distractors'] = source._distractorItems || [];
        } else {
          dataSourceMap[sourceId] = allItems;
        }
        dataSourceMap[sourceId + ':count'] = source.count || 1;
        if (source._categoryLabel) {
          resolvedVariables['targetCategoryLabel'] = source._categoryLabel;
        }
      } else if (source.type === 'random_number') {
        const minVal = resolveExpression(source.min ?? 0, resolvedVariables);
        const maxVal = resolveExpression(source.max ?? 10, resolvedVariables);
        const min = Number(isNaN(minVal) ? 0 : minVal);
        const max = Number(isNaN(maxVal) ? 10 : maxVal);
        dataSourceMap[sourceId] = Math.floor(rng() * (Math.max(min, max) - Math.min(min, max) + 1)) + Math.min(min, max);
      } else if (source.type === 'random_item') {
        dataSourceMap[sourceId] = pickRandom(normalizeDataSourceItems(source), rng);
      } else {
        dataSourceMap[sourceId] = normalizeDataSourceItems(source);
      }
      if (source.type === 'pool_selection' && source.category) {
        dataSourceMap[`${sourceId}:${source.category}`] = dataSourceMap[sourceId];
      }
      resolvedVariables[sourceId] = dataSourceMap[sourceId];
    }
  }

  const resolveIndexVariable = (pool) => {
    if (!Array.isArray(pool) || pool.length === 0) return 0;

    const isOrderedMode = Boolean(
      template?.isSequential === true ||
      template?.isOrdered === true ||
      template?.preserveOptionOrder === true ||
      template?.metadata?.isSequential === true ||
      template?.metadata?.isOrdered === true ||
      template?.metadata?.preserveOptionOrder === true ||
      searchParams?.get?.('isSequential') === 'true' ||
      searchParams?.get?.('isOrdered') === 'true'
    );

    if (qnNum !== null && !isNaN(qnNum) && qnNum > 0) {
      let poolOffset = 0;
      if (currentLevel === 2) poolOffset = l1Len;
      else if (currentLevel === 3) poolOffset = l1Len + l2Len;
      else if (currentLevel === 4) poolOffset = l1Len + l2Len + l3Len;

      const idxInPool = Math.max(0, qnNum - 1 - poolOffset);
      return pool[idxInPool % pool.length];
    } else if (isOrderedMode) {
      return pool[0];
    }

    return pickUnseenIndex(pool, activeTemplate.variables, difficultyContext, rng);
  };

  // 1. Evaluate variables sequentially
  if (Array.isArray(activeTemplate.variables)) {
    for (const v of activeTemplate.variables) {
      const varName = v?.name || v?.id;
      if (!varName) continue;

      if (varName === 'index') {
        let levelVarName = `index_l${currentLevel}`;
        const foundLvlVar = activeTemplate.variables.find(x => (x?.name || x?.id) === levelVarName);
        const levelPool = Array.isArray(foundLvlVar) ? foundLvlVar : (foundLvlVar ? (foundLvlVar.values || foundLvlVar.value) : null);
        if (Array.isArray(levelPool) && levelPool.length > 0) {
          resolvedVariables[varName] = resolveIndexVariable(levelPool);
          continue;
        }
        const selfPool = Array.isArray(v) ? v : (v ? (v.values || v.value) : null);
        if (Array.isArray(selfPool) && selfPool.length > 0) {
          resolvedVariables[varName] = resolveIndexVariable(selfPool);
          continue;
        }
      }

      if (/^index_l\d+$/.test(varName)) {
        resolvedVariables[varName] = resolvedVariables['index'];
        continue;
      }

      resolvedVariables[varName] = resolveVariableValue(v, resolvedVariables, dataSourceMap, rng);
    }
  } else if (activeTemplate.variables && typeof activeTemplate.variables === 'object') {
    for (const [varName, v] of Object.entries(activeTemplate.variables)) {
      const normalizedVar = typeof v === 'object' && v !== null ? { name: varName, ...v } : v;

      if (varName === 'index') {
        let levelVarName = `index_l${currentLevel}`;
        const foundLvlVar = activeTemplate.variables[levelVarName];
        const levelPool = Array.isArray(foundLvlVar) ? foundLvlVar : (foundLvlVar ? (foundLvlVar.values || foundLvlVar.value) : null);
        if (Array.isArray(levelPool) && levelPool.length > 0) {
          resolvedVariables[varName] = resolveIndexVariable(levelPool);
          continue;
        }
        const selfPool = Array.isArray(v) ? v : (v ? (v.values || v.value) : null);
        if (Array.isArray(selfPool) && selfPool.length > 0) {
          resolvedVariables[varName] = resolveIndexVariable(selfPool);
          continue;
        }
      }

      if (/^index_l\d+$/.test(varName)) {
        resolvedVariables[varName] = resolvedVariables['index'];
        continue;
      }

      resolvedVariables[varName] = resolveVariableValue(normalizedVar, resolvedVariables, dataSourceMap, rng);
    }
  }

  // 1.25 Populate row data and derivations into resolvedVariables
  let activeIdx = resolvedVariables['index'];
  if (Array.isArray(activeTemplate.rows) && activeTemplate.rows.length > 0) {
    if (activeIdx === undefined || isNaN(activeIdx) || activeIdx < 0 || activeIdx >= activeTemplate.rows.length) {
      activeIdx = pickUnseenIndex(Array.from({ length: activeTemplate.rows.length }, (_, i) => i), activeTemplate.variables, difficultyContext, rng);
      resolvedVariables['index'] = activeIdx;
    }
    const rowObj = activeTemplate.rows[activeIdx];
    if (rowObj) {
      for (const [rk, rv] of Object.entries(rowObj)) {
        if (rk === '_level' || rk === 'id' || rk === '_id') continue;
        if (rv !== undefined && rv !== null && String(rv).trim() !== '') {
          resolvedVariables[rk] = rv;
        }
      }
    }
  }

  const derivations = activeTemplate.derivations || activeTemplate.config?.derivations;
  if (derivations && typeof derivations === 'object') {
    for (const [dk, dexpr] of Object.entries(derivations)) {
      if (typeof dexpr === 'string') {
        let resolved = resolveExpression(dexpr, resolvedVariables);
        // Sanitize: strip trailing \" artifact from template editor bug, unescape \n
        if (typeof resolved === 'string') {
          resolved = resolved.replace(/\\"/g, '').replace(/\\n/g, '\n');
        }
        resolvedVariables[dk] = resolved;
      } else if (resolvedVariables[dk] === undefined) {
        resolvedVariables[dk] = dexpr;
      }
    }
  }

  // 1.5. Inject itemType/imageUrl fallbacks as [Item]/[item] variables
  if (Array.isArray(template.visuals)) {
    for (const v of template.visuals) {
      if (v.component === 'ItemCounter' && v.props) {
        const rawItemType = v.props.itemType;
        let itemTypeVal = 'item';
        let itemTypeLabel = null;
        if (rawItemType) {
          if (resolvedVariables[rawItemType] !== undefined) {
            itemTypeVal = resolvedVariables[rawItemType];
          } else {
            itemTypeVal = rawItemType;
          }
        }
        
        // Parse array or list of types (support label::url format)
        let itemTypesList = [];
        if (Array.isArray(itemTypeVal)) {
          itemTypesList = itemTypeVal.map(e => parseLabeledEntry(String(e)));
        } else if (typeof itemTypeVal === 'string' && itemTypeVal.trim().startsWith('[') && itemTypeVal.trim().endsWith(']')) {
          try {
            const parsed = JSON.parse(itemTypeVal);
            if (Array.isArray(parsed)) itemTypesList = parsed.map(e => parseLabeledEntry(String(e)));
          } catch (e) {
            // ignore
          }
        } else if (typeof itemTypeVal === 'string' && itemTypeVal.includes(',')) {
          itemTypesList = itemTypeVal.split(',').map(s => parseLabeledEntry(s.trim())).filter(e => e.url);
        }
        
        if (itemTypesList.length > 0) {
          const idx = Math.floor(rng() * itemTypesList.length);
          const chosen = itemTypesList[idx];
          itemTypeVal = chosen.url;
          itemTypeLabel = chosen.label;
        } else if (itemTypeVal === 'random') {
          const types = ['cupcake', 'apple', 'star'];
          const idx = Math.floor(rng() * types.length);
          itemTypeVal = types[idx];
        } else {
          const parsed = parseLabeledEntry(itemTypeVal);
          itemTypeVal = parsed.url;
          itemTypeLabel = parsed.label;
        }
        
        resolvedVariables["_ItemCounter_resolvedType"] = itemTypeVal;
        
        let cleanItemName;
        if (itemTypeLabel) {
          cleanItemName = itemTypeLabel;
        } else if (typeof itemTypeVal === 'string' && (
          itemTypeVal.startsWith('http://') || 
          itemTypeVal.startsWith('https://') || 
          itemTypeVal.startsWith('/') || 
          itemTypeVal.includes('.')
        )) {
          cleanItemName = getCleanNameFromUrl(itemTypeVal);
        } else {
          cleanItemName = itemTypeVal;
        }
        
        const makePlural = (noun) => {
          if (!noun) return '';
          if (noun.endsWith('y')) return noun.slice(0, -1) + 'ies';
          if (noun.endsWith('s') || noun.endsWith('x') || noun.endsWith('ch') || noun.endsWith('sh')) return noun + 'es';
          return noun + 's';
        };
        const pluralName = makePlural(cleanItemName);

        if (resolvedVariables["Item"] === undefined) {
          resolvedVariables["Item"] = cleanItemName;
        }
        if (resolvedVariables["item"] === undefined) {
          resolvedVariables["item"] = cleanItemName;
        }
        if (resolvedVariables["itemPlural"] === undefined) {
          resolvedVariables["itemPlural"] = pluralName;
        }
        if (resolvedVariables["ItemPlural"] === undefined) {
          resolvedVariables["ItemPlural"] = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);
        }
        if (resolvedVariables["item_plural"] === undefined) {
          resolvedVariables["item_plural"] = pluralName;
        }
      }
      
      if (v.component === 'Image' && v.props) {
        const rawImageUrl = v.props.imageUrl || v.props.src;
        let imageUrlVal = '';
        let imageUrlLabel = null;
        if (rawImageUrl) {
          if (resolvedVariables[rawImageUrl] !== undefined) {
            imageUrlVal = resolvedVariables[rawImageUrl];
          } else {
            imageUrlVal = typeof rawImageUrl === 'string' && rawImageUrl.includes('[')
              ? interpolateString(rawImageUrl, resolvedVariables)
              : rawImageUrl;
          }
        }
        
        let imageUrlsList = [];
        if (Array.isArray(imageUrlVal)) {
          imageUrlsList = imageUrlVal.map(e => parseLabeledEntry(String(e)));
        } else if (typeof imageUrlVal === 'string' && imageUrlVal.trim().startsWith('[') && imageUrlVal.trim().endsWith(']')) {
          try {
            const parsed = JSON.parse(imageUrlVal);
            if (Array.isArray(parsed)) imageUrlsList = parsed.map(e => parseLabeledEntry(String(e)));
          } catch (e) {
            // ignore
          }
        } else if (typeof imageUrlVal === 'string' && imageUrlVal.includes(',')) {
          imageUrlsList = imageUrlVal.split(',').map(s => parseLabeledEntry(s.trim())).filter(e => e.url);
        }
        
        if (imageUrlsList.length > 0) {
          const idx = Math.floor(rng() * imageUrlsList.length);
          const chosen = imageUrlsList[idx];
          imageUrlVal = chosen.url;
          imageUrlLabel = chosen.label;
        } else {
          const parsed = parseLabeledEntry(imageUrlVal);
          imageUrlVal = parsed.url;
          imageUrlLabel = parsed.label;
        }
        
        resolvedVariables["_Image_resolvedUrl"] = imageUrlVal;
        
        const cleanItemName = imageUrlLabel || (imageUrlVal ? getCleanNameFromUrl(imageUrlVal) : 'item');
        
        if (resolvedVariables["Item"] === undefined) {
          resolvedVariables["Item"] = cleanItemName;
        }
        if (resolvedVariables["item"] === undefined) {
          resolvedVariables["item"] = cleanItemName;
        }
      }

      if (v.component === 'VisualChoice' && v.props) {
        const rawCorrectCount = v.props.correctCount;
        let correctCount = 3;
        if (rawCorrectCount !== undefined) {
          if (resolvedVariables[rawCorrectCount] !== undefined) {
            correctCount = Number(resolvedVariables[rawCorrectCount]);
          } else {
            correctCount = Number(resolveExpression(rawCorrectCount, resolvedVariables)) || 3;
          }
        }

        const distractorMode = v.props.distractorMode || 'auto';
        let distractorCount;
        if (distractorMode === 'auto') {
          const offsets = [-3, -2, -1, 1, 2, 3];
          const validOffsets = offsets.filter(o => (correctCount + o) >= 1);
          const off = validOffsets[Math.floor(rng() * validOffsets.length)];
          distractorCount = correctCount + off;
        } else {
          distractorCount = Number(resolveExpression(String(v.props.distractorCount || '1'), resolvedVariables)) || 1;
        }

        let vcItemType = v.props.itemType || 'cupcake';
        if (resolvedVariables[vcItemType] !== undefined) {
          vcItemType = resolvedVariables[vcItemType];
        }

        let vcItemEntries = [];
        if (Array.isArray(vcItemType)) {
          vcItemEntries = vcItemType.map(e => parseLabeledEntry(String(e)));
        } else if (typeof vcItemType === 'string' && vcItemType.includes(',')) {
          vcItemEntries = vcItemType.split(',').map(s => parseLabeledEntry(s.trim())).filter(e => e.url);
        }

        let chosenEntry;
        if (vcItemEntries.length > 0) {
          chosenEntry = vcItemEntries[Math.floor(rng() * vcItemEntries.length)];
        } else {
          chosenEntry = parseLabeledEntry(String(vcItemType));
        }

        const vcItemUrl = chosenEntry.url;
        const vcItemLabel = chosenEntry.label;
        const vcCleanName = vcItemLabel || (
          vcItemUrl && (vcItemUrl.startsWith('http') || vcItemUrl.includes('/') || vcItemUrl.includes('.'))
            ? getCleanNameFromUrl(vcItemUrl)
            : vcItemUrl
        ) || 'item';

        resolvedVariables['_VC_correctCount'] = correctCount;
        resolvedVariables['_VC_distractorCount'] = distractorCount;
        resolvedVariables['_VC_itemUrl'] = vcItemUrl;
        resolvedVariables['_VC_itemLabel'] = vcCleanName;

        if (resolvedVariables["Item"] === undefined) resolvedVariables["Item"] = vcCleanName;
        if (resolvedVariables["item"] === undefined) resolvedVariables["item"] = vcCleanName;
      }
    }
  }

  // 2. Interpolate question texts
  let rawQuestionText = template.questionText || template.questionTemplate || template.questionPattern || template.blueprint ||
    resolvedVariables.questionText || resolvedVariables.questionTemplate || resolvedVariables.prompt || resolvedVariables.title || resolvedVariables.name || resolvedVariables.blueprint || '';
  let blankCounter = 0;
  if (template.optionsType === 'fillInTheBlank' || String(template.interaction?.engine || '').toLowerCase() === 'fill_blank') {
    const existingBlanksRegex = /\[\[blank(\d+)\]\]/g;
    let matchBlank;
    while ((matchBlank = existingBlanksRegex.exec(rawQuestionText)) !== null) {
      const idx = parseInt(matchBlank[1], 10);
      if (idx > blankCounter) {
        blankCounter = idx;
      }
    }
    rawQuestionText = rawQuestionText.replace(/\[\]|\[[rR]esult\]|\[[aA]nswer\]/g, () => {
      blankCounter++;
      return `[[blank${blankCounter}]]`;
    });
  }
  let questionText = interpolateString(rawQuestionText, resolvedVariables);
  if (!questionText.trim()) {
    questionText = String(resolvedVariables.questionText || resolvedVariables.questionTemplate || resolvedVariables.prompt || resolvedVariables.title || resolvedVariables.name || template.title || template.name || '');
  }
  
  let explanationContent = '';
  if (resolvedVariables.explanation) {
    explanationContent = interpolateString(resolvedVariables.explanation, resolvedVariables);
  } else if (resolvedVariables.Explanation) {
    explanationContent = interpolateString(resolvedVariables.Explanation, resolvedVariables);
  } else if (template.explanation?.sections?.[0]?.content) {
    explanationContent = interpolateString(template.explanation.sections[0].content, resolvedVariables);
  } else if (template.explanationTemplate) {
    // Used by JNVST / competitive-exam templates (config.explanationTemplate)
    explanationContent = interpolateString(template.explanationTemplate, resolvedVariables);
  }

  // 3. Resolve options and determine correctness
  let optionsList = [];
  let pickedItemIds = [];

  if (template.optionPool) {
    const { correctSource, distractorSource, correctCount = 1, distractorCount = 2 } = template.optionPool;
    const correctPool = dataSourceMap[correctSource] || [];
    const distractorPool = dataSourceMap[distractorSource + ':distractors'] || dataSourceMap[distractorSource] || [];

    // Anti-repetition: exclude recently seen items
    const seenIds = new Set(template._seenItemIds || []);
    const freshCorrect = correctPool.filter(item => !seenIds.has(item.id || item.label));
    const freshDistractors = distractorPool.filter(item => !seenIds.has(item.id || item.label));

    // Helper to pick items with fallback to whole pool if all items are seen
    const pickWithFallback = (freshPool, fullPool, count) => {
      const candidates = freshPool.length > 0 ? freshPool : fullPool;
      return pickRandomMany(candidates, count, rng);
    };

    const correctItems = pickWithFallback(freshCorrect, correctPool, correctCount);
    if (correctItems.length > 0) {
      resolvedVariables['TargetItem'] = correctItems[0];
      resolvedVariables['TargetLabel'] = correctItems[0].label;
      resolvedVariables['TargetSvg'] = correctItems[0].svg;
      resolvedVariables['TargetCount'] = correctItems[0].count;
    }
    const correctIds = new Set(correctItems.map(i => i.id || i.label));
    const correctShapes = new Set(correctItems.map(i => i.shape).filter(Boolean));

    // Distractors must not overlap correct items or correct shapes
    const eligibleFreshDistractors = freshDistractors.filter(d => !correctIds.has(d.id || d.label) && !correctShapes.has(d.shape));
    const eligibleFullDistractors = distractorPool.filter(d => !correctIds.has(d.id || d.label) && !correctShapes.has(d.shape));

    const distractorItems = pickWithFallback(eligibleFreshDistractors, eligibleFullDistractors, distractorCount);

    pickedItemIds = [
      ...correctItems.map(item => item.id || item.label),
      ...distractorItems.map(item => item.id || item.label)
    ];

    const rawOptions = [
      ...correctItems.map(item => ({ ...item, isCorrect: true })),
      ...distractorItems.map(item => ({ ...item, isCorrect: false }))
    ];

    optionsList = shuffle(rawOptions, rng);
  } else {
    let resolvedOptionsData = template.options;
    if (typeof resolvedOptionsData === 'string' && resolvedOptionsData.includes('[')) {
      const varName = resolvedOptionsData.replace(/[\[\]]/g, '').trim();
      if (resolvedVariables[varName] !== undefined && Array.isArray(resolvedVariables[varName])) {
        resolvedOptionsData = resolvedVariables[varName];
      } else {
        try {
          const parsed = JSON.parse(interpolateString(resolvedOptionsData, resolvedVariables));
          if (Array.isArray(parsed)) resolvedOptionsData = parsed;
        } catch (e) {}
      }
    }

    if (Array.isArray(resolvedOptionsData)) {
      const interactionEngine = String(
        template.interaction?.engine
        || template.interaction?.type
        || template.optionsType
        || template.type
        || ''
      ).toLowerCase();
      const isPictureChoice = interactionEngine === 'picture_mcq'
        || interactionEngine === 'picturechoice'
        || interactionEngine === 'picture_choice';

      const rawOptions = resolvedOptionsData.map((opt, optIdx) => {
        const rawLabel = typeof opt === 'string' ? opt : (opt?.label || opt?.value || opt?.text || '');
        const resolvedLabel = resolveLabelOrExpression(rawLabel, resolvedVariables);
        console.log("DEBUG OPT:", { opt, rawLabel, resolvedLabel, option1: resolvedVariables.option1 });
        const rawImageUrl = typeof opt === 'object' && opt ? opt.imageUrl : undefined;
        const resolvedImageUrl = rawImageUrl
          ? resolveLabelOrExpression(rawImageUrl, resolvedVariables)
          : (isPictureChoice && isImageLikeUrl(resolvedLabel) ? resolvedLabel : undefined);
        
        let isCorrect = false;
        if (typeof opt === 'object' && opt && typeof opt.isCorrect === 'boolean') {
          isCorrect = opt.isCorrect;
        } else if (typeof opt === 'object' && opt && typeof opt.isCorrect === 'string') {
          const resolved = resolveExpression(opt.isCorrect, resolvedVariables);
          isCorrect = resolved === true || resolved === 1 || String(resolved) === 'true';
        } else {
          const targetAns = resolvedVariables.correctAnswer || resolvedVariables.answer;
          if (targetAns !== undefined && targetAns !== null) {
            const ansList = Array.isArray(targetAns)
              ? targetAns
              : String(targetAns).split(',').map(s => s.trim()).filter(Boolean);
            isCorrect = ansList.some(a => String(a).toLowerCase() === String(resolvedLabel).toLowerCase());
          } else if (resolvedVariables.correct_index !== undefined) {
            isCorrect = Number(resolvedVariables.correct_index) === optIdx;
          } else if (resolvedVariables.correctIndex !== undefined) {
            isCorrect = Number(resolvedVariables.correctIndex) === optIdx;
          }
        }
        
        return {
          label: isPictureChoice && resolvedImageUrl ? (opt?.alt || opt?.text || `Option`) : resolvedLabel,
          ...(resolvedImageUrl ? { imageUrl: resolvedImageUrl } : {}),
          audioUrl: typeof opt === 'object' && opt?.audioUrl ? resolveLabelOrExpression(opt.audioUrl, resolvedVariables) : undefined,
          isCorrect,
          misconception: typeof opt === 'object' && opt?.misconception ? resolveLabelOrExpression(opt.misconception, resolvedVariables) : undefined,
          feedback: typeof opt === 'object' && opt?.feedback ? resolveLabelOrExpression(opt.feedback, resolvedVariables) : undefined,
          remediationHint: typeof opt === 'object' && opt?.remediationHint ? resolveLabelOrExpression(opt.remediationHint, resolvedVariables) : undefined
        };
      });

    const uniqueOptions = [];
    const seen = new Set();
    for (const opt of rawOptions) {
      const uniqueKey = opt.imageUrl || opt.label;
      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        uniqueOptions.push(opt);
      }
    }

    const isMcqLike = !['hotspot_select', 'mcq_hotspot', 'sorting', 'matching', 'fill_blank', 'number_input', 'sentence_ordering', 'sentenceordering', 'ordering', 'categorization', 'categorizationv2'].includes(String(interactionEngine).toLowerCase());

    if (isMcqLike && uniqueOptions.length > 0) {
      const correctOptions = uniqueOptions.filter(o => o.isCorrect);
      const incorrectOptions = uniqueOptions.filter(o => !o.isCorrect);

      let targetOptionCount = 4;
      let isMultiSelectMode = false;

      const isExplicitMsq = template.optionsType === 'msq' ||
        template.optionsType === 'multi_select' ||
        template.type === 'msq' ||
        template.type === 'multi_select' ||
        template.interaction?.engine === 'msq' ||
        template.interaction?.engine === 'multi_select' ||
        template.interaction?.inputMode === 'multi-choice';

      if (isExplicitMsq) {
        isMultiSelectMode = true;
      } else if (currentLevel === 4) {
        isMultiSelectMode = true;
      }

      const searchParams = difficultyContext?.searchParams;
      const isOrderedOrPreserved = Boolean(
        template.preserveOptionOrder === true ||
        template.shuffleOptions === false ||
        template.isSequential === true ||
        template.isOrdered === true ||
        template.metadata?.preserveOptionOrder === true ||
        template.metadata?.isSequential === true ||
        template.metadata?.isOrdered === true ||
        searchParams?.get?.('mode') === 'static' ||
        searchParams?.get?.('iit') === 'true' ||
        searchParams?.get?.('isSequential') === 'true' ||
        searchParams?.get?.('isOrdered') === 'true'
      );

      if (isOrderedOrPreserved || uniqueOptions.length >= 4) {
        targetOptionCount = uniqueOptions.length;
      } else if (currentLevel === 1 || currentLevel === 2) {
        targetOptionCount = 3;
      } else {
        targetOptionCount = 4;
      }

      let pickedCorrect = [];
      let pickedIncorrect = [];

      const pickRandomMany = (items, count) => {
        if (isOrderedOrPreserved) return items.slice(0, count);
        const shuffled = shuffle(items, rng);
        return shuffled.slice(0, count);
      };

      if (isExplicitMsq) {
        pickedCorrect = correctOptions;
        pickedIncorrect = pickRandomMany(incorrectOptions, Math.max(1, targetOptionCount - pickedCorrect.length));
        template.optionsType = 'msq';
        if (template.interaction) {
          template.interaction.engine = 'msq';
          template.interaction.inputMode = 'multi-choice';
        }
      } else if (isMultiSelectMode) {
        // Level 4: Show multiple correct options if available, up to 2, or at least 1
        const targetCorrectCount = Math.min(correctOptions.length, 2);
        pickedCorrect = pickRandomMany(correctOptions, targetCorrectCount > 0 ? targetCorrectCount : 1);
        pickedIncorrect = pickRandomMany(incorrectOptions, Math.max(1, targetOptionCount - pickedCorrect.length));
        
        template.optionsType = 'multi_select';
        if (template.interaction) {
          template.interaction.engine = 'multi_select';
          template.interaction.type = 'multi_select';
        }
      } else {
        // Levels 1-3: Show exactly 1 correct option
        pickedCorrect = pickRandomMany(correctOptions, 1);
        pickedIncorrect = pickRandomMany(incorrectOptions, Math.max(1, targetOptionCount - pickedCorrect.length));
        
        if (template.optionsType !== 'tap_to_fill' && template.type !== 'tap_to_fill' && template.interaction?.engine !== 'tap_to_fill') {
          template.optionsType = 'mcq';
          if (typeof template.interaction === 'string') {
            template.interaction = { engine: template.interaction, type: template.interaction };
          } else if (template.interaction && typeof template.interaction === 'object') {
            template.interaction.engine = 'mcq';
            template.interaction.type = 'mcq';
          }
        }
      }

      const combined = isOrderedOrPreserved ? uniqueOptions : [...pickedCorrect, ...pickedIncorrect];
      const shouldShuffle = !isOrderedOrPreserved && template.shuffleOptions !== false;
      optionsList = shouldShuffle ? shuffle(combined, rng) : combined;
    } else {
      const shouldShuffle = template.optionsType !== 'hotspot_select' && 
                            template.optionsType !== 'mcq_hotspot' && 
                            template.shuffleOptions !== false;
      optionsList = shouldShuffle ? shuffle(uniqueOptions, rng) : uniqueOptions;
    }
    }
  }

  const correctAnswerIndex = optionsList.findIndex(o => o.isCorrect);

  // 4. Resolve Parts and Visual SVG outputs
  let hasClickToFill = false;
  let rawParts = Array.isArray(template.parts) ? [...template.parts] : [];

  // Auto-detect image variables in resolvedVariables if template.parts contains no image parts
  const hasImagePartInRaw = rawParts.some(p => p?.type === 'image' || (p?.type === 'row' && Array.isArray(p.parts) && p.parts.some(cp => cp?.type === 'image')));
  if (!hasImagePartInRaw && resolvedVariables) {
    const imgVarKeys = Object.keys(resolvedVariables).filter(k => {
      const lc = k.toLowerCase();
      if (!lc.includes('image') && !lc.includes('img') && !lc.includes('pic')) return false;
      const val = String(resolvedVariables[k] || '').trim();
      return val.startsWith('http') || val.startsWith('/') || val.startsWith('data:');
    });
    if (imgVarKeys.length > 0) {
      imgVarKeys.sort();
      imgVarKeys.forEach(key => {
        const val = String(resolvedVariables[key]).trim();
        rawParts.push({
          type: 'image',
          content: val,
          imageUrl: val
        });
      });
    }
  }

  // Auto-group standalone top-level image parts into a compact grid layout on practice page
  const topLevelImageParts = rawParts.filter(p => p?.type === 'image');
  if (topLevelImageParts.length >= 2) {
    const nonImageParts = rawParts.filter(p => p?.type !== 'image');
    const gridCols = topLevelImageParts.length === 4 ? 2 : Math.min(topLevelImageParts.length, 3);
    const gridImageParts = topLevelImageParts.map(p => ({
      ...p,
      maxWidth: p.maxWidth || (gridCols === 2 ? 150 : 130),
      showSpeaker: p.showSpeaker !== undefined ? p.showSpeaker : false
    }));
    rawParts = [
      ...nonImageParts,
      {
        type: 'row',
        style: {
          display: 'grid',
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gap: '14px',
          maxWidth: `${gridCols * 180}px`,
          margin: '12px auto'
        },
        parts: gridImageParts
      }
    ];
  }
  
  const interactionEngine = String(
    template.interaction?.engine
    || template.interaction?.type
    || template.optionsType
    || template.type
    || ''
  ).toLowerCase();

  const isCategorizationEngine = ['categorization', 'categorizationv2', 'sorting', 'sort', 'categorysort'].includes(interactionEngine);
  
  if (isCategorizationEngine && !rawParts.some(p => p.type === 'categorization' || p.type === 'categorizationv2' || p.type === 'drag_drop')) {
    // Try to build categories from resolved category_1, category_2, ... variables first
    const dynCategories = [];
    let catIdx = 1;
    while (resolvedVariables[`category_${catIdx}`] !== undefined && resolvedVariables[`category_${catIdx}`] !== null && resolvedVariables[`category_${catIdx}`] !== '') {
      dynCategories.push({ id: `cat_${catIdx}`, label: String(resolvedVariables[`category_${catIdx}`]).trim() });
      catIdx++;
    }

    // Build items from resolved item_1a, item_1b, item_2a, item_2b, ... variables
    const dynItems = [];
    const isUrlValue = (v) => {
      if (!v) return false;
      return v.startsWith('http://') || v.startsWith('https://') || v.startsWith('/') &&
        /\.(png|jpg|jpeg|gif|webp|svg|avif)(\?|$)/i.test(v);
    };
    if (dynCategories.length > 0) {
      dynCategories.forEach((cat, idx) => {
        const ci = idx + 1;
        // Check item_Na, item_Nb, item_Nc pattern
        ['a','b','c','d','e'].forEach(suffix => {
          const key = `item_${ci}${suffix}`;
          if (resolvedVariables[key] !== undefined && resolvedVariables[key] !== null && String(resolvedVariables[key]).trim() !== '') {
            const val = String(resolvedVariables[key]).trim();
            if (isUrlValue(val)) {
              // Image URL — show image chip, use filename as fallback label
              const filename = val.split('/').pop().replace(/\.[^.]+$/, '').replace(/[-_]/g, ' ') || 'image';
              dynItems.push({ id: `item_${key}`, label: filename, imageUrl: val, content: filename, target: cat.id });
            } else {
              dynItems.push({ id: `item_${key}`, label: val, content: val, target: cat.id });
            }
          }
        });
      });
    }

    if (dynCategories.length > 0) {
      rawParts.push({
        type: 'categorizationv2',
        layoutMode: 'category_sort',
        categories: dynCategories,
        items: shuffle(dynItems.length > 0 ? dynItems : [], rng),
        answerKey: Object.fromEntries(dynItems.map(i => [i.id, i.target]))
      });
    } else {

    const targetCats = template.targetCategories 
      || template.dataSources?.find(ds => Array.isArray(ds.targetCategories))?.targetCategories 
      || ['long_a', 'short_a'];
    
    const generatedCategories = targetCats.map(catKey => ({
      id: `cat_${catKey}`,
      label: String(catKey).replace(/_/g, ' ').replace(/^long/i, 'Long').replace(/^short/i, 'Short')
    }));
    
    const generatedItems = [];
    const answerKey = {};
    const dsSource = template.dataSources?.[0]?.id || 'master';

    targetCats.forEach(catKey => {
      const catPool = dataSourceMap[`${dsSource}:${catKey}`] 
        || dataSourceMap[catKey] 
        || (Array.isArray(dataSourceMap[dsSource]) ? dataSourceMap[dsSource].filter(i => i.category === catKey) : []);
      const picked = pickRandomMany(catPool, 2, rng);
      picked.forEach((item, itemIdx) => {
        const itemId = `item_${catKey}_${itemIdx}_${Math.floor(rng() * 1000)}`;
        const labelVal = item.word || item.label || item.text || (typeof item === 'string' ? item : 'item');
        generatedItems.push({
          id: itemId,
          label: labelVal,
          imageUrl: item.imageUrl || undefined,
          target: `cat_${catKey}`
        });
        answerKey[itemId] = `cat_${catKey}`;
      });
    });

    rawParts.push({
      type: 'categorizationv2',
      layoutMode: 'category_sort',
      categories: generatedCategories,
      items: shuffle(generatedItems, rng),
      answerKey
    });
    } // end else (no dynCategories)
  }

  const resolvePartDeep = (part) => {
    if (!part || typeof part !== 'object') return part;
    const resolvedPart = { ...part };
    
    if (typeof resolvedPart.content === 'string') {
      resolvedPart.content = interpolateString(resolvedPart.content, resolvedVariables);
      const trimmed = resolvedPart.content.trim();
      if (trimmed.startsWith('/api/tts') || trimmed.endsWith('.mp3') || trimmed.endsWith('.wav')) {
        resolvedPart.type = 'audio';
        resolvedPart.audioUrl = trimmed;
      }
    }
    if (typeof resolvedPart.prompt === 'string') {
      resolvedPart.prompt = interpolateString(resolvedPart.prompt, resolvedVariables);
    }
    if (typeof resolvedPart.label === 'string') {
      resolvedPart.label = interpolateString(resolvedPart.label, resolvedVariables);
    }
    if (typeof resolvedPart.backgroundSvg === 'string') {
      resolvedPart.backgroundSvg = interpolateString(resolvedPart.backgroundSvg, resolvedVariables);
    }
    if (typeof resolvedPart.imageUrl === 'string') {
      resolvedPart.imageUrl = interpolateString(resolvedPart.imageUrl, resolvedVariables);
    } else if (resolvedPart.type === 'image' && typeof resolvedPart.content === 'string') {
      resolvedPart.imageUrl = interpolateString(resolvedPart.content, resolvedVariables);
    }

    const rawAudio = resolvedPart.audioUrl || resolvedPart.targetAudioUrl || resolvedPart.soundUrl;
    if (typeof rawAudio === 'string') {
      resolvedPart.audioUrl = interpolateString(rawAudio, resolvedVariables);
    }

    if (typeof resolvedPart.spokenText === 'string') {
      resolvedPart.spokenText = interpolateString(resolvedPart.spokenText, resolvedVariables);
    } else if (resolvedVariables.target_word || resolvedVariables.targetWord) {
      resolvedPart.spokenText = resolvedVariables.target_word || resolvedVariables.targetWord;
    }

    if (Array.isArray(resolvedPart.parts)) {
      resolvedPart.parts = resolvedPart.parts.map(resolvePartDeep);
    }
    
    if (Array.isArray(resolvedPart.categories)) {
      resolvedPart.categories = resolvedPart.categories.map(cat => ({
        ...cat,
        label: cat.label ? interpolateString(cat.label, resolvedVariables) : undefined,
        imageUrl: cat.imageUrl ? interpolateString(cat.imageUrl, resolvedVariables) : undefined,
        prefillImageUrl: cat.prefillImageUrl ? interpolateString(cat.prefillImageUrl, resolvedVariables) : undefined
      }));
    }
    
    if (Array.isArray(resolvedPart.items)) {
      resolvedPart.items = resolvedPart.items.map(item => ({
        ...item,
        content: item.content ? interpolateString(item.content, resolvedVariables) : undefined,
        label: item.label ? interpolateString(item.label, resolvedVariables) : undefined,
        imageUrl: item.imageUrl ? interpolateString(item.imageUrl, resolvedVariables) : undefined,
        audioUrl: item.audioUrl ? interpolateString(item.audioUrl, resolvedVariables) : undefined,
        alt: item.alt ? interpolateString(item.alt, resolvedVariables) : undefined,
        svg: item.svg ? interpolateString(item.svg, resolvedVariables) : undefined,
        imageWidth: item.imageWidth ? resolveExpression(String(item.imageWidth), resolvedVariables) : undefined
      }));
    }

    if (Array.isArray(resolvedPart.wordCards)) {
      resolvedPart.wordCards = resolvedPart.wordCards.map(card => ({
        ...card,
        ending: card.ending ? interpolateString(card.ending, resolvedVariables) : card.ending,
        answer: card.answer ? interpolateString(card.answer, resolvedVariables) : card.answer,
        imageUrl: card.imageUrl ? interpolateString(card.imageUrl, resolvedVariables) : card.imageUrl,
        svg: card.svg ? interpolateString(card.svg, resolvedVariables) : card.svg,
        alt: card.alt ? interpolateString(card.alt, resolvedVariables) : card.alt,
        prompt: card.prompt ? interpolateString(card.prompt, resolvedVariables) : card.prompt
      }));
    }

    if (resolvedPart.type === 'categorizationv2' || resolvedPart.type === 'categorization' || resolvedPart.type === 'drag_drop') {
      if (typeof resolvedPart.items === 'string') {
        const varName = resolvedPart.items.replace(/^\[|\]$/g, '');
        if (resolvedVariables[varName] !== undefined) {
          resolvedPart.items = resolvedVariables[varName];
        }
      }
      if (typeof resolvedPart.targets === 'string') {
        const varName = resolvedPart.targets.replace(/^\[|\]$/g, '');
        if (resolvedVariables[varName] !== undefined) {
          resolvedPart.targets = resolvedVariables[varName];
        }
      }
      if (typeof resolvedPart.categories === 'string') {
        const varName = resolvedPart.categories.replace(/^\[|\]$/g, '');
        if (resolvedVariables[varName] !== undefined) {
          resolvedPart.categories = resolvedVariables[varName];
        }
      }
    }

    if (resolvedPart.answerKey && typeof resolvedPart.answerKey === 'object') {
      resolvedPart.answerKey = Object.fromEntries(
        Object.entries(resolvedPart.answerKey).map(([k, v]) => {
          const resolvedK = interpolateString(k, resolvedVariables);
          const resolvedV = typeof v === 'string' ? interpolateString(v, resolvedVariables) : v;
          return [resolvedK, resolvedV];
        })
      );

      if (Array.isArray(resolvedPart.items)) {
        const finalItemIds = new Set(resolvedPart.items.map(item => item.id));
        resolvedPart.answerKey = Object.fromEntries(
          Object.entries(resolvedPart.answerKey).filter(([k]) => finalItemIds.has(k))
        );
      }
    }

    for (const prop of ['value', 'min', 'max', 'marker', 'hour', 'minute', 'numerator', 'denominator']) {
      if (resolvedPart[prop] !== undefined) {
        resolvedPart[prop] = resolveExpression(resolvedPart[prop], resolvedVariables);
      }
    }

    if (resolvedPart.type === 'number_line' && (resolvedPart.interactive === true || resolvedPart.interactive === 'true' || resolvedPart.clickToFill === true || resolvedPart.clickToFill === 'true')) {
      hasClickToFill = true;
    }

    return resolvedPart;
  };

  let parts = [];
  if (rawParts.length > 0) {
    parts = rawParts.map(resolvePartDeep);
  } else {
    // Helper: expand a text block through inline {= expr =} expressions
    const expandTextBlock = (text) => {
      const inlineParts = resolveInlineExpressions(text, resolvedVariables);
      if (!inlineParts) return [{ type: 'text', content: text }];
      if (inlineParts.length === 1) return [inlineParts[0]];
      return [{ type: 'section', parts: inlineParts }];
    };

    // Split the questionText by newlines to support placing visuals in the middle
    const textBlocks = questionText.split(/\n\n/);
    if (textBlocks.length > 1) {
      parts = textBlocks.flatMap(block => expandTextBlock(block));
    } else {
      const textLines = questionText.split(/\n/);
      if (textLines.length > 1) {
        parts = textLines.flatMap(line => expandTextBlock(line));
      } else {
        parts = expandTextBlock(questionText);
      }
    }
  }

  
  if (Array.isArray(template.visuals)) {
    for (const v of template.visuals) {
      // Skip duplicate rendering if the visual is already drawn inline via a {= draw... =} expression
      const blueprint = template.blueprint || template.questionText || '';
      const compName = v.component;
      const isDrawnInline = blueprint.includes(`draw${compName}`) ||
                            (compName === 'Clock' && blueprint.includes('drawAnalogClock')) ||
                            (compName === 'FractionModel' && (blueprint.includes('drawFractionBar') || blueprint.includes('drawFractionCircle') || blueprint.includes('drawFractionGrid')));
      if (isDrawnInline) {
        continue;
      }

      // Handle VisualChoice: produce two visual_panel parts instead of SVG
      if (v.component === 'VisualChoice') {
        const correctCount = resolvedVariables['_VC_correctCount'];
        const distractorCount = resolvedVariables['_VC_distractorCount'];
        const itemUrl = resolvedVariables['_VC_itemUrl'] || 'cupcake';

        const correctSvg = drawVisualChoicePanel(correctCount, itemUrl);
        const distractorSvg = drawVisualChoicePanel(distractorCount, itemUrl);

        const correctIsLeft = rng() < 0.5;
        const panels = correctIsLeft
          ? [
              { svg: correctSvg, isCorrect: true, count: correctCount },
              { svg: distractorSvg, isCorrect: false, count: distractorCount }
            ]
          : [
              { svg: distractorSvg, isCorrect: false, count: distractorCount },
              { svg: correctSvg, isCorrect: true, count: correctCount }
            ];

        panels.forEach((panel, i) => {
          parts.push({
            type: 'visual_panel',
            svg: panel.svg,
            isCorrect: panel.isCorrect,
            count: panel.count,
            panelIndex: i
          });
        });
        continue;
      }

      // Check the component registry
      const builder = COMPONENT_REGISTRY[v.component];
      if (builder) {
        const resolvedProps = {};
        const legacyPlaceValueFallbacks = {
          thousands: { Th: 1, TH: 1, T: 1 },
          hundreds: { H: 1 },
          tens: { T: 2 },
          ones: { O: 3, One: 3, Ones: 3 }
        };
        for (const [key, val] of Object.entries(v.props || {})) {
          if (v.component === 'ItemCounter' && key === 'itemType' && resolvedVariables["_ItemCounter_resolvedType"]) {
            resolvedProps[key] = resolvedVariables["_ItemCounter_resolvedType"];
          } else if (v.component === 'Image' && key === 'imageUrl' && resolvedVariables["_Image_resolvedUrl"]) {
            resolvedProps[key] = resolvedVariables["_Image_resolvedUrl"];
          } else if (typeof val === 'string' && resolvedVariables[val] !== undefined) {
            resolvedProps[key] = resolvedVariables[val];
          } else if (
            (v.component === 'PlaceValue' || v.component === 'BaseTenBlocks') &&
            legacyPlaceValueFallbacks[key] &&
            legacyPlaceValueFallbacks[key][String(val).trim()] !== undefined
          ) {
            resolvedProps[key] = legacyPlaceValueFallbacks[key][String(val).trim()];
          } else {
            resolvedProps[key] = resolveExpression(val, resolvedVariables);
          }
        }

        if (resolvedProps.clickToFill === true || resolvedProps.clickToFill === 'true' || resolvedProps.clickToFill === 1) {
          hasClickToFill = true;
        }
        
        try {
          const result = builder(resolvedProps, rng);
          const visualPart = (result && typeof result === 'object' && result.type) ? result : { type: 'svg', content: result };
          
          if (v.position === 'top') {
            parts.unshift(visualPart);
          } else if (v.position === 'middle') {
            if (parts.length > 0) {
              parts.splice(1, 0, visualPart);
            } else {
              parts.push(visualPart);
            }
          } else {
            parts.push(visualPart);
          }
        } catch (err) {
          console.error(`Failed to draw visual component ${v.component}:`, err);
        }
      }
    }
  }

  // 4.5. Resolve Solution sections
  let solutionSections = [];
  if (template.solution && Array.isArray(template.solution.sections)) {
    solutionSections = template.solution.sections.map(part => resolvePartStrings(part, resolvedVariables));
  }

  // 5. Build final question structure
  const isVisualChoice = template.optionsType === 'visual_choice';

  const rawAnswer = template.answer !== undefined ? template.answer : template.correctAnswer;
  let resolvedAnswer = null;
  if (rawAnswer !== undefined) {
    if (typeof rawAnswer === 'object' && rawAnswer !== null) {
      resolvedAnswer = Object.fromEntries(
        Object.entries(rawAnswer).map(([k, v]) => {
          const resolvedK = interpolateString(k, resolvedVariables);
          const resolvedV = typeof v === 'string' ? resolveLabelOrExpression(v, resolvedVariables) : v;
          return [resolvedK, resolvedV];
        })
      );
    } else if (typeof rawAnswer === 'string') {
      resolvedAnswer = resolveLabelOrExpression(rawAnswer, resolvedVariables);
    } else {
      resolvedAnswer = rawAnswer;
    }
  }

  const categorizationPart = parts.find(p => p.type === 'categorization' || p.type === 'categorizationv2' || p.type === 'drag_drop');

  const visualPanels = parts.filter(p => p.type === 'visual_panel');
  const vcCorrectIndex = visualPanels.findIndex(p => p.isCorrect);

  const rawInteractionEngine = typeof template.interaction === 'object' ? template.interaction?.engine : template.interaction;
  const isOrdering = ['sentence_ordering', 'sentenceordering', 'ordering'].includes(String(template.optionsType || rawInteractionEngine || template.type || '').toLowerCase());

  const resolvedItemId = resolvedVariables.target_word
    || resolvedVariables.word
    || resolvedVariables.Result
    || resolvedVariables.answer_letter
    || (resolvedVariables.index !== undefined ? `idx_${resolvedVariables.index}` : undefined);

  const actualLevel = Number(resolvedVariables.questionLevel || resolvedVariables.level) || currentLevel;

  const questionPayload = {
    itemId: resolvedItemId,
    level: actualLevel,
    difficulty: `Level ${actualLevel}`,
    type: isOrdering ? 'sentence_ordering' : (isVisualChoice ? 'visual_choice' : (template.type || template.optionsType || 'mcq')),
    interaction: template.interaction && typeof template.interaction === 'object'
      ? template.interaction
      : (isOrdering ? 'sentence_ordering' : (template.optionsType || (isVisualChoice ? 'visual_choice' : 'mcq'))),
    questionText: sanitizeLatexMathText(
      String(questionText || '')
        .replace(/(\\n|\/n|\n)\s*(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/gi, '')
        .replace(/(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/gi, '')
        .replace(/\\n/g, '\n')
        .replace(/\/n/g, '\n')
        .trim()
    ),
    parts,
    soundUrl: template.soundUrl ? interpolateString(template.soundUrl, resolvedVariables) : undefined,
    soundText: template.soundText ? interpolateString(template.soundText, resolvedVariables) : undefined,
    voice: template.voice || undefined,
    options: isVisualChoice
      ? visualPanels.map((p, idx) => ({ id: `panel_${idx}`, label: String(p.count), isPanel: true }))
      : optionsList.map((o, idx) => ({
        id: o.id || `opt_${idx}`,
        label: typeof o.label === 'string' ? sanitizeLatexMathText(o.label) : o.label,
        svg: o.svg || null,
        imageUrl: o.imageUrl || null,
        audioUrl: o.audioUrl || (o.label ? `/api/tts?voice=${template.voice || 'Puck'}&text=${encodeURIComponent(o.label)}` : null),
        isCorrect: o.isCorrect,
        misconception: o.misconception || null,
        feedback: o.feedback || null,
        remediationHint: o.remediationHint || null
      })),
    correctAnswerIndex: isVisualChoice
      ? (vcCorrectIndex >= 0 ? vcCorrectIndex : 0)
      : (correctAnswerIndex >= 0 ? correctAnswerIndex : 0),
    explanation: {
      sections: [{ type: 'text', content: explanationContent || (isVisualChoice
        ? `The panel showing ${resolvedVariables['_VC_correctCount']} ${resolvedVariables['_VC_itemLabel'] || 'item'}${resolvedVariables['_VC_correctCount'] !== 1 ? 's' : ''} is correct.`
        : `The correct answer is ${optionsList[correctAnswerIndex]?.label || ''}.`) }]
    },
    metaConfig: {
      readable: true,
      readOptions: !isVisualChoice,
      hasClickToFill,
      visuals: template.visuals
    },
    metadata: {
      ...(template.metadata || {}),
      isStatic: false,
      isRemediation: Boolean(
        resolvedVariables.is_remediation === true ||
        String(resolvedVariables.is_remediation).toLowerCase() === 'true' ||
        String(resolvedVariables.is_remediation).toLowerCase() === 'yes' ||
        resolvedVariables.isRemediation === true
      ),
      ...(Number.isFinite(Number(resolvedVariables.remediation_pair_index))
        ? { remediationPairIndex: Number(resolvedVariables.remediation_pair_index) }
        : (Number.isFinite(Number(resolvedVariables.remediationPairIndex)) ? { remediationPairIndex: Number(resolvedVariables.remediationPairIndex) } : {})
      )
    },
    layoutConfig: template.layoutConfig || template.layout || undefined,
    validationRules: resolveValidationRules(template.validationRules || template.validation?.rules, resolvedVariables),
    feedbackRules: template.feedbackRules || template.feedback || undefined,
    difficultyRules: template.difficultyRules || undefined,
    analyticsConfig: template.analyticsConfig || undefined,
    adaptiveRules: template.adaptiveRules || undefined,
    schema: {
      templateId: template.id || template.templateId || template.templateInfo?.templateId,
      generatorType: template.generatorType || template.config?.generatorType || undefined,
      subject: template.subject || template.templateInfo?.subject,
      topic: template.topic || template.templateInfo?.topic,
      grade: template.grade || template.templateInfo?.grade,
      skillId: template.skillId || template.templateInfo?.skillId,
      competencyId: template.competencyId || template.templateInfo?.competencyId,
      difficultyLevel: template.difficultyLevel || template.templateInfo?.difficultyLevel,
      layout: template.layoutConfig || template.layout || {},
      interaction: template.interaction && typeof template.interaction === 'object'
        ? template.interaction
        : { engine: template.optionsType || (isVisualChoice ? 'visual_choice' : 'mcq') },
      constraints: template.constraints || {},
      validationRules: resolveValidationRules(template.validationRules || template.validation?.rules, resolvedVariables),
      feedbackRules: template.feedbackRules || template.feedback || {},
      difficultyRules: template.difficultyRules || {},
      analyticsConfig: template.analyticsConfig || {},
      adaptiveRules: template.adaptiveRules || {},
      variables: Object.fromEntries(
        Object.entries(resolvedVariables).filter(([key, value]) => typeof value !== 'function' && !key.startsWith('_'))
      )
    }
  };

  if (categorizationPart) {
    if (categorizationPart.categories) questionPayload.categories = categorizationPart.categories;
    if (categorizationPart.items) questionPayload.items = categorizationPart.items;
    if (categorizationPart.layoutMode) questionPayload.layoutMode = categorizationPart.layoutMode;
    if (categorizationPart.htmlLayout) questionPayload.htmlLayout = categorizationPart.htmlLayout;
    if (categorizationPart.renderer) questionPayload.renderer = categorizationPart.renderer;
    if (categorizationPart.wordCards) questionPayload.wordCards = categorizationPart.wordCards;
    if (categorizationPart.words) questionPayload.words = categorizationPart.words;
    if (categorizationPart.targets) questionPayload.targets = categorizationPart.targets;
    if (categorizationPart.grid) questionPayload.grid = categorizationPart.grid;
    if (categorizationPart.pattern) questionPayload.pattern = categorizationPart.pattern;
    if (categorizationPart.behavior) questionPayload.behavior = categorizationPart.behavior;
    if (categorizationPart.isCopiable !== undefined) questionPayload.isCopiable = categorizationPart.isCopiable;
    if (categorizationPart.hideItemLabels !== undefined) questionPayload.hideItemLabels = categorizationPart.hideItemLabels;
    if (categorizationPart.isRemoval !== undefined) questionPayload.isRemoval = categorizationPart.isRemoval;
  }

  if (resolvedAnswer === null && Array.isArray(questionPayload.validationRules)) {
    const exactMatchRule = questionPayload.validationRules.find(r => r && r.type === 'exact_match' && String(r.target || '').toLowerCase() === 'answer');
    if (exactMatchRule && exactMatchRule.value !== undefined) {
      resolvedAnswer = exactMatchRule.value;
    }
  }

  if (resolvedAnswer !== null) {
    const categorizationLayoutMode = String(categorizationPart?.layoutMode || categorizationPart?.htmlLayout || '').toLowerCase();
    if (
      categorizationPart
      && resolvedAnswer
      && typeof resolvedAnswer === 'object'
      && categorizationLayoutMode !== 'word_completion'
      && categorizationLayoutMode !== 'complete_words'
      && categorizationLayoutMode !== 'grid_fill'
    ) {
      const finalItemIds = new Set((questionPayload.items || []).map(item => item.id));
      resolvedAnswer = Object.fromEntries(
        Object.entries(resolvedAnswer).filter(([k]) => finalItemIds.has(k))
      );
    }
    questionPayload.answer = resolvedAnswer;
    questionPayload.correctAnswer = resolvedAnswer;
    questionPayload.correctAnswerText = typeof resolvedAnswer === 'object' ? JSON.stringify(resolvedAnswer) : String(resolvedAnswer);
  }

  const allCorrectOptionLabels = optionsList.filter(o => o.isCorrect).map(o => o.label).filter(Boolean);
  if (allCorrectOptionLabels.length > 1) {
    questionPayload.correctAnswer = allCorrectOptionLabels;
    questionPayload.correctAnswerText = allCorrectOptionLabels.join(', ');
  }

  if (solutionSections.length > 0) {
    questionPayload.solution = {
      sections: solutionSections
    };
  }

  if (pickedItemIds && pickedItemIds.length > 0) {
    questionPayload.pickedItemIds = pickedItemIds;
  }

  return questionPayload;
}
