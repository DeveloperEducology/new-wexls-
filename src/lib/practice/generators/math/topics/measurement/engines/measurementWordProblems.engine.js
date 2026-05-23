/**
 * Measurement Word Problems Engine
 */

import { convertCustomary, convertMetric } from '../shared/conversions.js';

export function generateMeasurementWordProblemsQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  
  const names = ['Amy', 'James', 'Lucas', 'Emily', 'Chloe', 'Zack', 'Sophia'];
  const name = rng.pick(names);

  const wordProblems = [
    {
      // Subtraction customary length
      id: 'wp_ribbon_cut',
      generator: () => {
        const initialFt = rng.int(2, 5);
        const cutIn = rng.int(3, 11);
        const initialIn = initialFt * 12;
        const remainingIn = initialIn - cutIn;

        return {
          questionText: `**${name}** has a piece of ribbon that is **${initialFt} feet** long. If she cuts off **${cutIn} inches** of ribbon, how many inches of ribbon does she have left?`,
          parts: [{ type: 'text', content: `[blank:ans] inches` }],
          correctAnswer: remainingIn.toString(),
          explanation: {
            sections: [
              { content: `**Step 1: Convert feet to inches.** We know that 1 foot = 12 inches.` },
              { content: `${initialFt} feet = ${initialFt} × 12 = **${initialIn} inches**.` },
              { content: `**Step 2: Subtract the cut portion.**` },
              { content: `${initialIn} inches - ${cutIn} inches = **${remainingIn} inches**.` }
            ]
          }
        };
      }
    },
    {
      // Capacity cups/gallons
      id: 'wp_water_bucket',
      generator: () => {
        const gal = rng.int(2, 6);
        const qt = gal * 4;

        return {
          questionText: `A bucket holds **${gal} gallons** of water. How many **quarts** of water can it hold?`,
          parts: [{ type: 'text', content: `[blank:ans] quarts` }],
          correctAnswer: qt.toString(),
          explanation: {
            sections: [
              { content: `We know that 1 gallon = 4 quarts.` },
              { content: `Multiply the number of gallons by 4 to get quarts:` },
              { content: `**${gal} × 4 = ${qt} quarts**.` }
            ]
          }
        };
      }
    },
    {
      // Mass metric conversion
      id: 'wp_flour_baking',
      generator: () => {
        const kg = rng.int(2, 5);
        const gUsed = rng.int(1, 3) * 500; // e.g. 1000g or 1500g
        const totalG = kg * 1000;
        const leftG = totalG - gUsed;

        return {
          questionText: `**${name}** bought a **${kg} kilogram** bag of flour. If they use **${gUsed} grams** of flour for baking, how many grams of flour are left?`,
          parts: [{ type: 'text', content: `[blank:ans] grams` }],
          correctAnswer: leftG.toString(),
          explanation: {
            sections: [
              { content: `**Step 1: Convert kilograms to grams.** We know that 1 kg = 1,000 g.` },
              { content: `${kg} kg = ${kg} × 1000 = **${totalG} grams**.` },
              { content: `**Step 2: Subtract the used flour.**` },
              { content: `${totalG} g - ${gUsed} g = **${leftG} grams**.` }
            ]
          }
        };
      }
    }
  ];

  const pickedProblem = rng.pick(wordProblems);
  const q = pickedProblem.generator();

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: q.questionText,
    parts: q.parts,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    metadata: { task: 'measurement_wp', problemId: pickedProblem.id }
  };
}
