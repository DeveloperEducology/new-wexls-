import { resolveExpression } from './expressionParser.js';

// String interpolator to replace [var_name] placeholders
export function interpolateString(str, context) {
  if (typeof str !== 'string') return str;

  // Handle {{var}} mustache-style placeholders (used by template builder blueprint/solution)
  str = str.replace(/\{\{([A-Za-z0-9_]+)\}\}/g, (_, name) => {
    const trimmed = name.trim();
    if (context[trimmed] !== undefined) return context[trimmed];
    try { return resolveExpression(trimmed, context); } catch (e) { return `{{${trimmed}}}`; }
  });

  // If the string is exactly a single placeholder, return the resolved value directly to preserve types (objects, arrays)
  const exactMatch = str.trim().match(/^\[([A-Za-z0-9_]+)\]$/);
  if (exactMatch) {
    const varName = exactMatch[1];
    if (context[varName] !== undefined) {
      return context[varName];
    }
    try {
      return resolveExpression(varName, context);
    } catch (e) {
      // fallback
    }
  }

  const blankTokens = [];
  const protectedStr = str.replace(/\[\[[^\]]+\]\]/g, (token) => {
    const key = `__INLINE_BLANK_${blankTokens.length}__`;
    blankTokens.push(token);
    return key;
  });

  const restoreBlankTokens = (value) => String(value).replace(/__INLINE_BLANK_(\d+)__/g, (_, index) => blankTokens[Number(index)] || '');

  const withPathTokens = protectedStr.replace(/\[([A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]+\])?(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\]/g, (_, name) => {
    const trimmed = name.trim();
    if (context[trimmed] !== undefined) {
      return context[trimmed];
    }
    return resolveExpression(trimmed, context);
  });

  const resolved = withPathTokens.replace(/\[(.*?)\]/g, (match, name) => {
    if (match.startsWith('[[') || name.startsWith('[') || name.startsWith('speak:')) return match;
    const trimmed = name.trim();
    if (context[trimmed] !== undefined) {
      return context[trimmed];
    }
    // Try resolving as an expression directly if it's like [A - B]
    try {
      return resolveExpression(trimmed, context);
    } catch {
      return match;
    }
  });

  return restoreBlankTokens(resolved);
}


// Resolve labels that might be expressions or variables with/without brackets
export function resolveLabelOrExpression(label, context) {
  if (typeof label !== 'string') return label;
  
  let interpolated = label;
  if ((label.includes('[') && label.includes(']')) || (label.includes('{{') && label.includes('}}'))) {
    interpolated = interpolateString(label, context);
  }

  if (typeof interpolated !== 'string') return interpolated;

  // Parse fraction-like strings so they don't evaluate to decimal floats
  // e.g. "4/7" or "4/(7 * 2)" -> "4/7" or "4/14"
  if (interpolated.includes('/')) {
    const parts = interpolated.split('/');
    if (parts.length === 2) {
      const numPart = parts[0].trim();
      const denPart = parts[1].trim();
      const mathTermRegex = /^[A-Za-z0-9_()+\-*%\s]+$/;
      if (mathTermRegex.test(numPart) && mathTermRegex.test(denPart)) {
        try {
          const numVal = resolveExpression(numPart, context);
          const denVal = resolveExpression(denPart, context);
          if (typeof numVal === 'number' && typeof denVal === 'number' && !isNaN(numVal) && !isNaN(denVal)) {
            return `${numVal}/${denVal}`;
          }
        } catch (e) {
          // ignore and fallback
        }
      }
    }
  }

  // If the string looks like a function call expression (contains parentheses),
  // try evaluating it directly via resolveExpression.
  // e.g. toWords(A) + ' minus ' + toWords(B) → "nine minus five"
  if (interpolated.includes('(') && interpolated.includes(')')) {
    try {
      const result = resolveExpression(interpolated, context);
      if (result !== undefined && result !== interpolated && result !== null) {
        return result;
      }
    } catch (e) {
      // fall through to regex-based evaluation below
    }
  }
  
  const variableNames = Object.keys(context || {});
  const escapedVars = variableNames.map(v => v.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&'));
  const varPattern = escapedVars.length > 0 ? '|' + escapedVars.join('|') : '';
  const exprRegex = new RegExp(`^\\s*(\\d+|\\+|\\-|\\*|\\/|\\%|\\(|\\)|\\s${varPattern})+\\s*$`);
  
  if (exprRegex.test(interpolated)) {
    if (/^\s*\d+(\.\d+)?\s*$/.test(interpolated)) {
      return parseFloat(interpolated);
    }
    const resolved = resolveExpression(interpolated, context);
    if (resolved !== undefined && resolved !== interpolated) {
      return resolved;
    }
  }
  
  return interpolated;
}


export function getCleanNameFromUrl(url) {
  if (!url || typeof url !== 'string') return 'item';
  try {
    let filename = url.substring(url.lastIndexOf('/') + 1)
      .split(/[?#]/)[0]
      .replace(/\.[^/.]+$/, "");
    
    // Strip leading timestamp/id prefix like "1234567890-" or "1234567890_"
    filename = filename.replace(/^\d+[-_]/, '');
    
    filename = filename.replace(/[-_]/g, ' ').trim();
    return filename || 'item';
  } catch (e) {
    return 'item';
  }
}

export function parseLabeledEntry(entry) {
  if (!entry || typeof entry !== 'string') return { label: null, url: entry };
  const sepIdx = entry.indexOf('::');
  if (sepIdx !== -1) {
    const label = entry.slice(0, sepIdx).trim();
    const url = entry.slice(sepIdx + 2).trim();
    return { label: label || null, url };
  }
  return { label: null, url: entry.trim() };
}
