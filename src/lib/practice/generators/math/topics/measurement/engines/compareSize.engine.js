/**
 * Comparative Size, Weight, and Capacity Engine
 */

import { renderBalanceScale, renderMeasuringCup, drawRealWorldObject } from '../shared/svgMeasurementLibrary.js';

export function generateCompareSizeQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'easy';
  const forcedTask = config.forcedTask || 'compare_size';
  
  if (forcedTask === 'should_measure') {
    return generateShouldMeasureQuestion(rng);
  }
  
  if (forcedTask === 'indirect_comparison') {
    return generateIndirectComparisonQuestion(rng);
  }

  // Standard Comparative Tasks
  const attributes = ['length', 'height', 'width', 'weight', 'capacity', 'covers'];
  const attribute = config.attribute || rng.pick(attributes);

  if (attribute === 'weight') {
    // Light / Heavy comparison
    const isHeavy = rng.next() > 0.5;
    const weightA = rng.int(5, 10);
    const weightB = rng.int(1, 4);
    
    const leftWeight = isHeavy ? weightA : weightB;
    const rightWeight = isHeavy ? weightB : weightA;
    const labelA = 'Box A';
    const labelB = 'Box B';

    const svg = renderBalanceScale({
      leftWeight,
      rightWeight,
      leftLabel: labelA,
      rightLabel: labelB
    });

    const targetLabel = isHeavy ? (leftWeight > rightWeight ? labelA : labelB) : (leftWeight < rightWeight ? labelA : labelB);
    const otherLabel = targetLabel === labelA ? labelB : labelA;
    
    return {
      type: 'mcq',
      level: 'easy',
      questionText: `Look at the scale. Which box is **${isHeavy ? 'heavier' : 'lighter'}**?`,
      parts: [{ type: 'svg', content: svg }],
      options: [labelA, labelB],
      correctAnswerIndex: [labelA, labelB].indexOf(targetLabel),
      explanation: {
        sections: [
          { content: `On a balance scale, the heavier side tilts **down** and the lighter side goes **up**.` },
          { content: `• **${leftWeight > rightWeight ? labelA : labelB}** is tilted down, so it is heavier.` },
          { content: `• **${leftWeight < rightWeight ? labelA : labelB}** is tilted up, so it is lighter.` },
          { content: `Therefore, **${targetLabel}** is the **${isHeavy ? 'heavier' : 'lighter'}** box.` }
        ]
      },
      remediation: `The heavier object tilts the balance scale down. The lighter object goes up.`,
      metadata: { attribute: 'weight', isHeavy, targetLabel }
    };
  }

  if (attribute === 'capacity') {
    // Holds More / Less comparison
    const holdsMore = rng.next() > 0.5;
    const capA = rng.pick([500, 1000]);
    const capB = capA === 500 ? 1000 : 500;
    
    const svgA = renderMeasuringCup({ capacity: capA, level: capA / 2, unit: 'ml', vessel: 'cup' });
    const svgB = renderMeasuringCup({ capacity: capB, level: capB / 2, unit: 'ml', vessel: 'cup' });

    const target = holdsMore ? (capA > capB ? 'Cup A' : 'Cup B') : (capA < capB ? 'Cup A' : 'Cup B');

    return {
      type: 'mcq',
      level: 'easy',
      questionText: `Which container holds **${holdsMore ? 'more' : 'less'}**?`,
      parts: [
        {
          type: 'row',
          style: { justifyContent: 'center', gap: '20px', width: '100%' },
          parts: [
            {
              type: 'group',
              style: { alignItems: 'center', flex: '0 0 auto', width: 'auto' },
              parts: [
                { type: 'text', content: 'Cup A', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' } },
                { type: 'svg', content: svgA }
              ]
            },
            {
              type: 'group',
              style: { alignItems: 'center', flex: '0 0 auto', width: 'auto' },
              parts: [
                { type: 'text', content: 'Cup B', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' } },
                { type: 'svg', content: svgB }
              ]
            }
          ]
        }
      ],
      options: ['Cup A', 'Cup B'],
      correctAnswerIndex: ['Cup A', 'Cup B'].indexOf(target),
      explanation: {
        sections: [
          { content: `Cup A has a total capacity of **${capA} ml**.` },
          { content: `Cup B has a total capacity of **${capB} ml**.` },
          { content: `Comparing sizes: **${capA > capB ? 'Cup A' : 'Cup B'}** is larger and holds more. **${capA < capB ? 'Cup A' : 'Cup B'}** is smaller and holds less.` },
          { content: `Therefore, the one that holds **${holdsMore ? 'more' : 'less'}** is **${target}**.` }
        ]
      },
      remediation: `A larger container has more space and holds more. A smaller container holds less.`,
      metadata: { attribute: 'capacity', holdsMore, target }
    };
  }

  if (attribute === 'length' || attribute === 'height') {
    // Long / Short or Tall / Short
    const isLonger = rng.next() > 0.5;
    const isHeight = attribute === 'height';
    
    const objType = isHeight ? 'tree' : 'pencil';
    const sizeA = isLonger ? 150 : 80;
    const sizeB = isLonger ? 80 : 150;

    const svgA = `<svg width="180" height="120" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px;">
      ${drawRealWorldObject(objType, 15, isHeight ? 120 - sizeA * 0.7 : 40, isHeight ? 60 : sizeA, isHeight ? sizeA * 0.7 : 40)}
    </svg>`;
    const svgB = `<svg width="180" height="120" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px;">
      ${drawRealWorldObject(objType, 15, isHeight ? 120 - sizeB * 0.7 : 40, isHeight ? 60 : sizeB, isHeight ? sizeB * 0.7 : 40)}
    </svg>`;

    const target = isLonger ? (sizeA > sizeB ? 'Item A' : 'Item B') : (sizeA < sizeB ? 'Item A' : 'Item B');
    const propertyWord = isHeight ? (isLonger ? 'taller' : 'shorter') : (isLonger ? 'longer' : 'shorter');

    return {
      type: 'mcq',
      level: 'easy',
      questionText: `Which object is **${propertyWord}**?`,
      parts: [
        {
          type: 'row',
          style: { justifyContent: 'center', gap: '20px', width: '100%' },
          parts: [
            {
              type: 'group',
              style: { alignItems: 'center', flex: '0 0 auto', width: 'auto' },
              parts: [
                { type: 'text', content: 'Item A', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' } },
                { type: 'svg', content: svgA }
              ]
            },
            {
              type: 'group',
              style: { alignItems: 'center', flex: '0 0 auto', width: 'auto' },
              parts: [
                { type: 'text', content: 'Item B', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' } },
                { type: 'svg', content: svgB }
              ]
            }
          ]
        }
      ],
      options: ['Item A', 'Item B'],
      correctAnswerIndex: ['Item A', 'Item B'].indexOf(target),
      explanation: {
        sections: [
          { content: `Compare the dimensions of both items visually.` },
          { content: `• Item A has length/height unit size of **${sizeA}px**.` },
          { content: `• Item B has length/height unit size of **${sizeB}px**.` },
          { content: `Therefore, **${target}** is the **${propertyWord}** one.` }
        ]
      },
      metadata: { attribute, isLonger, target }
    };
  }

  // Default: Width wide/narrow
  const isWide = rng.next() > 0.5;
  const target = isWide ? 'Gate A' : 'Gate B';
  const sizeA = isWide ? 90 : 35;
  const sizeB = isWide ? 35 : 90;

  const svgA = `<svg width="160" height="80" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px;">
    <!-- Wide gate posts -->
    <rect x="${80 - sizeA/2}" y="10" width="10" height="60" fill="#78350f" />
    <rect x="${80 + sizeA/2 - 10}" y="10" width="10" height="60" fill="#78350f" />
    <!-- Gate bar -->
    <rect x="${80 - sizeA/2 + 10}" y="35" width="${sizeA - 20}" height="10" fill="#b45309" />
  </svg>`;

  const svgB = `<svg width="160" height="80" style="background:#fff; border:1px solid #cbd5e1; border-radius:6px;">
    <!-- Narrow gate posts -->
    <rect x="${80 - sizeB/2}" y="10" width="10" height="60" fill="#78350f" />
    <rect x="${80 + sizeB/2 - 10}" y="10" width="10" height="60" fill="#78350f" />
    <rect x="${80 - sizeB/2 + 10}" y="35" width="${sizeB - 20}" height="10" fill="#b45309" />
  </svg>`;

  return {
    type: 'mcq',
    level: 'easy',
    questionText: `Which gate is **${isWide ? 'wider' : 'narrower'}**?`,
    parts: [
      {
        type: 'row',
        style: { justifyContent: 'center', gap: '20px', width: '100%' },
        parts: [
          {
            type: 'group',
            style: { alignItems: 'center', flex: '0 0 auto', width: 'auto' },
            parts: [
              { type: 'text', content: 'Gate A', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' } },
              { type: 'svg', content: svgA }
            ]
          },
          {
            type: 'group',
            style: { alignItems: 'center', flex: '0 0 auto', width: 'auto' },
            parts: [
              { type: 'text', content: 'Gate B', style: { fontWeight: 'bold', textAlign: 'center', fontSize: '16px' } },
              { type: 'svg', content: svgB }
            ]
          }
        ]
      }
    ],
    options: ['Gate A', 'Gate B'],
    correctAnswerIndex: ['Gate A', 'Gate B'].indexOf(target),
    explanation: {
      sections: [
        { content: `Compare the distance between the two posts for each gate.` },
        { content: `• Gate A opening is **${sizeA}px** wide.` },
        { content: `• Gate B opening is **${sizeB}px** wide.` },
        { content: `Therefore, **${target}** is the **${isWide ? 'wider' : 'narrower'}** gate.` }
      ]
    },
    metadata: { attribute: 'width', isWide, target }
  };
}

/**
 * Question generator: Should you measure size, weight, or capacity?
 */
function generateShouldMeasureQuestion(rng) {
  const scenarios = [
    { question: 'how much sand fits in a bucket', correct: 'capacity', expl: 'We want to find how much space is inside the bucket to hold sand.' },
    { question: 'how heavy a backpack is', correct: 'weight', expl: 'We want to find the weight (how heavy it pulls down).' },
    { question: 'how long a skipping rope is', correct: 'size', expl: 'We want to find the size (length) of the rope.' },
    { question: 'how much milk is in a glass', correct: 'capacity', expl: 'We want to find the capacity (liquid volume) of milk inside.' },
    { question: 'how heavy a pumpkin is', correct: 'weight', expl: 'We want to find the weight of the pumpkin.' },
    { question: 'the distance from the door to the window', correct: 'size', expl: 'We want to find the size (length/distance) between them.' },
  ];

  const picked = rng.pick(scenarios);
  const options = ['size', 'weight', 'capacity'];

  return {
    type: 'mcq',
    level: 'easy',
    questionText: `To find out **${picked.question}**, should you measure **size**, **weight**, or **capacity**?`,
    options: options,
    correctAnswerIndex: options.indexOf(picked.correct),
    explanation: {
      sections: [
        { content: `• **Size** measures length, height, or width (how long, tall, or wide something is).` },
        { content: `• **Weight** measures how heavy something is.` },
        { content: `• **Capacity** measures how much a container can hold.` },
        { content: `For **${picked.question}**, we need to measure its **${picked.correct}**.` },
        { content: `${picked.expl}` }
      ]
    },
    metadata: { task: 'should_measure', scenario: picked.question }
  };
}

/**
 * Question generator: Indirect comparison (transitivity)
 */
function generateIndirectComparisonQuestion(rng) {
  const items = ['pencil', 'ribbon', 'crayon', 'stick', 'train'];
  const item = rng.pick(items);
  
  // Scenarios:
  // A > B, B > C => A > C (is A longer or shorter than C? longer)
  // A < B, B < C => A < C (is A longer or shorter than C? shorter)
  const isGreater = rng.next() > 0.5;
  const nameA = `${item} A`;
  const nameB = `${item} B`;
  const nameC = `${item} C`;

  const relation1 = isGreater ? `longer than` : `shorter than`;
  const relation2 = isGreater ? `longer than` : `shorter than`;
  
  const questionText = `**${nameA}** is ${relation1} **${nameB}**.\n\n**${nameB}** is ${relation2} **${nameC}**.\n\nIs **${nameA}** **longer** or **shorter** than **${nameC}**?`;

  const ans = isGreater ? 'longer' : 'shorter';

  return {
    type: 'mcq',
    level: 'medium',
    questionText: questionText,
    options: ['longer', 'shorter'],
    correctAnswerIndex: ['longer', 'shorter'].indexOf(ans),
    explanation: {
      sections: [
        { content: `Let's represent the items in order:` },
        { content: isGreater 
          ? `• **${nameA}** > **${nameB}**\n• **${nameB}** > **${nameC}**`
          : `• **${nameA}** < **${nameB}**\n• **${nameB}** < **${nameC}**`
        },
        { content: isGreater
          ? `Since **${nameA}** is larger than **${nameB}**, and **${nameB}** is larger than **${nameC}**, then **${nameA}** must be **longer** than **${nameC}**.`
          : `Since **${nameA}** is smaller than **${nameB}**, and **${nameB}** is smaller than **${nameC}**, then **${nameA}** must be **shorter** than **${nameC}**.`
        }
      ]
    },
    metadata: { task: 'indirect_comparison', isGreater }
  };
}
