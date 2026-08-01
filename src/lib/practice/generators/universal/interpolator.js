import { resolveExpression } from './expressionParser.js';

function getFromContext(key, context) {
  if (!key || !context) return undefined;
  if (context[key] !== undefined) return context[key];
  const clean = key.replace(/^_+/, '');
  if (context[clean] !== undefined) return context[clean];
  if (context[`_${clean}`] !== undefined) return context[`_${clean}`];
  return undefined;
}

function resolveVarWithSuffix(trimmed, context) {
  if (!trimmed || !context) return undefined;
  
  // 1. Direct lookup
  let val = getFromContext(trimmed, context);
  if (val !== undefined) return { val, suffix: '' };

  // 2. Check if trimmed starts with any key in context followed by space
  for (const key of Object.keys(context)) {
    if (key.startsWith('_')) continue;
    if (trimmed === key) {
      return { val: context[key], suffix: '' };
    } else if (trimmed.startsWith(key + ' ')) {
      const suffix = trimmed.slice(key.length + 1).trim();
      return { val: context[key], suffix };
    }
  }

  return undefined;
}

function tryEvalMath(expr) {
  if (expr === undefined || expr === null) return expr;
  let s = String(expr).trim();
  if (s.startsWith('=')) s = s.slice(1).trim();
  if (!s) return expr;
  if (!isNaN(s) && !isNaN(parseFloat(s))) return s;

  // Replace power symbol ^ with ** for JS exponentiation
  const sanitized = s.replace(/\^/g, '**');

  if (/^[0-9\.\s\+\-\*\/\%\(\)\*\*\,\=]+$/.test(sanitized)) {
    try {
      const res = new Function(`return (${sanitized})`)();
      if (typeof res === 'number' && isFinite(res)) {
        return Number.isInteger(res) ? String(res) : String(Number(res.toFixed(2)));
      }
    } catch (e) {}
  }
  return expr;
}

// String interpolator to replace [var_name] placeholders
export function interpolateString(str, context) {
  if (typeof str !== 'string') return str;

  // Clean JSON array wrappers or [0] indexing suffixes if present
  let cleanStr = str.trim();
  if (cleanStr.endsWith('][0]')) {
    cleanStr = cleanStr.slice(0, -4).trim();
  }
  if (cleanStr.startsWith('[') && cleanStr.endsWith(']')) {
    try {
      const parsed = JSON.parse(cleanStr);
      if (Array.isArray(parsed)) {
        cleanStr = parsed.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n\n');
      }
    } catch (e) {}
  }

  // Replace mustache placeholders {{var}}
  cleanStr = cleanStr.replace(/\{{1,2}([A-Za-z0-9_]+)\}{1,2}/g, (_, name) => {
    const trimmed = name.trim();
    const val = getFromContext(trimmed, context);
    if (val !== undefined) return tryEvalMath(val);
    try { return resolveExpression(trimmed, context); } catch (e) { return `{${trimmed}}`; }
  });

  // Handle single bracket placeholders [var]
  const blankTokens = [];
  const protectedStr = cleanStr.replace(/\[\[[^\]]+\]\]/g, (token) => {
    const key = `__INLINE_BLANK_${blankTokens.length}__`;
    blankTokens.push(token);
    return key;
  });

  const restoreBlankTokens = (value) => String(value).replace(/__INLINE_BLANK_(\d+)__/g, (_, index) => blankTokens[Number(index)] || '');

  const resolved = protectedStr.replace(/\[(.*?)\]/g, (match, name) => {
    if (match.startsWith('[[') || name.startsWith('[') || name.startsWith('speak:')) return match;
    const trimmed = name.trim();
    
    // First try resolveVarWithSuffix (handles [Result cm³] -> Result value + cm³)
    const resolvedVar = resolveVarWithSuffix(trimmed, context);
    if (resolvedVar && resolvedVar.val !== undefined) {
      let rawVal = resolvedVar.val;
      let evaluatedVal = '';
      if (typeof rawVal === 'string') {
        try {
          evaluatedVal = resolveExpression(rawVal, context);
        } catch (e) {
          evaluatedVal = tryEvalMath(interpolateString(rawVal, context));
        }
      } else {
        evaluatedVal = String(rawVal);
      }
      evaluatedVal = tryEvalMath(evaluatedVal);
      return resolvedVar.suffix ? `${evaluatedVal} ${resolvedVar.suffix}` : evaluatedVal;
    }

    try {
      const exprRes = resolveExpression(trimmed, context);
      if (exprRes !== undefined && exprRes !== trimmed && exprRes !== match) {
        return tryEvalMath(exprRes);
      }
    } catch {
      // fallback
    }

    return match;
  });

  const finalStr = restoreBlankTokens(resolved);
  return tryEvalMath(finalStr);
}

// Resolve labels that might be expressions or variables with/without brackets
export function resolveLabelOrExpression(label, context) {
  if (typeof label !== 'string') return label;

  let str = label.trim();

  // Strip JSON array indexing suffixes if present
  if (str.endsWith('][0]')) {
    str = str.slice(0, -4).trim();
  }
  if (str.startsWith('[') && str.endsWith(']')) {
    try {
      const parsed = JSON.parse(str);
      if (Array.isArray(parsed)) {
        str = parsed.map(item => typeof item === 'string' ? item : JSON.stringify(item)).join('\n\n');
      }
    } catch (e) {}
  }

  // Check if str starts with a context key (e.g. "Result cm³" or "Result")
  if (context && typeof context === 'object') {
    for (const key of Object.keys(context)) {
      if (key.startsWith('_')) continue;
      if (str === key) {
        str = `[${key}]`;
        break;
      } else if (str.startsWith(key + ' ')) {
        const suffix = str.slice(key.length + 1).trim();
        str = `[${key}] ${suffix}`;
        break;
      }
    }
  }

  let interpolated = interpolateString(str, context);

  if (typeof interpolated === 'string') {
    if (interpolated.includes('(') && interpolated.includes(')')) {
      try {
        const result = resolveExpression(interpolated, context);
        if (result !== undefined && result !== interpolated && result !== null) {
          return result;
        }
      } catch (e) {}
    }
    interpolated = tryEvalMath(interpolated);
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
