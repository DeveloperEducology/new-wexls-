/**
 * Choice of Measuring Tool Engine
 */

export function generateChooseToolQuestion(rng, config = {}) {
  const tools = [
    { name: 'ruler', description: 'length or height', scenarios: ['find how long a pen is', 'measure the height of a notebook'] },
    { name: 'scale', description: 'weight or mass', scenarios: ['find how heavy an apple is', 'measure the mass of a bag of flour'] },
    { name: 'measuring cup', description: 'liquid volume or capacity', scenarios: ['measure milk for a cake recipe', 'find how much water fits in a mug'] },
    { name: 'thermometer', description: 'temperature', scenarios: ['find out if a room is warm', 'measure how hot the water is'] }
  ];

  const targetTool = rng.pick(tools);
  const scenario = rng.pick(targetTool.scenarios);

  // Distractors
  const distractorTools = tools.filter(t => t.name !== targetTool.name);
  const options = rng.shuffle([
    targetTool.name,
    distractorTools[0].name,
    distractorTools[1].name
  ]);

  return {
    type: 'mcq',
    level: 'easy',
    questionText: `Which tool is the best to use if you want to **${scenario}**?`,
    options: options,
    correctAnswerIndex: options.indexOf(targetTool.name),
    explanation: {
      sections: [
        { content: `We want to: **${scenario}**.` },
        { content: `• A **ruler** measures length or height.` },
        { content: `• A **scale** measures weight or mass.` },
        { content: `• A **measuring cup** measures liquid volume.` },
        { content: `• A **thermometer** measures temperature.` },
        { content: `Therefore, we should use a **${targetTool.name}**.` }
      ]
    },
    metadata: { task: 'choose_tool', scenario, correctTool: targetTool.name }
  };
}
