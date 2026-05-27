import { randInt, uid } from './shared.js';
const pickOne = (arr, random = Math.random) => arr[Math.floor(random() * arr.length)];

const COLOR_SCHEMES = {
  indigo: { fill: '#e0e7ff', stroke: '#4f46e5', text: '#312e81' },
  blue: { fill: '#e0f2fe', stroke: '#0284c7', text: '#0c4a6e' },
  teal: { fill: '#ccfbf1', stroke: '#0d9488', text: '#115e59' },
};

export function generateNumberLineQuestion(template = {}, variables = {}, random = Math.random) {
  const mode = template.config?.mode || 'identify'; // 'identify' | 'skipCount'
  const difficulty = template.config?.difficulty || variables.difficulty || 'easy';

  // Determine factor limits based on difficulty
  let maxFactor, maxRange;
  if (difficulty === 'easy') {
    maxFactor = 5;
    maxRange = 20;
  } else if (difficulty === 'hard') {
    maxFactor = 12;
    maxRange = 60;
  } else {
    // medium
    maxFactor = 10;
    maxRange = 50;
  }

  // Generate jump size (factor 2) and number of jumps (factor 1)
  const jumpSize = randInt(2, maxFactor, random);
  const numJumps = randInt(2, Math.min(6, Math.floor(maxRange / jumpSize)), random);
  const product = jumpSize * numJumps;

  // Let the number line scale cover slightly past the product
  const nextMultiple = Math.ceil((product + 1) / jumpSize) * jumpSize;
  const maxTick = Math.max(10, nextMultiple);

  const scheme = pickOne(Object.values(COLOR_SCHEMES), random);

  if (mode === 'skipCount') {
    // Student completes the landing points pattern (e.g. 0, 4, 8, ?, 16)
    // Select one landing index to be the missing tick (excluding 0)
    const missingIndex = randInt(1, numJumps, random);
    const missingValue = missingIndex * jumpSize;
    const allLandings = Array.from({ length: numJumps + 1 }, (_, i) => i * jumpSize);

    const questionText = `Complete the skip counting pattern on the number line.`;
    
    // Replace the missing tick with a question mark on the number line labels list
    const missingTicks = [missingValue];

    // Build landing sequence string (with blank)
    const sequenceParts = allLandings.map((val) => {
      if (val === missingValue) return '[[ans]]';
      return `**${val}**`;
    });
    const sequenceString = sequenceParts.join(', ');

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
          type: 'number_line',
          min: 0,
          max: maxTick,
          jumpSize,
          numJumps,
          missingTicks,
          color: scheme.stroke,
          isVertical: true
        },
        {
          type: 'text',
          content: `Fill in the missing number in the skip counting pattern:\n\n${sequenceString}`,
          style: {
            marginTop: 24,
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a'
          }
        }
      ],
      answer: {
        ans: String(missingValue)
      },
      correctAnswerText: JSON.stringify({
        ans: String(missingValue)
      }),
      solution: {
        sections: [
          { type: 'text', content: `The number line shows jumps of **${jumpSize}**.` },
          { type: 'text', content: `Skip count by ${jumpSize} starting from 0: ${allLandings.join(', ')}.` },
          { type: 'text', content: `The missing number is **${missingValue}**.` }
        ]
      },
      metadata: {
        topic: 'multiplication',
        templateId: template.id,
        engine: 'numberLine',
        numJumps,
        jumpSize,
        product,
        mode
      }
    };
  }

  // Default mode: 'identify' (e.g. ? jumps of ? = ?)
  const questionText = `Write the multiplication equation shown on the number line.`;

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
        type: 'number_line',
        min: 0,
        max: maxTick,
        jumpSize,
        numJumps,
        color: scheme.stroke,
        isVertical: true
      },
      {
        type: 'text',
        content: `Complete the multiplication sentence:\n\n[[factor1]] jumps of [[factor2]] = [[total]]\n\nWrite it as an equation:\n\n[[factor1_eq]] × [[factor2_eq]] = [[total_eq]]`,
        style: {
          marginTop: 24,
          fontSize: '18px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      factor1: String(numJumps),
      factor2: String(jumpSize),
      total: String(product),
      factor1_eq: String(numJumps),
      factor2_eq: String(jumpSize),
      total_eq: String(product)
    },
    correctAnswerText: JSON.stringify({
      factor1: String(numJumps),
      factor2: String(jumpSize),
      total: String(product),
      factor1_eq: String(numJumps),
      factor2_eq: String(jumpSize),
      total_eq: String(product)
    }),
    solution: {
      sections: [
        { type: 'text', content: `Look at the number line:` },
        { type: 'text', content: `- There are **${numJumps}** jump arcs.` },
        { type: 'text', content: `- Each jump covers a size of **${jumpSize}** units.` },
        { type: 'text', content: `- The jumps end at **${product}**.` },
        { type: 'text', content: `So, ${numJumps} jumps of ${jumpSize} is equal to ${product}.` },
        { type: 'text', content: `The multiplication equation is **${numJumps} × ${jumpSize} = ${product}**.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'numberLine',
      numJumps,
      jumpSize,
      product,
      mode
    }
  };
}
