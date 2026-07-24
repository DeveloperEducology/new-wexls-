function normalizeText(value) {
  return String(value ?? '').replace(/\s+/g, '').toLowerCase();
}

function parseMaybeJson(value, fallback = null) {
  if (value == null) return fallback;
  if (typeof value === 'object') return value;
  if (typeof value !== 'string') return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

/**
 * Robust, isolated validation engine for Token Select (pick_from_sentence) questions.
 */
export function validateTokenSelect(question, userAnswer) {
  if (!question || userAnswer === undefined || userAnswer === null) return false;

  const parts = Array.isArray(question.parts) ? question.parts : [];
  let tokenParts = parts.filter(p => p && (['pick_from_sentence', 'select_from_sentence', 'token_select'].includes(p.type) || Array.isArray(p.tokens)));
  if (tokenParts.length === 0 && Array.isArray(question.tokens)) {
    tokenParts = [question];
  }

  let selectedTokenIds = [];
  if (userAnswer && typeof userAnswer === 'object' && !Array.isArray(userAnswer)) {
    Object.values(userAnswer).forEach(val => {
      if (typeof val === 'string') {
        selectedTokenIds.push(...val.split('|').map(s => s.trim()).filter(Boolean));
      } else if (Array.isArray(val)) {
        selectedTokenIds.push(...val.map(s => String(s).trim()).filter(Boolean));
      } else if (val !== undefined && val !== null) {
        selectedTokenIds.push(String(val).trim());
      }
    });
  } else if (typeof userAnswer === 'string') {
    selectedTokenIds = userAnswer.split('|').map(s => s.trim()).filter(Boolean);
  } else if (Array.isArray(userAnswer)) {
    selectedTokenIds = userAnswer.map(s => String(s).trim()).filter(Boolean);
  }

  if (selectedTokenIds.length === 0) return false;

  // 1. Check against part.tokens (isCorrect: true)
  if (tokenParts.length > 0) {
    for (const part of tokenParts) {
      const tokens = Array.isArray(part.tokens) ? part.tokens : [];
      if (tokens.length > 0) {
        const correctTokens = tokens.filter(t => Boolean(t.isCorrect));
        if (correctTokens.length > 0) {
          const correctIds = new Set(correctTokens.map(t => String(t.id || '').trim()).filter(Boolean));
          const correctTexts = new Set(correctTokens.map(t => normalizeText(t.text || t.display || t.content || t.label)).filter(Boolean));

          const userIds = new Set();
          const userTexts = new Set();

          selectedTokenIds.forEach(sel => {
            userIds.add(sel);
            const matchingTok = tokens.find(t => String(t.id || '').trim() === sel || normalizeText(t.text || t.display || t.content || t.label) === normalizeText(sel));
            if (matchingTok) {
              if (matchingTok.id) userIds.add(String(matchingTok.id).trim());
              const txt = matchingTok.text || matchingTok.display || matchingTok.content || matchingTok.label;
              if (txt) userTexts.add(normalizeText(txt));
            } else {
              userTexts.add(normalizeText(sel));
            }
          });

          let idMatch = false;
          if (correctIds.size > 0 && correctIds.size === userIds.size) {
            idMatch = [...correctIds].every(id => userIds.has(id));
          }

          let textMatch = false;
          if (correctTexts.size > 0 && correctTexts.size === userTexts.size) {
            textMatch = [...correctTexts].every(txt => userTexts.has(txt));
          }

          if (idMatch || textMatch) return true;
        }
      }
    }
  }

  // 2. Check against question.correctAnswer / question.answer / question.correctAnswerText
  const expectedRaw = question.answer ?? question.correctAnswer ?? question.correctAnswerText;
  const expected = parseMaybeJson(expectedRaw, expectedRaw);

  if (expected) {
    let expectedSet = new Set();
    if (typeof expected === 'object' && expected !== null && !Array.isArray(expected)) {
      Object.values(expected).forEach(val => {
        if (typeof val === 'string') {
          val.split(/[|,]/).forEach(v => expectedSet.add(normalizeText(v)));
        } else if (Array.isArray(val)) {
          val.forEach(v => expectedSet.add(normalizeText(v)));
        } else if (v !== undefined && v !== null) {
          expectedSet.add(normalizeText(v));
        }
      });
    } else if (typeof expected === 'string') {
      expected.split(/[|,]/).forEach(v => expectedSet.add(normalizeText(v)));
    } else if (Array.isArray(expected)) {
      expected.forEach(v => expectedSet.add(normalizeText(v)));
    }

    if (expectedSet.size > 0) {
      const userNormSet = new Set(selectedTokenIds.map(normalizeText));
      if (expectedSet.size === userNormSet.size && [...expectedSet].every(item => userNormSet.has(item))) {
        return true;
      }
    }
  }

  return false;
}
