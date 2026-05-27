import { randInt, uid } from './shared.js';
const pickOne = (arr, random = Math.random) => arr[Math.floor(random() * arr.length)];

export function generateFunctionMachineQuestion(template = {}, variables = {}, random = Math.random) {
  const mode = template.config?.mode || 'findOutput'; // 'findOutput' | 'findInput' | 'findRule'
  const difficulty = template.config?.difficulty || variables.difficulty || 'medium';

  // Determine factor limits based on difficulty
  let maxFactor, maxProduct;
  if (difficulty === 'easy') {
    maxFactor = 5;
    maxProduct = 25;
  } else if (difficulty === 'hard') {
    maxFactor = 12;
    maxProduct = 100;
  } else {
    maxFactor = 10;
    maxProduct = 50;
  }

  const multiplier = randInt(2, maxFactor, random);
  const input = randInt(2, Math.min(10, Math.floor(maxProduct / multiplier)), random);
  const output = input * multiplier;

  if (mode === 'findInput') {
    const questionText = `Find the input value that goes into the function machine.`;
    return {
      id: uid(),
      type: 'fillInTheBlank',
      questionText,
      parts: [
        {
          type: 'text',
          content: questionText,
          isVertical: true
        },
        {
          type: 'function_machine',
          input: '?',
          operation: `× ${multiplier}`,
          output: String(output),
          isVertical: true
        },
        {
          type: 'text',
          content: `What number goes into the machine?\n\n[[ans]] × ${multiplier} = ${output}`,
          style: {
            marginTop: 24,
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a'
          }
        }
      ],
      answer: {
        ans: String(input)
      },
      correctAnswerText: JSON.stringify({
        ans: String(input)
      }),
      solution: {
        sections: [
          { type: 'text', content: `The machine multiplies the input by **${multiplier}**.` },
          { type: 'text', content: `The output from the machine is **${output}**.` },
          { type: 'text', content: `To find the input, we look for the number that when multiplied by ${multiplier} equals ${output}:` },
          { type: 'text', content: `**${input} × ${multiplier} = ${output}**.` },
          { type: 'text', content: `So, the input is **${input}**.` }
        ]
      },
      metadata: {
        topic: 'multiplication',
        templateId: template.id,
        engine: 'functionMachine',
        input,
        multiplier,
        output,
        mode
      }
    };
  }

  if (mode === 'findRule') {
    const questionText = `Find the missing multiplier rule inside the function machine.`;
    return {
      id: uid(),
      type: 'fillInTheBlank',
      questionText,
      parts: [
        {
          type: 'text',
          content: questionText,
          isVertical: true
        },
        {
          type: 'function_machine',
          input: String(input),
          operation: '× ?',
          output: String(output),
          isVertical: true
        },
        {
          type: 'text',
          content: `What is the multiplying rule for the machine?\n\n${input} × [[ans]] = ${output}`,
          style: {
            marginTop: 24,
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a'
          }
        }
      ],
      answer: {
        ans: String(multiplier)
      },
      correctAnswerText: JSON.stringify({
        ans: String(multiplier)
      }),
      solution: {
        sections: [
          { type: 'text', content: `The input is **${input}**.` },
          { type: 'text', content: `The output is **${output}**.` },
          { type: 'text', content: `To find the multiplier rule, divide the output by the input (or find what number multiplied by ${input} gives ${output}):` },
          { type: 'text', content: `**${input} × ${multiplier} = ${output}**.` },
          { type: 'text', content: `So, the machine rule is **× ${multiplier}**.` }
        ]
      },
      metadata: {
        topic: 'multiplication',
        templateId: template.id,
        engine: 'functionMachine',
        input,
        multiplier,
        output,
        mode
      }
    };
  }

  // mode === 'findOutput' (default)
  const questionText = `Find the output value that comes out of the function machine.`;
  return {
    id: uid(),
    type: 'fillInTheBlank',
    questionText,
    parts: [
      {
        type: 'text',
        content: questionText,
        isVertical: true
      },
      {
        type: 'function_machine',
        input: String(input),
        operation: `× ${multiplier}`,
        output: '?',
        isVertical: true
      },
      {
        type: 'text',
        content: `What number comes out of the machine?\n\n${input} × ${multiplier} = [[ans]]`,
        style: {
          marginTop: 24,
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      ans: String(output)
    },
    correctAnswerText: JSON.stringify({
      ans: String(output)
    }),
    solution: {
      sections: [
        { type: 'text', content: `The input value is **${input}**.` },
        { type: 'text', content: `The machine rule is **× ${multiplier}**.` },
        { type: 'text', content: `Multiply the input by the rule to get the output:` },
        { type: 'text', content: `**${input} × ${multiplier} = ${output}**.` },
        { type: 'text', content: `So, the output is **${output}**.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'functionMachine',
      input,
      multiplier,
      output,
      mode
    }
  };
}
