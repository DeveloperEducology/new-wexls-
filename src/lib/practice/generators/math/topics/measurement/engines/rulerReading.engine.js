/**
 * Ruler Reading Engine (Inches and Centimeters)
 */

import { getSvgTool } from '@/lib/practice/svgTools';
import { formatFraction } from '../shared/utils.js';

export function generateRulerReadingQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'measure_ruler';
  const isMetric = config.system === 'metric' || forcedTask.includes('cm') || rng.next() > 0.5;

  const compareMode = config.compare || forcedTask.includes('compare');
  const offsetMode = difficulty === 'hard' || forcedTask.includes('offset') || rng.next() > 0.7;

  if (compareMode) {
    return generateCompareRulerQuestion(rng, isMetric);
  }

  const objectType = rng.pick(['pencil', 'crayon', 'key']);

  if (isMetric) {
    // Metric Centimeters & Millimeters
    const isDecimal = difficulty === 'hard' || difficulty === 'medium';
    let lengthCm, objectOffset, objectLength;

    if (isDecimal) {
      // Near decimals (tenths / millimeters)
      objectLength = rng.float(3, 10, 1); // e.g. 6.4 cm
      objectOffset = offsetMode ? rng.int(1, 3) : 0;
      lengthCm = 15;
    } else {
      // Whole Centimeters
      objectLength = rng.int(3, 12);
      objectOffset = offsetMode ? rng.int(1, 3) : 0;
      lengthCm = 15;
    }

    const svg = getSvgTool('centimeter_ruler', {
      length: lengthCm,
      objectLength,
      objectOffset,
      objectType,
      showLabel: false
    }).svg;

    const endPoint = objectOffset + objectLength;
    const ans = objectLength.toString();

    let stepList = [];
    if (objectOffset > 0) {
      stepList.push({ content: `**Step 1: Check the starting alignment.** The end of the ${objectType} is at the **${objectOffset} cm** mark (not 0).` });
      stepList.push({ content: `**Step 2: Check the ending point.** The tip of the ${objectType} reaches the **${endPoint} cm** mark.` });
      stepList.push({ content: `**Step 3: Subtract the starting point from the ending point.** ${endPoint} - ${objectOffset} = **${ans} cm**.` });
    } else {
      stepList.push({ content: `**Step 1: Check the starting alignment.** The end of the ${objectType} aligns perfectly with the **0 cm** mark.` });
      stepList.push({ content: `**Step 2: Read the ending point.** The tip of the ${objectType} aligns with the **${ans} cm** mark.` });
      stepList.push({ content: `The length is simply the ending value: **${ans} cm**.` });
    }

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `What is the length of the ${objectType} in centimeters?`,
      parts: [
        { type: 'svg', content: svg },
        { type: 'text', content: '[blank:ans] cm' }
      ],
      correctAnswer: ans,
      explanation: {
        sections: stepList
      },
      remediation: objectOffset > 0 
        ? `Remember: Since the object starts at **${objectOffset} cm**, you must subtract **${objectOffset}** from the end mark (**${endPoint}**) to find the real length.`
        : `Read the number directly where the tip of the object aligns on the ruler.`,
      metadata: { system: 'metric', objectLength, objectOffset, endPoint }
    };

  } else {
    // Customary Inches (whole, half, quarter inches)
    let precision = 1; // 1 = whole, 2 = halves, 4 = quarters
    if (difficulty === 'medium') precision = 2;
    if (difficulty === 'hard') precision = 4;

    const totalIntervals = 6 * precision;
    const offsetTicks = offsetMode ? rng.int(1, 2) * precision : 0;
    const lengthTicks = rng.int(2 * precision, 5 * precision);

    const objectLength = lengthTicks / precision;
    const objectOffset = offsetTicks / precision;
    const lengthInches = 6;

    const svg = getSvgTool('inch_ruler', {
      length: lengthInches,
      objectLength,
      objectOffset,
      objectType,
      showLabel: false
    }).svg;

    const endPoint = objectOffset + objectLength;

    // Format fractional answers
    const wholeLength = Math.floor(objectLength);
    const fractionPart = objectLength - wholeLength;
    const num = Math.round(fractionPart * precision);
    const den = precision;
    const ansString = formatFraction(wholeLength, num, den);

    const wholeOffset = Math.floor(objectOffset);
    const numOff = Math.round((objectOffset - wholeOffset) * precision);
    const ansOffset = formatFraction(wholeOffset, numOff, precision);

    const wholeEnd = Math.floor(endPoint);
    const numEnd = Math.round((endPoint - wholeEnd) * precision);
    const ansEnd = formatFraction(wholeEnd, numEnd, precision);

    let stepList = [];
    if (objectOffset > 0) {
      stepList.push({ content: `**Step 1: Check the start.** The object starts at **${ansOffset} inches** (not 0).` });
      stepList.push({ content: `**Step 2: Check the end.** The object ends at **${ansEnd} inches**.` });
      stepList.push({ content: `**Step 3: Subtract.** ${ansEnd} - ${ansOffset} = **${ansString} inches**.` });
    } else {
      stepList.push({ content: `**Step 1: Check the start.** The object starts at **0**.` });
      stepList.push({ content: `**Step 2: Read the end.** The object ends at the **${ansString}** inch mark.` });
      stepList.push({ content: `The length is **${ansString} inches**.` });
    }

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `What is the length of the ${objectType} in inches? (Write as a whole number, fraction, or mixed number like 2 1/2)`,
      parts: [
        { type: 'svg', content: svg },
        { type: 'text', content: '[blank:ans] inches' }
      ],
      correctAnswer: ansString,
      placeholder: "e.g., 4 1/2",
      explanation: {
        sections: stepList
      },
      remediation: `Find the closest whole inch mark, then count the fractional ticks (halves or quarters) to get the exact value.`,
      metadata: { system: 'customary', objectLength, objectOffset, endPoint, ansString }
    };
  }
}

/**
 * Question generator for comparing lengths on rulers
 */
function generateCompareRulerQuestion(rng, isMetric) {
  const typeA = 'pencil';
  const typeB = 'key';

  const lenA = isMetric ? rng.int(8, 12) : rng.int(4, 5);
  const lenB = isMetric ? rng.int(4, 7) : rng.int(2, 3);
  
  const diff = lenA - lenB;
  const unitLabel = isMetric ? 'cm' : 'inches';

  const svgA = isMetric 
    ? getSvgTool('centimeter_ruler', { length: 15, objectLength: lenA, objectOffset: 0, objectType: typeA, showLabel: false }).svg
    : getSvgTool('inch_ruler', { length: 6, objectLength: lenA, objectOffset: 0, objectType: typeA, showLabel: false }).svg;

  const svgB = isMetric 
    ? getSvgTool('centimeter_ruler', { length: 15, objectLength: lenB, objectOffset: 0, objectType: typeB, showLabel: false }).svg
    : getSvgTool('inch_ruler', { length: 6, objectLength: lenB, objectOffset: 0, objectType: typeB, showLabel: false }).svg;

  return {
    type: 'fillInTheBlank',
    level: 'medium',
    questionText: `How much longer is the ${typeA} than the ${typeB} in ${unitLabel}?`,
    parts: [
      { type: 'text', content: `**Object A: ${typeA}**` },
      { type: 'svg', content: svgA },
      { type: 'text', content: `**Object B: ${typeB}**` },
      { type: 'svg', content: svgB },
      { type: 'text', content: `[blank:ans] ${unitLabel}` }
    ],
    correctAnswer: diff.toString(),
    explanation: {
      sections: [
        { content: `**Step 1: Find the length of the ${typeA}.** It is **${lenA} ${unitLabel}**.` },
        { content: `**Step 2: Find the length of the ${typeB}.** It is **${lenB} ${unitLabel}**.` },
        { content: `**Step 3: Subtract to compare.** ${lenA} - ${lenB} = **${diff} ${unitLabel}**.` },
        { content: `The ${typeA} is **${diff} ${unitLabel}** longer than the ${typeB}.` }
      ]
    },
    metadata: { task: 'compare_lengths', lenA, lenB, diff, isMetric }
  };
}
