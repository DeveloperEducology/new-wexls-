/**
 * Balance Scale Questions Engine
 */

export function generateBalanceScaleQuestion(rng, config = {}) {
  const difficulty = config.difficulty || 'medium';
  const forcedTask = config.forcedTask || 'compare_weights'; // 'compare_weights' | 'add_weight' | 'remove_weight' | 'interactive_balance'

  if (forcedTask === 'add_weight') {
    return generateAddWeightQuestion(rng, difficulty);
  }

  if (forcedTask === 'remove_weight') {
    return generateRemoveWeightQuestion(rng, difficulty);
  }

  if (forcedTask === 'interactive_balance') {
    return generateInteractiveBalanceQuestion(rng, difficulty);
  }

  return generateCompareWeightsQuestion(rng, difficulty);
}

// ----------------------------------------------------
// SVG RENDERING HELPERS
// ----------------------------------------------------

function drawBalanceScaleSVG({ leftWeight, rightWeight, leftLabel = 'Box A', rightLabel = 'Box B', showStacked = false }) {
  const width = 450;
  const height = 300;
  const midX = width / 2;
  const pivotY = height - 60;
  const beamY = 120;
  
  // Calculate tilt angle based on weight difference
  let tiltDegrees = 0;
  if (leftWeight > rightWeight) {
    tiltDegrees = -12; // Left goes down
  } else if (rightWeight > leftWeight) {
    tiltDegrees = 12; // Right goes down
  }
  
  const rad = (tiltDegrees * Math.PI) / 180;
  const armLength = 135;
  
  // Left and right hook points on the beam
  const leftBeamX = midX - armLength * Math.cos(rad);
  const leftBeamY = beamY - armLength * Math.sin(rad);
  const rightBeamX = midX + armLength * Math.cos(rad);
  const rightBeamY = beamY + armLength * Math.sin(rad);
  
  // Platform pan coordinates
  const panH = 80;
  const leftPanX = leftBeamX;
  const leftPanY = leftBeamY + panH;
  const rightPanX = rightBeamX;
  const rightPanY = rightBeamY + panH;

  // Render weights on each pan
  let leftWeightsHTML = '';
  let rightWeightsHTML = '';

  if (showStacked) {
    leftWeightsHTML = renderStackedWeights(leftPanX, leftPanY, leftWeight);
    rightWeightsHTML = renderStackedWeights(rightPanX, rightPanY, rightWeight);
  } else {
    leftWeightsHTML = renderLabeledBox(leftPanX, leftPanY, leftWeight, leftLabel, '#f87171');
    rightWeightsHTML = renderLabeledBox(rightPanX, rightPanY, rightWeight, rightLabel, '#60a5fa');
  }

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px;">
      <!-- Table Base -->
      <rect x="50" y="${pivotY + 20}" width="350" height="15" rx="3" fill="#78350f" stroke="#451a03" stroke-width="2" />
      
      <!-- Stand Pillar -->
      <polygon points="${midX - 22},${pivotY + 20} ${midX + 22},${pivotY + 20} ${midX + 10},${beamY} ${midX - 10},${beamY}" fill="#475569" stroke="#000" stroke-width="2" />
      
      <!-- Left Pan Assembly cords -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX - 30}" y2="${leftPanY}" stroke="#64748b" stroke-width="2" />
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX + 30}" y2="${leftPanY}" stroke="#64748b" stroke-width="2" />
      <!-- Platform Pan Left -->
      <path d="M ${leftPanX - 35},${leftPanY} L ${leftPanX + 35},${leftPanY} Q ${leftPanX},${leftPanY + 12} ${leftPanX - 35},${leftPanY} Z" fill="#cbd5e1" stroke="#334155" stroke-width="2" />
      <!-- Left Pan Weights -->
      ${leftWeightsHTML}
      
      <!-- Right Pan Assembly cords -->
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX - 30}" y2="${rightPanY}" stroke="#64748b" stroke-width="2" />
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX + 30}" y2="${rightPanY}" stroke="#64748b" stroke-width="2" />
      <!-- Platform Pan Right -->
      <path d="M ${rightPanX - 35},${rightPanY} L ${rightPanX + 35},${rightPanY} Q ${rightPanX},${rightPanY + 12} ${rightPanX - 35},${rightPanY} Z" fill="#cbd5e1" stroke="#334155" stroke-width="2" />
      <!-- Right Pan Weights -->
      ${rightWeightsHTML}
      
      <!-- Central Balance Beam -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${rightBeamX}" y2="${rightBeamY}" stroke="#334155" stroke-width="5" stroke-linecap="round" />
      <circle cx="${midX}" cy="${beamY}" r="7" fill="#facc15" stroke="#000" stroke-width="2" />
    </svg>
  `;
}

function renderStackedWeights(panX, panY, totalWeight) {
  let html = '';
  let yCurrent = panY - 2;

  // Split totalWeight into 5kg and 1kg units
  const weights = [];
  let remaining = totalWeight;
  while (remaining >= 5) {
    weights.push(5);
    remaining -= 5;
  }
  while (remaining >= 1) {
    weights.push(1);
    remaining -= 1;
  }

  weights.forEach((w) => {
    const width = w === 5 ? 36 : 28;
    const height = w === 5 ? 18 : 14;
    const color = w === 5 ? '#f59e0b' : '#94a3b8'; // Gold for 5, Silver for 1
    const stroke = w === 5 ? '#b45309' : '#475569';
    const textCol = w === 5 ? '#ffffff' : '#1e293b';

    const x = panX - width / 2;
    const y = yCurrent - height;

    html += `
      <g>
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" stroke="${stroke}" stroke-width="1.5" rx="3" />
        <ellipse cx="${panX}" cy="${y}" rx="${width / 2}" ry="3" fill="${color}" stroke="${stroke}" stroke-width="1" />
        <text x="${panX}" y="${y + height / 2 + 4}" font-family="Outfit, sans-serif" font-weight="950" font-size="10px" fill="${textCol}" text-anchor="middle">${w}</text>
      </g>
    `;
    yCurrent -= (height + 2);
  });

  return html;
}

function renderLabeledBox(panX, panY, weight, label, fillColor) {
  const width = 64;
  const height = 46;
  const x = panX - width / 2;
  const y = panY - height - 2;
  const strokeColor = '#1e293b';

  return `
    <g>
      <!-- Main Box body -->
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" rx="4" />
      
      <!-- Label -->
      <text x="${panX}" y="${y + 16}" font-family="Outfit, sans-serif" font-weight="bold" font-size="11px" fill="#fff" text-anchor="middle">${label}</text>
      
      <!-- Weight value -->
      <text x="${panX}" y="${y + 34}" font-family="Plus Jakarta Sans, sans-serif" font-weight="800" font-size="13px" fill="#fff" text-anchor="middle">${weight} kg</text>
    </g>
  `;
}

// ----------------------------------------------------
// ENGINE IMPLEMENTATIONS
// ----------------------------------------------------

/**
 * Skill 1: Compare weights on a balance scale (MCQ)
 */
function generateCompareWeightsQuestion(rng, difficulty) {
  const showStacked = rng.next() > 0.5;
  
  // Pick random weights
  let leftWeight = rng.int(1, 10);
  let rightWeight = rng.int(1, 10);
  while (leftWeight === rightWeight) {
    rightWeight = rng.int(1, 10);
  }

  // In non-stacked mode, weights can be slightly larger for variety
  if (!showStacked) {
    leftWeight = rng.int(5, 25);
    rightWeight = rng.int(5, 25);
    while (leftWeight === rightWeight) {
      rightWeight = rng.int(5, 25);
    }
  }

  const askHeavy = rng.next() > 0.5;
  const labelA = 'Box A';
  const labelB = 'Box B';

  const svg = drawBalanceScaleSVG({
    leftWeight,
    rightWeight,
    leftLabel: labelA,
    rightLabel: labelB,
    showStacked
  });

  const isLeftHeavier = leftWeight > rightWeight;
  const targetLabel = askHeavy 
    ? (isLeftHeavier ? labelA : labelB) 
    : (isLeftHeavier ? labelB : labelA);
    
  const compareText = askHeavy ? 'more weight' : 'less weight';
  const tiltText = isLeftHeavier 
    ? `**${labelA}** is tilted down (heavier), and **${labelB}** is tilted up (lighter)`
    : `**${labelB}** is tilted down (heavier), and **${labelA}** is tilted up (lighter)`;

  const explanationSteps = [
    { content: `On a balance scale, gravity pulls the heavier side down and lifts the lighter side up.` },
    { content: `• Left side (**${labelA}**) has **${leftWeight} kg**.` },
    { content: `• Right side (**${labelB}**) has **${rightWeight} kg**.` }
  ];

  if (showStacked) {
    explanationSteps.push({ content: `You can count the stacked weights on each side to find the total:` });
    explanationSteps.push({ content: `• Left side has weights totaling **${leftWeight} kg**.` });
    explanationSteps.push({ content: `• Right side has weights totaling **${rightWeight} kg**.` });
  }

  explanationSteps.push({ content: `Comparing the two sides: **${leftWeight} kg** is ${isLeftHeavier ? 'greater' : 'less'} than **${rightWeight} kg**.` });
  explanationSteps.push({ content: `Therefore, **${targetLabel}** has **${compareText}**.` });

  return {
    type: 'mcq',
    level: difficulty,
    questionText: `Which side of the scale has **${compareText}**?`,
    parts: [
      { type: 'svg', content: svg }
    ],
    options: [`${labelA} (Left side)`, `${labelB} (Right side)`],
    correctAnswerIndex: isLeftHeavier === askHeavy ? 0 : 1,
    explanation: {
      sections: explanationSteps
    },
    remediation: `The heavier side tilts down, and the lighter side goes up. Compare the weight values on the scale.`,
    metadata: { task: 'compare_weights', leftWeight, rightWeight, askHeavy, targetLabel }
  };
}

/**
 * Skill 2: Find weight to add to balance the scale (Fill in the blank)
 */
function generateAddWeightQuestion(rng, difficulty) {
  // Generate random weights ensuring they are unbalanced
  let leftWeight = rng.int(3, 15);
  let rightWeight = rng.int(3, 15);
  while (leftWeight === rightWeight) {
    rightWeight = rng.int(3, 15);
  }

  const isLeftLighter = leftWeight < rightWeight;
  const lighterBox = isLeftLighter ? 'Box A' : 'Box B';
  const heavierBox = isLeftLighter ? 'Box B' : 'Box A';
  const lighterWeight = isLeftLighter ? leftWeight : rightWeight;
  const heavierWeight = isLeftLighter ? rightWeight : leftWeight;
  const neededWeight = heavierWeight - lighterWeight;

  const svg = drawBalanceScaleSVG({
    leftWeight,
    rightWeight,
    leftLabel: 'Box A',
    rightLabel: 'Box B',
    showStacked: false
  });

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `How much weight must be **added** to ${lighterBox} to balance the scale?`,
    parts: [
      { type: 'svg', content: svg },
      { type: 'text', content: 'Add [blank:ans] kg to ' + lighterBox }
    ],
    correctAnswer: { ans: neededWeight.toString() },
    explanation: {
      sections: [
        { content: `**Step 1: Compare the current weights.**` },
        { content: `• **Box A** (left) has **${leftWeight} kg**.` },
        { content: `• **Box B** (right) has **${rightWeight} kg**.` },
        { content: `The scale is unbalanced because **${heavierBox}** is heavier than **${lighterBox}** (${heavierWeight} kg > ${lighterWeight} kg).` },
        { content: `**Step 2: Calculate the weight difference.**` },
        { content: `To balance the scale, the weights on both sides must be equal (${heavierWeight} kg).` },
        { content: `Subtract the lighter weight from the heavier weight:` },
        { content: `$$\\text{Weight to add} = ${heavierWeight} - ${lighterWeight} = \\mathbf{${neededWeight}\\text{ kg}}$$` },
        { content: `Adding **${neededWeight} kg** to **${lighterBox}** makes both sides equal to **${heavierWeight} kg**.` }
      ]
    },
    remediation: `Find the weight on each side. Subtract the lighter weight from the heavier weight to find out how much to add to the lighter side.`,
    metadata: { task: 'add_weight', leftWeight, rightWeight, neededWeight, lighterBox }
  };
}

/**
 * Skill 3: Find weight to remove to balance the scale (Fill in the blank)
 */
function generateRemoveWeightQuestion(rng, difficulty) {
  // Generate random weights ensuring they are unbalanced
  let leftWeight = rng.int(4, 20);
  let rightWeight = rng.int(4, 20);
  while (leftWeight === rightWeight) {
    rightWeight = rng.int(4, 20);
  }

  const isLeftHeavier = leftWeight > rightWeight;
  const heavierBox = isLeftHeavier ? 'Box A' : 'Box B';
  const lighterBox = isLeftHeavier ? 'Box B' : 'Box A';
  const heavierWeight = isLeftHeavier ? leftWeight : rightWeight;
  const lighterWeight = isLeftHeavier ? rightWeight : leftWeight;
  const excessWeight = heavierWeight - lighterWeight;

  const svg = drawBalanceScaleSVG({
    leftWeight,
    rightWeight,
    leftLabel: 'Box A',
    rightLabel: 'Box B',
    showStacked: false
  });

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `How much weight must be **removed** from ${heavierBox} to balance the scale?`,
    parts: [
      { type: 'svg', content: svg },
      { type: 'text', content: 'Remove [blank:ans] kg from ' + heavierBox }
    ],
    correctAnswer: { ans: excessWeight.toString() },
    explanation: {
      sections: [
        { content: `**Step 1: Compare the current weights.**` },
        { content: `• **Box A** (left) has **${leftWeight} kg**.` },
        { content: `• **Box B** (right) has **${rightWeight} kg**.` },
        { content: `The scale is unbalanced because **${heavierBox}** is heavier than **${lighterBox}** (${heavierWeight} kg > ${lighterWeight} kg).` },
        { content: `**Step 2: Calculate the difference.**` },
        { content: `To balance the scale, both sides must equal the lighter weight (**${lighterWeight} kg**).` },
        { content: `Subtract the lighter weight from the heavier weight to find the excess:` },
        { content: `$$\\text{Weight to remove} = ${heavierWeight} - ${lighterWeight} = \\mathbf{${excessWeight}\\text{ kg}}$$` },
        { content: `Removing **${excessWeight} kg** from **${heavierBox}** leaves it with **${lighterWeight} kg**, balancing the scale.` }
      ]
    },
    remediation: `Find the weight on each side. Subtract the lighter weight from the heavier weight to find the excess weight to remove from the heavier side.`,
    metadata: { task: 'remove_weight', leftWeight, rightWeight, excessWeight, heavierBox }
  };
}

/**
 * Skill 4: Interactive Balance Scale (Change SVG as user enters weight)
 */
function generateInteractiveBalanceQuestion(rng, difficulty) {
  // Fixed target weight on the right pan (Box B)
  const targetRightWeight = rng.int(3, 15);
  
  // Standard initial SVG when the input is empty or 0
  const initialSvg = drawBalanceScaleSVG({
    leftWeight: 0,
    rightWeight: targetRightWeight,
    leftLabel: 'Box A',
    rightLabel: 'Box B',
    showStacked: true
  });

  return {
    type: 'fillInTheBlank',
    level: difficulty,
    questionText: `Enter a weight for Box A (left side) so that the scale balances with Box B (right side).`,
    parts: [
      {
        type: 'svg',
        content: initialSvg,
        // The dynamicContent function is called by SvgPart in PartRenderer.js with the current userAnswer
        dynamicContent: (userAnswer) => {
          const enteredVal = userAnswer && userAnswer.ans ? parseInt(userAnswer.ans, 10) : 0;
          const leftW = isNaN(enteredVal) || enteredVal < 0 ? 0 : enteredVal;
          return drawBalanceScaleSVG({
            leftWeight: leftW,
            rightWeight: targetRightWeight,
            leftLabel: 'Box A',
            rightLabel: 'Box B',
            showStacked: true
          });
        }
      },
      { type: 'text', content: 'Box A weight: [blank:ans] kg' }
    ],
    correctAnswer: { ans: targetRightWeight.toString() },
    explanation: {
      sections: [
        { content: `**Step 1: Check the target weight.**` },
        { content: `• **Box B** (right side) has **${targetRightWeight} kg**.` },
        { content: `**Step 2: Match the weights to balance.**` },
        { content: `For the balance scale to be completely level, the weight on the left side (**Box A**) must equal the weight on the right side (**Box B**).` },
        { content: `Therefore, Box A must also be **${targetRightWeight} kg**.` }
      ]
    },
    remediation: `Enter the same weight value for Box A as Box B has to make the scale level.`,
    metadata: { task: 'interactive_balance', rightWeight: targetRightWeight }
  };
}
