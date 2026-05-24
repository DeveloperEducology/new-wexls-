/**
 * Interactive Dice Measurement Engine
 */

export function generateDiceMeasurementQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  
  // Decide a target length for the line in terms of dice (e.g. between 4 and 7)
  const targetLength = rng.int(4, 7);

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: 'Use dice to measure the line.',
    parts: [
      {
        type: 'interactive_dice_measurement',
        targetLength: targetLength,
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
    remediation: `Click the '+' button or click dice in the storage tray to place them under the line. Count how many dice fit exactly under the line.`,
    metadata: { task: 'interactive_dice_measurement', targetLength }
  };
}
