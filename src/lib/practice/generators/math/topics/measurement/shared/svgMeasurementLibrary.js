/**
 * Programmatic SVG Measurement Library
 * Plain, child-friendly, high contrast, and uncluttered.
 * Avoids gradients, glassmorphism, or blur effects.
 */

// Procedural 2D Drawings of Real-world Objects
export function drawRealWorldObject(type, x, y, width, height) {
  switch (type) {
    case 'pencil':
      return `
        <g class="svg-pencil" transform="translate(${x}, ${y})">
          <!-- Pencil Body (Yellow) -->
          <rect x="0" y="${height * 0.2}" width="${width * 0.75}" height="${height * 0.6}" fill="#facc15" stroke="#000" stroke-width="2" />
          <!-- Lead tip base (Wood) -->
          <polygon points="${width * 0.75},${height * 0.2} ${width * 0.75},${height * 0.8} ${width * 0.9},${height * 0.5}" fill="#fed7aa" stroke="#000" stroke-width="2" />
          <!-- Pencil Lead (Black) -->
          <polygon points="${width * 0.87},${height * 0.44} ${width * 0.75 + (width * 0.15)},${height * 0.5} ${width * 0.87},${height * 0.56}" fill="#000" stroke="#000" stroke-width="1" />
          <polygon points="${width * 0.85},${height * 0.4} ${width * 0.95},${height * 0.5} ${width * 0.85},${height * 0.6}" fill="#000" />
          <!-- Ferrule (Metal band) -->
          <rect x="${width * 0.08}" y="${height * 0.2}" width="${width * 0.08}" height="${height * 0.6}" fill="#94a3b8" stroke="#000" stroke-width="2" />
          <!-- Eraser (Pink) -->
          <path d="M 0,${height * 0.2} L ${width * 0.08},${height * 0.2} L ${width * 0.08},${height * 0.8} L 0,${height * 0.8} Q -${width * 0.06},${height * 0.5} 0,${height * 0.2} Z" fill="#fda4af" stroke="#000" stroke-width="2" />
          <!-- Pencil lines -->
          <line x1="${width * 0.16}" y1="${height * 0.4}" x2="${width * 0.75}" y2="${height * 0.4}" stroke="#ca8a04" stroke-width="1.5" />
          <line x1="${width * 0.16}" y1="${height * 0.6}" x2="${width * 0.75}" y2="${height * 0.6}" stroke="#ca8a04" stroke-width="1.5" />
        </g>
      `;

    case 'crayon':
      return `
        <g class="svg-crayon" transform="translate(${x}, ${y})">
          <!-- Crayon Tip (Red/Blue) -->
          <path d="M ${width * 0.8},${height * 0.25} L ${width * 0.95},${height * 0.5} L ${width * 0.8},${height * 0.75} Z" fill="#ef4444" stroke="#000" stroke-width="2" />
          <!-- Crayon Body -->
          <rect x="0" y="${height * 0.2}" width="${width * 0.8}" height="${height * 0.6}" fill="#ef4444" stroke="#000" stroke-width="2" />
          <!-- Wrapper (Dark Red) -->
          <rect x="${width * 0.15}" y="${height * 0.2}" width="${width * 0.5}" height="${height * 0.6}" fill="#b91c1c" stroke="#000" stroke-width="2" />
          <!-- Crayon details/labels -->
          <circle cx="${width * 0.4}" cy="${height * 0.5}" r="${height * 0.2}" fill="#ef4444" stroke="#000" stroke-width="1.5" />
          <line x1="${width * 0.08}" y1="${height * 0.2}" x2="${width * 0.08}" y2="${height * 0.8}" stroke="#000" stroke-width="1.5" />
          <line x1="${width * 0.72}" y1="${height * 0.2}" x2="${width * 0.72}" y2="${height * 0.8}" stroke="#000" stroke-width="1.5" />
        </g>
      `;

    case 'paperclip':
      return `
        <g class="svg-paperclip" transform="translate(${x}, ${y})">
          <!-- Outer Loop -->
          <path d="M 10,${height * 0.5} 
                   L ${width - 15},${height * 0.5} 
                   A 12,12 0 0,0 ${width - 15},${height * 0.2} 
                   L 20,${height * 0.2} 
                   A 15,15 0 0,0 20,${height * 0.8} 
                   L ${width - 10},${height * 0.8} 
                   A 15,15 0 0,0 ${width - 10},${height * 0.1}
                   L 30,${height * 0.1}" 
                fill="none" stroke="#475569" stroke-width="4" stroke-linecap="round" />
        </g>
      `;

    case 'key':
      return `
        <g class="svg-key" transform="translate(${x}, ${y})">
          <!-- Head / Loop -->
          <circle cx="${height * 0.5}" cy="${height * 0.5}" r="${height * 0.4}" fill="none" stroke="#64748b" stroke-width="4" />
          <circle cx="${height * 0.5}" cy="${height * 0.5}" r="${height * 0.15}" fill="none" stroke="#64748b" stroke-width="2" />
          <!-- Shaft -->
          <rect x="${height * 0.9}" y="${height * 0.4}" width="${width - height * 0.9}" height="${height * 0.2}" fill="#64748b" stroke="#000" stroke-width="1" />
          <!-- Teeth -->
          <rect x="${width - 25}" y="${height * 0.6}" width="6" height="10" fill="#64748b" stroke="#000" stroke-width="1" />
          <rect x="${width - 15}" y="${height * 0.6}" width="6" height="12" fill="#64748b" stroke="#000" stroke-width="1" />
        </g>
      `;

    case 'apple':
      return `
        <g class="svg-apple" transform="translate(${x}, ${y})">
          <!-- Leaf -->
          <path d="M ${width * 0.5},${height * 0.2} Q ${width * 0.6},${height * 0.05} ${width * 0.75},${height * 0.1} Q ${width * 0.65},${height * 0.25} ${width * 0.5},${height * 0.2}" fill="#22c55e" stroke="#000" stroke-width="1.5" />
          <!-- Stem -->
          <path d="M ${width * 0.5},${height * 0.3} Q ${width * 0.48},${height * 0.15} ${width * 0.52},${height * 0.1}" fill="none" stroke="#78350f" stroke-width="3" stroke-linecap="round" />
          <!-- Apple Body -->
          <path d="M ${width * 0.5},${height * 0.35} 
                   C ${width * 0.3},${height * 0.25} 0,${height * 0.4} 0,${height * 0.65} 
                   C 0,${height * 0.9} ${width * 0.35},${height * 0.95} ${width * 0.5},${height * 0.85} 
                   C ${width * 0.65},${height * 0.95} ${width},${height * 0.9} ${width},${height * 0.65} 
                   C ${width},${height * 0.4} ${width * 0.7},${height * 0.25} ${width * 0.5},${height * 0.35} Z" 
                fill="#ef4444" stroke="#000" stroke-width="2" />
        </g>
      `;

    case 'cup':
      return `
        <g class="svg-cup" transform="translate(${x}, ${y})">
          <!-- Handle -->
          <path d="M ${width * 0.25},${height * 0.3} C ${width * 0.05},${height * 0.3} ${width * 0.05},${height * 0.8} ${width * 0.25},${height * 0.8}" fill="none" stroke="#0ea5e9" stroke-width="4" stroke-linecap="round" />
          <!-- Mug Body -->
          <rect x="${width * 0.25}" y="${height * 0.2}" width="${width * 0.6}" height="${height * 0.7}" rx="5" fill="#38bdf8" stroke="#000" stroke-width="2" />
          <!-- Rim -->
          <ellipse cx="${width * 0.55}" cy="${height * 0.2}" rx="${width * 0.3}" ry="6" fill="#0ea5e9" stroke="#000" stroke-width="2" />
        </g>
      `;

    case 'leaf':
      return `
        <g class="svg-leaf" transform="translate(${x}, ${y})">
          <!-- Leaf outline and vein -->
          <path d="M 10,${height * 0.8} Q ${width * 0.3},${height * 0.1} ${width - 10},10 Q ${width * 0.8},${height * 0.9} 10,${height * 0.8}" fill="#4ade80" stroke="#166534" stroke-width="2.5" />
          <path d="M 10,${height * 0.8} L ${width - 12},12" fill="none" stroke="#166534" stroke-width="2" />
          <!-- Vein extensions -->
          <path d="M ${width * 0.3},${height * 0.6} Q ${width * 0.45},${height * 0.45} ${width * 0.4},${height * 0.7}" fill="none" stroke="#166534" stroke-width="1.5" />
          <path d="M ${width * 0.5},${height * 0.42} Q ${width * 0.68},${height * 0.3} ${width * 0.6},${height * 0.55}" fill="none" stroke="#166534" stroke-width="1.5" />
        </g>
      `;

    case 'tree':
      return `
        <g class="svg-tree" transform="translate(${x}, ${y})">
          <!-- Trunk -->
          <rect x="${width * 0.42}" y="${height * 0.6}" width="${width * 0.16}" height="${height * 0.4}" fill="#78350f" stroke="#000" stroke-width="2" />
          <!-- Foliage -->
          <circle cx="${width * 0.5}" cy="${height * 0.4}" r="${width * 0.38}" fill="#22c55e" stroke="#15803d" stroke-width="2" />
          <circle cx="${width * 0.3}" cy="${height * 0.48}" r="${width * 0.25}" fill="#22c55e" stroke="#15803d" stroke-width="2" />
          <circle cx="${width * 0.7}" cy="${height * 0.48}" r="${width * 0.25}" fill="#22c55e" stroke="#15803d" stroke-width="2" />
        </g>
      `;

    default:
      // Fallback simple geometric block
      return `
        <g transform="translate(${x}, ${y})">
          <rect x="0" y="0" width="${width}" height="${height}" fill="#ca8a04" stroke="#000" stroke-width="2" rx="4" />
          <text x="${width / 2}" y="${height / 2 + 5}" text-anchor="middle" font-size="14" fill="#fff" font-weight="bold">${type}</text>
        </g>
      `;
  }
}

// 1. Inch Ruler SVG component
export function renderInchRuler({ lengthInches = 6, objectLength = 4, objectOffset = 0, ticksPerInch = 4, objectType = 'pencil' }) {
  const pxPerInch = 120;
  const marginX = 40;
  const rulerHeight = 85;
  const width = lengthInches * pxPerInch + marginX * 2;
  const height = 240;

  let ticksHTML = '';
  const totalTicks = lengthInches * ticksPerInch;
  for (let i = 0; i <= totalTicks; i++) {
    const val = i / ticksPerInch;
    const xPos = marginX + val * pxPerInch;
    let tickHeight = 15;
    let isLabeled = false;

    if (i % ticksPerInch === 0) {
      tickHeight = 35;
      isLabeled = true;
    } else if ((i * 2) % ticksPerInch === 0) {
      tickHeight = 25; // half mark
    } else if ((i * 4) % ticksPerInch === 0) {
      tickHeight = 20; // quarter mark
    }

    ticksHTML += `<line x1="${xPos}" y1="${rulerHeight}" x2="${xPos}" y2="${rulerHeight - tickHeight}" stroke="#000" stroke-width="1.5" />`;

    if (isLabeled) {
      ticksHTML += `<text x="${xPos}" y="${rulerHeight - 42}" font-family="Outfit, sans-serif" font-weight="bold" font-size="18" text-anchor="middle">${val}</text>`;
    }
  }

  // Draw the measured object
  const objX = marginX + objectOffset * pxPerInch;
  const objW = objectLength * pxPerInch;
  const objY = rulerHeight + 25;
  const objH = 45;
  const objectHTML = drawRealWorldObject(objectType, objX, objY, objW, objH);

  // Guide lines to show measurement endpoints
  const guideLineHTML = `
    <line x1="${objX}" y1="${rulerHeight}" x2="${objX}" y2="${objY + objH}" stroke="#ef4444" stroke-dasharray="4" stroke-width="1.5" />
    <line x1="${objX + objW}" y1="${rulerHeight}" x2="${objX + objW}" y2="${objY + objH}" stroke="#ef4444" stroke-dasharray="4" stroke-width="1.5" />
  `;

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px;">
      <!-- Ruler Base -->
      <rect x="${marginX}" y="5" width="${lengthInches * pxPerInch}" height="${rulerHeight}" fill="#fef08a" stroke="#ca8a04" stroke-width="3" rx="4" />
      
      <!-- Ruler label -->
      <text x="${marginX + 15}" y="${rulerHeight - 12}" font-family="Outfit, sans-serif" font-weight="900" font-size="13" fill="#ca8a04">INCHES</text>
      
      <!-- Ticks and numbers -->
      ${ticksHTML}
      
      <!-- Helper lines -->
      ${guideLineHTML}
      
      <!-- Measured Object -->
      ${objectHTML}
    </svg>
  `;
}

// 2. Centimeter Ruler SVG component
export function renderCentimeterRuler({ lengthCm = 15, objectLength = 10, objectOffset = 0, objectType = 'crayon' }) {
  const pxPerCm = 45;
  const marginX = 40;
  const rulerHeight = 85;
  const width = lengthCm * pxPerCm + marginX * 2;
  const height = 240;

  let ticksHTML = '';
  for (let mm = 0; mm <= lengthCm * 10; mm++) {
    const valCm = mm / 10;
    const xPos = marginX + valCm * pxPerCm;
    let tickHeight = 10;
    let isLabeled = false;

    if (mm % 10 === 0) {
      tickHeight = 30;
      isLabeled = true;
    } else if (mm % 5 === 0) {
      tickHeight = 20; // 5mm mark
    }

    ticksHTML += `<line x1="${xPos}" y1="${rulerHeight}" x2="${xPos}" y2="${rulerHeight - tickHeight}" stroke="#000" stroke-width="1.2" />`;

    if (isLabeled) {
      ticksHTML += `<text x="${xPos}" y="${rulerHeight - 38}" font-family="Outfit, sans-serif" font-weight="bold" font-size="16" text-anchor="middle">${valCm}</text>`;
    }
  }

  const objX = marginX + objectOffset * pxPerCm;
  const objW = objectLength * pxPerCm;
  const objY = rulerHeight + 25;
  const objH = 45;
  const objectHTML = drawRealWorldObject(objectType, objX, objY, objW, objH);

  const guideLineHTML = `
    <line x1="${objX}" y1="${rulerHeight}" x2="${objX}" y2="${objY + objH}" stroke="#ef4444" stroke-dasharray="4" stroke-width="1.5" />
    <line x1="${objX + objW}" y1="${rulerHeight}" x2="${objX + objW}" y2="${objY + objH}" stroke="#ef4444" stroke-dasharray="4" stroke-width="1.5" />
  `;

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px;">
      <!-- Ruler Base -->
      <rect x="${marginX}" y="5" width="${lengthCm * pxPerCm}" height="${rulerHeight}" fill="#e2e8f0" stroke="#475569" stroke-width="3" rx="4" />
      
      <!-- Ruler label -->
      <text x="${marginX + 15}" y="${rulerHeight - 10}" font-family="Outfit, sans-serif" font-weight="900" font-size="13" fill="#475569">CENTIMETERS</text>
      
      <!-- Ticks and numbers -->
      ${ticksHTML}
      
      <!-- Guide lines -->
      ${guideLineHTML}
      
      <!-- Measured Object -->
      ${objectHTML}
    </svg>
  `;
}

// 3. Thermometer SVG component
export function renderThermometer({ temperature = 72, scaleSymbol = 'F', minTemp = -10, maxTemp = 110, tickInterval = 10 }) {
  const width = 160;
  const height = 360;
  const bulbRadius = 24;
  const tubeWidth = 20;

  const stemTop = 40;
  const stemBottom = 300;
  const stemHeight = stemBottom - stemTop;

  // Map temperature to height
  const range = maxTemp - minTemp;
  const clampedTemp = Math.max(minTemp, Math.min(maxTemp, temperature));
  const tempRatio = (clampedTemp - minTemp) / range;
  const liquidY = stemBottom - tempRatio * stemHeight;

  // Build ticks
  let ticksHTML = '';
  for (let t = minTemp; t <= maxTemp; t += tickInterval) {
    const ratio = (t - minTemp) / range;
    const yPos = stemBottom - ratio * stemHeight;

    // Draw main label tick and line
    ticksHTML += `
      <line x1="${width / 2 + tubeWidth / 2}" y1="${yPos}" x2="${width / 2 + tubeWidth / 2 + 15}" y2="${yPos}" stroke="#000" stroke-width="2" />
      <text x="${width / 2 + tubeWidth / 2 + 22}" y="${yPos + 5}" font-family="Outfit, sans-serif" font-weight="bold" font-size="14" text-anchor="start">${t}°</text>
    `;

    // Sub-ticks
    const subStep = tickInterval / 5;
    for (let st = t + subStep; st < t + tickInterval && st <= maxTemp; st += subStep) {
      const subRatio = (st - minTemp) / range;
      const subY = stemBottom - subRatio * stemHeight;
      ticksHTML += `
        <line x1="${width / 2 + tubeWidth / 2}" y1="${subY}" x2="${width / 2 + tubeWidth / 2 + 8}" y2="${subY}" stroke="#64748b" stroke-width="1" />
      `;
    }
  }

  // Choose color based on temperature
  const liquidColor = temperature > 0 ? '#ef4444' : '#0ea5e9'; // Red for warm, blue for freezing

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto;">
      <!-- Title -->
      <text x="${width / 2}" y="24" font-family="Outfit, sans-serif" font-weight="bold" font-size="18" text-anchor="middle">${scaleSymbol === 'F' ? 'Fahrenheit (°F)' : 'Celsius (°C)'}</text>
      
      <!-- Outer Tube Contour -->
      <rect x="${width / 2 - tubeWidth / 2 - 4}" y="${stemTop - 4}" width="${tubeWidth + 8}" height="${stemHeight + 8}" rx="${tubeWidth / 2}" fill="#f1f5f9" stroke="#000" stroke-width="2" />
      <circle cx="${width / 2}" cy="${stemBottom + bulbRadius / 2}" r="${bulbRadius + 4}" fill="#f1f5f9" stroke="#000" stroke-width="2" />
      
      <!-- White glass interior -->
      <rect x="${width / 2 - tubeWidth / 2}" y="${stemTop}" width="${tubeWidth}" height="${stemHeight}" rx="${tubeWidth / 2}" fill="#ffffff" />
      <circle cx="${width / 2}" cy="${stemBottom + bulbRadius / 2}" r="${bulbRadius}" fill="#ffffff" />

      <!-- Ticks and labels -->
      ${ticksHTML}

      <!-- Liquid columns -->
      <rect x="${width / 2 - tubeWidth / 4}" y="${liquidY}" width="${tubeWidth / 2}" height="${stemBottom - liquidY}" fill="${liquidColor}" />
      <circle cx="${width / 2}" cy="${stemBottom + bulbRadius / 2}" r="${bulbRadius - 3}" fill="${liquidColor}" />
    </svg>
  `;
}

// 4. Measuring Cup & Liquid Volume Container
export function renderMeasuringCup({ capacity = 1000, level = 600, unit = 'ml', vessel = 'cylinder' }) {
  const width = 240;
  const height = 320;
  const marginY = 40;
  const marginX = 60;
  const vesselHeight = height - marginY * 2;
  const vesselWidth = width - marginX * 2;

  // Map volume level to height
  const clampedLevel = Math.max(0, Math.min(capacity, level));
  const fillRatio = clampedLevel / capacity;
  const liquidY = height - marginY - fillRatio * vesselHeight;

  let ticksHTML = '';
  const intervals = 5;
  const step = capacity / intervals;
  for (let i = 0; i <= intervals; i++) {
    const val = step * i;
    const ratio = val / capacity;
    const yPos = height - marginY - ratio * vesselHeight;

    ticksHTML += `
      <line x1="${width - marginX}" y1="${yPos}" x2="${width - marginX - 15}" y2="${yPos}" stroke="#000" stroke-width="2" />
      <text x="${width - marginX + 8}" y="${yPos + 5}" font-family="Outfit, sans-serif" font-weight="bold" font-size="14" text-anchor="start">${val} ${unit}</text>
    `;
  }

  // Draw cup structure
  let vesselSVG = '';
  if (vessel === 'cup') {
    // Tapered glass shape
    vesselSVG = `
      <!-- Handle -->
      <path d="M ${marginX},${marginY + 30} C ${marginX - 40},${marginY + 30} ${marginX - 40},${height - marginY - 30} ${marginX},${height - marginY - 30}" fill="none" stroke="#64748b" stroke-width="6" stroke-linecap="round" />
      <!-- Liquid Fill (Polygon) -->
      <polygon points="${marginX + 5 + (1 - fillRatio) * 15},${liquidY} ${width - marginX - 5 - (1 - fillRatio) * 15},${liquidY} ${width - marginX - 20},${height - marginY} ${marginX + 20},${height - marginY}" fill="#38bdf8" />
      <!-- Outline Glass Cup -->
      <polygon points="${marginX},${marginY} ${width - marginX},${marginY} ${width - marginX - 20},${height - marginY} ${marginX + 20},${height - marginY}" fill="none" stroke="#000" stroke-width="3" />
    `;
  } else {
    // Graduated cylinder
    vesselSVG = `
      <!-- Cylinder Liquid Fill -->
      <rect x="${marginX + 3}" y="${liquidY}" width="${vesselWidth - 6}" height="${height - marginY - liquidY}" fill="#60a5fa" />
      <!-- Cylinder body -->
      <rect x="${marginX}" y="${marginY}" width="${vesselWidth}" height="${vesselHeight}" fill="none" stroke="#000" stroke-width="3" rx="4" />
      <!-- Base stand -->
      <ellipse cx="${width / 2}" cy="${height - marginY}" rx="${vesselWidth * 0.7}" ry="12" fill="#334155" stroke="#000" stroke-width="2" />
    `;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto;">
      ${vesselSVG}
      ${ticksHTML}
    </svg>
  `;
}

// 5. Balance Scale SVG component
export function renderBalanceScale({ leftWeight = 5, rightWeight = 8, leftLabel = 'Box A', rightLabel = 'Box B' }) {
  const width = 360;
  const height = 240;
  
  const midX = width / 2;
  const pivotY = height - 50;
  const beamY = 100;
  
  // Calculate beam tilt based on weight difference
  let tilt = 0; // levels
  if (leftWeight > rightWeight) {
    tilt = -15; // Left goes down
  } else if (rightWeight > leftWeight) {
    tilt = 15; // Right goes down
  }

  const armLength = 110;
  const rad = (tilt * Math.PI) / 180;
  
  // Left and right hook points on the beam
  const leftBeamX = midX - armLength * Math.cos(rad);
  const leftBeamY = beamY - armLength * Math.sin(rad);
  const rightBeamX = midX + armLength * Math.cos(rad);
  const rightBeamY = beamY + armLength * Math.sin(rad);

  // Platform/Pan details (they hang vertically downwards from beam tips)
  const panH = 70;
  const leftPanX = leftBeamX;
  const leftPanY = leftBeamY + panH;
  const rightPanX = rightBeamX;
  const rightPanY = rightBeamY + panH;

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px;">
      <!-- Base Stand -->
      <polygon points="${midX - 35},${pivotY} ${midX + 35},${pivotY} ${midX + 15},${beamY} ${midX - 15},${beamY}" fill="#475569" stroke="#000" stroke-width="2.5" />
      <rect x="${midX - 60}" y="${pivotY}" width="120" height="20" fill="#334155" stroke="#000" stroke-width="2" rx="4" />
      
      <!-- Hanger lines left -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX - 25}" y2="${leftPanY}" stroke="#64748b" stroke-width="1.5" />
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX + 25}" y2="${leftPanY}" stroke="#64748b" stroke-width="1.5" />
      <!-- Platform pan left -->
      <path d="M ${leftPanX - 30},${leftPanY} L ${leftPanX + 30},${leftPanY} Q ${leftPanX},${leftPanY + 12} ${leftPanX - 30},${leftPanY} Z" fill="#94a3b8" stroke="#000" stroke-width="2" />
      <!-- Left Object -->
      <rect x="${leftPanX - 18}" y="${leftPanY - 26}" width="36" height="25" fill="#f87171" stroke="#000" stroke-width="2" rx="2" />
      <text x="${leftPanX}" y="${leftPanY - 9}" font-family="Outfit, sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">${leftLabel}</text>

      <!-- Hanger lines right -->
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX - 25}" y2="${rightPanY}" stroke="#64748b" stroke-width="1.5" />
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX + 25}" y2="${rightPanY}" stroke="#64748b" stroke-width="1.5" />
      <!-- Platform pan right -->
      <path d="M ${rightPanX - 30},${rightPanY} L ${rightPanX + 30},${rightPanY} Q ${rightPanX},${rightPanY + 12} ${rightPanX - 30},${rightPanY} Z" fill="#94a3b8" stroke="#000" stroke-width="2" />
      <!-- Right Object -->
      <rect x="${rightPanX - 18}" y="${rightPanY - 26}" width="36" height="25" fill="#60a5fa" stroke="#000" stroke-width="2" rx="2" />
      <text x="${rightPanX}" y="${rightPanY - 9}" font-family="Outfit, sans-serif" font-weight="bold" font-size="12" fill="#fff" text-anchor="middle">${rightLabel}</text>

      <!-- Central Balance Beam (Balanced at midX, beamY) -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${rightBeamX}" y2="${rightBeamY}" stroke="#1e293b" stroke-width="6" stroke-linecap="round" />
      <circle cx="${midX}" cy="${beamY}" r="8" fill="#facc15" stroke="#000" stroke-width="2" />
    </svg>
  `;
}

// 6. Spring Dial Scale SVG component
export function renderSpringScale({ weight = 4.5, unit = 'lbs', maxWeight = 10 }) {
  const width = 200;
  const height = 240;
  const cx = width / 2;
  const cy = 110;
  const r = 70;

  // Calculate pointer angle (mapping 0 to maxWeight onto 270 degrees clockwise, starting from -135 degrees)
  const startAngle = -135;
  const totalAngleRange = 270;
  const valueRatio = Math.max(0, Math.min(maxWeight, weight)) / maxWeight;
  const angleDeg = startAngle + valueRatio * totalAngleRange;
  const angleRad = (angleDeg * Math.PI) / 180;

  const pointerX = cx + (r - 20) * Math.cos(angleRad);
  const pointerY = cy + (r - 20) * Math.sin(angleRad);

  // Mark lines on the dial
  let marksHTML = '';
  for (let i = 0; i <= maxWeight; i++) {
    const ratio = i / maxWeight;
    const markDeg = startAngle + ratio * totalAngleRange;
    const markRad = (markDeg * Math.PI) / 180;
    
    const xOuter = cx + r * Math.cos(markRad);
    const yOuter = cy + r * Math.sin(markRad);
    const xInner = cx + (r - 10) * Math.cos(markRad);
    const yInner = cy + (r - 10) * Math.sin(markRad);
    
    marksHTML += `<line x1="${xInner}" y1="${yInner}" x2="${xOuter}" y2="${yOuter}" stroke="#000" stroke-width="2" />`;
    
    // Label numbers
    const xText = cx + (r - 24) * Math.cos(markRad);
    const yText = cy + (r - 24) * Math.sin(markRad) + 5;
    marksHTML += `<text x="${xText}" y="${yText}" font-family="Outfit, sans-serif" font-weight="bold" font-size="13" text-anchor="middle">${i}</text>`;
  }

  return `
    <svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto;">
      <!-- Hanger Ring -->
      <circle cx="${cx}" cy="22" r="14" fill="none" stroke="#334155" stroke-width="4" />
      <rect x="${cx - 8}" y="32" width="16" height="20" fill="#475569" stroke="#000" stroke-width="1.5" />
      
      <!-- Scale Face -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#000" stroke-width="3.5" />
      
      <!-- Dial tick marks -->
      ${marksHTML}
      
      <!-- Pointer Needle -->
      <line x1="${cx}" y1="${cy}" x2="${pointerX}" y2="${pointerY}" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
      <circle cx="${cx}" cy="${cy}" r="6" fill="#334155" />
      
      <!-- Unit Label -->
      <text x="${cx}" y="${cy + r/2}" font-family="Outfit, sans-serif" font-weight="bold" font-size="14" fill="#64748b" text-anchor="middle">${unit.toUpperCase()}</text>
    </svg>
  `;
}

// 7. Cube Train SVG component
export function renderCubeTrain({ cubesCount = 5, orientation = 'horizontal', objectLength = 4.3, objectType = 'crayon' }) {
  const cubeSize = 35;
  const marginX = 40;
  const marginY = 50;
  const width = 360;
  const height = 180;

  let trainHTML = '';
  if (orientation === 'horizontal') {
    // Draw object aligned at (marginX, marginY)
    const objW = objectLength * cubeSize;
    const objectHTML = drawRealWorldObject(objectType, marginX, marginY, objW, 35);

    // Draw cube train underneath
    for (let i = 0; i < cubesCount; i++) {
      const colors = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
      const fill = colors[i % colors.length];
      trainHTML += `
        <rect x="${marginX + i * cubeSize}" y="${marginY + 50}" width="${cubeSize}" height="${cubeSize}" fill="${fill}" stroke="#000" stroke-width="2" rx="4" />
        <!-- Cube dot/knob connector -->
        <circle cx="${marginX + i * cubeSize + cubeSize / 2}" cy="${marginY + 50 + cubeSize / 2}" r="5" fill="#fff" opacity="0.4" />
      `;
    }

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px;">
        <!-- Object -->
        ${objectHTML}
        <!-- Cube Train -->
        ${trainHTML}
      </svg>
    `;
  } else {
    // Vertical train
    const objH = objectLength * cubeSize;
    const objectHTML = drawRealWorldObject(objectType, marginX, height - marginY - objH, 35, objH);

    for (let i = 0; i < cubesCount; i++) {
      const colors = ['#3b82f6', '#f43f5e', '#10b981', '#f59e0b', '#8b5cf6'];
      const fill = colors[i % colors.length];
      trainHTML += `
        <rect x="${marginX + 60}" y="${height - marginY - (i + 1) * cubeSize}" width="${cubeSize}" height="${cubeSize}" fill="${fill}" stroke="#000" stroke-width="2" rx="4" />
        <circle cx="${marginX + 60 + cubeSize / 2}" cy="${height - marginY - (i + 1) * cubeSize + cubeSize / 2}" r="5" fill="#fff" opacity="0.4" />
      `;
    }

    return `
      <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px;">
        <!-- Object -->
        ${objectHTML}
        <!-- Vertical Cube Train -->
        ${trainHTML}
      </svg>
    `;
  }
}

// 8. Unit Square Grid (for Area)
export function renderUnitSquareGrid({ gridWidth = 5, gridHeight = 4, shadedCoordinates = [] }) {
  const cellSize = 35;
  const padding = 20;
  const svgW = gridWidth * cellSize + padding * 2;
  const svgH = gridHeight * cellSize + padding * 2;

  let gridCells = '';
  const shadedSet = new Set(shadedCoordinates.map(coord => `${coord[0]},${coord[1]}`));

  for (let r = 0; r < gridHeight; r++) {
    for (let c = 0; c < gridWidth; c++) {
      const isShaded = shadedSet.has(`${c},${r}`);
      const fill = isShaded ? '#60a5fa' : '#ffffff';
      gridCells += `
        <rect x="${padding + c * cellSize}" y="${padding + r * cellSize}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="#475569" stroke-width="1.5" />
      `;
    }
  }

  return `
    <svg width="100%" height="${svgH}" viewBox="0 0 ${svgW} ${svgH}" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto; max-width:320px;">
      ${gridCells}
    </svg>
  `;
}

// 9. Isometric Stacked Blocks (for 3D Volume)
export function renderIsometricBlocks({ width = 3, depth = 2, height = 2 }) {
  const size = 30; // Isometric unit edge length
  const centerShiftX = 140;
  const centerShiftY = 160;

  // Projected 2D coordinates for an isometric point (x, y, z)
  // x goes right-down (+30 deg), y goes up (-90 deg), z goes left-down (+150 deg)
  const project = (ix, iy, iz) => {
    const rx = centerShiftX + (ix - iz) * size * Math.cos(Math.PI / 6);
    const ry = centerShiftY + (iz + ix) * size * Math.sin(Math.PI / 6) - iy * size;
    return { x: rx, y: ry };
  };

  let blocksHTML = '';

  // Draw blocks back-to-front, bottom-to-top to ensure correct occlusion layering
  for (let iy = 0; iy < height; iy++) {
    for (let iz = 0; iz < depth; iz++) {
      for (let ix = 0; ix < width; ix++) {
        // Draw one 3D unit cube at (ix, iy, iz)
        const p0 = project(ix, iy, iz);
        const pTop = project(ix, iy + 1, iz);
        const pR = project(ix + 1, iy, iz);
        const pL = project(ix, iy, iz + 1);
        const pTR = project(ix + 1, iy + 1, iz);
        const pTL = project(ix, iy + 1, iz + 1);
        const pF = project(ix + 1, iy, iz + 1);
        const pTF = project(ix + 1, iy + 1, iz + 1);

        blocksHTML += `
          <g>
            <!-- Top Face (light gray/yellowish highlights) -->
            <polygon points="${pTop.x},${pTop.y} ${pTR.x},${pTR.y} ${pTF.x},${pTF.y} ${pTL.x},${pTL.y}" fill="#93c5fd" stroke="#1e3a8a" stroke-width="1" />
            <!-- Left Face (medium shading) -->
            <polygon points="${pTop.x},${pTop.y} ${pTL.x},${pTL.y} ${pL.x},${pL.y} ${p0.x},${p0.y}" fill="#3b82f6" stroke="#1e3a8a" stroke-width="1" />
            <!-- Right Face (darkest shading) -->
            <polygon points="${pTop.x},${pTop.y} ${pTR.x},${pTR.y} ${pF.x},${pF.y} ${p0.x},${p0.y}" fill="#1d4ed8" stroke="#1e3a8a" stroke-width="1" />
          </g>
        `;
      }
    }
  }

  const svgW = width * 55 + depth * 55 + 40;
  const svgH = height * size + depth * 20 + width * 20 + 80;

  return `
    <svg width="100%" height="240" viewBox="0 0 320 240" xmlns="http://www.w3.org/2000/svg" style="background:#fff; border:2px solid #e2e8f0; border-radius:8px; display:block; margin:0 auto; max-width:320px;">
      ${blocksHTML}
    </svg>
  `;
}
