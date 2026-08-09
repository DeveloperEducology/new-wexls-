/**
 * Helper to sanitize LaTeX math cell strings & question prompts before rendering.
 * Extracts English words outside math mode ($...$) so spaces are preserved and KaTeX renders cleanly.
 */
export function sanitizeLatexMathText(inputStr) {
  if (typeof inputStr !== 'string' || !inputStr.trim()) return inputStr;
  let str = inputStr.trim();

  // 1. Fix common \frac syntax typos: \fracx -> \frac{x}, \fracy -> \frac{y}
  str = str.replace(/\\frac([a-zA-Z0-9])\{/g, '\\frac{$1}{');
  str = str.replace(/\\frac([a-zA-Z0-9])([a-zA-Z0-9])/g, '\\frac{$1}{$2}');
  str = str.replace(/\\frac([a-zA-Z0-9])\\\b/g, '\\frac{$1}\\');

  // 2. Fix \sqrt typos: \sqrt2 -> \sqrt{2}, \sqrtx -> \sqrt{x}, \sqrty -> \sqrt{y}
  str = str.replace(/\\sqrty\b/g, '\\sqrt{y}');
  str = str.replace(/\\sqrtx\b/g, '\\sqrt{x}');
  str = str.replace(/\\sqrt([a-zA-Z0-9])\b/g, '\\sqrt{$1}');

  // 3. Balance unclosed braces
  const openBraces = (str.match(/\{/g) || []).length;
  const closeBraces = (str.match(/\}/g) || []).length;
  if (openBraces > closeBraces) {
    str += '}'.repeat(openBraces - closeBraces);
  }

  // 4. Normalize escaped backslashes e.g. \\sqrt -> \sqrt
  str = str.replace(/\\\\([a-zA-Z]+)/g, '\\$1');

  // 5. Smart Math & English Text Delimiter Separation
  if (str.includes('$')) {
    // Extract English phrases mistakenly wrapped inside $...$ so spaces are preserved
    str = str.replace(/\$([^\$]+)\$/g, (match, inner) => {
      let cleanInner = inner.replace(/\b(Given|find the value of|find|the value of|where|and|or|for|if|then|when|such that)\b/gi, (m) => `$$ ${m} $$`);
      return cleanInner;
    });
    str = str.replace(/\$\$\s*\$\$/g, '').replace(/\$\$/g, '$');
  } else if (str.includes('\\') || /[a-zA-Z0-9_]+\s*=\s*/.test(str)) {
    // Wrap standalone math tokens or entire math cell in $...$
    if (/^(\\?[a-zA-Z0-9\s\{\}\+\-\*\/\=\^\_\(\)\,\.\:\;\<\>\!]+)$/.test(str) && !/\b(Given|find|where|the|of)\b/i.test(str)) {
      str = `$${str.trim()}$`;
    } else {
      // Wrap math expressions like x = 2 + \sqrt{3} or \frac{x}{...}
      str = str.replace(/([a-zA-Z0-9_]+\s*=\s*[^,\s]+)|(\\frac\{[^\}]+\}\{[^\}]+\})|(\\sqrt\{[^\}]+\})/g, (match) => {
        return `$${match.trim()}$`;
      });
    }
  }

  return str.replace(/\$\$/g, '$').replace(/\$\s+\$/g, ' ').trim();
}
