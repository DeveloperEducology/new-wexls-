/**
 * Unit Choice Selection Engine
 */

import { COMMON_OBJECTS, UNITS } from '../shared/unitSystems.js';

export function generateChooseUnitQuestion(rng, config = {}) {
  const system = config.system || (rng.next() > 0.5 ? 'customary' : 'metric');
  const attribute = config.attribute || rng.pick(['length', 'weight', 'capacity']);

  let objList = [];
  if (attribute === 'length') objList = COMMON_OBJECTS.length;
  else if (attribute === 'weight') objList = COMMON_OBJECTS.weight;
  else if (attribute === 'capacity') objList = COMMON_OBJECTS.capacity;

  const obj = rng.pick(objList);
  const correctUnitId = obj.averageSize[system === 'metric' ? 'metric' : 'customary'].unit;
  const correctUnit = UNITS[correctUnitId];

  // Find a distractor unit of the SAME attribute but different scale (e.g. inches vs miles, or grams vs kilograms)
  const allUnitsForAttr = Object.values(UNITS).filter(u => u.attribute === attribute && u.system === system);
  const distractorUnit = allUnitsForAttr.find(u => u.id !== correctUnitId) || allUnitsForAttr[0];

  const correctText = correctUnit.plural;
  const distractorText = distractorUnit.plural;
  const options = rng.shuffle([correctText, distractorText]);

  return {
    type: 'mcq',
    level: 'easy',
    questionText: `Which is the best unit to measure the **${attribute}** of a **${obj.name}**?`,
    options: options,
    correctAnswerIndex: options.indexOf(correctText),
    explanation: {
      sections: [
        { content: `We want to measure the **${attribute}** of a **${obj.name}**.` },
        { content: `• **${correctText}** is suitable for items of this size.` },
        { content: `• **${distractorText}** is either too small or too large to be practical.` },
        { content: `Therefore, we should use **${correctText}**.` }
      ]
    },
    metadata: { task: 'choose_unit', attribute, objectName: obj.name, correctText, distractorText }
  };
}
