/**
 * Thermometer Reading Engine
 */

import { renderThermometer } from '../shared/svgMeasurementLibrary.js';

export function generateThermometerQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'read_thermometer';
  const scale = config.scale || (rng.next() > 0.5 ? 'F' : 'C');

  let minTemp = 0;
  let maxTemp = 100;
  let tickInterval = 10;
  let temperature = 0;

  const isNegative = difficulty === 'hard' || forcedTask.includes('neg') || rng.next() > 0.7;

  if (scale === 'F') {
    minTemp = isNegative ? -20 : 0;
    maxTemp = isNegative ? 60 : 100;
    // Spacing of 2 degrees per sub-tick
    tickInterval = 20; // major lines: 0, 20, 40, 60, etc.
    const stepsCount = (maxTemp - minTemp) / 2; // 2 degree steps
    const stepIdx = rng.int(0, stepsCount);
    temperature = minTemp + stepIdx * 2;
  } else {
    minTemp = isNegative ? -10 : 0;
    maxTemp = isNegative ? 40 : 50;
    // Spacing of 1 degree per sub-tick
    tickInterval = 10;
    temperature = rng.int(minTemp, maxTemp);
  }

  const svg = renderThermometer({
    temperature,
    scaleSymbol: scale,
    minTemp,
    maxTemp,
    tickInterval
  });

  const subTickVal = scale === 'F' ? 4 : 2; // tick resolution: 20/5 = 4 degrees for F, 10/5 = 2 degrees for C
  const majorBase = Math.floor(temperature / tickInterval) * tickInterval;
  const subTicksAbove = Math.round((temperature - majorBase) / (tickInterval / 5));

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `What temperature is shown on the thermometer in degrees ${scale === 'F' ? 'Fahrenheit' : 'Celsius'}?`,
    parts: [
      { type: 'svg', content: svg },
      { type: 'text', content: `[blank:ans] °${scale}` }
    ],
    correctAnswer: temperature.toString(),
    explanation: {
      sections: [
        { content: `**Step 1: Identify the closest major numbered line.** The red liquid rises above the **${majorBase}°** mark.` },
        { content: `**Step 2: Determine the value of each small tick mark.** The space between major labels (${tickInterval} degrees) has 5 subdivisions, so each small tick is worth **${tickInterval / 5}°**.` },
        { content: `**Step 3: Count the ticks above the major label.** The liquid is **${subTicksAbove}** small ticks above **${majorBase}°**.` },
        { content: `**Step 4: Calculate the total.** ${majorBase} + (${subTicksAbove} × ${tickInterval / 5}) = **${temperature}°**.` }
      ]
    },
    remediation: `Always verify the increment value of each small tick line between the numbers. On many thermometers, each small mark is worth 2 degrees.`,
    metadata: { task: forcedTask, scale, temperature }
  };
}
