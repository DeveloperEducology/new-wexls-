/**
 * Precision and Error Engine (GPE, Percent Error, Min/Max Tolerances)
 */

export function generatePrecisionErrorQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'gpe';

  // Tasks: gpe, percent_error, min_max_area, percent_error_area
  let task = forcedTask;
  if (forcedTask === 'precision_error') {
    task = rng.pick(['gpe', 'percent_error', 'min_max_area']);
  }

  if (task === 'gpe') {
    // Greatest Possible Error
    // Scenarios:
    // 1. Measured to nearest millimeter (0.1 cm) => GPE is 0.05 cm
    // 2. Measured to nearest gram => GPE is 0.5 g
    // 3. Measured to nearest tenth of an inch => GPE is 0.05 in
    const scenarios = [
      { unit: 'centimeters', val: '8.4', prec: 0.1, ans: '0.05' },
      { unit: 'inches', val: '5.2', prec: 0.1, ans: '0.05' },
      { unit: 'grams', val: '24', prec: 1, ans: '0.5' },
      { unit: 'meters', val: '12.85', prec: 0.01, ans: '0.005' },
      { unit: 'kilograms', val: '5.0', prec: 0.1, ans: '0.05' }
    ];

    const picked = rng.pick(scenarios);

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `A length is measured as **${picked.val} ${picked.unit}** to the nearest **${picked.prec} ${UNITS_SINGULAR[picked.unit] || picked.unit}**. What is the **greatest possible error** of this measurement?`,
      parts: [{ type: 'text', content: `[blank:ans] ${picked.unit}` }],
      correctAnswer: picked.ans,
      explanation: {
        sections: [
          { content: `The **greatest possible error (GPE)** is always **half of the precision unit** used for the measurement.` },
          { content: `• The precision is to the nearest **${picked.prec} ${picked.unit}**.` },
          { content: `• GPE = $\\frac{1}{2}$ × ${picked.prec} = **${picked.ans} ${picked.unit}**.` }
        ]
      },
      metadata: { task: 'gpe', val: picked.val, ans: picked.ans }
    };

  } else if (task === 'percent_error') {
    // Percent Error
    const actual = rng.int(10, 50) * 2; // e.g. 40
    const dev = rng.pick([-2, -1, 1, 2]);
    const experimental = actual + dev;
    
    const err = Math.abs(experimental - actual);
    const pctErr = (err / actual) * 100;
    const ans = parseFloat(pctErr.toFixed(2)).toString();

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `A student measures the length of a desk as **${experimental} cm**, but its actual length is **${actual} cm**. What is the **percent error** of the measurement? (Round to 2 decimal places if needed, do not write the % sign)`,
      parts: [{ type: 'text', content: `[blank:ans]%` }],
      correctAnswer: ans,
      explanation: {
        sections: [
          { content: `Use the percent error formula: **$\\text{Percent Error} = \\frac{|\\text{Experimental} - \\text{Actual}|}{\\text{Actual}} × 100\\%$**` },
          { content: `1. Find the absolute difference: **|${experimental} - ${actual}| = ${err}**.` },
          { content: `2. Divide by the actual value: **$\\frac{${err}}{${actual}} = ${err / actual}$**.` },
          { content: `3. Multiply by 100: **${err / actual} × 100 = ${ans}\\%$**.` }
        ]
      },
      metadata: { task: 'percent_error', experimental, actual, ans }
    };

  } else {
    // Min/Max Area
    const w = rng.int(4, 7);
    const l = rng.int(8, 12);
    // Nearest whole unit => tolerance is ±0.5
    const isMin = rng.next() > 0.5;

    const wMin = w - 0.5;
    const wMax = w + 0.5;
    const lMin = l - 0.5;
    const lMax = l + 0.5;

    const ansVal = isMin ? wMin * lMin : wMax * lMax;
    const ans = parseFloat(ansVal.toFixed(2)).toString();

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `The sides of a rectangle are measured to the nearest centimeter as **${w} cm** and **${l} cm**. What is the **${isMin ? 'minimum' : 'maximum'} possible area** of the rectangle? (Write your answer as a decimal)`,
      parts: [{ type: 'text', content: `[blank:ans] square cm` }],
      correctAnswer: ans,
      explanation: {
        sections: [
          { content: `Since the measurements are taken to the nearest centimeter, the actual values could be off by up to **0.5 cm** (the greatest possible error).` },
          { content: `• Range for width: ${w} ± 0.5 cm → **[${wMin}, ${wMax}]**.` },
          { content: `• Range for length: ${l} ± 0.5 cm → **[${lMin}, ${lMax}]**.` },
          { content: isMin
            ? `To find the **minimum area**, multiply the smallest bounds: **${wMin} × ${lMin} = ${ans} \\text{ cm}^2$**.`
            : `To find the **maximum area**, multiply the largest bounds: **${wMax} × ${lMax} = ${ans} \\text{ cm}^2$**.`
          }
        ]
      },
      metadata: { task: 'min_max_area', w, l, isMin, ans }
    };
  }
}

const UNITS_SINGULAR = {
  centimeters: 'centimeter',
  inches: 'inch',
  grams: 'gram',
  meters: 'meter',
  kilograms: 'kilogram'
};
