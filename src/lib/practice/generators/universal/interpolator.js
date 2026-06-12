import { resolveExpression } from './expressionParser.js';

// String interpolator to replace [var_name] placeholders
export function interpolateString(str, context) {
  if (typeof str !== 'string') return str;
  const withPathTokens = str.replace(/\[([A-Za-z_][A-Za-z0-9_]*(?:\[[^\]]+\])?(?:\.[A-Za-z_][A-Za-z0-9_]*)*)\]/g, (_, name) => {
    const trimmed = name.trim();
    if (context[trimmed] !== undefined) {
      return context[trimmed];
    }
    return resolveExpression(trimmed, context);
  });

  return withPathTokens.replace(/\[(.*?)\]/g, (_, name) => {
    const trimmed = name.trim();
    if (context[trimmed] !== undefined) {
      return context[trimmed];
    }
    // Try resolving as an expression directly if it's like [A - B]
    return resolveExpression(trimmed, context);
  });
}

// Resolve labels that might be expressions or variables with/without brackets
export function resolveLabelOrExpression(label, context) {
  if (typeof label !== 'string') return label;
  
  let interpolated = label;
  if (label.includes('[') && label.includes(']')) {
    interpolated = interpolateString(label, context);
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
