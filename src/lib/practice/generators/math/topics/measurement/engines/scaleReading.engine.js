/**
 * Dial Scale and Weight Reading Engine
 */

import { renderSpringScale } from '../shared/svgMeasurementLibrary.js';

export function generateScaleReadingQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'read_scale';

  const unit = rng.pick(['lbs', 'kg']);
  const maxWeight = 10;
  
  // Decide the weight
  // Easy: whole numbers, Medium: halves (.5), Hard: quarters (.25)
  let weight = 5;
  if (difficulty === 'easy') {
    weight = rng.int(1, 9);
  } else if (difficulty === 'medium') {
    weight = rng.int(1, 9) + (rng.next() > 0.5 ? 0.5 : 0);
  } else {
    weight = rng.int(1, 9) + rng.pick([0, 0.25, 0.5, 0.75]);
  }

  const svg = renderSpringScale({
    weight,
    unit,
    maxWeight
  });

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `What is the weight shown on the dial scale?`,
    parts: [
      { type: 'svg', content: svg },
      { type: 'text', content: `[blank:ans] ${unit}` }
    ],
    correctAnswer: weight.toString(),
    explanation: {
      sections: [
        { content: `Look at the red pointer needle on the scale dial.` },
        { content: `Locate the marking the pointer is pointing to between the numbers.` },
        { content: `• Major tick marks represent whole numbers (1, 2, 3, etc.).` },
        { content: `• Subdivisions represent fractions of a unit (halves or quarters).` },
        { content: `The pointer matches the **${weight}** mark.` },
        { content: `Therefore, the weight is **${weight} ${unit}**.` }
      ]
    },
    metadata: { task: forcedTask, weight, unit }
  };
}
