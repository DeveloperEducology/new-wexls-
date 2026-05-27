/**
 * Liquid Volume Reading Engine (Graduated Cylinders & Cups)
 */

import { getSvgTool } from '@/lib/practice/svgTools';

export function generateLiquidVolumeQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'read_volume';
  
  const isCup = forcedTask.includes('cup') || rng.next() > 0.5;
  const unit = isCup ? 'cups' : 'ml';
  
  const capacity = isCup ? 8 : 1000;
  const step = isCup ? 1 : 100;
  const level = rng.int(1, capacity / step) * step;

  const svg = getSvgTool(isCup ? 'measuring_cup' : 'graduated_cylinder', {
    capacity,
    level,
    unit,
    showLabel: false
  }).svg;

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `How much liquid is in the container?`,
    parts: [
      { type: 'svg', content: svg },
      { type: 'text', content: `[blank:ans] ${unit}` }
    ],
    correctAnswer: level.toString(),
    explanation: {
      sections: [
        { content: `Look at the surface level of the liquid (the meniscus).` },
        { content: `Locate the marking on the container scale that lines up with the top of the liquid.` },
        { content: `The liquid reaches the **${level}** line.` },
        { content: `Therefore, the volume is **${level} ${unit}**.` }
      ]
    },
    metadata: { task: forcedTask, capacity, level, unit }
  };
}
