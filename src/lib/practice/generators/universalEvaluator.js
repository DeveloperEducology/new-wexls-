// Gateway wrapper for the refactored modular Universal Template Evaluator pipeline
import { seededRandom, evaluateTemplate } from './universal/evaluator.js';
import { resolveExpression } from './universal/expressionParser.js';
import { interpolateString, resolveLabelOrExpression, getCleanNameFromUrl, parseLabeledEntry } from './universal/interpolator.js';
import { renderTenFrame } from './universal/components/TenFrame.js';
import { renderJarOfMarbles } from './universal/components/JarOfMarbles.js';
import { renderSpinner } from './universal/components/Spinner.js';
import { renderItemCounter } from './universal/components/ItemCounter.js';
import { drawVisualChoicePanel } from './universal/components/VisualChoice.js';

// Legacy positional wrappers for backward compatibility
export function drawTenFrame(filledCount, crossedOutCount = 0, color = 'red') {
  return renderTenFrame({ filledCount, crossedOutCount, color });
}

export function drawJarOfMarbles(colorA, countA, colorB, countB, seed) {
  return renderJarOfMarbles({ colorA, countA, colorB, countB }, seededRandom(seed));
}

export function drawSpinner(colorA, sectorsA, colorB, sectorsB) {
  return renderSpinner({ colorA, sectorsA, colorB, sectorsB });
}

export function drawItemCounter(itemCount, itemType = 'cupcake') {
  return renderItemCounter({ count: itemCount, itemType });
}

export {
  seededRandom,
  evaluateTemplate,
  resolveExpression,
  interpolateString,
  resolveLabelOrExpression,
  getCleanNameFromUrl,
  parseLabeledEntry,
  drawVisualChoicePanel
};
