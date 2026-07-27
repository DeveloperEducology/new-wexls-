import { resolveExpression } from './expressionParser.js';
import { interpolateString, getCleanNameFromUrl, parseLabeledEntry, resolveLabelOrExpression } from './interpolator.js';
import { COMPONENT_REGISTRY } from './components/index.js';
import { drawVisualChoicePanel } from './components/VisualChoice.js';
import { generateDynamicSceneSvg } from './components/SceneComposer.js';


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

  if (seenSet.size === 0) {
    return pickRandom(pool, rng);
  }

  let wordList = null;
  if (Array.isArray(templateVariables)) {
    const wordVar = templateVariables.find(v => {
      const name = String(v?.name || v?.id || '').toLowerCase();
      return name === 'target_word' || name === 'word' || name === 'result' || name === 'answer_letter';
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

  const unseenPool = pool.filter(idx => {
    const idxStr = String(idx).toLowerCase();
    if (seenSet.has(idxStr) || seenSet.has(`idx_${idxStr}`)) return false;
    if (wordList && Array.isArray(wordList) && idx >= 0 && idx < wordList.length) {
      const wordVal = String(wordList[idx]).toLowerCase();
      if (seenSet.has(wordVal)) return false;
    }
    return true;
  });

  if (unseenPool.length > 0) {
    return pickRandom(unseenPool, rng);
  }

  return pickRandom(pool, rng);
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

  let currentLevel = 3; // default fallback
  if (difficultyContext) {
    const historyContext = difficultyContext.historyContext || {};
    const searchParams = difficultyContext.searchParams;
    const difficulty = difficultyContext.difficulty || 'adaptive';

    if (historyContext.practiceLevel) {
      currentLevel = Number(historyContext.practiceLevel) || 3;
    } else if (searchParams) {
      const levelParam = searchParams.get('practiceLevel') || searchParams.get('level');
      if (levelParam) {
        currentLevel = Number(levelParam) || 3;
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

  // 1. Evaluate variables sequentially
  if (Array.isArray(template.variables)) {
    for (const v of template.variables) {
      const varName = v?.name || v?.id;
      if (!varName) continue;

      if (varName === 'index') {
        let levelVarName = `index_l${currentLevel}`;
        const foundLvlVar = template.variables.find(x => (x?.name || x?.id) === levelVarName);
        const levelPool = foundLvlVar ? (foundLvlVar.values || foundLvlVar.value) : null;
        if (Array.isArray(levelPool) && levelPool.length > 0) {
          resolvedVariables[varName] = pickUnseenIndex(levelPool, template.variables, difficultyContext, rng);
          continue;
        }
        const selfPool = v.values || v.value;
        if (Array.isArray(selfPool) && selfPool.length > 0) {
          resolvedVariables[varName] = pickUnseenIndex(selfPool, template.variables, difficultyContext, rng);
          continue;
        }
      }

      if (/^index_l\d+$/.test(varName)) {
        resolvedVariables[varName] = resolvedVariables['index'];
        continue;
      }

      resolvedVariables[varName] = resolveVariableValue(v, resolvedVariables, dataSourceMap, rng);
    }
  } else if (template.variables && typeof template.variables === 'object') {
    for (const [varName, v] of Object.entries(template.variables)) {
      if (!v) continue;
      const normalizedVar = { name: varName, ...v };

      if (varName === 'index') {
        let levelVarName = `index_l${currentLevel}`;
        const foundLvlVar = template.variables[levelVarName];
        const levelPool = foundLvlVar ? (foundLvlVar.values || foundLvlVar.value) : null;
        if (Array.isArray(levelPool) && levelPool.length > 0) {
          resolvedVariables[varName] = pickUnseenIndex(levelPool, template.variables, difficultyContext, rng);
          continue;
        }
        const selfPool = v.values || v.value;
        if (Array.isArray(selfPool) && selfPool.length > 0) {
          resolvedVariables[varName] = pickUnseenIndex(selfPool, template.variables, difficultyContext, rng);
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
  let rawQuestionText = template.questionText || '';
  if (template.optionsType === 'fillInTheBlank' || String(template.interaction?.engine || '').toLowerCase() === 'fill_blank') {
    let blankCounter = 0;
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
  const questionText = interpolateString(rawQuestionText, resolvedVariables);
  
  let explanationContent = '';
  if (template.explanation?.sections?.[0]?.content) {
    explanationContent = interpolateString(template.explanation.sections[0].content, resolvedVariables);
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

      if (currentLevel === 1) {
        targetOptionCount = 3;
      } else if (currentLevel === 2) {
        targetOptionCount = 3;
      } else if (currentLevel === 3) {
        targetOptionCount = 4;
      } else if (currentLevel === 4) {
        targetOptionCount = 4;
      }

      let pickedCorrect = [];
      let pickedIncorrect = [];

      const pickRandomMany = (items, count) => {
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
          if (template.interaction) {
            template.interaction.engine = 'mcq';
            template.interaction.type = 'mcq';
          }
        }
      }

      const combined = [...pickedCorrect, ...pickedIncorrect];
      const shouldShuffle = template.shuffleOptions !== false;
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
              dynItems.push({ id: `item_${key}`, label: filename, imageUrl: val, content: val, target: cat.id });
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

  let parts = [];
  if (rawParts.length > 0) {
    parts = rawParts.map(part => {
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
        // Resolve dynamic variable strings for items, targets, categories, grid, pattern, and behavior
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
        if (typeof resolvedPart.grid === 'string') {
          const varName = resolvedPart.grid.replace(/^\[|\]$/g, '');
          if (resolvedVariables[varName] !== undefined) {
            resolvedPart.grid = resolvedVariables[varName];
          }
        }
        if (typeof resolvedPart.pattern === 'string') {
          const varName = resolvedPart.pattern.replace(/^\[|\]$/g, '');
          if (resolvedVariables[varName] !== undefined) {
            resolvedPart.pattern = resolvedVariables[varName];
          }
        }
        if (typeof resolvedPart.behavior === 'string') {
          const varName = resolvedPart.behavior.replace(/^\[|\]$/g, '');
          if (resolvedVariables[varName] !== undefined) {
            resolvedPart.behavior = resolvedVariables[varName];
          }
        }

        // Interpolate inner properties of objects like grid, pattern, and behavior
        if (resolvedPart.grid && typeof resolvedPart.grid === 'object') {
          resolvedPart.grid = { ...resolvedPart.grid };
          for (const key of Object.keys(resolvedPart.grid)) {
            if (typeof resolvedPart.grid[key] === 'string') {
              const cleaned = resolvedPart.grid[key].replace(/^\[|\]$/g, '');
              if (resolvedVariables[cleaned] !== undefined) {
                resolvedPart.grid[key] = resolvedVariables[cleaned];
              } else {
                resolvedPart.grid[key] = resolveExpression(resolvedPart.grid[key], resolvedVariables);
              }
            }
          }
        }
        if (resolvedPart.pattern && typeof resolvedPart.pattern === 'object') {
          resolvedPart.pattern = { ...resolvedPart.pattern };
          for (const key of Object.keys(resolvedPart.pattern)) {
            if (typeof resolvedPart.pattern[key] === 'string') {
              const cleaned = resolvedPart.pattern[key].replace(/^\[|\]$/g, '');
              if (resolvedVariables[cleaned] !== undefined) {
                resolvedPart.pattern[key] = resolvedVariables[cleaned];
              } else {
                resolvedPart.pattern[key] = resolveExpression(resolvedPart.pattern[key], resolvedVariables);
              }
            }
            if (Array.isArray(resolvedPart.pattern[key])) {
              resolvedPart.pattern[key] = resolvedPart.pattern[key].map(elem => {
                if (typeof elem === 'string') {
                  const cleaned = elem.replace(/^\[|\]$/g, '');
                  return resolvedVariables[cleaned] !== undefined ? resolvedVariables[cleaned] : elem;
                }
                return elem;
              });
            }
          }
        }
        if (resolvedPart.behavior && typeof resolvedPart.behavior === 'object') {
          resolvedPart.behavior = { ...resolvedPart.behavior };
          for (const key of Object.keys(resolvedPart.behavior)) {
            if (typeof resolvedPart.behavior[key] === 'string') {
              const cleaned = resolvedPart.behavior[key].replace(/^\[|\]$/g, '');
              if (resolvedVariables[cleaned] !== undefined) {
                resolvedPart.behavior[key] = resolvedVariables[cleaned];
              } else {
                resolvedPart.behavior[key] = resolveExpression(resolvedPart.behavior[key], resolvedVariables);
              }
            }
          }
        }

        // Post-processing mapping/interpolation of items after variable resolution
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

        // 1. Dynamic Categories Subsetting
        const rawCatCount = resolvedPart.categoryCount || resolvedPart.categoriesCount || resolvedPart.maxCategories;
        if (rawCatCount !== undefined && Array.isArray(resolvedPart.categories)) {
          const catCountVal = Number(resolveExpression(String(rawCatCount), resolvedVariables));
          if (catCountVal > 0 && catCountVal < resolvedPart.categories.length) {
            const indexedCats = resolvedPart.categories.map((c, i) => ({ c, i }));
            const shuffledCats = shuffle(indexedCats, rng);
            const selected = shuffledCats.slice(0, catCountVal);
            selected.sort((a, b) => a.i - b.i);
            resolvedPart.categories = selected.map(x => x.c);
          }
        }

        // 2. Filter items pool to only match selected categories
        if (Array.isArray(resolvedPart.categories) && Array.isArray(resolvedPart.items)) {
          const selectedCatIds = new Set(resolvedPart.categories.map(c => c.id));
          let validItems = resolvedPart.items.filter(item => {
            const targetCatId = resolvedPart.answerKey?.[item.id] || item.target;
            return selectedCatIds.has(targetCatId);
          });

          // 3. Dynamic Items Subsetting (Round-Robin Distribution across categories)
          const rawItemCount = resolvedPart.itemCount || resolvedPart.itemsCount || resolvedPart.maxItems || resolvedPart.count;
          if (rawItemCount !== undefined) {
            const itemCountVal = Number(resolveExpression(String(rawItemCount), resolvedVariables));
            if (itemCountVal > 0 && itemCountVal < validItems.length) {
              // Group items by category
              const itemsByCat = {};
              for (const cat of resolvedPart.categories) {
                itemsByCat[cat.id] = [];
              }
              for (const item of validItems) {
                const targetCatId = resolvedPart.answerKey?.[item.id] || item.target;
                if (itemsByCat[targetCatId]) {
                  itemsByCat[targetCatId].push(item);
                }
              }
              // Shuffle items inside each category
              for (const catId of Object.keys(itemsByCat)) {
                itemsByCat[catId] = shuffle(itemsByCat[catId], rng);
              }
              // Gather active categories
              const activeCats = Object.keys(itemsByCat).filter(catId => itemsByCat[catId].length > 0);
              if (activeCats.length > 0) {
                const selectedItems = [];
                const shuffledCatsList = shuffle(activeCats, rng);
                let catIdx = 0;
                while (selectedItems.length < itemCountVal) {
                  let itemPicked = false;
                  for (let i = 0; i < shuffledCatsList.length; i++) {
                    const targetCat = shuffledCatsList[(catIdx + i) % shuffledCatsList.length];
                    if (itemsByCat[targetCat].length > 0) {
                      selectedItems.push(itemsByCat[targetCat].shift());
                      itemPicked = true;
                      if (selectedItems.length >= itemCountVal) break;
                    }
                  }
                  if (!itemPicked) break;
                  catIdx = (catIdx + 1) % shuffledCatsList.length;
                }
                validItems = selectedItems;
              } else {
                validItems = shuffle(validItems, rng).slice(0, itemCountVal);
              }
            }
          }
          resolvedPart.items = validItems;
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

        // 4. Clean/filter answerKey to only reference final items
        if (Array.isArray(resolvedPart.items)) {
          const finalItemIds = new Set(resolvedPart.items.map(item => item.id));
          resolvedPart.answerKey = Object.fromEntries(
            Object.entries(resolvedPart.answerKey).filter(([k]) => finalItemIds.has(k))
          );
        }
      }

      if (resolvedPart.type === 'pick_from_sentence' || resolvedPart.type === 'select_from_sentence') {
        if (typeof resolvedPart.tokens === 'string') {
          const varName = resolvedPart.tokens.replace(/^\[|\]$/g, '');
          if (resolvedVariables[varName] !== undefined) {
            resolvedPart.tokens = resolvedVariables[varName];
          }
        }
      }

      if (resolvedPart.type === 'interactive_stickers') {

        if (typeof resolvedPart.sceneImageUrl === 'string') {
          resolvedPart.sceneImageUrl = interpolateString(resolvedPart.sceneImageUrl, resolvedVariables);
        }
        if (typeof resolvedPart.stickers === 'string') {
          const varName = resolvedPart.stickers.replace(/^\[|\]$/g, '');
          if (resolvedVariables[varName] !== undefined) {
            resolvedPart.stickers = resolvedVariables[varName];
          }
        }
        if (Array.isArray(resolvedPart.stickers)) {
          resolvedPart.stickers = resolvedPart.stickers.map(stk => ({
            ...stk,
            name: stk.name ? interpolateString(stk.name, resolvedVariables) : stk.name,
            imageUrl: stk.imageUrl ? interpolateString(stk.imageUrl, resolvedVariables) : stk.imageUrl
          }));
        }
        if (typeof resolvedPart.initialPlacements === 'string') {
          const varName = resolvedPart.initialPlacements.replace(/^\[|\]$/g, '');
          if (resolvedVariables[varName] !== undefined) {
            resolvedPart.initialPlacements = resolvedVariables[varName];
          }
        }
      }

      for (const prop of ['value', 'min', 'max', 'marker', 'hour', 'minute', 'numerator', 'denominator']) {
        if (resolvedPart[prop] !== undefined) {
          resolvedPart[prop] = resolveExpression(resolvedPart[prop], resolvedVariables);
        }
      }

      if (resolvedPart.type === 'hotspot_canvas' && resolvedPart.composeScene) {
        const compose = resolvedPart.composeScene;
        const containerType = typeof compose.containerType === 'string'
          ? interpolateString(compose.containerType, resolvedVariables)
          : 'box';
        
        let targetClipart = '';
        if (typeof compose.targetClipart === 'string') {
          targetClipart = interpolateString(compose.targetClipart, resolvedVariables);
          if (resolvedVariables[targetClipart] !== undefined) {
            targetClipart = resolvedVariables[targetClipart];
          }
        }
        
        let placements = [];
        if (Array.isArray(compose.placements)) {
          placements = compose.placements.map(p => {
            if (typeof p === 'string') {
              const interpolated = interpolateString(p, resolvedVariables);
              return resolvedVariables[interpolated] !== undefined ? resolvedVariables[interpolated] : interpolated;
            } else if (typeof p === 'object' && p !== null) {
              const resP = { ...p };
              if (typeof resP.type === 'string') {
                resP.type = interpolateString(resP.type, resolvedVariables);
                if (resolvedVariables[resP.type] !== undefined) resP.type = resolvedVariables[resP.type];
              }
              if (typeof resP.clipart === 'string') {
                resP.clipart = interpolateString(resP.clipart, resolvedVariables);
                if (resolvedVariables[resP.clipart] !== undefined) resP.clipart = resolvedVariables[resP.clipart];
              }
              return resP;
            }
            return p;
          });
        }
        
        const hsList = Array.isArray(resolvedPart.hotspots) ? resolvedPart.hotspots.map(h => {
          const resH = { ...h };
          if (typeof resH.label === 'string') {
            resH.label = interpolateString(resH.label, resolvedVariables);
          }
          return resH;
        }) : [];

        resolvedPart.backgroundSvg = generateDynamicSceneSvg({
          containerType,
          targetClipart,
          placements,
          hotspots: hsList,
          canvasWidth: resolvedPart.canvasWidth || 500,
          canvasHeight: resolvedPart.canvasHeight || 320,
          outsidePosition: typeof compose.outsidePosition === 'string'
            ? interpolateString(compose.outsidePosition, resolvedVariables)
            : 'auto'
        });
      }
      
      if (resolvedPart.type === 'arithmeticLayout' && resolvedPart.layout && Array.isArray(resolvedPart.layout.rows)) {
        resolvedPart.layout = {
          ...resolvedPart.layout,
          rows: resolvedPart.layout.rows.map(row => {
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
      
      if (resolvedPart.type === 'number_line' && (resolvedPart.interactive === true || resolvedPart.interactive === 'true' || resolvedPart.clickToFill === true || resolvedPart.clickToFill === 'true')) {
        hasClickToFill = true;
      }

      return resolvedPart;
    });
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

  const questionPayload = {
    itemId: resolvedItemId,
    type: isOrdering ? 'sentence_ordering' : (isVisualChoice ? 'visual_choice' : (template.type || template.optionsType || 'mcq')),
    interaction: template.interaction && typeof template.interaction === 'object'
      ? template.interaction
      : (isOrdering ? 'sentence_ordering' : (template.optionsType || (isVisualChoice ? 'visual_choice' : 'mcq'))),
    questionText: String(questionText || '')
      .replace(/(\\n|\/n|\n)\s*(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/gi, '')
      .replace(/(\/api\/tts\?[^\s\n"']+|\S+\.(?:mp3|wav|ogg))/gi, '')
      .replace(/\\n/g, '\n')
      .replace(/\/n/g, '\n')
      .trim(),
    parts,
    soundUrl: template.soundUrl ? interpolateString(template.soundUrl, resolvedVariables) : undefined,
    soundText: template.soundText ? interpolateString(template.soundText, resolvedVariables) : undefined,
    voice: template.voice || undefined,
    options: isVisualChoice
      ? visualPanels.map((p, idx) => ({ id: `panel_${idx}`, label: String(p.count), isPanel: true }))
      : optionsList.map((o, idx) => ({
        id: o.id || `opt_${idx}`,
        label: o.label,
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
