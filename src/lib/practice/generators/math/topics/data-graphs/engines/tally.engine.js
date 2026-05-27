class SeededRandom {
  constructor(seed) {
    this.seed = typeof seed === 'number' ? seed : parseInt(seed) || Date.now();
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }
}

const shuffle = (array, rng) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// SVG Helper to render tally marks beautifully
function buildTallySvg(value, xStart, y) {
  const numFives = Math.floor(value / 5);
  const remainder = value % 5;
  let elements = [];

  let currentX = xStart;

  // Draw groups of 5
  for (let f = 0; f < numFives; f++) {
    // Draw 4 vertical lines
    for (let v = 0; v < 4; v++) {
      elements.push(`<line x1="${currentX + v * 6}" y1="${y - 12}" x2="${currentX + v * 6}" y2="${y + 12}" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />`);
    }
    // Draw 1 diagonal line crossing them
    elements.push(`<line x1="${currentX - 2}" y1="${y + 8}" x2="${currentX + 22}" y2="${y - 8}" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" />`);
    currentX += 32; // spacing between groups
  }

  // Draw remaining vertical lines
  for (let r = 0; r < remainder; r++) {
    elements.push(`<line x1="${currentX + r * 6}" y1="${y - 12}" x2="${currentX + r * 6}" y2="${y + 12}" stroke="#1e293b" stroke-width="2.5" stroke-linecap="round" />`);
  }

  return elements.join('\n');
}

export function generateTallyLinePlotQuestion(config = {}) {
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const rng = new SeededRandom(seed);
  const task = config.forcedTask || 'data-graphs-g2-read-tally-chart';

  if (task === 'data-graphs-remedial-count-objects') {
    return generateRemedialCountObjects(rng, seed);
  }
  if (task === 'data-graphs-remedial-tally-read-5') {
    return generateRemedialTallyRead5(rng, seed);
  }
  if (task === 'data-graphs-g3-line-plot') {
    return generateLinePlot(rng, seed);
  }

  return generateTallyChart(rng, seed);
}

function generateTallyChart(rng, seed) {
  const animals = ['Birds', 'Cats', 'Dogs', 'Fish'];
  // Values between 3 and 14
  const values = animals.map(() => rng.int(3, 14));
  const data = Object.fromEntries(animals.map((a, i) => [a, values[i]]));

  const questions = [
    { type: 'read', title: 'Read tally' },
    { type: 'compare', title: 'Compare tally' }
  ];
  const qType = rng.pick(questions);

  let questionText = '';
  let correctAnswerValue = 0;
  let explanationText = '';

  if (qType.type === 'read') {
    const target = rng.pick(animals);
    questionText = `How many **${target}** are shown in the tally chart?`;
    correctAnswerValue = data[target];
    
    const fives = Math.floor(correctAnswerValue / 5);
    const rem = correctAnswerValue % 5;
    explanationText = `Look at the row for **${target}**.\n- We see **${fives}** group(s) of 5 tallies (slashed bundle) = **${fives * 5}**.\n- Plus **${rem}** individual tally lines = **${rem}**.\n\nTotal count:\n$$${fives * 5} + ${rem} = ${correctAnswerValue}$$\n\nSo, **${correctAnswerValue} ${target.toLowerCase()}** are counted.`;
  } else {
    const sorted = [...animals].sort(() => rng.next() - 0.5);
    const animalA = sorted[0];
    const animalB = sorted[1];
    const valA = data[animalA];
    const valB = data[animalB];

    if (valA > valB) {
      questionText = `How many more **${animalA}** than **${animalB}** are there?`;
      correctAnswerValue = valA - valB;
      explanationText = `Count the tallies for each animal:\n- ${animalA}: **${valA}**\n- ${animalB}: **${valB}**\n\nCalculate the difference:\n$$${valA} - ${valB} = ${correctAnswerValue}$$\n\nSo, there are **${correctAnswerValue}** more ${animalA.toLowerCase()} than ${animalB.toLowerCase()}.`;
    } else {
      questionText = `How many fewer **${animalA}** than **${animalB}** are there?`;
      correctAnswerValue = valB - valA;
      explanationText = `Count the tallies for each animal:\n- ${animalA}: **${valA}**\n- ${animalB}: **${valB}**\n\nCalculate the difference:\n$$${valB} - ${valA} = ${correctAnswerValue}$$\n\nSo, there are **${correctAnswerValue}** fewer ${animalA.toLowerCase()} than ${animalB.toLowerCase()}.`;
    }
  }

  // Draw the SVG Tally Chart
  const rows = animals.map((animal, index) => {
    const y = 62 + index * 34;
    const val = data[animal];
    const talliesSvg = buildTallySvg(val, 120, y);

    return `
      <!-- Row Border -->
      <line x1="25" y1="${y - 17}" x2="395" y2="${y - 17}" stroke="#cbd5e1" stroke-width="1" />
      <text x="40" y="${y + 5}" font-size="14" font-weight="700" fill="#334155">${animal}</text>
      ${talliesSvg}
    `;
  });

  const svg = `
    <svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 400px; display: block; margin: 0 auto;">
      <rect width="420" height="200" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
      
      <!-- Table Headers -->
      <text x="40" y="28" font-size="14" font-weight="900" fill="#0f172a">Animal</text>
      <text x="120" y="28" font-size="14" font-weight="900" fill="#0f172a">Tally Marks</text>
      <line x1="25" y1="40" x2="395" y2="40" stroke="#475569" stroke-width="2" />
      
      <!-- Rows -->
      ${rows.join('')}
      <line x1="100" y1="15" x2="100" y2="185" stroke="#cbd5e1" stroke-width="1.5" />
    </svg>
  `;

  // Options
  const answerChoices = new Set([correctAnswerValue]);
  while (answerChoices.size < 4) {
    const candidate = Math.max(0, correctAnswerValue + rng.int(-3, 4));
    if (candidate !== correctAnswerValue) {
      answerChoices.add(candidate);
    }
  }

  const sortedChoices = Array.from(answerChoices).sort((a, b) => a - b);
  const correctAnswerIndex = sortedChoices.indexOf(correctAnswerValue);

  const options = sortedChoices.map((val, idx) => ({
    id: `opt_${idx}`,
    label: String(val)
  }));

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'svg', content: svg }
    ],
    options,
    correctAnswerIndex,
    explanation: {
      sections: [
        { content: `### Let's read the tally chart:` },
        { type: 'svg', content: svg },
        { content: explanationText }
      ]
    },
    remediation: `Remember, a group of tally marks with a diagonal line through it counts as **5**. Single vertical lines count as **1** each. Group them by 5s first, then add the remaining single marks.`,
    metadata: {
      subject: 'math',
      topic: 'data-graphs',
      skillId: 'data-graphs-g2-read-tally-chart',
      templateId: 'data_graphs.tally.read',
      engine: 'tally',
      correctAnswerValue,
      seed
    }
  };
}

function generateLinePlot(rng, seed) {
  // fractional line plot: pencil lengths in inches: 1, 1 1/2, 2, 2 1/2, 3
  const labels = ['1', '1 ½', '2', '2 ½', '3'];
  const values = [1, 1.5, 2, 2.5, 3];
  
  // Counts of Xs at each tick: between 0 and 4
  const counts = [rng.int(1, 4), rng.int(0, 3), rng.int(2, 4), rng.int(0, 3), rng.int(1, 3)];
  const data = Object.fromEntries(labels.map((lbl, idx) => [lbl, counts[idx]]));

  const questions = [
    { type: 'read', title: 'Read line plot' },
    { type: 'mode', title: 'Find the most common value' },
    { type: 'compare', title: 'Compare counts' }
  ];
  const qType = rng.pick(questions);

  let questionText = '';
  let correctAnswerLabel = '';
  let explanationText = '';

  if (qType.type === 'read') {
    const targetLabel = rng.pick(['1', '2', '2 ½']);
    questionText = `How many pencils are **${targetLabel} inches** long?`;
    const ansVal = data[targetLabel];
    correctAnswerLabel = String(ansVal);
    explanationText = `Look at the line plot above the label **${targetLabel}**.\n\nWe count exactly **${ansVal}** 'X' mark(s) stacked on top of each other.\n\nSo, **${ansVal}** pencils are ${targetLabel} inches long.`;
  } else if (qType.type === 'mode') {
    questionText = `What is the most common pencil length (the length with the most pencils)?`;
    
    // Find label with max count
    let maxIdx = 0;
    for (let i = 1; i < counts.length; i++) {
      if (counts[i] > counts[maxIdx]) {
        maxIdx = i;
      }
    }
    correctAnswerLabel = labels[maxIdx] + ' inches';
    
    explanationText = `The most common length has the tallest stack of 'X' marks.\n\nLooking at the line plot:\n- 1 inch: ${counts[0]} pencils\n- 1 ½ inches: ${counts[1]} pencils\n- 2 inches: ${counts[2]} pencils\n- 2 ½ inches: ${counts[3]} pencils\n- 3 inches: ${counts[4]} pencils\n\nThe tallest stack is at **${labels[maxIdx]} inches** with **${counts[maxIdx]}** pencils.`;
  } else {
    // Compare 2 inches and 1 inch
    const valA = data['2'];
    const valB = data['1'];
    
    if (valA > valB) {
      questionText = `How many more pencils are **2 inches** long than **1 inch** long?`;
      const ansVal = valA - valB;
      correctAnswerLabel = String(ansVal);
      explanationText = `Count the 'X' marks for each length:\n- 2 inches: **${valA}** pencils\n- 1 inch: **${valB}** pencils\n\nCalculate the difference:\n$$${valA} - ${valB} = ${ansVal}$$\n\nSo, there are **${ansVal}** more pencils that are 2 inches long.`;
    } else {
      questionText = `How many more pencils are **1 inch** long than **2 inches** long?`;
      const ansVal = valB - valA;
      correctAnswerLabel = String(ansVal);
      explanationText = `Count the 'X' marks for each length:\n- 1 inch: **${valB}** pencils\n- 2 inches: **${valA}** pencils\n\nCalculate the difference:\n$$${valB} - ${valA} = ${ansVal}$$\n\nSo, there are **${ansVal}** more pencils that are 1 inch long.`;
    }
  }

  // Draw the SVG Line Plot
  const ticks = [];
  const xStart = 60;
  const xSpacing = 70;
  
  labels.forEach((lbl, idx) => {
    const x = xStart + idx * xSpacing;
    const count = counts[idx];
    
    // Draw tick mark
    ticks.push(`
      <line x1="${x}" y1="140" x2="${x}" y2="150" stroke="#334155" stroke-width="2" />
      <text x="${x}" y="170" font-size="13" font-weight="700" fill="#475569" text-anchor="middle">${lbl}</text>
    `);
    
    // Draw stacked Xs
    for (let i = 0; i < count; i++) {
      const y = 126 - i * 18;
      ticks.push(`
        <text x="${x}" y="${y}" font-size="14" font-weight="900" fill="#3b82f6" text-anchor="middle">X</text>
      `);
    }
  });

  const svg = `
    <svg viewBox="0 0 420 200" xmlns="http://www.w3.org/2000/svg" style="max-width: 400px; display: block; margin: 0 auto;">
      <rect width="420" height="200" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
      <text x="210" y="24" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">Pencil Lengths (inches)</text>
      
      <!-- Number Line -->
      <line x1="30" y1="145" x2="390" y2="145" stroke="#334155" stroke-width="2.5" />
      <path d="M 30,145 L 36,140 M 30,145 L 36,150" stroke="#334155" stroke-width="2" />
      <path d="M 390,145 L 384,140 M 390,145 L 384,150" stroke="#334155" stroke-width="2" />
      
      <!-- Ticks & Xs -->
      ${ticks.join('')}
    </svg>
  `;

  // Options
  let options = [];
  if (qType.type === 'mode') {
    options = labels.map((lbl, idx) => ({
      id: `opt_${idx}`,
      label: `${lbl} inches`
    }));
  } else {
    options = ['0', '1', '2', '3', '4'].map((val, idx) => ({
      id: `opt_${idx}`,
      label: val
    }));
  }

  const correctAnswerIndex = options.findIndex(o => o.label === correctAnswerLabel);

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'svg', content: svg }
    ],
    options,
    correctAnswerIndex,
    explanation: {
      sections: [
        { content: `### Let's analyze the line plot:` },
        { type: 'svg', content: svg },
        { content: explanationText }
      ]
    },
    remediation: `A line plot displays data as 'X' marks stacked over a number line. To find the value for any number, count the number of 'X's stacked directly above that number.`,
    metadata: {
      subject: 'math',
      topic: 'data-graphs',
      skillId: 'data-graphs-g3-line-plot',
      templateId: 'data_graphs.line_plot.read',
      engine: 'tally',
      correctAnswerLabel,
      seed
    }
  };
}

function generateRemedialCountObjects(rng, seed) {
  const count = rng.int(2, 6);
  
  // Draw count shapes in a box
  const shapesSvg = [];
  for (let i = 0; i < count; i++) {
    const cx = 50 + (i % 3) * 45;
    const cy = 55 + Math.floor(i / 3) * 45;
    shapesSvg.push(`<circle cx="${cx}" cy="${cy}" r="16" fill="#3b82f6" stroke="#1e3a8a" stroke-width="1.5" />`);
  }
  
  const questionText = `Count the blue circles in the box. How many are there?`;

  const svg = `
    <svg viewBox="0 0 200 120" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
      <rect width="200" height="120" rx="8" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="2" />
      ${shapesSvg.join('')}
    </svg>
  `;

  const choices = ['2', '3', '4', '5', '6'];
  const options = choices.map((val, idx) => ({
    id: `opt_${idx}`,
    label: val
  }));
  
  const correctAnswerIndex = choices.indexOf(String(count));

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'svg', content: svg }
    ],
    options,
    correctAnswerIndex,
    explanation: {
      sections: [
        { content: `### Let's count them:` },
        { content: `Count each circle in the box one-by-one:\n\nThere are exactly **${count}** circles.` }
      ]
    },
    remediation: `Point to each blue circle in the box and count: 1, 2, 3... and find the final number.`,
    metadata: {
      subject: 'math',
      topic: 'data-graphs',
      skillId: 'data-graphs-remedial-count-objects',
      templateId: 'data_graphs.remedial.count',
      engine: 'tally',
      correctAnswerValue: count,
      seed
    }
  };
}

function generateRemedialTallyRead5(rng, seed) {
  const count = rng.int(1, 5);
  const talliesSvg = buildTallySvg(count, 50, 50);

  const questionText = `How many tally marks are shown below?`;

  const svg = `
    <svg viewBox="0 0 150 100" xmlns="http://www.w3.org/2000/svg" style="max-width: 150px; display: block; margin: 0 auto;">
      <rect width="150" height="100" rx="8" fill="#f8fafc" stroke="#cbd5e1" stroke-width="2" />
      ${talliesSvg}
    </svg>
  `;

  const choices = ['1', '2', '3', '4', '5'];
  const options = choices.map((val, idx) => ({
    id: `opt_${idx}`,
    label: val
  }));
  
  const correctAnswerIndex = choices.indexOf(String(count));

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'svg', content: svg }
    ],
    options,
    correctAnswerIndex,
    explanation: {
      sections: [
        { content: `### Tally Marks Count:` },
        { content: count === 5 
          ? `We see 4 vertical lines crossed by 1 diagonal line. This bundle represents exactly **5**.` 
          : `Count the vertical lines: there are exactly **${count}** lines.`
        }
      ]
    },
    remediation: `Count each vertical line. If you see a diagonal line crossing through a bundle of lines, it is a full bundle of **5**.`,
    metadata: {
      subject: 'math',
      topic: 'data-graphs',
      skillId: 'data-graphs-remedial-tally-read-5',
      templateId: 'data_graphs.remedial.tally',
      engine: 'tally',
      correctAnswerValue: count,
      seed
    }
  };
}
