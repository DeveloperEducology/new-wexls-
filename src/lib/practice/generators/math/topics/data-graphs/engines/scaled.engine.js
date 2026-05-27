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

export function generateScaledGraphQuestion(config = {}) {
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const rng = new SeededRandom(seed);
  const task = config.forcedTask || 'data-graphs-g2-scaled-bar-graph';

  if (task === 'data-graphs-g2-scaled-pictograph') {
    return generateScaledPictograph(rng, seed);
  }

  return generateScaledBarGraph(rng, seed);
}

function generateScaledBarGraph(rng, seed) {
  const categories = ['Red', 'Blue', 'Green', 'Yellow'];
  const colors = ['#f87171', '#60a5fa', '#34d399', '#fbbf24'];

  const scale = rng.pick([2, 5, 10]);
  
  // Pick values that are multiples of scale
  const values = categories.map(() => rng.int(1, 6) * scale);
  const data = Object.fromEntries(categories.map((c, i) => [c, values[i]]));

  const questions = [
    { type: 'difference', title: 'Compare categories' },
    { type: 'total', title: 'Find the total' },
    { type: 'read', title: 'Read values' }
  ];
  const qType = rng.pick(questions);

  let questionText = '';
  let correctAnswerValue = 0;
  let explanationText = '';

  if (qType.type === 'difference') {
    const sorted = [...categories].sort(() => rng.next() - 0.5);
    const catA = sorted[0];
    const catB = sorted[1];
    const valA = data[catA];
    const valB = data[catB];

    if (valA > valB) {
      questionText = `How many more students chose **${catA}** than **${catB}**?`;
      correctAnswerValue = valA - valB;
      explanationText = `From the graph:\n- **${catA}** has **${valA}** votes.\n- **${catB}** has **${valB}** votes.\n\nCalculate the difference:\n$$${valA} - ${valB} = ${correctAnswerValue}$$\n\nSo, **${correctAnswerValue}** more students chose ${catA}.`;
    } else {
      questionText = `How many fewer students chose **${catA}** than **${catB}**?`;
      correctAnswerValue = valB - valA;
      explanationText = `From the graph:\n- **${catA}** has **${valA}** votes.\n- **${catB}** has **${valB}** votes.\n\nCalculate the difference:\n$$${valB} - ${valA} = ${correctAnswerValue}$$\n\nSo, **${correctAnswerValue}** fewer students chose ${catA}.`;
    }
  } else if (qType.type === 'total') {
    questionText = `How many students voted in total for their favorite color?`;
    correctAnswerValue = values.reduce((sum, val) => sum + val, 0);
    
    const sumString = values.join(' + ');
    explanationText = `Add the values for all categories together:\n- Red: **${data.Red}**\n- Blue: **${data.Blue}**\n- Green: **${data.Green}**\n- Yellow: **${data.Yellow}**\n\nTotal votes:\n$$${sumString} = ${correctAnswerValue}$$\n\nThere are **${correctAnswerValue}** total votes.`;
  } else {
    const targetCat = rng.pick(categories);
    questionText = `How many students chose **${targetCat}** as their favorite color?`;
    correctAnswerValue = data[targetCat];
    explanationText = `Look at the bar for **${targetCat}** and trace it to the y-axis.\nThe top of the bar aligns with the line for **${correctAnswerValue}**.\n\nSo, **${correctAnswerValue}** students chose ${targetCat}.`;
  }

  // Draw the SVG bar graph
  const gridLines = [];
  const maxVal = 6 * scale;
  for (let i = 0; i <= 6; i++) {
    const val = i * scale;
    const y = 180 - i * 24;
    gridLines.push(`
      <line x1="45" y1="${y}" x2="380" y2="${y}" stroke="#e2e8f0" stroke-width="1" />
      <text x="35" y="${y + 4}" font-size="12" fill="#64748b" text-anchor="end">${val}</text>
    `);
  }

  const bars = categories.map((cat, index) => {
    const x = 70 + index * 80;
    const val = data[cat];
    const barHeight = (val / scale) * 24;
    const y = 180 - barHeight;
    const color = colors[index];

    return `
      <rect x="${x}" y="${y}" width="40" height="${barHeight}" rx="4" fill="${color}" stroke="#334155" stroke-width="1.5" />
      <text x="${x + 20}" y="198" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">${cat}</text>
    `;
  });

  const svg = `
    <svg viewBox="0 0 420 230" xmlns="http://www.w3.org/2000/svg" style="max-width: 400px; display: block; margin: 0 auto;">
      <rect width="420" height="230" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
      <text x="210" y="24" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">Favorite Colors</text>
      
      <!-- Grid & Axis Lines -->
      ${gridLines.join('')}
      <line x1="45" y1="180" x2="380" y2="180" stroke="#475569" stroke-width="2" />
      
      <!-- Bars -->
      ${bars.join('')}
    </svg>
  `;

  // Generate options
  const answerChoices = new Set([correctAnswerValue]);
  while (finalChoicesSize(answerChoices) < 4) {
    const candidate = rng.int(1, 20) * (scale === 2 ? 1 : Math.floor(scale / 2) || 1);
    if (candidate !== correctAnswerValue && candidate > 0) {
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
        { content: `### Let's analyze the bar graph:` },
        { type: 'svg', content: svg },
        { content: explanationText }
      ]
    },
    remediation: `Always look at the scale of the graph. On the y-axis, each grid line represents a step of **${scale}**. Count up by ${scale}s to read each bar's value.`,
    metadata: {
      subject: 'math',
      topic: 'data-graphs',
      skillId: 'data-graphs-g2-scaled-bar-graph',
      templateId: 'data_graphs.bar.scaled',
      engine: 'scaled',
      scale,
      correctAnswerValue,
      seed
    }
  };
}

function generateScaledPictograph(rng, seed) {
  const items = [
    { name: 'Apples', icon: '🍎' },
    { name: 'Stars', icon: '⭐' },
    { name: 'Cars', icon: '🚗' },
    { name: 'Flowers', icon: '🌸' }
  ];
  
  const pickedItem = rng.pick(items);
  const categories = ['Mon', 'Tue', 'Wed', 'Thu'];

  const scale = rng.pick([2, 5]);
  const values = categories.map(() => rng.int(1, 5) * scale);
  const data = Object.fromEntries(categories.map((c, i) => [c, values[i]]));

  const questions = [
    { type: 'count', title: 'Read one day' },
    { type: 'difference', title: 'Compare days' }
  ];
  const qType = rng.pick(questions);

  let questionText = '';
  let correctAnswerValue = 0;
  let explanationText = '';

  if (qType.type === 'count') {
    const targetDay = rng.pick(categories);
    questionText = `How many ${pickedItem.name.toLowerCase()} did the students collect on **${targetDay}**?`;
    correctAnswerValue = data[targetDay];
    
    const countIcons = data[targetDay] / scale;
    explanationText = `On **${targetDay}**, we see **${countIcons}** ${pickedItem.icon} icons.\n\nSince the key says each ${pickedItem.icon} represents **${scale}** ${pickedItem.name.toLowerCase()}:\n\n$$${countIcons} \\times ${scale} = ${correctAnswerValue}$$\n\nSo, **${correctAnswerValue}** ${pickedItem.name.toLowerCase()} were collected on ${targetDay}.`;
  } else {
    const dayA = 'Mon';
    const dayB = 'Tue';
    const valA = data[dayA];
    const valB = data[dayB];

    if (valA > valB) {
      questionText = `How many more ${pickedItem.name.toLowerCase()} were collected on **${dayA}** than on **${dayB}**?`;
      correctAnswerValue = valA - valB;
      explanationText = `Calculate the values for each day:\n- ${dayA}: **${valA}** (since ${valA / scale} icons $\\times$ ${scale} = ${valA})\n- ${dayB}: **${valB}** (since ${valB / scale} icons $\\times$ ${scale} = ${valB})\n\nCalculate the difference:\n$$${valA} - ${valB} = ${correctAnswerValue}$$\n\nSo, **${correctAnswerValue}** more ${pickedItem.name.toLowerCase()} were collected on ${dayA}.`;
    } else {
      questionText = `How many fewer ${pickedItem.name.toLowerCase()} were collected on **${dayA}** than on **${dayB}**?`;
      correctAnswerValue = valB - valA;
      explanationText = `Calculate the values for each day:\n- ${dayA}: **${valA}** (since ${valA / scale} icons $\\times$ ${scale} = ${valA})\n- ${dayB}: **${valB}** (since ${valB / scale} icons $\\times$ ${scale} = ${valB})\n\nCalculate the difference:\n$$${valB} - ${valA} = ${correctAnswerValue}$$\n\nSo, **${correctAnswerValue}** fewer ${pickedItem.name.toLowerCase()} were collected on ${dayA}.`;
    }
  }

  // Draw the SVG pictograph
  const rows = categories.map((cat, index) => {
    const y = 60 + index * 34;
    const val = data[cat];
    const iconCount = val / scale;
    
    // Generate icons list
    let iconsSvg = '';
    for (let i = 0; i < iconCount; i++) {
      iconsSvg += `<text x="${100 + i * 28}" y="${y + 8}" font-size="20">${pickedItem.icon}</text>`;
    }

    return `
      <text x="35" y="${y + 6}" font-size="14" font-weight="700" fill="#334155">${cat}</text>
      <line x1="85" y1="${y - 18}" x2="380" y2="${y - 18}" stroke="#e2e8f0" stroke-width="1" />
      ${iconsSvg}
    `;
  });

  const svg = `
    <svg viewBox="0 0 420 230" xmlns="http://www.w3.org/2000/svg" style="max-width: 400px; display: block; margin: 0 auto;">
      <rect width="420" height="230" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2" />
      <text x="210" y="24" font-size="16" font-weight="700" fill="#0f172a" text-anchor="middle">Fruit Collection</text>
      
      <!-- Pictograph Rows -->
      ${rows.join('')}
      <line x1="85" y1="35" x2="85" y2="190" stroke="#475569" stroke-width="2" />
      <line x1="85" y1="190" x2="380" y2="190" stroke="#475569" stroke-width="1" />
      
      <!-- Key -->
      <rect x="120" y="200" width="180" height="22" rx="4" fill="#e2e8f0" />
      <text x="210" y="215" font-size="12" font-weight="700" fill="#334155" text-anchor="middle">Key: Each ${pickedItem.icon} = ${scale} ${pickedItem.name.toLowerCase()}</text>
    </svg>
  `;

  // Generate options
  const answerChoices = new Set([correctAnswerValue]);
  while (finalChoicesSize(answerChoices) < 4) {
    const candidate = rng.int(1, 10) * scale;
    if (candidate !== correctAnswerValue && candidate > 0) {
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
        { content: `### Let's analyze the pictograph:` },
        { type: 'svg', content: svg },
        { content: explanationText }
      ]
    },
    remediation: `Read the **Key** carefully at the bottom of the pictograph. In this chart, each picture counts as **${scale}**. Count by ${scale}s for each picture shown.`,
    metadata: {
      subject: 'math',
      topic: 'data-graphs',
      skillId: 'data-graphs-g2-scaled-pictograph',
      templateId: 'data_graphs.pictograph.scaled',
      engine: 'scaled',
      scale,
      correctAnswerValue,
      seed
    }
  };
}

function finalChoicesSize(set) {
  return set.size;
}
