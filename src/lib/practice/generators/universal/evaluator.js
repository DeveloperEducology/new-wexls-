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

// Main Template Evaluator Engine
export function evaluateTemplate(template, seed) {
  if (!template || typeof template !== 'object') {
    throw new Error('Template document is invalid.');
  }

  const rng = seededRandom(seed);
  // Built-in helper functions available to ALL template expressions & interpolations.
  const resolvedVariables = {
    toWords: numberToWords,
  };

  // 1. Evaluate variables sequentially
  if (Array.isArray(template.variables)) {
    for (const v of template.variables) {
      if (v.type === 'integer') {
        const minVal = resolveExpression(v.min, resolvedVariables);
        const maxVal = resolveExpression(v.max, resolvedVariables);
        // Ensure min <= max
        const min = Math.min(minVal, maxVal);
        const max = Math.max(minVal, maxVal);
        
        resolvedVariables[v.name] = Math.floor(rng() * (max - min + 1)) + min;
      } else if (v.type === 'expression') {
        resolvedVariables[v.name] = resolveExpression(v.formula, resolvedVariables);
      } else if (v.type === 'list') {
        const items = Array.isArray(v.items) ? v.items : [];
        if (items.length > 0) {
          const idx = Math.floor(rng() * items.length);
          resolvedVariables[v.name] = items[idx];
        } else {
          resolvedVariables[v.name] = '';
        }
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
            imageUrlVal = rawImageUrl;
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
  const questionText = interpolateString(template.questionText, resolvedVariables);
  
  let explanationContent = '';
  if (template.explanation?.sections?.[0]?.content) {
    explanationContent = interpolateString(template.explanation.sections[0].content, resolvedVariables);
  }

  // 3. Resolve options and determine correctness
  let optionsList = [];
  if (Array.isArray(template.options)) {
    const rawOptions = template.options.map(opt => {
      const resolvedLabel = resolveLabelOrExpression(opt.label || opt.value, resolvedVariables);
      
      let isCorrect = false;
      if (typeof opt.isCorrect === 'boolean') {
        isCorrect = opt.isCorrect;
      } else if (typeof opt.isCorrect === 'string') {
        const resolved = resolveExpression(opt.isCorrect, resolvedVariables);
        isCorrect = resolved === true || resolved === 1 || String(resolved) === 'true';
      }
      
      return { label: resolvedLabel, isCorrect };
    });

    const uniqueOptions = [];
    const seen = new Set();
    for (const opt of rawOptions) {
      if (!seen.has(opt.label)) {
        seen.add(opt.label);
        uniqueOptions.push(opt);
      }
    }

    const shouldShuffle = template.optionsType !== 'hotspot_select' && 
                          template.optionsType !== 'mcq_hotspot' && 
                          template.shuffleOptions !== false;
    optionsList = shouldShuffle ? shuffle(uniqueOptions, rng) : uniqueOptions;
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
          svg: item.svg ? interpolateString(item.svg, resolvedVariables) : undefined,
          imageWidth: item.imageWidth ? resolveExpression(String(item.imageWidth), resolvedVariables) : undefined
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
        for (const [key, val] of Object.entries(v.props || {})) {
          if (v.component === 'ItemCounter' && key === 'itemType' && resolvedVariables["_ItemCounter_resolvedType"]) {
            resolvedProps[key] = resolvedVariables["_ItemCounter_resolvedType"];
          } else if (v.component === 'Image' && key === 'imageUrl' && resolvedVariables["_Image_resolvedUrl"]) {
            resolvedProps[key] = resolvedVariables["_Image_resolvedUrl"];
          } else if (typeof val === 'string' && resolvedVariables[val] !== undefined) {
            resolvedProps[key] = resolvedVariables[val];
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
    solutionSections = template.solution.sections.map(part => {
      let resolvedPart;
      if (typeof part === 'string') {
        resolvedPart = interpolateString(part, resolvedVariables);
      } else {
        resolvedPart = { ...part };
        if (typeof resolvedPart.content === 'string') {
          resolvedPart.content = interpolateString(resolvedPart.content, resolvedVariables);
        }
        if (typeof resolvedPart.text === 'string') {
          resolvedPart.text = interpolateString(resolvedPart.text, resolvedVariables);
        }
        if (typeof resolvedPart.label === 'string') {
          resolvedPart.label = interpolateString(resolvedPart.label, resolvedVariables);
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
      }
      return resolvedPart;
    });
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
      : optionsList.map((o, idx) => ({ id: `opt_${idx}`, label: o.label })),
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
    }
  };

  if (categorizationPart) {
    if (categorizationPart.categories) questionPayload.categories = categorizationPart.categories;
    if (categorizationPart.items) questionPayload.items = categorizationPart.items;
  }

  if (resolvedAnswer !== null) {
    if (categorizationPart && resolvedAnswer && typeof resolvedAnswer === 'object') {
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

  return questionPayload;
}
