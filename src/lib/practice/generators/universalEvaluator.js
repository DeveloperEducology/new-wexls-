// Gateway wrapper for the refactored modular Universal Template Evaluator pipeline
import { seededRandom, evaluateTemplate as baseEvaluateTemplate, resolveValidationRules } from './universal/evaluator.js';
import { resolveExpression } from './universal/expressionParser.js';
import { interpolateString, resolveLabelOrExpression, getCleanNameFromUrl, parseLabeledEntry } from './universal/interpolator.js';
import { renderTenFrame } from './universal/components/TenFrame.js';
import { renderJarOfMarbles } from './universal/components/JarOfMarbles.js';
import { renderSpinner } from './universal/components/Spinner.js';
import { renderItemCounter } from './universal/components/ItemCounter.js';
import { drawVisualChoicePanel } from './universal/components/VisualChoice.js';
import { renderPlaceValue } from './universal/components/PlaceValue.js';
import { COMPONENT_REGISTRY } from './universal/components/index.js';

// Legacy and custom positional wrappers for backward compatibility and template rendering
export function drawPlaceValue(thousands, hundreds, tens, ones, showChart = true, color = undefined) {
  return COMPONENT_REGISTRY.PlaceValue({ thousands, hundreds, tens, ones, showChart, color });
}
export function drawBaseTenBlocks(rodsCount, blocksCount, flatsCount = 0, cubesCount = 0, color = undefined) {
  return COMPONENT_REGISTRY.PlaceValue({ tens: rodsCount, ones: blocksCount, hundreds: flatsCount, thousands: cubesCount, showChart: false, color });
}
export function drawTenFrame(filledCount, crossedOutCount = 0, color = 'red') {
  return COMPONENT_REGISTRY.TenFrame({ filledCount, crossedOutCount, color });
}
export function drawJarOfMarbles(colorA, countA, colorB, countB, seed) {
  return COMPONENT_REGISTRY.JarOfMarbles({ colorA, countA, colorB, countB }, seed);
}
export function drawSpinner(colorA, sectorsA, colorB, sectorsB) {
  return COMPONENT_REGISTRY.Spinner({ colorA, sectorsA, colorB, sectorsB });
}
export function drawItemCounter(itemCount, itemType = 'cupcake', crossedOutCount = 0, itemsPerRow = 5) {
  return COMPONENT_REGISTRY.ItemCounter({ count: itemCount, itemType, crossedOutCount, itemsPerRow });
}
export function drawNumberLine(min, max, step, pointValue, pointLabel = '', markedPoints = '', jumps = '', interactive = false, color = 'blue') {
  return COMPONENT_REGISTRY.NumberLine({ min, max, step, pointValue, pointLabel, markedPoints, jumps, interactive, color });
}
export function drawHundredChart(missing = '', highlighted = '', color = 'blue') {
  return COMPONENT_REGISTRY.HundredChart({ missing, highlighted, color });
}
export function drawRekenrek(rows = 2, values = '0,0') {
  return COMPONENT_REGISTRY.Rekenrek({ rows, values });
}
export function drawNumberBond(whole, left, right, missing = '') {
  return COMPONENT_REGISTRY.NumberBond({ whole, left, right, missing });
}
export function drawTallyChart(categories, counts, showFrequency = true) {
  return COMPONENT_REGISTRY.TallyChart({ categories, counts, showFrequency });
}
export function drawFractionBar(denominator, numerator, color = 'blue', interactive = false) {
  return COMPONENT_REGISTRY.FractionBar({ denominator, numerator, color, interactive });
}
export function drawFractionCircle(denominator, numerator, color = 'red', interactive = false) {
  return COMPONENT_REGISTRY.FractionCircle({ denominator, numerator, color, interactive });
}
export function drawFractionGrid(rows, cols, shaded, color = 'green', interactive = false) {
  return COMPONENT_REGISTRY.FractionGrid({ rows, cols, shaded, color, interactive });
}
export function drawDecimalGrid(value, color = 'orange') {
  return COMPONENT_REGISTRY.DecimalGrid({ value, color });
}
export function drawDecimalLine(min, max, step, markedPoint, pointLabel = '', color = 'blue') {
  return COMPONENT_REGISTRY.DecimalLine({ min, max, step, markedPoint, pointLabel, color });
}
export function drawShapeCanvas(shape, label = '', color = 'purple') {
  return COMPONENT_REGISTRY.ShapeCanvas({ shape, label, color });
}
export function drawCoordinatePlane(xMin, xMax, yMin, yMax, points = '', polygon = '') {
  return COMPONENT_REGISTRY.CoordinatePlane({ xMin, xMax, yMin, yMax, points, polygon });
}
export function drawProtractor(angle) {
  return COMPONENT_REGISTRY.Protractor({ angle });
}
export function drawRuler(length, objectLength, objectType = 'pencil') {
  return COMPONENT_REGISTRY.Ruler({ length, objectLength, objectType });
}
export function drawGeoboard(gridSize, polygon = '', color = 'red') {
  return COMPONENT_REGISTRY.Geoboard({ gridSize, polygon, color });
}
export function drawBarGraph(title, categories, values, yMax = undefined, color = 'blue') {
  return COMPONENT_REGISTRY.BarGraph({ title, categories, values, yMax, color });
}
export function drawPictograph(categories, values, emoji = '🍎', key = 1, showCount = true) {
  return COMPONENT_REGISTRY.Pictograph({ categories, values, emoji, key, showCount });
}
export function drawFrequencyTable(title, categories, values, headers = 'Category,Frequency') {
  return COMPONENT_REGISTRY.FrequencyTable({ title, categories, values, headers });
}
export function drawAnalogClock(hour, minute, interactive = false) {
  return COMPONENT_REGISTRY.AnalogClock({ hour, minute, interactive });
}
export function drawCalendar(month, daysInMonth, startDay, highlightDays = '') {
  return COMPONENT_REGISTRY.Calendar({ month, daysInMonth, startDay, highlightDays });
}
export function drawThermometer(min, max, value, unit = 'C') {
  return COMPONENT_REGISTRY.Thermometer({ min, max, value, unit });
}
export function drawBalanceScale(leftWeight, rightWeight, leftLabel = 'Box A', rightLabel = 'Box B', showStacked = false) {
  return COMPONENT_REGISTRY.BalanceScale({ leftWeight, rightWeight, leftLabel, rightLabel, showStacked });
}
export function drawMeasuringJug(capacity, step, value) {
  return COMPONENT_REGISTRY.MeasuringJug({ capacity, step, value });
}
export function drawMoneyDisplay(amount) {
  return COMPONENT_REGISTRY.MoneyDisplay({ amount });
}
export function drawPriceTagCompare(itemA, priceA, itemB, priceB) {
  return COMPONENT_REGISTRY.PriceTagCompare({ itemA, priceA, itemB, priceB });
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
      if (v.value !== undefined) return [ v.value ];
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
  try {
    return resolveExpression(expr, ctx);
  } catch (err) {
    if (typeof expr === 'number') return expr;
    let resolved = String(expr);
    for (const [key, val] of Object.entries(ctx)) {
      if (typeof val === 'string' && val.includes('/')) {
        const [num, den] = val.split('/').map(Number);
        resolved = resolved.replace(new RegExp(`${key}_numerator`, 'g'), String(num));
        resolved = resolved.replace(new RegExp(`${key}_denominator`, 'g'), String(den));
        resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), `(${num}/${den})`);
      } else {
        const isNumeric = typeof val === 'number' || (typeof val === 'string' && !isNaN(Number(val)));
        const replacement = isNumeric ? String(val) : JSON.stringify(val);
        resolved = resolved.replace(new RegExp(`\\b${key}\\b`, 'g'), replacement);
      }
    }
    const result = new Function(`return (${resolved})`)();
    if (typeof result === 'number') {
      return Math.round(result * 100) / 100;
    }
    return result;
  }
}

function fillTemplate(tmpl, ctx) {
  let result = tmpl;

  // Temporarily protect [[blank_id]] double-bracket tokens (used by FIB renderer)
  // Replace [[...]] with a placeholder so inner [key] substitutions don't strip one bracket
  const doubleBracketMap = {};
  let dbIndex = 0;
  result = result.replace(/\[\[([^\]]+)\]\]/g, (match) => {
    const placeholder = `__DBLBRACKET_${dbIndex++}__`;
    doubleBracketMap[placeholder] = match;
    return placeholder;
  });

  for (const [key, val] of Object.entries(ctx)) {
    // Replace {{key}}
    result = result.replace(new RegExp(`\\{\\{(\\s*)${key}(\\s*)\\}\\}`, 'g'), String(val));
    // Replace [key] — but only single brackets (double-bracket tokens already protected above)
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

  // Evaluate any math expressions wrapped in [expression] — skip if starts with [ (double bracket already gone)
  result = result.replace(/\[\s*(.*?)\s*\]/g, (match, expr) => {
    // Skip placeholders and double-bracket-like patterns
    if (match.startsWith('[[') || expr.startsWith('[')) return match;
    if (ctx[expr] !== undefined) return String(ctx[expr]);
    try {
      return String(evalDerivation(expr, ctx));
    } catch {
      return match;
    }
  });

  // Restore [[blank_id]] double-bracket tokens
  for (const [placeholder, original] of Object.entries(doubleBracketMap)) {
    result = result.replaceAll(placeholder, original);
  }

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

export function evaluateTemplate(template, seed, difficultyContext = null) {
  let config = template?.config || template || {};
  if (config.config && (!config.variables || Array.isArray(config.variables))) {
    config = { ...config, ...config.config };
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

  if (template?.type === 'universal' || config.type === 'universal') {
    return baseEvaluateTemplate(config, seed, difficultyContext);
  }

  const isParameterized = template?.type === 'parameterized' ||
    (template?.examId === 'jnvst' || template?.exam === 'jnvst') ||
    (config.variables && (Array.isArray(config.variables) ? config.variables.some(v => v && v.name) : true));

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
    let isMultiSelectMode = false;

    let combos = buildCombinations(variables);
    if (!combos.length) return { questionText: '', options: [], correctAnswerIndex: -1 };

    // ── Level-pool filtering ──────────────────────────────────────────────────
    // If the template has index_l1/l2/l3/l4 pools (compiled by the grid editor),
    // restrict combos to only the rows belonging to the current difficulty level.
    let levelPoolKey = currentLevel <= 1 ? 'index_l1'
                     : currentLevel === 2 ? 'index_l2'
                     : currentLevel === 3 ? 'index_l3'
                     : 'index_l4';
    let rawLevelPool = variables[levelPoolKey];
    if (levelPoolKey === 'index_l4' && (!rawLevelPool || (Array.isArray(rawLevelPool) && rawLevelPool.length === 0) || (rawLevelPool.values && rawLevelPool.values.length === 0) || (rawLevelPool.pool && rawLevelPool.pool.length === 0))) {
      levelPoolKey = 'index_l3';
      rawLevelPool = variables[levelPoolKey];
    }
    const levelPool = rawLevelPool
      ? (rawLevelPool.values || rawLevelPool.pool || (Array.isArray(rawLevelPool) ? rawLevelPool : null))
      : null;
    if (levelPool && levelPool.length > 0 && variables.index) {
      const levelSet = new Set(levelPool.map(Number));
      const filtered = combos.filter(c => c.index !== undefined && levelSet.has(Number(c.index)));
      if (filtered.length > 0) combos = filtered; // only restrict if we found matches
    }
    // ─────────────────────────────────────────────────────────────────────────


    // Align parallel choice lists (e.g. animal and image)
    if (variables.animal && variables.image) {
      const animalPool = variables.animal.pool || variables.animal.values || [];
      const imagePool = variables.image.pool || variables.image.values || [];
      if (animalPool.length > 0 && animalPool.length === imagePool.length) {
        combos = combos.filter(combo => {
          const animalIdx = animalPool.indexOf(combo.animal);
          const imageIdx = imagePool.indexOf(combo.image);
          return animalIdx === -1 || imageIdx === -1 || animalIdx === imageIdx;
        });
      }
    }

    // Filter combinations to only keep those that produce integer-only outputs for all derivations
    let validCombos = [];
    for (const combo of combos) {
      const tempCtx = { ...combo };
      let remaining = { ...derivations };
      let changed = true;
      let iterations = 0;
      
      while (changed && iterations < 5 && Object.keys(remaining).length > 0) {
        changed = false;
        iterations++;
        for (const [key, expr] of Object.entries(remaining)) {
          try {
            const val = evalDerivation(expr, tempCtx);
            if (val !== null && val !== undefined && (typeof val === 'number' ? !isNaN(val) : true)) {
              tempCtx[key] = val;
              delete remaining[key];
              changed = true;
            }
          } catch {
            // ignore and wait for next iteration when dependencies are resolved
          }
        }
      }
      
      let hasDecimal = false;
      for (const key of Object.keys(derivations)) {
        const val = tempCtx[key];
        if (val === undefined || val === null || (typeof val === 'number' && !Number.isInteger(val))) {
          hasDecimal = true;
        }
      }
      if (!hasDecimal) {
        validCombos.push(tempCtx);
      }
    }

    const finalCombos = validCombos.length > 0 ? validCombos : combos;

    const rng = seededRandom(seed);
    const idx = Math.floor(rng() * finalCombos.length);
    const combo = { ...finalCombos[idx] };
    
    // Image pool selection and variable mapping (similar to base evaluator)
    if (Array.isArray(config.visuals)) {
      for (const v of config.visuals) {
        if (v.component === 'ItemCounter' && v.props) {
          const rawItemType = v.props.itemType;
          let itemTypeVal = 'item';
          let itemTypeLabel = null;
          if (rawItemType) {
            if (combo[rawItemType] !== undefined) {
              itemTypeVal = combo[rawItemType];
            } else {
              itemTypeVal = rawItemType;
            }
          }
          
          let itemTypesList = [];
          if (Array.isArray(itemTypeVal)) {
            itemTypesList = itemTypeVal.map(e => parseLabeledEntry(String(e)));
          } else if (typeof itemTypeVal === 'string' && itemTypeVal.includes(',')) {
            itemTypesList = itemTypeVal.split(',').map(s => parseLabeledEntry(s.trim())).filter(e => e.url);
          }
          
          if (itemTypesList.length > 0) {
            const idx = Math.floor(rng() * itemTypesList.length);
            const chosen = itemTypesList[idx];
            itemTypeVal = chosen.url;
            itemTypeLabel = chosen.label;
          } else {
            const parsed = parseLabeledEntry(String(itemTypeVal));
            itemTypeVal = parsed.url;
            itemTypeLabel = parsed.label;
          }
          
          combo["_ItemCounter_resolvedType"] = itemTypeVal;
          
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

          if (combo["Item"] === undefined) combo["Item"] = cleanItemName;
          if (combo["item"] === undefined) combo["item"] = cleanItemName;
          if (combo["itemPlural"] === undefined) combo["itemPlural"] = pluralName;
          if (combo["ItemPlural"] === undefined) combo["ItemPlural"] = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);
          if (combo["item_plural"] === undefined) combo["item_plural"] = pluralName;
        }
        
        if (v.component === 'Image' && v.props) {
          const rawImageUrl = v.props.imageUrl || v.props.src;
          let imageUrlVal = '';
          let imageUrlLabel = null;
          if (rawImageUrl) {
            if (combo[rawImageUrl] !== undefined) {
              imageUrlVal = combo[rawImageUrl];
            } else {
              imageUrlVal = rawImageUrl;
            }
          }
          
          let imageUrlsList = [];
          if (Array.isArray(imageUrlVal)) {
            imageUrlsList = imageUrlVal.map(e => parseLabeledEntry(String(e)));
          } else if (typeof imageUrlVal === 'string' && imageUrlVal.includes(',')) {
            imageUrlsList = imageUrlVal.split(',').map(s => parseLabeledEntry(s.trim())).filter(e => e.url);
          }
          
          if (imageUrlsList.length > 0) {
            const idx = Math.floor(rng() * imageUrlsList.length);
            const chosen = imageUrlsList[idx];
            imageUrlVal = chosen.url;
            imageUrlLabel = chosen.label;
          } else {
            const parsed = parseLabeledEntry(String(imageUrlVal));
            imageUrlVal = parsed.url;
            imageUrlLabel = parsed.label;
          }
          
          combo["_Image_resolvedUrl"] = imageUrlVal;
          
          let cleanItemName;
          if (imageUrlLabel) {
            cleanItemName = imageUrlLabel;
          } else if (typeof imageUrlVal === 'string' && (
            imageUrlVal.startsWith('http://') || 
            imageUrlVal.startsWith('https://') || 
            imageUrlVal.startsWith('/') || 
            imageUrlVal.includes('.')
          )) {
            cleanItemName = getCleanNameFromUrl(imageUrlVal);
          } else {
            cleanItemName = imageUrlVal;
          }
          
          const makePlural = (noun) => {
            if (!noun) return '';
            if (noun.endsWith('y')) return noun.slice(0, -1) + 'ies';
            if (noun.endsWith('s') || noun.endsWith('x') || noun.endsWith('ch') || noun.endsWith('sh')) return noun + 'es';
            return noun + 's';
          };
          const pluralName = makePlural(cleanItemName);

          if (combo["Item"] === undefined) combo["Item"] = cleanItemName;
          if (combo["item"] === undefined) combo["item"] = cleanItemName;
          if (combo["itemPlural"] === undefined) combo["itemPlural"] = pluralName;
          if (combo["ItemPlural"] === undefined) combo["ItemPlural"] = pluralName.charAt(0).toUpperCase() + pluralName.slice(1);
          if (combo["item_plural"] === undefined) combo["item_plural"] = pluralName;
        }
      }
    }
    
    // Compute/populate derivations with dependency resolution
    const ctx = { ...combo };
    let remainingDerivations = { ...derivations };
    let changed = true;
    let iterations = 0;
    
    while (changed && iterations < 5 && Object.keys(remainingDerivations).length > 0) {
      changed = false;
      iterations++;
      for (const [key, expr] of Object.entries(remainingDerivations)) {
        try {
          const val = evalDerivation(expr, ctx);
          if (val !== null && val !== undefined && (typeof val === 'number' ? !isNaN(val) : true)) {
            ctx[key] = val;
            delete remainingDerivations[key];
            changed = true;
          }
        } catch {
          // ignore and wait for next iteration when dependencies are resolved
        }
      }
    }
    for (const key of Object.keys(remainingDerivations)) {
      ctx[key] = null;
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

    const resolvedInteractionEngine =
      (typeof config.interaction === 'object' ? config.interaction.engine : null) ||
      config.optionsType || 'mcq';
    const isMcqLike = !['hotspot_select', 'mcq_hotspot', 'sorting', 'matching', 'fill_blank', 'number_input'].includes(String(resolvedInteractionEngine).toLowerCase());

    if (isMcqLike && options.length > 0) {
      const correctOptions = options.filter(o => o.isCorrect);
      const incorrectOptions = options.filter(o => !o.isCorrect);

      let targetOptionCount = 4;

      const isExplicitMsq = resolvedInteractionEngine === 'msq' || config.optionsType === 'msq';
      if (isExplicitMsq) {
        isMultiSelectMode = true;
      } else if (currentLevel === 4) {
        isMultiSelectMode = true;
      }

      let pickedCorrect = [];
      let pickedIncorrect = [];

      const pickRandomMany = (items, count) => {
        const shuffled = seededShuffle(items, rng);
        return shuffled.slice(0, count);
      };

      if (isExplicitMsq) {
        // For explicitly authored MSQ questions, we MUST show ALL correct options
        // to avoid mismatch with the compiled validation rules.
        pickedCorrect = correctOptions;
        pickedIncorrect = pickRandomMany(incorrectOptions, Math.max(1, targetOptionCount - pickedCorrect.length));
      } else if (isMultiSelectMode) {
        const targetCorrectCount = Math.min(correctOptions.length, 2);
        pickedCorrect = pickRandomMany(correctOptions, targetCorrectCount > 0 ? targetCorrectCount : 1);
        pickedIncorrect = pickRandomMany(incorrectOptions, Math.max(1, targetOptionCount - pickedCorrect.length));
      } else {
        pickedCorrect = pickRandomMany(correctOptions, 1);
        pickedIncorrect = pickRandomMany(incorrectOptions, Math.max(1, targetOptionCount - pickedCorrect.length));
      }

      options = [...pickedCorrect, ...pickedIncorrect];
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
          if (v.component === 'ItemCounter' && key === 'itemType' && ctx["_ItemCounter_resolvedType"]) {
            resolvedProps[key] = ctx["_ItemCounter_resolvedType"];
          } else if (v.component === 'Image' && key === 'imageUrl' && ctx["_Image_resolvedUrl"]) {
            resolvedProps[key] = ctx["_Image_resolvedUrl"];
          } else if (typeof val === 'string' && ctx[val] !== undefined) {
            resolvedProps[key] = ctx[val];
          } else {
            try {
              resolvedProps[key] = resolveExpression(val, ctx);
            } catch {
              const num = Number(val);
              resolvedProps[key] = Number.isFinite(num) ? num : val;
            }
          }
        }
        try {
          const result = builder(resolvedProps, rng);
          const visualPart = (result && typeof result === 'object' && result.type) 
            ? { ...result, position: v.position } 
            : { type: 'svg', content: result, position: v.position };
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
      metaConfig: {
        readable: true,
        readOptions: interactionEngine !== 'fill_blank' && interactionEngine !== 'fillInTheBlank',
        hasClickToFill: Boolean(config.metaConfig?.hasClickToFill || config.clickToFill),
        visuals: config.visuals
      },
      schema: {
        variables: Object.fromEntries(
          Object.entries(ctx).filter(([key, value]) => typeof value !== 'function' && !key.startsWith('_'))
        )
      }
    };

    // Attach fill-in-the-blank fields so QuestionRenderer picks the right renderer
    if (interactionEngine === 'fill_blank' || interactionEngine === 'fillInTheBlank' || interactionEngine === 'number_input') {
      result.type = 'fillInTheBlank';
      result.interaction = { engine: 'fill_blank', inputMode: 'number' };
      
      const resolvedRules = resolveValidationRules(validationRules, ctx);
      result.validationRules = resolvedRules;
      
      // Extract correct answer object from validation rules for display in PracticeFeedback
      const exactMatchRule = resolvedRules.find(r => r && r.type === 'exact_match' && r.target === 'answer');
      if (exactMatchRule && exactMatchRule.value) {
        result.answer = exactMatchRule.value;
      } else if (answer) {
        // Resolve answer placeholders using ctx (e.g. {{Result}} → actual value)
        if (typeof answer === 'object' && !Array.isArray(answer)) {
          result.answer = Object.fromEntries(
            Object.entries(answer).map(([k, v]) => [k, fillTemplate(String(v), ctx)])
          );
        } else {
          result.answer = answer;
        }
      }
    } else if (isMultiSelectMode) {
      result.type = 'multi_select';
      result.interaction = 'multi_select';
    } else {
      result.type = 'mcq';
      result.interaction = 'mcq';
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

