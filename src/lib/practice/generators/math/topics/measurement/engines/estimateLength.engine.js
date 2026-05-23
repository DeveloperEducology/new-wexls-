/**
 * Length Estimation Engine (Realistic Options)
 */

import { COMMON_OBJECTS } from '../shared/unitSystems.js';

export function generateEstimateLengthQuestion(rng, config = {}) {
  const isMetric = config.system === 'metric' || rng.next() > 0.5;
  const sysLabel = isMetric ? 'metric' : 'customary';

  // Pick a random object from our list
  const obj = rng.pick(COMMON_OBJECTS.length);
  const correctObj = obj.averageSize[sysLabel];

  // Generate a fake absurd option (e.g. 10x larger or 10x smaller)
  const isTooBig = rng.next() > 0.5;
  const multiplier = isTooBig ? 10 : 0.1;
  const fakeVal = Math.round(correctObj.value * multiplier * 10) / 10;
  
  const correctText = `${correctObj.value} ${correctObj.unit}`;
  const fakeText = `${fakeVal} ${correctObj.unit}`;
  const options = rng.shuffle([correctText, fakeText]);

  return {
    type: 'mcq',
    level: 'easy',
    questionText: `What is a realistic estimate for the length of a **${obj.name}**?`,
    options: options,
    correctAnswerIndex: options.indexOf(correctText),
    explanation: {
      sections: [
        { content: `Think about the real-world size of a **${obj.name}**.` },
        { content: `• **${correctText}** is a sensible, realistic measurement.` },
        { content: `• **${fakeText}** is either far too large or far too small.` },
        { content: `Therefore, the best estimate is **${correctText}**.` }
      ]
    },
    metadata: { task: 'estimate_length', objectName: obj.name, correctText, fakeText }
  };
}
