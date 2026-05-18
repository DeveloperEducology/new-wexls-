import { createSeededRandom, randInt, uid } from './shared.js';

function getTemperatureColor(value, min, max) {
  const range = max - min;
  const valRatio = range === 0 ? 0.5 : (value - min) / range;
  const clampedRatio = Math.max(0, Math.min(1, valRatio));
  // Map ratio 0 -> 1 to hue 220 (cool blue) -> 0 (hot red)
  const hue = 220 - clampedRatio * 220;
  return `hsl(${Math.round(hue)}, 85%, 50%)`;
}

function buildBulbSvg(value, config) {
  const min = config.min;
  const max = config.max;
  const majorStep = config.majorStep;
  const minorStep = config.minorStep;
  const unit = config.unit;
  
  const width = 120;
  const topPadding = 40;
  const bottomPadding = 60;
  const usableHeight = 300;
  const height = usableHeight + topPadding + bottomPadding;
  
  const tubeWidth = 20;
  const bulbRadius = 24;
  const centerX = width / 2;
  
  const tubeLeft = centerX - tubeWidth / 2;
  const tubeRight = centerX + tubeWidth / 2;
  const bulbCenterY = topPadding + usableHeight + 10;
  
  const range = max - min;
  const clampedValue = Math.max(min, Math.min(max, value));
  const valRatio = (clampedValue - min) / range;
  const fillHeight = valRatio * usableHeight;
  const fillTopY = topPadding + usableHeight - fillHeight;
  
  let ticksHtml = '';
  for (let t = min; t <= max; t += minorStep) {
    const isMajor = t % majorStep === 0;
    const y = topPadding + usableHeight - ((t - min) / range) * usableHeight;
    const tickWidth = isMajor ? 12 : 6;
    
    ticksHtml += `<line x1="${tubeRight}" y1="${y}" x2="${tubeRight + tickWidth}" y2="${y}" stroke="#475569" stroke-width="${isMajor ? 2 : 1}" />`;
    
    if (isMajor) {
      ticksHtml += `<text x="${tubeRight + tickWidth + 6}" y="${y + 5}" font-size="14" font-family="sans-serif" font-weight="700" fill="#334155">${t}</text>`;
    }
  }
  
  const unitLabel = `°${unit}`;
  ticksHtml += `<text x="${tubeRight + 8}" y="${topPadding - 12}" font-size="16" font-family="sans-serif" font-weight="800" fill="#334155">${unitLabel}</text>`;
  
  const bgHtml = `
    <circle cx="${centerX}" cy="${bulbCenterY}" r="${bulbRadius}" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2" />
    <rect x="${tubeLeft}" y="${topPadding}" width="${tubeWidth}" height="${usableHeight + 10}" rx="${tubeWidth / 2}" fill="#f1f5f9" stroke="#94a3b8" stroke-width="2" />
    <rect x="${tubeLeft + 2}" y="${bulbCenterY - bulbRadius}" width="${tubeWidth - 4}" height="${bulbRadius + 5}" fill="#f1f5f9" />
  `;
  
  const fillColor = getTemperatureColor(clampedValue, min, max);
  const fillHtml = `
    <circle cx="${centerX}" cy="${bulbCenterY}" r="${bulbRadius - 4}" fill="${fillColor}" />
    <rect x="${tubeLeft + 4}" y="${fillTopY}" width="${tubeWidth - 8}" height="${usableHeight + 10 - (fillTopY - topPadding)}" rx="${(tubeWidth - 8)/2}" fill="${fillColor}" />
  `;
  
  return `
    <svg width="100%" height="auto" viewBox="0 0 ${width + 60} ${height}" style="max-width: 160px; margin: 0 auto; display: block;" xmlns="http://www.w3.org/2000/svg">
      ${bgHtml}
      ${fillHtml}
      ${ticksHtml}
      <path d="M ${tubeLeft} ${bulbCenterY - 14} L ${tubeLeft} ${topPadding + tubeWidth/2} A ${tubeWidth/2} ${tubeWidth/2} 0 0 1 ${tubeRight} ${topPadding + tubeWidth/2} L ${tubeRight} ${bulbCenterY - 14}" fill="none" stroke="#94a3b8" stroke-width="2" />
    </svg>
  `;
}

function buildDialSvg(value, config) {
  const min = config.min;
  const max = config.max;
  const majorStep = config.majorStep;
  const minorStep = config.minorStep;
  const unit = config.unit;
  
  const cx = 100;
  const cy = 100;
  const scaleR = 50;
  const range = max - min;
  
  const outerCircle = `<circle cx="${cx}" cy="${cy}" r="80" fill="#ffffff" stroke="#000000" stroke-width="14" />`;
  
  let ticksHtml = '';
  const startAngle = 135;
  const totalAngle = 270;
  
  for (let t = min; t <= max; t += minorStep) {
    const isMajor = t % majorStep === 0;
    const valRatio = range === 0 ? 0 : (t - min) / range;
    const angleDeg = startAngle + valRatio * totalAngle;
    const angleRad = (angleDeg * Math.PI) / 180;
    
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    
    const tickLen = isMajor ? 6 : 3;
    const x1 = cx + scaleR * cos;
    const y1 = cy + scaleR * sin;
    const x2 = cx + (scaleR + tickLen) * cos;
    const y2 = cy + (scaleR + tickLen) * sin;
    
    ticksHtml += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#000000" stroke-width="${isMajor ? 2 : 1}" />`;
    
    if (isMajor) {
      const labelR = scaleR + 16;
      const lx = cx + labelR * cos;
      const ly = cy + labelR * sin;
      ticksHtml += `
        <text x="${lx}" y="${ly}" font-size="11" font-family="sans-serif" font-weight="700" fill="#334155" text-anchor="middle" dominant-baseline="middle">
          ${t}
        </text>
      `;
    }
  }
  
  const xStart = cx + scaleR * Math.cos((startAngle * Math.PI) / 180);
  const yStart = cy + scaleR * Math.sin((startAngle * Math.PI) / 180);
  const xEnd = cx + scaleR * Math.cos(((startAngle + totalAngle) * Math.PI) / 180);
  const yEnd = cy + scaleR * Math.sin(((startAngle + totalAngle) * Math.PI) / 180);
  const arcPath = `<path d="M ${xStart} ${yStart} A ${scaleR} ${scaleR} 0 1 1 ${xEnd} ${yEnd}" fill="none" stroke="#000000" stroke-width="3" />`;
  
  const clampedVal = Math.max(min, Math.min(max, value));
  const valRatio = range === 0 ? 0 : (clampedVal - min) / range;
  const needleAngleDeg = startAngle + valRatio * totalAngle;
  const needleAngleRad = (needleAngleDeg * Math.PI) / 180;
  
  const needleL = scaleR + 2;
  const nx = cx + needleL * Math.cos(needleAngleRad);
  const ny = cy + needleL * Math.sin(needleAngleRad);
  
  const fillColor = getTemperatureColor(clampedVal, min, max);
  const needleHtml = `
    <line x1="${cx}" y1="${cy}" x2="${nx}" y2="${ny}" stroke="${fillColor}" stroke-width="3" stroke-linecap="round" />
    <circle cx="${cx}" cy="${cy}" r="6" fill="${fillColor}" />
  `;
  
  const unitHtml = `<text x="${cx}" y="${cy + 46}" font-size="22" font-family="sans-serif" font-weight="800" text-anchor="middle" fill="#000000">°${unit}</text>`;
  
  return `
    <svg width="100%" height="auto" viewBox="0 0 200 200" style="max-width: 180px; margin: 0 auto; display: block;" xmlns="http://www.w3.org/2000/svg">
      ${outerCircle}
      ${arcPath}
      ${ticksHtml}
      ${unitHtml}
      ${needleHtml}
    </svg>
  `;
}

function buildThermometerSvg(value, config) {
  if (config.visualStyle === 'dial') {
    return buildDialSvg(value, config);
  }
  return buildBulbSvg(value, config);
}

function generateOptions(correctValue, allPossibleValues, random, count = 4, suffix = '') {
  const options = new Set([correctValue]);
  let failsafe = 100;
  while (options.size < count && failsafe > 0) {
    failsafe--;
    const r = allPossibleValues[randInt(0, allPossibleValues.length - 1, random)];
    options.add(r);
  }
  const arr = Array.from(options).sort((a, b) => a - b);
  return arr.map((v) => ({
    id: `opt_${v}`,
    label: `${v}${suffix}`,
    value: `${v}${suffix}`,
    isCorrect: v === correctValue,
  }));
}

export function generateThermometerQuestion(template = {}, variables = {}) {
  const random = createSeededRandom(variables.seed || template.seed || Date.now());
  const difficulty = variables.difficulty || 'medium';
  
  const config = template.config || {};
  const mode = config.mode || 'read'; // read, compare, estimate
  
  // 1. Determine actual unit and visual style
  let unit = config.unit || 'C';
  if (difficulty === 'hard') {
    unit = random() > 0.5 ? 'C' : 'F';
  }
  const visualStyle = config.visualStyle || (random() > 0.5 ? 'dial' : 'bulb');
  
  // 2. Set bounds based on unit
  const min = config.min ?? (unit === 'F' ? 30 : 0);
  const max = config.max ?? (unit === 'F' ? 130 : 60);
  const majorStep = config.majorStep ?? (unit === 'F' ? 10 : 5);
  const minorStep = config.minorStep ?? (unit === 'F' ? 5 : 1);
  const possibleValues = config.values || [];
  
  // 3. Generate valid values based on difficulty
  let validValues = [];
  if (possibleValues.length) {
    validValues = possibleValues;
  } else {
    if (difficulty === 'easy') {
      for (let v = min; v <= max; v++) {
        if (v % 5 === 0) {
          validValues.push(v);
        }
      }
    } else if (difficulty === 'hard') {
      for (let v = min; v <= max; v++) {
        validValues.push(v);
      }
    } else {
      // medium / adaptive / default
      for (let v = min; v <= max; v += minorStep) {
        validValues.push(v);
      }
    }
  }
  
  const questionId = uid();
  
  if (mode === 'compare') {
    const leftVal = validValues[randInt(0, validValues.length - 1, random)];
    let rightVal = validValues[randInt(0, validValues.length - 1, random)];
    while (rightVal === leftVal) {
      rightVal = validValues[randInt(0, validValues.length - 1, random)];
    }
    
    const isHigher = random() > 0.5;
    const questionText = isHigher ? 'Which thermometer shows the higher temperature?' : 'Which thermometer shows the lower temperature?';
    
    let correctAnswer = '';
    if (isHigher) {
      correctAnswer = leftVal > rightVal ? 'left' : 'right';
    } else {
      correctAnswer = leftVal < rightVal ? 'left' : 'right';
    }
    
    const svgConfig = { min, max, majorStep, minorStep, unit, visualStyle };
    
    return {
      id: questionId,
      type: 'mcq',
      questionText,
      isGrid: true,
      layoutConfig: { variant: 'svgGrid', columns: 2 },
      parts: [
        {
          type: 'svg',
          content: `
            <div style="display: flex; justify-content: center; gap: 32px; width: 100%;">
              <div style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 8px;">Left</div>
                ${buildThermometerSvg(leftVal, svgConfig)}
              </div>
              <div style="text-align: center;">
                <div style="font-weight: bold; margin-bottom: 8px;">Right</div>
                ${buildThermometerSvg(rightVal, svgConfig)}
              </div>
            </div>
          `,
          isVertical: true,
        }
      ],
      options: [
        { id: 'opt_left', label: 'Left', value: 'left', isCorrect: correctAnswer === 'left' },
        { id: 'opt_right', label: 'Right', value: 'right', isCorrect: correctAnswer === 'right' }
      ],
      answer: correctAnswer === 'left' ? 0 : 1,
      correctAnswerIndex: correctAnswer === 'left' ? 0 : 1,
      solution: {
        sections: [
          { type: 'text', content: `The left thermometer shows ${leftVal}°${unit}.` },
          { type: 'text', content: `The right thermometer shows ${rightVal}°${unit}.` },
          { type: 'text', content: `The ${correctAnswer} thermometer is ${isHigher ? 'higher' : 'lower'}.` }
        ]
      },
      metadata: {
        subject: 'science',
        topic: 'units-measurement',
        engine: 'thermometer',
        templateId: template.id,
        leftTemperature: leftVal,
        rightTemperature: rightVal,
        unit
      }
    };
  }

  // read or estimate
  const value = validValues[randInt(0, validValues.length - 1, random)];
  
  const questionText = mode === 'estimate' ? 'Estimate the temperature shown by this thermometer.' : 'Select the temperature shown by this thermometer.';
  const suffix = `°${unit}`;
  const options = generateOptions(value, validValues, random, 4, suffix);
  
  return {
    id: questionId,
    type: 'mcq',
    questionText,
    parts: [
      {
        type: 'svg',
        content: buildThermometerSvg(value, { min, max, majorStep, minorStep, unit, visualStyle }),
        isVertical: true,
        style: { margin: '0 auto 20px' }
      }
    ],
    options,
    answer: options.findIndex((o) => o.isCorrect),
    correctAnswerIndex: options.findIndex((o) => o.isCorrect),
    solution: {
      sections: [
        { type: 'text', content: `The liquid reaches ${value}°${unit}.` }
      ]
    },
    metadata: {
      subject: 'science',
      topic: 'units-measurement',
      engine: 'thermometer',
      templateId: template.id,
      value,
      unit
    }
  };
}
