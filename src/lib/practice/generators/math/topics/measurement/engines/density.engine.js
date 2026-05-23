/**
 * Density, Mass, and Volume Engine
 */

export function generateDensityQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'density';

  // Solve for: density, mass, volume
  const solveFor = rng.pick(['density', 'mass', 'volume']);

  // Density = Mass / Volume
  const density = rng.int(2, 8); // e.g. 5 g/cm^3
  const volume = rng.int(3, 10) * 10; // e.g. 50 cm^3
  const mass = density * volume; // e.g. 250 g

  if (solveFor === 'density') {
    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `An object has a mass of **${mass} grams** and a volume of **${volume} cubic centimeters**. What is its density?`,
      parts: [{ type: 'text', content: `[blank:ans] g/cm³` }],
      correctAnswer: density.toString(),
      explanation: {
        sections: [
          { content: `Use the density formula: **$\\text{Density} = \\frac{\\text{Mass}}{\\text{Volume}}$**` },
          { content: `• Mass = **${mass} g**` },
          { content: `• Volume = **${volume} \\text{ cm}^3**` },
          { content: `Calculate: **$\\text{Density} = \\frac{${mass}}{${volume}} = ${density} \\text{ g/cm}^3$**.` }
        ]
      },
      metadata: { task: 'density', solveFor, mass, volume, density }
    };
  } else if (solveFor === 'mass') {
    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `An object has a density of **${density} g/cm³** and a volume of **${volume} cm³**. What is its mass?`,
      parts: [{ type: 'text', content: `[blank:ans] grams` }],
      correctAnswer: mass.toString(),
      explanation: {
        sections: [
          { content: `Rearrange the density formula to solve for mass: **$\\text{Mass} = \\text{Density} × \\text{Volume}$**` },
          { content: `• Density = **${density} \\text{ g/cm}^3**` },
          { content: `• Volume = **${volume} \\text{ cm}^3**` },
          { content: `Calculate: **$\\text{Mass} = ${density} × ${volume} = ${mass} \\text{ grams}$**.` }
        ]
      },
      metadata: { task: 'density', solveFor, mass, volume, density }
    };
  } else {
    // Solve for volume
    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `An object has a density of **${density} g/cm³** and a mass of **${mass} grams**. What is its volume?`,
      parts: [{ type: 'text', content: `[blank:ans] cm³` }],
      correctAnswer: volume.toString(),
      explanation: {
        sections: [
          { content: `Rearrange the density formula to solve for volume: **$\\text{Volume} = \\frac{\\text{Mass}}{\\text{Density}}$**` },
          { content: `• Mass = **${mass} g**` },
          { content: `• Density = **${density} \\text{ g/cm}^3**` },
          { content: `Calculate: **$\\text{Volume} = \\frac{${mass}}{${density}} = ${volume} \\text{ cm}^3$**.` }
        ]
      },
      metadata: { task: 'density', solveFor, mass, volume, density }
    };
  }
}
