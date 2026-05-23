/**
 * Mixed Unit Arithmetic Engine (Add, Subtract, Multiply, Divide)
 */

import { simplifyMixedCustomary, toTotalBaseCustomary, convertCustomary } from '../shared/conversions.js';
import { UNITS } from '../shared/unitSystems.js';

export function generateMixedUnitsQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'mixed_addition';

  // Operations: add, subtract, multiply, divide
  let operation = 'add';
  if (forcedTask.includes('sub')) operation = 'subtract';
  else if (forcedTask.includes('mult')) operation = 'multiply';
  else if (forcedTask.includes('div')) operation = 'divide';
  else operation = rng.pick(['add', 'subtract', 'multiply', 'divide']);

  // Unit pairs: [parent, base, conversionFactor]
  const pair = rng.pick([
    ['ft', 'in', 12],
    ['lb', 'oz', 16],
    ['gal', 'qt', 4],
    ['yd', 'ft', 3]
  ]);

  const parentUnit = UNITS[pair[0]];
  const baseUnit = UNITS[pair[1]];
  const baseInParent = pair[2];

  if (operation === 'add') {
    // Generate values that force a carry-over
    const p1 = rng.int(1, 6);
    const b1 = rng.int(Math.floor(baseInParent / 2), baseInParent - 1);
    
    const p2 = rng.int(1, 4);
    const b2 = rng.int(Math.floor(baseInParent / 2), baseInParent - 1);

    const totalBase = (p1 + p2) * baseInParent + (b1 + b2);
    const { parentVal, baseVal } = simplifyMixedCustomary(totalBase, baseUnit.id, parentUnit.id);

    const qText = `Add: **${p1} ${parentUnit.symbol} ${b1} ${baseUnit.symbol} + ${p2} ${parentUnit.symbol} ${b2} ${baseUnit.symbol}**`;

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `${qText}. Write your answer in the blanks:`,
      parts: [{ type: 'text', content: `[blank:parent] ${parentUnit.symbol} [blank:base] ${baseUnit.symbol}` }],
      correctAnswer: {
        parent: parentVal.toString(),
        base: baseVal.toString()
      },
      explanation: {
        sections: [
          { content: `**Step 1: Add the base units (${baseUnit.plural}) together.**` },
          { content: `${b1} ${baseUnit.symbol} + ${b2} ${baseUnit.symbol} = **${b1 + b2} ${baseUnit.symbol}**.` },
          { content: `Since **${b1 + b2} ${baseUnit.symbol}** is greater than 1 ${parentUnit.name} (${baseInParent} ${baseUnit.symbol}), simplify it:` },
          { content: `**${b1 + b2} ${baseUnit.symbol} = 1 ${parentUnit.symbol} and ${b1 + b2 - baseInParent} ${baseUnit.symbol}** (carry 1 to the ${parentUnit.plural} column).` },
          { content: `**Step 2: Add the parent units (${parentUnit.plural}) together along with the carry.**` },
          { content: `${p1} ${parentUnit.symbol} + ${p2} ${parentUnit.symbol} + 1 ${parentUnit.symbol} (carry) = **${parentVal} ${parentUnit.symbol}**.` },
          { content: `Therefore, the total sum is **${parentVal} ${parentUnit.symbol} ${baseVal} ${baseUnit.symbol}**.` }
        ]
      },
      metadata: { task: 'mixed_addition', operation, parentVal, baseVal, p1, b1, p2, b2 }
    };

  } else if (operation === 'subtract') {
    // Generate values that force borrowing
    const p1 = rng.int(4, 9);
    const b1 = rng.int(1, Math.floor(baseInParent / 2) - 1);
    
    const p2 = rng.int(1, p1 - 2);
    const b2 = rng.int(Math.floor(baseInParent / 2) + 1, baseInParent - 1);

    const totalBase1 = p1 * baseInParent + b1;
    const totalBase2 = p2 * baseInParent + b2;
    const diffBase = totalBase1 - totalBase2;
    const { parentVal, baseVal } = simplifyMixedCustomary(diffBase, baseUnit.id, parentUnit.id);

    const qText = `Subtract: **${p1} ${parentUnit.symbol} ${b1} ${baseUnit.symbol} - ${p2} ${parentUnit.symbol} ${b2} ${baseUnit.symbol}**`;

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `${qText}. Write your answer in the blanks:`,
      parts: [{ type: 'text', content: `[blank:parent] ${parentUnit.symbol} [blank:base] ${baseUnit.symbol}` }],
      correctAnswer: {
        parent: parentVal.toString(),
        base: baseVal.toString()
      },
      explanation: {
        sections: [
          { content: `**Step 1: Look at the base units (${baseUnit.plural}).**` },
          { content: `We cannot subtract ${b2} ${baseUnit.symbol} from ${b1} ${baseUnit.symbol} because ${b1} is smaller than ${b2}. We need to borrow from the **${parentUnit.plural}**.` },
          { content: `**Step 2: Borrow 1 ${parentUnit.name} from ${p1} ${parentUnit.plural}.**` },
          { content: `• ${p1} ${parentUnit.symbol} becomes **${p1 - 1} ${parentUnit.symbol}**.` },
          { content: `• Add the borrowed ${baseInParent} ${baseUnit.symbol} to the existing ${b1} ${baseUnit.symbol}: **${b1} + ${baseInParent} = ${b1 + baseInParent} ${baseUnit.symbol}**.` },
          { content: `**Step 3: Subtract the base units.**` },
          { content: `${b1 + baseInParent} ${baseUnit.symbol} - ${b2} ${baseUnit.symbol} = **${baseVal} ${baseUnit.symbol}**.` },
          { content: `**Step 4: Subtract the parent units.**` },
          { content: `${p1 - 1} ${parentUnit.symbol} - ${p2} ${parentUnit.symbol} = **${parentVal} ${parentUnit.symbol}**.` },
          { content: `Therefore, the difference is **${parentVal} ${parentUnit.symbol} ${baseVal} ${baseUnit.symbol}**.` }
        ]
      },
      metadata: { task: 'mixed_subtraction', operation, parentVal, baseVal, p1, b1, p2, b2 }
    };

  } else if (operation === 'multiply') {
    const p1 = rng.int(1, 4);
    const b1 = rng.int(1, baseInParent - 1);
    const factor = rng.int(2, 4);

    const totalBase = (p1 * baseInParent + b1) * factor;
    const { parentVal, baseVal } = simplifyMixedCustomary(totalBase, baseUnit.id, parentUnit.id);

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Multiply: **(${p1} ${parentUnit.symbol} ${b1} ${baseUnit.symbol}) × ${factor}**. Write your answer:`,
      parts: [{ type: 'text', content: `[blank:parent] ${parentUnit.symbol} [blank:base] ${baseUnit.symbol}` }],
      correctAnswer: {
        parent: parentVal.toString(),
        base: baseVal.toString()
      },
      explanation: {
        sections: [
          { content: `**Step 1: Multiply both parts by ${factor}.**` },
          { content: `• Parent: ${p1} ${parentUnit.symbol} × ${factor} = **${p1 * factor} ${parentUnit.symbol}**.` },
          { content: `• Base: ${b1} ${baseUnit.symbol} × ${factor} = **${b1 * factor} ${baseUnit.symbol}**.` },
          { content: `**Step 2: Simplify the base units.**` },
          { content: `Since **${b1 * factor} ${baseUnit.symbol}** is greater than ${baseInParent} ${baseUnit.symbol}, convert them:` },
          { content: `**${b1 * factor} ÷ ${baseInParent} = ${Math.floor((b1 * factor) / baseInParent)} ${parentUnit.plural}** with a remainder of **${(b1 * factor) % baseInParent} ${baseUnit.symbol}**.` },
          { content: `**Step 3: Combine the parts.**` },
          { content: `${p1 * factor} + ${Math.floor((b1 * factor) / baseInParent)} = **${parentVal} ${parentUnit.symbol}**.` },
          { content: `Final simplified answer: **${parentVal} ${parentUnit.symbol} ${baseVal} ${baseUnit.symbol}**.` }
        ]
      },
      metadata: { task: 'mixed_multiplication', operation, parentVal, baseVal, p1, b1, factor }
    };

  } else {
    // Divide
    // Generate total values that yield integer answers after dividing
    const factor = rng.int(2, 4);
    const parentVal = rng.int(1, 4);
    const baseVal = rng.int(1, baseInParent - 1);
    
    // Total in base unit that is divisible
    const totalBaseInput = (parentVal * factor) * baseInParent + (baseVal * factor);
    const { parentVal: p1, baseVal: b1 } = simplifyMixedCustomary(totalBaseInput, baseUnit.id, parentUnit.id);

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Divide: **(${p1} ${parentUnit.symbol} ${b1} ${baseUnit.symbol}) ÷ ${factor}**. Write your answer:`,
      parts: [{ type: 'text', content: `[blank:parent] ${parentUnit.symbol} [blank:base] ${baseUnit.symbol}` }],
      correctAnswer: {
        parent: parentVal.toString(),
        base: baseVal.toString()
      },
      explanation: {
        sections: [
          { content: `To divide mixed units cleanly, it is easiest to convert the entire measurement to the smaller unit first.` },
          { content: `**Step 1: Convert to ${baseUnit.plural}.**` },
          { content: `• ${p1} ${parentUnit.symbol} = ${p1} × ${baseInParent} = **${p1 * baseInParent} ${baseUnit.symbol}**.` },
          { content: `• Total base units: ${p1 * baseInParent} + ${b1} = **${totalBaseInput} ${baseUnit.symbol}**.` },
          { content: `**Step 2: Divide by ${factor}.**` },
          { content: `${totalBaseInput} ${baseUnit.symbol} ÷ ${factor} = **${totalBaseInput / factor} ${baseUnit.symbol}**.` },
          { content: `**Step 3: Simplify back into mixed units.**` },
          { content: `• ${totalBaseInput / factor} ÷ ${baseInParent} = **${parentVal} ${parentUnit.symbol}** with a remainder of **${baseVal} ${baseUnit.symbol}**.` },
          { content: `Therefore, the quotient is **${parentVal} ${parentUnit.symbol} ${baseVal} ${baseUnit.symbol}**.` }
        ]
      },
      metadata: { task: 'mixed_division', operation, parentVal, baseVal, p1, b1, factor }
    };
  }
}
