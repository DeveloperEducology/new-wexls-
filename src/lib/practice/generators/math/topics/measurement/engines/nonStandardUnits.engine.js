/**
 * Non-standard Measurement Engine (Cubes, Paperclips, Pennies)
 */

import { renderCubeTrain } from '../shared/svgMeasurementLibrary.js';

export function generateNonStandardUnitsQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'easy';
  const forcedTask = config.forcedTask || 'measure_with_cubes';
  
  const unit = rng.pick(['cube', 'paperclip']);
  const orientation = (forcedTask.includes('height') || forcedTask === 'measure_height') ? 'vertical' : 'horizontal';
  
  // Decide the length of the object in terms of units
  const count = rng.int(3, 8);
  // Introduce a slight offset/fraction to verify rounding to nearest unit or exact counting
  const objectLength = count; // Exact whole numbers for basic grades
  const objectType = rng.pick(['pencil', 'crayon', 'key']);

  const svg = renderCubeTrain({
    cubesCount: count,
    orientation,
    objectLength,
    objectType
  });

  const propertyWord = orientation === 'vertical' ? 'tall' : 'long';
  const unitName = unit === 'cube' ? 'cubes' : 'paperclips';

  return {
    type: 'fillInTheBlank',
    level: 'easy',
    questionText: `How many ${unitName} ${propertyWord} is the ${objectType}?`,
    parts: [
      { type: 'svg', content: svg },
      { type: 'text', content: '[blank:ans]' }
    ],
    correctAnswer: count.toString(),
    explanation: {
      sections: [
        { content: `Line up the start of the ${objectType} with the start of the ${unitName} train.` },
        { content: `Count each individual ${unit === 'cube' ? 'block' : 'paperclip'} from left to right (or bottom to top).` },
        { content: `There are exactly **${count}** ${unitName} lined up with the ${objectType}.` },
        { content: `Therefore, the ${objectType} is **${count}** ${unitName} ${propertyWord}.` }
      ]
    },
    remediation: `Make sure to count every unit block from the very start to the very end of the object. Do not leave any gaps.`,
    metadata: { task: forcedTask, unit, count, orientation }
  };
}
