import { SeededRandom } from '../../topics/measurement/shared/utils.js';

export function generateNonStandardMeasurementQuestion(rngOrTemplate, configOrVariables = {}) {
  let rng;
  let config;

  if (rngOrTemplate && (typeof rngOrTemplate.next === 'function' || typeof rngOrTemplate.random === 'function')) {
    // Called as (rng, config)
    rng = rngOrTemplate;
    config = configOrVariables;
  } else {
    // Called as (template, variables)
    const template = rngOrTemplate || {};
    const variables = configOrVariables || {};
    const seed = variables.seed || template.seed || Date.now().toString();
    rng = new SeededRandom(seed);
    config = {
      ...(template.config || {}),
      ...variables
    };
  }

  const difficulty = config.difficulty || 'medium';
  const layoutMode = config.layoutMode || 'horizontal_row'; // vertical_stack | horizontal_row | drag_to_measure | compare_two_objects | wrong_measure_fix | add_lengths | add_heights
  const answerMode = config.answerMode || 'count'; // count | compare | error_type | sum
  const unitObject = config.unitObject || rng.pick(['cubes', 'dice', 'paperclips', 'pennies']);

  // Dynamic Theme Colors
  const themes = [
    { name: 'red', primary: '#ef4444', stroke: '#b91c1c', pip: '#ffffff' },
    { name: 'blue', primary: '#3b82f6', stroke: '#1d4ed8', pip: '#ffffff' },
    { name: 'emerald', primary: '#10b981', stroke: '#047857', pip: '#ffffff' },
    { name: 'amber', primary: '#f59e0b', stroke: '#b45309', pip: '#fffbeb' },
    { name: 'purple', primary: '#a78bfa', stroke: '#6d28d9', pip: '#ffffff' },
    { name: 'slate', primary: '#1e293b', stroke: '#0f172a', pip: '#94a3b8' }
  ];
  const theme = rng.pick(themes);
  const secondaryTheme = themes.find(t => t.name !== theme.name);

  // Pick random LKG object asset
  const items = [
    { name: 'flower', img: '/images/lkg/flower.png', vertical: true, horizontal: false },
    { name: 'flowers', img: '/images/lkg/flowers.png', vertical: true, horizontal: false },
    { name: 'hippo toy', img: '/images/lkg/hippo.png', vertical: true, horizontal: true },
    { name: 'toy car', img: '/images/lkg/car.png', vertical: false, horizontal: true },
    { name: 'duck toy', img: '/images/lkg/duck.png', vertical: true, horizontal: true },
    { name: 'frog toy', img: '/images/lkg/frog.png', vertical: true, horizontal: true },
    { name: 'butterfly drawing', img: '/images/lkg/butterfly.png', vertical: true, horizontal: true },
    { name: 'apple drawing', img: '/images/lkg/apple.png', vertical: true, horizontal: true }
  ];

  // Pick suitable items
  const isVertical = layoutMode.includes('vertical') || layoutMode.includes('height') || layoutMode === 'compare_two_objects' || config.orientation === 'vertical';
  const filteredItems = items.filter(item => isVertical ? item.vertical : item.horizontal);
  const activeItem = filteredItems.length > 0 ? rng.pick(filteredItems) : items[2];

  // Base lengths
  let targetLength = rng.int(3, 7);
  let firstLength = 0;
  let secondLength = 0;

  if (answerMode === 'sum') {
    firstLength = rng.int(2, 5);
    secondLength = rng.int(2, 5);
    targetLength = firstLength + secondLength;
  }

  // Construct parts list
  const parts = [];
  let questionText = '';
  let correctAnswer = {};
  let explanationSections = [];
  let remediation = '';
  let choices = [];
  let answerKey = '';
  let misconceptionTags = [];

  // Layout Config Schema
  const layoutConfig = {
    layoutMode,
    dimension: isVertical ? 'height' : 'length',
    orientation: isVertical ? 'vertical' : 'horizontal',
    unitObject,
    targetLength,
    firstLength,
    secondLength,
    objectImage: activeItem.img,
    objectName: activeItem.name,
    interactionMode: layoutMode === 'drag_to_measure' ? 'drag' : 'static',
    showGuideLine: !isVertical,
    showGroundLine: isVertical,
    unitColor: theme.primary,
    strokeColor: theme.stroke,
    pipColor: theme.pip,
    secondaryColor: secondaryTheme.primary,
    secondaryStroke: secondaryTheme.stroke
  };

  // Generate layouts based on answerMode
  if (answerMode === 'count') {
    // 1. COUNT PRE-PLACED OR DRAGGABLE MODE
    questionText = layoutMode === 'drag_to_measure' 
      ? `Use ${unitObject} to measure the ${layoutConfig.dimension} of the ${activeItem.name}.`
      : `How many ${unitObject} ${isVertical ? 'tall' : 'long'} is the ${activeItem.name}?`;
    
    parts.push({
      type: 'non_standard_object_measurement',
      ...layoutConfig
    });

    parts.push({
      type: 'text',
      content: `The ${activeItem.name} is about [blank:ans] ${unitObject} ${isVertical ? 'tall' : 'long'}.`
    });

    correctAnswer = { ans: targetLength.toString() };

    misconceptionTags = isVertical 
      ? ['starts_not_aligned', 'gap_between_units', 'overlap_units', 'wrong_orientation']
      : ['starts_not_aligned', 'gap_between_units', 'overlap_units'];

    explanationSections = [
      { content: `**Step 1: Look at the visual alignment.**` },
      { content: `• The ${unitObject} are lined up from the start to the end of the ${activeItem.name}.` },
      { content: `• They touch side-by-side with no gaps and no overlaps.` },
      { content: `**Step 2: Count the units.**` },
      { content: `• Counting from the start, there are exactly **${targetLength}** ${unitObject} lined up.` },
      { content: `• So, the ${activeItem.name} is about **${targetLength}** ${unitObject} ${isVertical ? 'tall' : 'long'}.` }
    ];

    remediation = `Count the ${unitObject} aligned end-to-end next to the ${activeItem.name}. Make sure there are no gaps.`;

  } else if (answerMode === 'sum') {
    // 2. ADDITION SUM MODE
    questionText = isVertical
      ? `Find the total height of the combined towers.`
      : `Find the total length of the two trains combined.`;

    parts.push({
      type: 'non_standard_object_measurement',
      ...layoutConfig
    });

    const labelFirst = isVertical ? 'bottom tower' : 'first train';
    const labelSecond = isVertical ? 'top tower' : 'second train';

    parts.push({
      type: 'text',
      content: `The ${labelFirst} is ${firstLength} ${unitObject} ${isVertical ? 'tall' : 'long'}. The ${labelSecond} is ${secondLength} ${unitObject} ${isVertical ? 'tall' : 'long'}.\n\nHow many ${unitObject} altogether? [blank:ans] ${unitObject}`
    });

    correctAnswer = { ans: targetLength.toString() };
    misconceptionTags = ['adds_only_one_part', 'counts_object_not_units'];

    explanationSections = [
      { content: `**Step 1: Identify the length of each section.**` },
      { content: `• The first colored train is **${firstLength}** ${unitObject} ${isVertical ? 'tall' : 'long'}.` },
      { content: `• The second colored train is **${secondLength}** ${unitObject} ${isVertical ? 'tall' : 'long'}.` },
      { content: `**Step 2: Add to find the total.**` },
      { content: `• Add the two parts together: **${firstLength} + ${secondLength} = ${targetLength}**.` },
      { content: `• Altogether, they are **${targetLength}** ${unitObject} ${isVertical ? 'tall' : 'long'}.` }
    ];

    remediation = `Add the count of the first color train (${firstLength}) to the count of the second color train (${secondLength}) to get the total sum.`;

  } else if (answerMode === 'compare') {
    // 3. COMPARISON MCQ MODE
    const secondaryItem = items.filter(item => item.name !== activeItem.name && (isVertical ? item.vertical : item.horizontal))[0] || items[3];
    
    questionText = isVertical
      ? `Which toy is taller: the ${activeItem.name} or the ${secondaryItem.name}?`
      : `Which object is longer: the ${activeItem.name} or the ${secondaryItem.name}?`;

    // Randomize lengths to compare
    const firstObjLength = rng.int(4, 7);
    const secondObjLength = rng.int(2, Math.max(2, firstObjLength - 1));
    const firstIsCorrect = firstObjLength > secondObjLength;

    parts.push({
      type: 'non_standard_object_measurement',
      ...layoutConfig,
      layoutMode: 'compare_two_objects',
      firstLength: firstObjLength,
      secondLength: secondObjLength,
      firstImage: activeItem.img,
      secondImage: secondaryItem.img,
      firstName: activeItem.name,
      secondName: secondaryItem.name
    });

    choices = [
      { id: 'opt_1', label: `the ${activeItem.name}`, isCorrect: firstIsCorrect },
      { id: 'opt_2', label: `the ${secondaryItem.name}`, isCorrect: !firstIsCorrect }
    ];

    if (rng.next() < 0.5) choices.reverse();
    answerKey = choices.find(c => c.isCorrect).id;

    misconceptionTags = ['starts_not_aligned', 'counts_object_not_units'];

    explanationSections = [
      { content: `**Step 1: Count the units for both.**` },
      { content: `• The ${activeItem.name} is measured using **${firstObjLength}** ${unitObject}.` },
      { content: `• The ${secondaryItem.name} is measured using **${secondObjLength}** ${unitObject}.` },
      { content: `**Step 2: Compare the numbers.**` },
      { content: `• **${firstObjLength}** is greater than **${secondObjLength}**.` },
      { content: `• Therefore, the **${firstIsCorrect ? activeItem.name : secondaryItem.name}** is ${isVertical ? 'taller' : 'longer'}.` }
    ];

    remediation = `Count how many units each object takes. The object that takes more units is the ${isVertical ? 'taller' : 'longer'} one.`;

  } else if (answerMode === 'error_type') {
    // 4. ERROR FIXING MCQ MODE
    const errors = ['gap', 'overlap', 'wrong_start', 'none'];
    const chosenError = rng.pick(errors);

    questionText = isVertical
      ? `Did Mia measure the height of the ${activeItem.name} correctly?`
      : `Did Mia measure the length of the line correctly?`;

    parts.push({
      type: 'non_standard_object_measurement',
      ...layoutConfig,
      layoutMode: 'wrong_measure_fix',
      errorType: chosenError
    });

    choices = [
      { id: 'opt_none', label: 'Yes, it is measured correctly.', isCorrect: chosenError === 'none' },
      { id: 'opt_gap', label: `No, because there are gaps between the ${unitObject}.`, isCorrect: chosenError === 'gap' },
      { id: 'opt_overlap', label: `No, because the ${unitObject} overlap each other.`, isCorrect: chosenError === 'overlap' },
      { id: 'opt_start', label: `No, because she did not start measuring at the end of the object.`, isCorrect: chosenError === 'wrong_start' }
    ];

    answerKey = choices.find(c => c.isCorrect).id;

    misconceptionTags = chosenError === 'none' ? [] : [`${chosenError}_units` === 'gap_units' ? 'gap_between_units' : `${chosenError}_units` === 'overlap_units' ? 'overlap_units' : 'starts_not_aligned'];

    let explainText = '';
    if (chosenError === 'none') {
      explainText = `Yes! The ${unitObject} are aligned perfectly end-to-end, start at the exact end of the object, and have no gaps or overlaps.`;
    } else if (chosenError === 'gap') {
      explainText = `No! There are visible spaces (gaps) between the ${unitObject}. To measure correctly, the units must touch each other without leaving gaps.`;
    } else if (chosenError === 'overlap') {
      explainText = `No! The ${unitObject} are overlapping (placed on top of each other). To measure correctly, they must lay flat side-by-side with no overlaps.`;
    } else {
      explainText = `No! She did not align the first ${unitObject} with the starting end of the object. Measurement must always begin at the exact edge of the object.`;
    }

    explanationSections = [
      { content: `**Reviewing the measurement:**` },
      { content: `• ${explainText}` }
    ];

    remediation = `Remember the rules of measuring: start at the exact end, leave no gaps, and do not overlap the units.`;
  }

  // Final Output
  const isMcq = answerMode === 'compare' || answerMode === 'error_type';
  const result = {
    type: isMcq ? 'mcq' : 'fillInTheBlank',
    level: difficulty,
    questionText,
    parts,
    explanation: {
      sections: explanationSections
    },
    remediation,
    metadata: {
      task: 'non_standard_object_measurement',
      layoutMode,
      answerMode,
      unitObject,
      targetLength,
      firstLength,
      secondLength,
      item: activeItem.name,
      misconceptionTags
    }
  };

  if (isMcq) {
    result.options = choices;
    result.answer = answerKey;
    result.correctAnswerIndex = choices.findIndex(c => c.isCorrect);
  } else {
    result.correctAnswer = correctAnswer;
  }

  return result;
}
