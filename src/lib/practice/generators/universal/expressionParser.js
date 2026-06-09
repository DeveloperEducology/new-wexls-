import { COMPONENT_REGISTRY } from './components/index.js';

// Safe math expression parser (CSP-safe)
function evaluateSimpleExpression(str) {
  let s = String(str).replace(/\s+/g, '');
  
  while (s.includes('(')) {
    s = s.replace(/\(([^()]+)\)/g, (match, subExpr) => {
      return evaluateSimpleExpression(subExpr);
    });
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
  drawItemCounter: (itemCount, itemType = 'cupcake') => {
    return COMPONENT_REGISTRY.ItemCounter({ count: itemCount, itemType });
  }
};

export function resolveExpression(expr, context) {
  if (typeof expr === 'number') return expr;
  if (!expr) return 0;
  
  const hasOperators = /[\+\-\*\/\%\(\)]/.test(String(expr));
  const hasComparisons = /[=\!<>\?:]/.test(String(expr));

  // Try custom safe parser first if it is a simple math formula without conditionals/strings
  if (hasOperators && !hasComparisons && !String(expr).includes('draw')) {
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
