/**
 * Interactive Dice Measurement Engine
 */

export function generateDiceMeasurementQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'interactive_dice_measurement';
  
  // Decide orientation: horizontal (length) or vertical (height)
  // config.forcedTask can be 'interactive_dice_measurement' (horizontal) or 'interactive_dice_vertical' (vertical)
  const orientation = (forcedTask === 'interactive_dice_vertical' || rng.next() > 0.5) ? 'vertical' : 'horizontal';
  
  // Decide a target length for the line in terms of dice (e.g. between 3 and 7)
  const targetLength = rng.int(3, 7);

  // Generate theme colors
  const themes = [
    { primary: '#ef4444', stroke: '#b91c1c', pip: '#ffffff' }, // Red
    { primary: '#3b82f6', stroke: '#1d4ed8', pip: '#ffffff' }, // Blue
    { primary: '#10b981', stroke: '#047857', pip: '#ffffff' }, // Emerald
    { primary: '#f59e0b', stroke: '#b45309', pip: '#fffbeb' }, // Amber
    { primary: '#a78bfa', stroke: '#6d28d9', pip: '#ffffff' }, // Purple
    { primary: '#1e293b', stroke: '#0f172a', pip: '#94a3b8' }  // Slate
  ];
  const theme = rng.pick(themes);

  if (orientation === 'vertical') {
    // Pick a random vertical image asset
    const items = [
      { name: 'flower', img: '/images/lkg/flower.png' },
      { name: 'flowers', img: '/images/lkg/flowers.png' },
      { name: 'hippo toy', img: '/images/lkg/hippo.png' },
      { name: 'toy car', img: '/images/lkg/car.png' },
      { name: 'duck toy', img: '/images/lkg/duck.png' },
      { name: 'frog toy', img: '/images/lkg/frog.png' },
      { name: 'butterfly drawing', img: '/images/lkg/butterfly.png' }
    ];
    const item = rng.pick(items);

    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: `Use dice to measure the height of the ${item.name}.`,
      parts: [
        {
          type: 'non_standard_object_measurement',
          layoutMode: 'drag_to_measure',
          orientation: 'vertical',
          unitObject: 'dice',
          targetLength: targetLength,
          unitColor: theme.primary,
          cubeColor: theme.primary,
          strokeColor: theme.stroke,
          pipColor: theme.pip,
          objectImage: item.img,
          objectName: item.name,
          interactionMode: 'drag'
        },
        {
          type: 'text',
          content: `The ${item.name} is about [blank:ans] dice tall.`
        }
      ],
      correctAnswer: { ans: targetLength.toString() },
      explanation: {
        sections: [
          { content: `**Step 1: Place the dice vertically next to the ${item.name}.**` },
          { content: `• Stack dice next to the ${item.name} starting from the ground up to the top.` },
          { content: `• Make sure the dice touch side-by-side with no gaps.` },
          { content: `**Step 2: Count the dice.**` },
          { content: `• Lined up from bottom to top, it takes exactly **${targetLength}** dice to measure the height.` },
          { content: `• Therefore, the ${item.name} is about **${targetLength}** dice tall.` }
        ]
      },
      remediation: `Click the dice in the tray or drag them next to the ${item.name} from bottom to top. Count how many dice fit exactly from the bottom to the top.`,
      metadata: { task: 'interactive_dice_vertical', targetLength, orientation: 'vertical', theme }
    };
  } else {
    // Horizontal mode
    return {
      type: 'fillInTheBlank',
      level: difficulty,
      questionText: 'Use dice to measure the line.',
      parts: [
        {
          type: 'non_standard_object_measurement',
          layoutMode: 'drag_to_measure',
          orientation: 'horizontal',
          unitObject: 'dice',
          targetLength: targetLength,
          unitColor: theme.primary,
          cubeColor: theme.primary,
          strokeColor: theme.stroke,
          pipColor: theme.pip,
          interactionMode: 'drag'
        },
        {
          type: 'text',
          content: 'The line is about [blank:ans] dice long.'
        }
      ],
      correctAnswer: { ans: targetLength.toString() },
      explanation: {
        sections: [
          { content: `**Step 1: Place the dice under the line.**` },
          { content: `• Add dice until they line up exactly from the start of the line to the end.` },
          { content: `• Make sure there are no gaps between the dice.` },
          { content: `**Step 2: Count the dice.**` },
          { content: `• Lined up from start to end, it takes exactly **${targetLength}** dice to measure the line.` },
          { content: `• Therefore, the line is about **${targetLength}** dice long.` }
        ]
      },
      remediation: `Click the dice in the tray or drag them to align them under the line end-to-end. Count how many dice fit exactly under the line.`,
      metadata: { task: 'interactive_dice_measurement', targetLength, orientation: 'horizontal', theme }
    };
  }
}
