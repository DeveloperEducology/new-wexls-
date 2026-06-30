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

function resolvePartStrings(part, resolvedVariables) {
  if (typeof part === 'string') {
    return interpolateString(part, resolvedVariables);
  }
  if (!part || typeof part !== 'object') {
    return part;
  }
  const resolved = { ...part };
  if (typeof resolved.content === 'string') {
    resolved.content = interpolateString(resolved.content, resolvedVariables);
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
  if (typeof source.items === 'string') {
    return source.items.split(',').map(item => item.trim()).filter(Boolean);
  }
  if (typeof source.value === 'string') {
    return source.value.split(',').map(item => item.trim()).filter(Boolean);
  }
  return [];
}

function resolveVariableValue(variable, resolvedVariables, dataSourceMap, rng) {
  const type = String(variable?.type || '').toLowerCase();
  const sourceKey = variable?.source || variable?.sourceId;
  const sourceItems = sourceKey ? dataSourceMap[sourceKey] : null;

  if (type === 'integer' || type === 'random_number') {
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

  if (type === 'list' || type === 'random_item' || type === 'array') {
    const items = Array.isArray(sourceItems) ? sourceItems : normalizeDataSourceItems(variable);
    return pickRandom(items, rng);
  }

  return variable?.value ?? '';
}

export function resolveValidationRules(rules, resolvedVariables) {
  if (!Array.isArray(rules)) return [];
  const resolveTemplateValue = (value) => {
    if (typeof value === 'string') return interpolateString(value, resolvedVariables);
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
export function evaluateTemplate(originalTemplate, seed) {
  if (!originalTemplate || typeof originalTemplate !== 'object') {
    throw new Error('Template document is invalid.');
  }

  // Normalize universal template format to legacy flat structure for evaluator compatibility
  let template = originalTemplate;
  if (originalTemplate.templateInfo || originalTemplate.layout || originalTemplate.interaction || originalTemplate.feedback) {
    const schemaInteraction = originalTemplate.interaction || {};
    template = {
      ...originalTemplate,
      questionText: originalTemplate.layout?.questionText || originalTemplate.questionText,
      optionsType: schemaInteraction.engine || schemaInteraction.type || originalTemplate.optionsType || 'mcq',
      options: schemaInteraction.options || originalTemplate.options || [],
      explanation: originalTemplate.feedback?.stepByStepExplanation 
        ? { sections: [{ type: 'text', content: originalTemplate.feedback.stepByStepExplanation }] }
        : originalTemplate.explanation,
    };
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
      resolvedVariables[varName] = resolveVariableValue(v, resolvedVariables, dataSourceMap, rng);
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
        
        if (resolvedVariables["Item"] === undefined) {
          resolvedVariables["Item"] = cleanItemName;
        }
        if (resolvedVariables["item"] === undefined) {
          resolvedVariables["item"] = cleanItemName;
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

      const rawOptions = resolvedOptionsData.map(opt => {
      const resolvedLabel = resolveLabelOrExpression(opt.label || opt.value, resolvedVariables);
      const resolvedImageUrl = opt.imageUrl
        ? resolveLabelOrExpression(opt.imageUrl, resolvedVariables)
        : (isPictureChoice && isImageLikeUrl(resolvedLabel) ? resolvedLabel : undefined);
      
      let isCorrect = false;
      if (typeof opt.isCorrect === 'boolean') {
        isCorrect = opt.isCorrect;
      } else if (typeof opt.isCorrect === 'string') {
        const resolved = resolveExpression(opt.isCorrect, resolvedVariables);
        isCorrect = resolved === true || resolved === 1 || String(resolved) === 'true';
      }
      
      return {
        label: isPictureChoice && resolvedImageUrl ? opt.alt || opt.text || `Option` : resolvedLabel,
        ...(resolvedImageUrl ? { imageUrl: resolvedImageUrl } : {}),
        isCorrect,
        misconception: opt.misconception ? resolveLabelOrExpression(opt.misconception, resolvedVariables) : undefined,
        feedback: opt.feedback ? resolveLabelOrExpression(opt.feedback, resolvedVariables) : undefined,
        remediationHint: opt.remediationHint ? resolveLabelOrExpression(opt.remediationHint, resolvedVariables) : undefined
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

    const shouldShuffle = template.optionsType !== 'hotspot_select' && 
                          template.optionsType !== 'mcq_hotspot' && 
                          template.shuffleOptions !== false;
    optionsList = shouldShuffle ? shuffle(uniqueOptions, rng) : uniqueOptions;
    }
  }

  const correctAnswerIndex = optionsList.findIndex(o => o.isCorrect);

  // 4. Resolve Parts and Visual SVG outputs
  let hasClickToFill = false;
  let parts = [];
  if (Array.isArray(template.parts)) {
    parts = template.parts.map(part => {
      const resolvedPart = { ...part };
      
      if (typeof resolvedPart.content === 'string') {
        resolvedPart.content = interpolateString(resolvedPart.content, resolvedVariables);
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
    parts = [{ type: 'text', content: questionText }];
  }
  
  if (Array.isArray(template.visuals)) {
    for (const v of template.visuals) {

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
          if (result && typeof result === 'object' && result.type) {
            parts.push(result);
          } else if (typeof result === 'string') {
            parts.push({ type: 'svg', content: result });
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

  const questionPayload = {
    type: isVisualChoice ? 'visual_choice' : (template.optionsType || 'mcq'),
    interaction: template.optionsType || (isVisualChoice ? 'visual_choice' : 'mcq'),
    questionText,
    parts,
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
      hasClickToFill
    },
    layoutConfig: template.layoutConfig || template.layout || undefined,
    validationRules: resolveValidationRules(template.validationRules || template.validation?.rules, resolvedVariables),
    feedbackRules: template.feedbackRules || template.feedback || undefined,
    difficultyRules: template.difficultyRules || undefined,
    analyticsConfig: template.analyticsConfig || undefined,
    adaptiveRules: template.adaptiveRules || undefined,
    schema: {
      templateId: template.id || template.templateId || template.templateInfo?.templateId,
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
