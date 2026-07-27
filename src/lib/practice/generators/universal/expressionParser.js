import { COMPONENT_REGISTRY } from './components/index.js';

// Safe math expression parser (CSP-safe)
function evaluateSimpleExpression(str) {
  let s = String(str).replace(/\s+/g, '');
  
  while (s.includes('(')) {
    const prev = s;
    s = s.replace(/\(([^()]*)\)/g, (match, subExpr) => {
      return evaluateSimpleExpression(subExpr);
    });
    if (s === prev) {
      s = s.replace(/\(\)/g, '0');
      if (s === prev) break;
    }
  }
  
  const tokens = [];
  let numberBuffer = '';
  
  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (/[0-9.]/.test(char)) {
      numberBuffer += char;
    } else if (char === '-' && (i === 0 || /[+\-*/%]/.test(s[i - 1]))) {
      numberBuffer += char;
    } else {
      if (numberBuffer) {
        tokens.push(parseFloat(numberBuffer));
        numberBuffer = '';
      }
      tokens.push(char);
    }
  }
  if (numberBuffer) {
    tokens.push(parseFloat(numberBuffer));
  }
  
  // 1. Process multiplications, divisions, modulo
  let i = 0;
  while (i < tokens.length) {
    if (tokens[i] === '*' || tokens[i] === '/' || tokens[i] === '%') {
      const op = tokens[i];
      const left = tokens[i - 1];
      const right = tokens[i + 1];
      let res = 0;
      if (op === '*') res = left * right;
      else if (op === '/') res = left / right;
      else if (op === '%') res = left % right;
      
      tokens.splice(i - 1, 3, res);
      i--;
    } else {
      i++;
    }
  }
  
  // 2. Process additions, subtractions
  i = 0;
  while (i < tokens.length) {
    if (tokens[i] === '+' || tokens[i] === '-') {
      const op = tokens[i];
      const left = tokens[i - 1];
      const right = tokens[i + 1];
      let res = 0;
      if (op === '+') res = left + right;
      else if (op === '-') res = left - right;
      
      tokens.splice(i - 1, 3, res);
      i--;
    } else {
      i++;
    }
  }
  
  return tokens[0];
}

const drawingHelpers = {
  drawPlaceValue: (thousands, hundreds, tens, ones, showChart = true, color = undefined) => {
    return COMPONENT_REGISTRY.PlaceValue({ thousands, hundreds, tens, ones, showChart, color });
  },
  drawBaseTenBlocks: (rodsCount, blocksCount, flatsCount = 0, cubesCount = 0, color = undefined) => {
    return COMPONENT_REGISTRY.PlaceValue({ tens: rodsCount, ones: blocksCount, hundreds: flatsCount, thousands: cubesCount, showChart: false, color });
  },
  drawTenFrame: (filledCount, crossedOutCount = 0, color = 'red') => {
    return COMPONENT_REGISTRY.TenFrame({ filledCount, crossedOutCount, color });
  },
  drawJarOfMarbles: (colorA, countA, colorB, countB, seed) => {
    return COMPONENT_REGISTRY.JarOfMarbles({ colorA, countA, colorB, countB }, seed);
  },
  drawSpinner: (colorA, sectorsA, colorB, sectorsB) => {
    return COMPONENT_REGISTRY.Spinner({ colorA, sectorsA, colorB, sectorsB });
  },
  drawItemCounter: (itemCount, itemType = 'cupcake', crossedOutCount = 0, itemsPerRow = 5) => {
    return COMPONENT_REGISTRY.ItemCounter({ count: itemCount, itemType, crossedOutCount, itemsPerRow });
  },
  drawNumberLine: (min, max, step, pointValue, pointLabel = '', markedPoints = '', jumps = '', interactive = false, color = 'blue') => {
    return COMPONENT_REGISTRY.NumberLine({ min, max, step, pointValue, pointLabel, markedPoints, jumps, interactive, color });
  },
  drawHundredChart: (missing = '', highlighted = '', color = 'blue') => {
    return COMPONENT_REGISTRY.HundredChart({ missing, highlighted, color });
  },
  drawRekenrek: (rows = 2, values = '0,0') => {
    return COMPONENT_REGISTRY.Rekenrek({ rows, values });
  },
  drawNumberBond: (whole, left, right, missing = '') => {
    return COMPONENT_REGISTRY.NumberBond({ whole, left, right, missing });
  },
  drawTallyChart: (categories, counts, showFrequency = true) => {
    return COMPONENT_REGISTRY.TallyChart({ categories, counts, showFrequency });
  },
  drawFractionBar: (denominator, numerator, color = 'blue', interactive = false) => {
    return COMPONENT_REGISTRY.FractionBar({ denominator, numerator, color, interactive });
  },
  drawFractionCircle: (denominator, numerator, color = 'red', interactive = false) => {
    return COMPONENT_REGISTRY.FractionCircle({ denominator, numerator, color, interactive });
  },
  drawFractionGrid: (rows, cols, shaded, color = 'green', interactive = false) => {
    return COMPONENT_REGISTRY.FractionGrid({ rows, cols, shaded, color, interactive });
  },

  drawDecimalGrid: (value, color = 'orange') => {
    return COMPONENT_REGISTRY.DecimalGrid({ value, color });
  },
  drawDecimalLine: (min, max, step, markedPoint, pointLabel = '', color = 'blue') => {
    return COMPONENT_REGISTRY.DecimalLine({ min, max, step, markedPoint, pointLabel, color });
  },
  drawShapeCanvas: (shape, label = '', color = 'purple') => {
    return COMPONENT_REGISTRY.ShapeCanvas({ shape, label, color });
  },
  drawCoordinatePlane: (xMin, xMax, yMin, yMax, points = '', polygon = '') => {
    return COMPONENT_REGISTRY.CoordinatePlane({ xMin, xMax, yMin, yMax, points, polygon });
  },
  drawProtractor: (angle) => {
    return COMPONENT_REGISTRY.Protractor({ angle });
  },
  drawRuler: (length, objectLength, objectType = 'pencil') => {
    return COMPONENT_REGISTRY.Ruler({ length, objectLength, objectType });
  },
  drawGeoboard: (gridSize, polygon = '', color = 'red') => {
    return COMPONENT_REGISTRY.Geoboard({ gridSize, polygon, color });
  },
  drawBarGraph: (title, categories, values, yMax = undefined, color = 'blue') => {
    return COMPONENT_REGISTRY.BarGraph({ title, categories, values, yMax, color });
  },
  drawPictograph: (categories, values, emoji = '🍎', key = 1, showCount = true) => {
    return COMPONENT_REGISTRY.Pictograph({ categories, values, emoji, key, showCount });
  },
  drawFrequencyTable: (title, categories, values, headers = 'Category,Frequency') => {
    return COMPONENT_REGISTRY.FrequencyTable({ title, categories, values, headers });
  },
  drawAnalogClock: (hour, minute, interactive = false) => {
    return COMPONENT_REGISTRY.AnalogClock({ hour, minute, interactive });
  },
  drawCalendar: (month, daysInMonth, startDay, highlightDays = '') => {
    return COMPONENT_REGISTRY.Calendar({ month, daysInMonth, startDay, highlightDays });
  },
  drawThermometer: (min, max, value, unit = 'C') => {
    return COMPONENT_REGISTRY.Thermometer({ min, max, value, unit });
  },
  drawBalanceScale: (leftWeight, rightWeight, leftLabel = 'Box A', rightLabel = 'Box B', showStacked = false) => {
    return COMPONENT_REGISTRY.BalanceScale({ leftWeight, rightWeight, leftLabel, rightLabel, showStacked });
  },
  drawMeasuringJug: (capacity, step, value) => {
    return COMPONENT_REGISTRY.MeasuringJug({ capacity, step, value });
  },
  drawMoneyDisplay: (amount) => {
    return COMPONENT_REGISTRY.MoneyDisplay({ amount });
  },
  drawPriceTagCompare: (itemA, priceA, itemB, priceB) => {
    return COMPONENT_REGISTRY.PriceTagCompare({ itemA, priceA, itemB, priceB });
  }
};


export function resolveExpression(expr, context) {
  if (typeof expr === 'number') return expr;
  if (!expr) return 0;

  // Interpolate list-like visual props (e.g. coordinates "h,k" or point lists) containing variables
  if (typeof expr === 'string') {
    let interpolated = expr.trim();
    let hasReplacements = false;
    const sortedKeys = Object.keys(context || {}).sort((a, b) => b.length - a.length);

    sortedKeys.forEach(key => {
      const regex = new RegExp(`\\b${key}\\b`, 'g');
      if (regex.test(interpolated)) {
        interpolated = interpolated.replace(regex, context[key]);
        hasReplacements = true;
      }
    });

    if (hasReplacements) {
      const num = Number(interpolated);
      if (Number.isFinite(num)) {
        return num;
      }
      const isJSExpr = /[=\!<>\?:]/.test(interpolated) || interpolated.includes("'") || interpolated.includes('"');
      if (/[,;]/.test(interpolated) && !interpolated.includes('draw') && !interpolated.startsWith('[') && !interpolated.startsWith('{') && !isJSExpr) {
        return interpolated;
      }
    }
  }

  let cleanedExpr = String(expr);
  if (cleanedExpr.includes('[') && cleanedExpr.includes(']')) {
    // Replace standalone [varName] placeholders with context values, leaving array literals like ["a", "b"][index] intact
    cleanedExpr = cleanedExpr.replace(/(?<![A-Za-z0-9_\]\)"'])\[([A-Za-z_][A-Za-z0-9_]*(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\]/g, (match, name) => {
      const trimmed = name.trim();
      if (context && context[trimmed] !== undefined) {
        const val = context[trimmed];
        return typeof val === 'string' ? JSON.stringify(val) : val;
      }
      return match;
    });
  }
  expr = cleanedExpr;

  const hasOperators = /[\+\-\*\/\%\(\)]/.test(String(expr));
  const hasComparisons = /[=\!<>\?:]/.test(String(expr));

  // Try custom safe parser first only for plain numeric math. Array/string
  // formulas can contain "/" or parentheses in text and must go to JS eval.
  const isPlainMathExpression = /^[\d\s+\-*/%().]+$/.test(String(expr));
  if (hasOperators && !hasComparisons && !String(expr).includes('draw') && isPlainMathExpression) {
    // Replace variables by their value from context
    let evaluated = String(expr).replace(/[a-zA-Z_]+/g, (token) => {
      if (context[token] !== undefined) {
        return context[token];
      }
      return token;
    });

    try {
      const parsedVal = evaluateSimpleExpression(evaluated);
      if (parsedVal !== undefined && !isNaN(parsedVal)) {
        return parsedVal;
      }
    } catch (e) {
      // Ignore and fallback
    }
  }

  try {
    const varNames = [...Object.keys(context || {}), ...Object.keys(drawingHelpers)];
    const varValues = [...Object.values(context || {}), ...Object.values(drawingHelpers)];
    // Evaluate in context scope to support strings and conditionals correctly
    return new Function(...varNames, `"use strict"; return (${expr})`)(...varValues);
  } catch (err) {
    // Fallback if compilation fails
    try {
      let evaluated = String(expr).replace(/[a-zA-Z_]+/g, (token) => {
        if (context[token] !== undefined) {
          return context[token];
        }
        return token;
      });
      return Function(`"use strict"; return (${evaluated})`)();
    } catch (e) {
      return expr;
    }
  }
}

export { evaluateSimpleExpression };
