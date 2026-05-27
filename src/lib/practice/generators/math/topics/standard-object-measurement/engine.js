// Standard Object Measurement Topic Engine
// Simulates all variations of the non_standard_object_measurement template

function getSeedInt(seed) {
  let hash = 0;
  const s = String(seed);
  for (let i = 0; i < s.length; i++) {
    hash = (hash << 5) - hash + s.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

const configs = {
  'som-g1-measure-length': {
    layoutFamily: 'measurement',
    layoutMode: 'drag_to_measure',
    orientation: 'horizontal',
    unitObject: 'cubes',
    targetLength: 5,
    firstLength: 0,
    secondLength: 0,
    objectImage: '/images/lkg/car.png',
    objectName: 'toy car',
    answerMode: 'count',
    questionText: 'Use cubes to measure the length of the toy car.',
    blankText: 'The toy car is about [blank:ans] cubes long.',
    answerKey: { ans: '5' }
  },
  'som-g1-measure-height': {
    layoutFamily: 'measurement',
    layoutMode: 'drag_to_measure',
    orientation: 'vertical',
    unitObject: 'dice',
    targetLength: 6,
    firstLength: 0,
    secondLength: 0,
    objectImage: '/images/lkg/flower.png',
    objectName: 'flower',
    answerMode: 'count',
    questionText: 'Use dice to measure the height of the flower.',
    blankText: 'The flower is about [blank:ans] dice tall.',
    answerKey: { ans: '6' }
  },
  'som-g1-compare': {
    layoutFamily: 'comparison',
    layoutMode: 'compare_two_objects',
    orientation: 'vertical',
    unitObject: 'paperclips',
    targetLength: 7,
    firstLength: 6,
    secondLength: 4,
    objectImage: '',
    objectName: '',
    firstImage: '/images/lkg/duck.png',
    secondImage: '/images/lkg/frog.png',
    firstName: 'duck toy',
    secondName: 'frog toy',
    answerMode: 'compare',
    questionText: 'Which toy is taller: the duck toy or the frog toy?',
    options: [
      { id: 'opt_1', label: 'the duck toy', isCorrect: true },
      { id: 'opt_2', label: 'the frog toy', isCorrect: false }
    ],
    answer: 'opt_1'
  },
  'som-g1-error-spotting': {
    layoutFamily: 'measurement',
    layoutMode: 'wrong_measure_fix',
    orientation: 'horizontal',
    unitObject: 'pennies',
    targetLength: 5,
    firstLength: 0,
    secondLength: 0,
    errorType: 'gap',
    objectImage: '',
    objectName: 'pencil',
    answerMode: 'error_type',
    questionText: 'Did Mia measure the length of the pencil correctly?',
    options: [
      { id: 'opt_none', label: 'Yes, it is measured correctly.', isCorrect: false },
      { id: 'opt_gap', label: 'No, because there are gaps between the pennies.', isCorrect: true },
      { id: 'opt_overlap', label: 'No, because the pennies overlap each other.', isCorrect: false },
      { id: 'opt_start', label: 'No, because she did not start measuring at the end of the pencil.', isCorrect: false }
    ],
    answer: 'opt_gap'
  },
  'som-g1-add-lengths': {
    layoutFamily: 'measurement',
    layoutMode: 'add_lengths',
    orientation: 'horizontal',
    unitObject: 'cubes',
    targetLength: 7,
    firstLength: 4,
    secondLength: 3,
    objectImage: '',
    objectName: '',
    answerMode: 'sum',
    questionText: 'Find the total length of the two trains combined.',
    blankText: 'The first train is 4 cubes long. The second train is 3 cubes long.\n\nHow many cubes altogether? [blank:ans] cubes',
    answerKey: { ans: '7' }
  },
  'som-g1-add-heights': {
    layoutFamily: 'measurement',
    layoutMode: 'add_heights',
    orientation: 'vertical',
    unitObject: 'dice',
    targetLength: 6,
    firstLength: 2,
    secondLength: 4,
    objectImage: '',
    objectName: '',
    answerMode: 'sum',
    questionText: 'Find the total height of the combined towers.',
    blankText: 'The bottom tower is 2 dice tall. The top tower is 4 dice tall.\n\nHow many dice altogether? [blank:ans] dice',
    answerKey: { ans: '6' }
  },
  'som-g1-static-length': {
    layoutFamily: 'measurement',
    layoutMode: 'horizontal_row',
    orientation: 'horizontal',
    unitObject: 'paperclips',
    targetLength: 4,
    firstLength: 0,
    secondLength: 0,
    objectImage: '/images/lkg/hippo.png',
    objectName: 'hippo toy',
    answerMode: 'count',
    questionText: 'How many paperclips long is the hippo toy?',
    blankText: 'The hippo toy is about [blank:ans] paperclips long.',
    answerKey: { ans: '4' }
  },
  'som-g1-static-height': {
    layoutFamily: 'measurement',
    layoutMode: 'vertical_stack',
    orientation: 'vertical',
    unitObject: 'pennies',
    targetLength: 5,
    firstLength: 0,
    secondLength: 0,
    objectImage: '/images/lkg/apple.png',
    objectName: 'apple drawing',
    answerMode: 'count',
    questionText: 'How many pennies tall is the apple drawing?',
    blankText: 'The apple drawing is about [blank:ans] pennies tall.',
    answerKey: { ans: '5' }
  }
};

export function generateSOMQuestion(config = {}) {
  const skill = config.logic_type || config.forcedTask || 'som-g1-measure-length';
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const seedInt = getSeedInt(seed);

  let itemConfig;

  if (skill.startsWith('som-g1-copy-cubes')) {
    let targetLimit = 5;
    if (skill.endsWith('-to-3')) targetLimit = 3;
    else if (skill.endsWith('-to-10')) targetLimit = 10;

    let total = 5;
    if (targetLimit === 3) {
      total = 2 + (seedInt % 2); // 2 or 3
    } else if (targetLimit === 5) {
      total = 3 + (seedInt % 3); // 3, 4, or 5
    } else {
      total = 5 + (seedInt % 6); // 5, 6, 7, 8, 9, or 10
    }

    const prefilled = 1 + (seedInt % (total - 1));
    const addCount = total - prefilled;

    itemConfig = {
      layoutFamily: 'measurement',
      layoutMode: 'drag_to_measure',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: total,
      firstLength: prefilled,
      secondLength: 0,
      interactionMode: 'drag',
      objectImage: '',
      objectName: '',
      answerMode: 'count',
      questionText: `${prefilled === 1 ? 'Here is' : 'Here are'} ${prefilled} ${prefilled === 1 ? 'cube' : 'cubes'} in the boxes. Add ${addCount} more ${addCount === 1 ? 'cube' : 'cubes'}.`,
      blankText: `How many cubes in total? [blank:ans]`,
      answerKey: { ans: String(total) }
    };
  } else if (skill.startsWith('som-g1-pattern-')) {
    const isAbab = skill.includes('abab');
    const total = isAbab ? 7 : 8;
    const prefilled = 4;
    const prefilledColors = isAbab 
      ? ['#ef4444', '#3b82f6', '#ef4444', '#3b82f6']
      : ['#ef4444', '#ef4444', '#3b82f6', '#3b82f6'];
    const prefilledStrokes = isAbab
      ? ['#b91c1c', '#1d4ed8', '#b91c1c', '#1d4ed8']
      : ['#b91c1c', '#b91c1c', '#1d4ed8', '#1d4ed8'];
      
    itemConfig = {
      layoutFamily: 'patterns',
      patternGroupSize: isAbab ? 2 : 4,
      patternRule: isAbab ? 'ABAB' : 'AABB',
      layoutMode: 'drag_to_measure',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: total,
      firstLength: prefilled,
      secondLength: 0,
      interactionMode: 'drag',
      objectImage: '',
      objectName: '',
      answerMode: 'count',
      prefilledColors,
      prefilledStrokes,
      trayColors: ['#ef4444', '#3b82f6'],
      questionText: `Here is a repeating ${isAbab ? 'Red-Blue-Red-Blue' : 'Red-Red-Blue-Blue'} pattern. Drag cubes to complete the pattern.`,
      blankText: `How many cubes in total will there be when the pattern is complete? [blank:ans]`,
      answerKey: { ans: String(total) }
    };
  } else if (skill === 'som-g1-sub-takeaway') {
    const total = 5 + (seedInt % 5); // 5 to 9
    const subCount = 1 + ((seedInt >> 2) % (total - 3)); // 1 to total-3
    const left = total - subCount;
    itemConfig = {
      layoutFamily: 'subtraction',
      subCount: subCount,
      layoutMode: 'drag_to_measure',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: total,
      firstLength: total,
      secondLength: 0,
      interactionMode: 'drag',
      objectImage: '',
      objectName: '',
      answerMode: 'count',
      questionText: `Here is a train of ${total} cubes in the boxes. Click ${subCount} ${subCount === 1 ? 'cube' : 'cubes'} to take ${subCount === 1 ? 'it' : 'them'} away.`,
      blankText: `How many cubes are left? [blank:ans]`,
      answerKey: { ans: String(left) }
    };
  } else if (skill.includes('place-value')) {
    let thousands = 0;
    let hundreds = 0;
    let tens = 0;
    let ones = 0;
    let total = 0;
    let questionText = '';
    let blankText = '';

    if (skill === 'som-g1-place-value-blocks') {
      tens = 1;
      ones = 1 + (seedInt % 9); // 1 to 9
      total = 10 + ones;
      questionText = 'Look at the blocks. What number do they show?';
      blankText = `The number is [blank:ans]`;
    } else if (skill === 'som-g1-place-value-50') {
      tens = 1 + (seedInt % 5); // 1 to 5 tens
      ones = 1 + ((seedInt >> 2) % 9); // 1 to 9 ones
      total = tens * 10 + ones;
      questionText = 'Look at the blocks. What number do they show?';
      blankText = `The number is [blank:ans]`;
    } else if (skill === 'som-g2-place-value-100') {
      tens = 1 + (seedInt % 9); // 1 to 9 tens
      ones = 1 + ((seedInt >> 2) % 9); // 1 to 9 ones
      total = tens * 10 + ones;
      questionText = 'Look at the blocks. What number do they show?';
      blankText = `The number is [blank:ans]`;
    } else if (skill === 'som-g2-place-value-hundreds') {
      hundreds = 1 + (seedInt % 9); // 1 to 9 hundreds
      tens = (seedInt >> 2) % 10; // 0 to 9 tens
      ones = (seedInt >> 4) % 10; // 0 to 9 ones
      total = hundreds * 100 + tens * 10 + ones;
      questionText = 'Look at the blocks. What number do they show?';
      blankText = `The number is [blank:ans]`;
    } else if (skill === 'som-g3-place-value-thousands') {
      thousands = 1 + (seedInt % 9); // 1 to 9 thousands
      hundreds = (seedInt >> 2) % 10; // 0 to 9 hundreds
      tens = (seedInt >> 4) % 10; // 0 to 9 tens
      ones = (seedInt >> 6) % 10; // 0 to 9 ones
      total = thousands * 1000 + hundreds * 100 + tens * 10 + ones;
      questionText = 'Look at the blocks. What number do they show?';
      blankText = `The number is [blank:ans]`;
    }

    itemConfig = {
      layoutFamily: 'place_value',
      layoutMode: 'add_lengths',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: total,
      firstLength: tens * 10 || hundreds * 100 || thousands * 1000,
      secondLength: ones,
      interactionMode: 'static',
      objectImage: '',
      objectName: '',
      answerMode: 'count',
      questionText,
      blankText,
      answerKey: { ans: String(total) },
      thousands,
      hundreds,
      tens,
      ones
    };
  } 
  // Inside generateSOMQuestion(config)
 else if (skill === 'som-g2-custom-skill') {
  const count = 1 + (seedInt % 10);
  itemConfig = {
    layoutFamily: 'ten_frame',
    layoutMode: 'horizontal_row',
    orientation: 'horizontal',
    targetLength: count,
    firstLength: count,
    frameCount: 1,
    frameMax: 10,
    answerMode: 'count',
    questionText: 'Count the stars in the ten frame:',
    blankText: 'There are [blank:ans] stars.',
    answerKey: { ans: String(count) }
  };
} else if (skill === 'som-g1-fraction-strips') {
    const parts = 2 + (seedInt % 3); // 2, 3, or 4 equal parts
    const partSize = 2 + ((seedInt >> 2) % 3); // 2, 3, or 4 cubes per part
    const total = parts * partSize;
    itemConfig = {
      layoutFamily: 'comparison',
      layoutMode: 'add_lengths',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: total,
      firstLength: partSize,
      secondLength: partSize,
      interactionMode: 'static',
      objectImage: '',
      objectName: '',
      answerMode: 'count',
      questionText: `Here is a fraction bar of length ${total}. It is divided into ${parts} equal parts of ${partSize} ${partSize === 1 ? 'cube' : 'cubes'} each.`,
      blankText: `Each part is what fraction of the whole? 1/[blank:ans]`,
      answerKey: { ans: String(parts) }
    };
  } else if (skill === 'som-g1-multiplication-array') {
    const groupCount = 2 + (seedInt % 3); // 2, 3, or 4 groups
    const groupSize = 2 + ((seedInt >> 2) % 3); // 2, 3, or 4 size
    const total = groupCount * groupSize;
    const additionExpr = Array.from({ length: groupCount }).map(() => groupSize).join(' + ');
    itemConfig = {
      layoutFamily: 'equal_groups',
      groupCount: groupCount,
      groupSize: groupSize,
      layoutMode: 'compare_two_objects',
      orientation: 'vertical',
      unitObject: 'cubes',
      targetLength: total,
      firstLength: groupSize,
      secondLength: groupSize,
      firstImage: '',
      secondImage: '',
      firstName: 'tower 1',
      secondName: 'tower 2',
      answerMode: 'count',
      questionText: `We can write multiplication as repeated addition. Look at the ${groupCount} towers of ${groupSize} cubes each.`,
      blankText: `${additionExpr} = [blank:ans]`,
      answerKey: { ans: String(total) }
    };
  } else if (skill === 'som-g1-graphing-bars') {
    const firstLength = 1 + (seedInt % 8); // 1 to 8
    let secondLength = 1 + ((seedInt + 3) % 8); // 1 to 8
    if (secondLength === firstLength) {
      secondLength = (secondLength % 8) + 1;
    }
    const askApples = (seedInt % 2) === 0;
    itemConfig = {
      layoutFamily: 'graphs',
      layoutMode: 'compare_two_objects',
      orientation: 'vertical',
      unitObject: 'cubes',
      targetLength: 8,
      firstLength: firstLength,
      secondLength: secondLength,
      firstImage: '',
      secondImage: '',
      firstName: 'Apples',
      secondName: 'Bananas',
      answerMode: 'count',
      questionText: `Look at the block graph showing favorite fruits: Apples vs Bananas.`,
      blankText: askApples
        ? `How many children chose Apples? [blank:ans] children`
        : `How many children chose Bananas? [blank:ans] children`,
      answerKey: { ans: String(askApples ? firstLength : secondLength) }
    };
  } else if (skill === 'som-g1-sub-compare') {
    const firstLength = 6 + (seedInt % 5); // 6 to 10
    const secondLength = 3 + ((seedInt >> 2) % (firstLength - 4)); // 3 to firstLength-2
    const diff = firstLength - secondLength;
    itemConfig = {
      layoutFamily: 'comparison',
      layoutMode: 'compare_two_objects',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: firstLength,
      firstLength: firstLength,
      secondLength: secondLength,
      firstName: 'red train',
      secondName: 'blue train',
      answerMode: 'count',
      questionText: `The red block train is ${firstLength} cubes long. The blue block train is ${secondLength} cubes long.`,
      blankText: `How many more cubes are in the red train than the blue train? [blank:ans]`,
      answerKey: { ans: String(diff) }
    };
  } else if (skill.startsWith('som-g1-ten-frame') || skill.startsWith('som-g1-ten-frame')) {
    let maxVal = 5;
    if (skill === 'som-g1-ten-frame-10') maxVal = 10;
    if (skill === 'som-g1-ten-frame-20') maxVal = 20;
    const count = 1 + (seedInt % maxVal); // 1 to maxVal
    const frameCount = maxVal <= 10 ? 1 : 2;
    itemConfig = {
      layoutFamily: 'ten_frame',
      layoutMode: 'horizontal_row',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: count,
      firstLength: count,
      secondLength: 0,
      frameCount,
      frameMax: maxVal,
      objectImage: '', objectName: '',
      answerMode: 'count',
      questionText: 'Look at the ten frame. How many dots do you see?',
      blankText: 'There are [blank:ans] dots.',
      answerKey: { ans: String(count) }
    };
  } else if (skill.startsWith('som-g1-number-bonds')) {
    const maxVal = skill.endsWith('-5') ? 5 : 10;
    const whole = 2 + (seedInt % (maxVal - 1)); // 2 to maxVal
    const partA = 1 + ((seedInt >> 2) % (whole - 1)); // 1 to whole-1
    const partB = whole - partA;
    const askLeft = (seedInt % 2) === 0;
    itemConfig = {
      layoutFamily: 'number_bonds',
      layoutMode: 'compare_two_objects',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: whole,
      firstLength: partA,
      secondLength: partB,
      bondWhole: whole,
      bondPartA: askLeft ? null : partA,
      bondPartB: askLeft ? partB : null,
      objectImage: '', objectName: '',
      answerMode: 'count',
      questionText: `The whole is ${whole}. One part is ${askLeft ? partB : partA}. What is the other part?`,
      blankText: 'The missing part is [blank:ans].',
      answerKey: { ans: String(askLeft ? partA : partB) }
    };
  } else if (skill.startsWith('som-g1-number-line') || skill.startsWith('som-g2-number-line')) {
    let lineMax = 10;
    if (skill === 'som-g1-number-line-20') lineMax = 20;
    if (skill === 'som-g2-number-line-100') lineMax = 100;
    const step = lineMax === 100 ? 10 : 1;
    const markerPos = step + ((seedInt % ((lineMax / step) - 1)) * step); // never 0, never max
    itemConfig = {
      layoutFamily: 'number_line',
      layoutMode: 'horizontal_row',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: lineMax,
      firstLength: markerPos,
      secondLength: 0,
      lineMax,
      lineStep: step,
      markerPos,
      objectImage: '', objectName: '',
      answerMode: 'count',
      questionText: 'Look at the number line. What number is the marker pointing to?',
      blankText: 'The marker is at [blank:ans].',
      answerKey: { ans: String(markerPos) }
    };
  } else if (skill.startsWith('som-g2-area-grid')) {
    const isClick = skill === 'som-g2-area-grid-click';
    const maxDim = skill === 'som-g2-area-grid-small' ? 4 : (isClick ? 5 : 6);
    const minDim = 2;
    const gridW = minDim + (seedInt % (maxDim - minDim + 1));
    const gridH = minDim + ((seedInt >> 2) % (maxDim - minDim + 1));
    const area = gridW * gridH;
    itemConfig = {
      layoutFamily: 'area_grid',
      layoutMode: 'horizontal_row',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: area,
      firstLength: gridW,
      secondLength: gridH,
      gridW,
      gridH,
      interactionMode: isClick ? 'click' : 'static',
      objectImage: '', objectName: '',
      answerMode: 'count',
      questionText: isClick
        ? `Click every square to fill this ${gridW}×${gridH} rectangle. How many squares are there?`
        : `Count the squares inside the rectangle.`,
      blankText: isClick
        ? 'I filled [blank:ans] squares.'
        : 'There are [blank:ans] squares.',
      answerKey: { ans: String(area) }
    };
  } else if (skill === 'som-g2-division-sharing') {
    const groups = 2 + (seedInt % 3); // 2, 3, or 4 groups
    const perGroup = 2 + ((seedInt >> 2) % 4); // 2, 3, 4, or 5 per group
    const total = groups * perGroup;
    itemConfig = {
      layoutFamily: 'division',
      layoutMode: 'compare_two_objects',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: total,
      firstLength: perGroup,
      secondLength: groups,
      groupCount: groups,
      groupSize: perGroup,
      objectImage: 'https://cdn-icons-png.flaticon.com/512/6363/6363577.png', objectName: 'bird',
      answerMode: 'count',
      questionText: `${total} apples are shared equally into ${groups} groups. How many apples in each group?`,
      blankText: 'Each group gets [blank:ans] apples.',
      answerKey: { ans: String(perGroup) }
    };
  } else if (skill === 'som-g1-money-coins') {
    // coins: ₹1=1, ₹2=2, ₹5=5
    const coinTypes = [1, 2, 5];
    const coins = [];
    let total = 0;
    const coinCount = 3 + (seedInt % 4); // 3 to 6 coins
    for (let i = 0; i < coinCount; i++) {
      const coin = coinTypes[(seedInt + i * 7) % 3];
      coins.push(coin);
      total += coin;
    }
    itemConfig = {
      layoutFamily: 'money',
      layoutMode: 'horizontal_row',
      orientation: 'horizontal',
      unitObject: 'pennies',
      targetLength: total,
      firstLength: coinCount,
      secondLength: 0,
      coins,
      objectImage: '', objectName: '',
      answerMode: 'count',
      questionText: 'Count the coins. How much money is there?',
      blankText: 'Total = ₹[blank:ans]',
      answerKey: { ans: String(total) }
    };
  } else if (skill === 'som-g1-odd-even') {
    const num = 2 + (seedInt % 9); // 2 to 10
    const isEven = num % 2 === 0;
    itemConfig = {
      layoutFamily: 'odd_even',
      layoutMode: 'horizontal_row',
      orientation: 'horizontal',
      unitObject: 'cubes',
      targetLength: num,
      firstLength: num,
      secondLength: 0,
      oddEvenCount: num,
      objectImage: '', objectName: '',
      answerMode: 'odd_even_mcq',
      questionText: `There are ${num} cubes. Are they odd or even?`,
      options: [
        { id: 'opt_even', label: 'Even', isCorrect: isEven },
        { id: 'opt_odd', label: 'Odd', isCorrect: !isEven }
      ],
      answer: isEven ? 'opt_even' : 'opt_odd'
    };
  } else {
    itemConfig = configs[skill] || configs['som-g1-measure-length'];
  } 
  
  const isMcq = itemConfig.answerMode === 'compare' || itemConfig.answerMode === 'error_type' || itemConfig.answerMode === 'odd_even_mcq';

  const result = {
    id: `som-${skill}`,
    type: isMcq ? 'mcq' : 'fillInTheBlank',
    questionText: itemConfig.questionText,
    parts: [
      {
        type: 'non_standard_object_measurement',
        layoutMode: itemConfig.layoutMode,
        dimension: itemConfig.orientation === 'vertical' ? 'height' : 'length',
        orientation: itemConfig.orientation || 'horizontal',
        unitObject: itemConfig.unitObject,
        targetLength: itemConfig.targetLength,
        firstLength: itemConfig.firstLength,
        secondLength: itemConfig.secondLength,
        objectImage: itemConfig.objectImage,
        objectName: itemConfig.objectName,
        interactionMode: itemConfig.interactionMode || (itemConfig.layoutMode === 'drag_to_measure' ? 'drag' : 'static'),
        errorType: itemConfig.errorType || 'none',
        firstImage: itemConfig.firstImage,
        secondImage: itemConfig.secondImage,
        firstName: itemConfig.firstName,
        secondName: itemConfig.secondName,
        unitColor: '#ef4444',
        strokeColor: '#b91c1c',
        pipColor: '#ffffff',
        secondaryColor: '#3b82f6',
        secondaryStroke: '#1d4ed8',
        prefilledColors: itemConfig.prefilledColors,
        prefilledStrokes: itemConfig.prefilledStrokes,
        trayColors: itemConfig.trayColors,
        layoutFamily: itemConfig.layoutFamily,
        patternGroupSize: itemConfig.patternGroupSize,
        patternRule: itemConfig.patternRule,
        groupCount: itemConfig.groupCount,
        groupSize: itemConfig.groupSize,
        subCount: itemConfig.subCount,
        thousands: itemConfig.thousands,
        hundreds: itemConfig.hundreds,
        tens: itemConfig.tens,
        ones: itemConfig.ones,
        // Ten frame
        frameCount: itemConfig.frameCount,
        frameMax: itemConfig.frameMax,
        // Number bonds
        bondWhole: itemConfig.bondWhole,
        bondPartA: itemConfig.bondPartA,
        bondPartB: itemConfig.bondPartB,
        // Number line
        lineMax: itemConfig.lineMax,
        lineStep: itemConfig.lineStep,
        markerPos: itemConfig.markerPos,
        // Area grid
        gridW: itemConfig.gridW,
        gridH: itemConfig.gridH,
        // Money
        coins: itemConfig.coins,
        // Odd/even
        oddEvenCount: itemConfig.oddEvenCount
      }
    ],
    solution: {
      sections: [
        { type: 'text', content: `This question demonstrates the '${itemConfig.layoutMode}' layout.` }
      ]
    }
  };

  if (isMcq) {
    result.options = itemConfig.options;
    result.answer = itemConfig.answer;
    result.correctAnswerIndex = itemConfig.options.findIndex(o => o.isCorrect);
  } else {
    result.parts.push({
      type: 'text',
      content: itemConfig.blankText,
      isVertical: true
    });
    result.answer = itemConfig.answerKey;
    result.correctAnswerText = JSON.stringify(itemConfig.answerKey);
  }

  return result;
}
