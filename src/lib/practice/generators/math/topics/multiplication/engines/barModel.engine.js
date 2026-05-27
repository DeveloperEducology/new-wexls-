import { randInt, uid } from './shared.js';
const pickOne = (arr, random = Math.random) => arr[Math.floor(random() * arr.length)];

const COLOR_SCHEMES = {
  indigo: { fill: '#e0e7ff', stroke: '#4f46e5', text: '#312e81' },
  blue: { fill: '#e0f2fe', stroke: '#0284c7', text: '#0c4a6e' },
  teal: { fill: '#ccfbf1', stroke: '#0d9488', text: '#115e59' },
  emerald: { fill: '#d1fae5', stroke: '#059669', text: '#064e3b' },
  purple: { fill: '#f3e8ff', stroke: '#7c3aed', text: '#4c1d95' },
};

export function generateBarModelQuestion(template = {}, variables = {}, random = Math.random) {
  const mode = template.config?.mode || 'findTotalSingle'; // 'findTotalSingle' | 'findValueSingle' | 'comparisonLarge' | 'comparisonSmall'
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

  const factor1 = randInt(3, maxFactor, random); // e.g. number of groups or multiplier
  const factor2 = randInt(2, Math.min(10, Math.floor(maxProduct / factor1)), random); // e.g. group size / base quantity
  const product = factor1 * factor2;

  const scheme1 = pickOne(Object.values(COLOR_SCHEMES), random);
  let scheme2 = pickOne(Object.values(COLOR_SCHEMES), random);
  while (scheme2.stroke === scheme1.stroke) {
    scheme2 = pickOne(Object.values(COLOR_SCHEMES), random);
  }

  if (mode === 'findTotalSingle') {
    // Single bar, find the total
    const questionText = `Find the total value shown by the bar model.`;
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
          type: 'bar_model',
          mode: 'single',
          bars: [
            {
              segmentCount: factor1,
              segmentValue: String(factor2),
              showSegmentLabels: true,
              bracketLabel: '?',
              color: scheme1.fill,
              stroke: scheme1.stroke,
              textColor: scheme1.text
            }
          ],
          isVertical: true
        },
        {
          type: 'text',
          content: `There are [[groups]] parts, and each part is [[size]].\n\nComplete the equation to find the total:\n\n[[groups_eq]] × [[size_eq]] = [[total]]`,
          style: {
            marginTop: 24,
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a'
          }
        }
      ],
      answer: {
        groups: String(factor1),
        size: String(factor2),
        groups_eq: String(factor1),
        size_eq: String(factor2),
        total: String(product)
      },
      correctAnswerText: JSON.stringify({
        groups: String(factor1),
        size: String(factor2),
        groups_eq: String(factor1),
        size_eq: String(factor2),
        total: String(product)
      }),
      solution: {
        sections: [
          { type: 'text', content: `The bar is divided into **${factor1}** equal parts.` },
          { type: 'text', content: `Each part has a value of **${factor2}**.` },
          { type: 'text', content: `To find the total, multiply the number of parts by the value of each part:` },
          { type: 'text', content: `**${factor1} × ${factor2} = ${product}**.` }
        ]
      },
      metadata: {
        topic: 'multiplication',
        templateId: template.id,
        engine: 'barModel',
        factor1,
        factor2,
        product,
        mode
      }
    };
  }

  if (mode === 'findValueSingle') {
    // Single bar, find the value of each segment
    const questionText = `Find the value of each equal part in the bar model.`;
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
          type: 'bar_model',
          mode: 'single',
          bars: [
            {
              segmentCount: factor1,
              segmentValue: '?',
              showSegmentLabels: true,
              bracketLabel: String(product),
              color: scheme2.fill,
              stroke: scheme2.stroke,
              textColor: scheme2.text
            }
          ],
          isVertical: true
        },
        {
          type: 'text',
          content: `The total value of **${product}** is split into [[parts_count]] equal parts.\n\nWhat is the value of each part?\n\n[[parts_count_eq]] × [[part_value]] = ${product}`,
          style: {
            marginTop: 24,
            fontSize: '18px',
            fontWeight: 700,
            color: '#0f172a'
          }
        }
      ],
      answer: {
        parts_count: String(factor1),
        parts_count_eq: String(factor1),
        part_value: String(factor2)
      },
      correctAnswerText: JSON.stringify({
        parts_count: String(factor1),
        parts_count_eq: String(factor1),
        part_value: String(factor2)
      }),
      solution: {
        sections: [
          { type: 'text', content: `The total value is **${product}**.` },
          { type: 'text', content: `It is split into **${factor1}** equal parts.` },
          { type: 'text', content: `To find the value of one part, we look for the number that when multiplied by ${factor1} gives ${product}:` },
          { type: 'text', content: `**${factor1} × ${factor2} = ${product}**.` },
          { type: 'text', content: `So, each part is worth **${factor2}**.` }
        ]
      },
      metadata: {
        topic: 'multiplication',
        templateId: template.id,
        engine: 'barModel',
        factor1,
        factor2,
        product,
        mode
      }
    };
  }

  if (mode === 'comparisonLarge') {
    // Multiplicative comparison: find the larger quantity (e.g. B is 3 times A)
    const itemsList = [
      { name: 'Apple', plural: 'Apples' },
      { name: 'Red Ribbon', plural: 'Red Ribbons', otherName: 'Blue Ribbon' },
      { name: 'Book', plural: 'Books', otherName: 'Notebook' },
      { name: 'Toy Car', plural: 'Toy Cars', otherName: 'Toy Boat' },
    ];
    const chosenItem = pickOne(itemsList, random);
    const labelA = chosenItem.otherName || `Group A`;
    const labelB = chosenItem.name || `Group B`;

    const questionText = `${labelB} has a value ${factor1} times as large as ${labelA}. Find the total value of ${labelB}.`;

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
          type: 'bar_model',
          mode: 'comparison',
          bars: [
            {
              label: labelA,
              segmentCount: 1,
              segmentValue: String(factor2),
              color: scheme1.fill,
              stroke: scheme1.stroke,
              textColor: scheme1.text
            },
            {
              label: labelB,
              segmentCount: factor1,
              segmentValue: String(factor2),
              showSegmentLabels: false,
              bracketLabel: '?',
              color: scheme2.fill,
              stroke: scheme2.stroke,
              textColor: scheme2.text
            }
          ],
          isVertical: true
        },
        {
          type: 'text',
          content: `${labelA} is worth **${factor2}**.\n\n${labelB} has [[multiplier]] times as many segments.\n\nWhat is the total value of ${labelB}?\n\n[[multiplier_eq]] × ${factor2} = [[total_ans]]`,
          style: {
            marginTop: 24,
            fontSize: '17px',
            fontWeight: 700,
            color: '#0f172a'
          }
        }
      ],
      answer: {
        multiplier: String(factor1),
        multiplier_eq: String(factor1),
        total_ans: String(product)
      },
      correctAnswerText: JSON.stringify({
        multiplier: String(factor1),
        multiplier_eq: String(factor1),
        total_ans: String(product)
      }),
      solution: {
        sections: [
          { type: 'text', content: `The bar model shows that ${labelA} represents **${factor2}**.` },
          { type: 'text', content: `${labelB} is made of **${factor1}** segments of the same size.` },
          { type: 'text', content: `To find the total value of ${labelB}, multiply the base value by the number of segments:` },
          { type: 'text', content: `**${factor1} × ${factor2} = ${product}**.` }
        ]
      },
      metadata: {
        topic: 'multiplication',
        templateId: template.id,
        engine: 'barModel',
        factor1,
        factor2,
        product,
        mode
      }
    };
  }

  // mode === 'comparisonSmall'
  // Multiplicative comparison: find the smaller quantity (e.g. B is 3 times A, B total is 15, find A)
  const labelA = `Bar A`;
  const labelB = `Bar B`;
  const questionText = `${labelB} is ${factor1} times as large as ${labelA}. Find the value of ${labelA}.`;

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
        type: 'bar_model',
        mode: 'comparison',
        bars: [
          {
            label: labelA,
            segmentCount: 1,
            segmentValue: '?',
            color: scheme1.fill,
            stroke: scheme1.stroke,
            textColor: scheme1.text
          },
          {
            label: labelB,
            segmentCount: factor1,
            segmentValue: '?',
            showSegmentLabels: false,
            bracketLabel: String(product),
            color: scheme2.fill,
            stroke: scheme2.stroke,
            textColor: scheme2.text
          }
        ],
        isVertical: true
      },
      {
        type: 'text',
        content: `The total value of ${labelB} is **${product}**, which is split into [[segments_count]] equal parts.\n\nWhat is the value of ${labelA} (one part)?\n\n[[segments_count_eq]] × [[segment_val]] = ${product}`,
        style: {
          marginTop: 24,
          fontSize: '17px',
          fontWeight: 700,
          color: '#0f172a'
        }
      }
    ],
    answer: {
      segments_count: String(factor1),
      segments_count_eq: String(factor1),
      segment_val: String(factor2)
    },
    correctAnswerText: JSON.stringify({
      segments_count: String(factor1),
      segments_count_eq: String(factor1),
      segment_val: String(factor2)
    }),
    solution: {
      sections: [
        { type: 'text', content: `The total value of ${labelB} is **${product}**.` },
        { type: 'text', content: `${labelB} has **${factor1}** equal segments.` },
        { type: 'text', content: `To find the value of each segment (which is the value of ${labelA}), we divide:` },
        { type: 'text', content: `**${product} ÷ ${factor1} = ${factor2}** (or **${factor1} × ${factor2} = ${product}**).` },
        { type: 'text', content: `So, ${labelA} is equal to **${factor2}**.` }
      ]
    },
    metadata: {
      topic: 'multiplication',
      templateId: template.id,
      engine: 'barModel',
      factor1,
      factor2,
      product,
      mode
    }
  };
}
