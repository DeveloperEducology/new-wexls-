/**
 * Unit Conversion Engine (Linear, Tables, Rates, Cross-System, Temperature)
 */

import { convertCustomary, convertMetric, convertBetweenSystems, celsiusToFahrenheit, fahrenheitToCelsius } from '../shared/conversions.js';
import { UNITS } from '../shared/unitSystems.js';

export function generateUnitConversionQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'single_conversion';

  if (forcedTask.includes('table') || forcedTask === 'conversion_table') {
    return generateConversionTable(rng, difficulty);
  }

  if (forcedTask.includes('rate') || forcedTask === 'convert_rates') {
    return generateRateConversion(rng, difficulty);
  }

  if (forcedTask.includes('temp') || forcedTask === 'convert_temp') {
    return generateTemperatureConversion(rng, difficulty);
  }

  if (forcedTask.includes('cross') || forcedTask === 'convert_cross_system') {
    return generateCrossSystemConversion(rng, difficulty);
  }

  // Default: Single linear customary/metric conversion
  const isMetric = config.system === 'metric' || rng.next() > 0.5;
  const attribute = rng.pick(['length', 'weight', 'capacity']);

  let fromUnit, toUnit, val;
  
  if (isMetric) {
    // Metric conversions
    const unitsList = Object.values(UNITS).filter(u => u.system === 'metric' && u.attribute === (attribute === 'weight' ? 'mass' : attribute));
    fromUnit = rng.pick(unitsList);
    toUnit = rng.pick(unitsList.filter(u => u.id !== fromUnit.id));

    // Decimals for hard, integers for easy/medium
    val = difficulty === 'hard' ? rng.float(1, 10, 1) : rng.int(1, 15) * rng.pick([1, 10, 100]);
    const converted = convertMetric(val, fromUnit.id, toUnit.id);
    const ans = parseFloat(converted.toFixed(4)).toString();

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Convert **${val} ${fromUnit.plural}** into **${toUnit.plural}**:`,
      parts: [{ type: 'text', content: `[blank:ans] ${toUnit.symbol}` }],
      correctAnswer: ans,
      explanation: {
        sections: [
          { content: `We want to convert **${val} ${fromUnit.name}** to **${toUnit.name}**.` },
          { content: `• 1 ${fromUnit.name} = **${convertMetric(1, fromUnit.id, toUnit.id)} ${toUnit.plural}**.` },
          { content: `• Multiplier calculation: ${val} × ${convertMetric(1, fromUnit.id, toUnit.id)} = **${ans}**.` },
          { content: `Therefore, ${val} ${fromUnit.symbol} = **${ans} ${toUnit.symbol}**.` }
        ]
      },
      metadata: { task: 'single_conversion', system: 'metric', fromUnit: fromUnit.id, toUnit: toUnit.id, val, ans }
    };

  } else {
    // Customary conversions
    const unitsList = Object.values(UNITS).filter(u => u.system === 'customary' && u.attribute === attribute);
    
    // Choose pair where we get integers or clean fractions
    let pair = [];
    if (attribute === 'length') {
      pair = rng.pick([['ft', 'in'], ['yd', 'ft'], ['yd', 'in'], ['mi', 'ft']]);
    } else if (attribute === 'weight') {
      pair = [['lb', 'oz'], ['tn', 'lb']][rng.int(0, 1)];
    } else {
      pair = rng.pick([['gal', 'qt'], ['qt', 'pt'], ['pt', 'c'], ['c', 'fl_oz'], ['gal', 'c']]);
    }

    fromUnit = UNITS[pair[0]];
    toUnit = UNITS[pair[1]];

    val = rng.int(2, 8);
    if (fromUnit.id === 'mi') val = 1; // Limit miles to 1 or 2 for small numbers
    
    const converted = convertCustomary(val, fromUnit.id, toUnit.id);
    const ans = converted.toString();

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Convert **${val} ${fromUnit.plural}** into **${toUnit.plural}**:`,
      parts: [{ type: 'text', content: `[blank:ans] ${toUnit.symbol}` }],
      correctAnswer: ans,
      explanation: {
        sections: [
          { content: `We want to convert **${val} ${fromUnit.name}** to **${toUnit.name}**.` },
          { content: `• 1 ${fromUnit.name} = **${convertCustomary(1, fromUnit.id, toUnit.id)} ${toUnit.plural}**.` },
          { content: `• Multiply: ${val} × ${convertCustomary(1, fromUnit.id, toUnit.id)} = **${ans}**.` },
          { content: `Therefore, ${val} ${fromUnit.symbol} = **${ans} ${toUnit.symbol}**.` }
        ]
      },
      metadata: { task: 'single_conversion', system: 'customary', fromUnit: fromUnit.id, toUnit: toUnit.id, val, ans }
    };
  }
}

/**
 * Generate Conversion Tables
 */
function generateConversionTable(rng, difficulty) {
  const isMetric = rng.next() > 0.5;
  let fromUnit, toUnit, factor;

  if (isMetric) {
    const pair = rng.pick([['m', 'cm', 100], ['km', 'm', 1000], ['kg', 'g', 1000], ['l', 'ml', 1000]]);
    fromUnit = UNITS[pair[0]];
    toUnit = UNITS[pair[1]];
    factor = pair[2];
  } else {
    const pair = rng.pick([['ft', 'in', 12], ['yd', 'ft', 3], ['lb', 'oz', 16], ['gal', 'qt', 4]]);
    fromUnit = UNITS[pair[0]];
    toUnit = UNITS[pair[1]];
    factor = pair[2];
  }

  // Create table inputs: 3 values, 1 is blank
  const rows = [1, 2, 3, 5].map(v => ({ input: v, output: v * factor }));
  const blankRowIdx = rng.int(1, 3);
  const targetRow = rows[blankRowIdx];

  const headerRow = `| ${fromUnit.name} (${fromUnit.symbol}) | ${toUnit.name} (${toUnit.symbol}) |`;
  const dividerRow = `| :---: | :---: |`;
  const dataRows = rows.map((r, idx) => {
    if (idx === blankRowIdx) {
      return `| ${r.input} | [blank:ans] |`;
    }
    return `| ${r.input} | ${r.output} |`;
  }).join('\n');

  const markdownTable = `${headerRow}\n${dividerRow}\n${dataRows}`;

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `Complete the unit conversion table below.`,
    parts: [{ type: 'text', content: markdownTable }],
    correctAnswer: targetRow.output.toString(),
    explanation: {
      sections: [
        { content: `Looking at the conversion table, notice the relationship between **${fromUnit.plural}** and **${toUnit.plural}**:` },
        { content: `1 ${fromUnit.symbol} = **${factor} ${toUnit.symbol}**.` },
        { content: `For the blank row with input **${targetRow.input}**, multiply by the factor **${factor}**:` },
        { content: `**${targetRow.input} × ${factor} = ${targetRow.output}**.` }
      ]
    },
    metadata: { task: 'conversion_table', fromUnit: fromUnit.id, toUnit: toUnit.id, input: targetRow.input, ans: targetRow.output }
  };
}

/**
 * Generate Temperature Conversion
 */
function generateTemperatureConversion(rng, difficulty) {
  const toFahrenheit = rng.next() > 0.5;
  
  if (toFahrenheit) {
    // Celsius to Fahrenheit
    // Choose values that make Celsius calculation clean (multiples of 5)
    const c = rng.int(0, 8) * 5;
    const f = celsiusToFahrenheit(c);
    
    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Convert **${c}°C** (Celsius) to **Fahrenheit (°F)**:`,
      parts: [{ type: 'text', content: `[blank:ans] °F` }],
      correctAnswer: f.toString(),
      explanation: {
        sections: [
          { content: `Use the Celsius to Fahrenheit formula: **$F = \\frac{9}{5}C + 32$**` },
          { content: `1. Multiply Celsius by $\\frac{9}{5}$: **${c} × \\frac{9}{5} = ${c * 1.8}**` },
          { content: `2. Add 32: **${c * 1.8} + 32 = ${f}**.` },
          { content: `Therefore, **${c}°C = ${f}°F**.` }
        ]
      },
      metadata: { task: 'convert_temp', c, f }
    };
  } else {
    // Fahrenheit to Celsius
    // Choose Fahrenheit values that yield integer Celsius values
    const c = rng.int(0, 8) * 5;
    const f = celsiusToFahrenheit(c);

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Convert **${f}°F** (Fahrenheit) to **Celsius (°C)**:`,
      parts: [{ type: 'text', content: `[blank:ans] °C` }],
      correctAnswer: c.toString(),
      explanation: {
        sections: [
          { content: `Use the Fahrenheit to Celsius formula: **$C = (F - 32) × \\frac{5}{9}$**` },
          { content: `1. Subtract 32 from Fahrenheit: **${f} - 32 = ${f - 32}**` },
          { content: `2. Multiply by $\\frac{5}{9}$: **${f - 32} × \\frac{5}{9} = ${c}**.` },
          { content: `Therefore, **${f}°F = ${c}°C**.` }
        ]
      },
      metadata: { task: 'convert_temp', c, f }
    };
  }
}

/**
 * Generate Cross-System Customary ↔ Metric Conversions
 */
function generateCrossSystemConversion(rng, difficulty) {
  // Approximate conversions (textbook style, e.g. using 1 in = 2.5 cm, 1 kg = 2.2 lbs, 1 gal = 3.8 liters)
  const conversionScenarios = [
    { from: 'in', to: 'cm', factor: 2.54, label: '1 inch ≈ 2.54 cm' },
    { from: 'cm', to: 'in', factor: 1/2.54, label: '1 cm ≈ 0.39 inches' },
    { from: 'lb', to: 'kg', factor: 0.45, label: '1 pound ≈ 0.45 kg' },
    { from: 'kg', to: 'lb', factor: 2.2, label: '1 kilogram ≈ 2.2 pounds' },
    { from: 'gal', to: 'l', factor: 3.8, label: '1 gallon ≈ 3.8 liters' }
  ];

  const scenario = rng.pick(conversionScenarios);
  const input = rng.int(2, 10);
  
  const converted = input * scenario.factor;
  const ans = parseFloat(converted.toFixed(2)).toString();

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `Using the conversion **${scenario.label}**, convert **${input} ${UNITS[scenario.from].plural}** into **${UNITS[scenario.to].plural}** (round to 2 decimal places if needed):`,
    parts: [{ type: 'text', content: `[blank:ans] ${scenario.to}` }],
    correctAnswer: ans,
    explanation: {
      sections: [
        { content: `We want to convert **${input} ${scenario.from}** to **${scenario.to}**.` },
        { content: `Using the conversion factor: **${scenario.label}**.` },
        { content: `Multiply the input by the factor: **${input} × ${scenario.factor} = ${ans}**.` }
      ]
    },
    metadata: { task: 'convert_cross_system', from: scenario.from, to: scenario.to, input, ans }
  };
}

/**
 * Generate Rates and Speed conversions (Dimensional Analysis)
 */
function generateRateConversion(rng, difficulty) {
  // Scenario 1: Speed (miles per hour to feet per second)
  // Scenario 2: Water flow (gallons per minute to quarts per second)
  const isSpeed = rng.next() > 0.5;

  if (isSpeed) {
    const mph = rng.int(3, 10) * 10; // e.g. 60 mph
    // conversion: mph * 5280 / 3600 = mph * 22 / 15
    const fps = (mph * 22) / 15;
    const ans = parseFloat(fps.toFixed(2)).toString();

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Convert **${mph} miles per hour (mph)** into **feet per second (ft/s)** (round to 2 decimal places if needed):`,
      parts: [{ type: 'text', content: `[blank:ans] ft/s` }],
      correctAnswer: ans,
      explanation: {
        sections: [
          { content: `To convert speed from miles per hour to feet per second, use dimensional analysis:` },
          { content: `1. Convert miles to feet: **1 mile = 5,280 feet**.` },
          { content: `2. Convert hours to seconds: **1 hour = 3,600 seconds**.` },
          { content: `3. Calculation: **$\\frac{${mph} \\text{ miles}}{1 \\text{ hour}} × \\frac{5280 \\text{ feet}}{1 \\text{ mile}} × \\frac{1 \\text{ hour}}{3600 \\text{ seconds}}$**` },
          { content: `**$= \\frac{${mph} × 5280}{3600} = ${ans} \\text{ ft/s}$**.` }
        ]
      },
      metadata: { task: 'convert_rates', type: 'speed', mph, ans }
    };
  } else {
    // Flow: Gallons per minute to quarts per second
    const gpm = rng.int(3, 12);
    // gpm * 4 quarts/gal / 60 seconds/min = gpm / 15 quarts/second
    const qps = gpm / 15;
    const ans = parseFloat(qps.toFixed(3)).toString();

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Convert **${gpm} gallons per minute (gpm)** into **quarts per second (qt/s)** (round to 3 decimal places if needed):`,
      parts: [{ type: 'text', content: `[blank:ans] qt/s` }],
      correctAnswer: ans,
      explanation: {
        sections: [
          { content: `To convert flow rate from gallons per minute to quarts per second:` },
          { content: `1. Convert gallons to quarts: **1 gallon = 4 quarts**.` },
          { content: `2. Convert minutes to seconds: **1 minute = 60 seconds**.` },
          { content: `3. Calculation: **$\\frac{${gpm} \\text{ gallons}}{1 \\text{ minute}} × \\frac{4 \\text{ quarts}}{1 \\text{ gallon}} × \\frac{1 \\text{ minute}}{60 \\text{ seconds}}$**` },
          { content: `**$= \\frac{${gpm} × 4}{60} = \\frac{${gpm}}{15} = ${ans} \\text{ qt/s}$**.` }
        ]
      },
      metadata: { task: 'convert_rates', type: 'flow', gpm, ans }
    };
  }
}
