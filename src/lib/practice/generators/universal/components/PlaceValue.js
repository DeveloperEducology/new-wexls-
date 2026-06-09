import { SVG_DEFS } from './defs.js';

const THEMES = {
  green: {
    top: '#bbf7d0',
    left: '#4ade80',
    right: '#22c55e',
    stroke: '#15803d'
  },
  blue: {
    top: '#bfdbfe',
    left: '#60a5fa',
    right: '#3b82f6',
    stroke: '#1d4ed8'
  },
  orange: {
    top: '#ffedd5',
    left: '#fb923c',
    right: '#f97316',
    stroke: '#c2410c'
  },
  purple: {
    top: '#e9d5ff',
    left: '#c084fc',
    right: '#a855f7',
    stroke: '#7e22ce'
  },
  pink: {
    top: '#fecdd3',
    left: '#fb7185',
    right: '#f43f5e',
    stroke: '#be123c'
  },
  red: {
    top: '#fee2e2',
    left: '#f87171',
    right: '#ef4444',
    stroke: '#b91c1c'
  },
  yellow: {
    top: '#fef08a',
    left: '#facc15',
    right: '#eab308',
    stroke: '#a16207'
  }
};

const DEFAULT_THEMES = {
  thousands: THEMES.green,
  hundreds: THEMES.green,
  tens: THEMES.green,
  ones: THEMES.green
};

function getTheme(type, props) {
  if (props.color && THEMES[props.color]) {
    return THEMES[props.color];
  }
  const specColor = props[type + 'Color'];
  if (specColor && THEMES[specColor]) {
    return THEMES[specColor];
  }
  return DEFAULT_THEMES[type];
}

function drawCube(x, y, theme) {
  const { top, left, right, stroke } = theme;
  return `
    <g transform="translate(${x}, ${y})">
      <!-- Front Face -->
      <rect x="0" y="5" width="18" height="18" fill="${left}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Right Face -->
      <polygon points="18,5 27,0 27,18 18,23" fill="${right}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Top Face -->
      <polygon points="9,0 27,0 18,5 0,5" fill="${top}" stroke="${stroke}" stroke-width="0.75" />
    </g>
  `;
}

function drawThousand(x, y, theme) {
  const { top, left, right, stroke } = theme;
  let lines = '';
  
  // Top face grid lines
  for (let j = 1; j < 10; j++) {
    const xStart = j * 18;
    const yStart = 5;
    const xEnd = 90 + j * 18;
    const yEnd = 0;
    lines += `<line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="${stroke}" stroke-width="0.75" />`;
  }
  for (let j = 1; j < 10; j++) {
    const xStart = j * 9;
    const yStart = 5 - j * 0.5;
    const xEnd = 180 + j * 9;
    const yEnd = 5 - j * 0.5;
    lines += `<line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="${stroke}" stroke-width="0.75" />`;
  }
  
  // Front face grid lines
  for (let j = 1; j < 10; j++) {
    const xVal = j * 18;
    lines += `<line x1="${xVal}" y1="5" x2="${xVal}" y2="185" stroke="${stroke}" stroke-width="0.75" />`;
  }
  for (let j = 1; j < 10; j++) {
    const yVal = 5 + j * 18;
    lines += `<line x1="0" y1="${yVal}" x2="180" y2="${yVal}" stroke="${stroke}" stroke-width="0.75" />`;
  }
  
  // Right face grid lines
  for (let j = 1; j < 10; j++) {
    const xVal = 180 + j * 9;
    const yStart = 5 - j * 0.5;
    const yEnd = 185 - j * 0.5;
    lines += `<line x1="${xVal}" y1="${yStart}" x2="${xVal}" y2="${yEnd}" stroke="${stroke}" stroke-width="0.75" />`;
  }
  for (let j = 1; j < 10; j++) {
    const yValFront = 5 + j * 18;
    const yValBack = j * 18;
    lines += `<line x1="180" y1="${yValFront}" x2="270" y2="${yValBack}" stroke="${stroke}" stroke-width="0.75" />`;
  }

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Front Face -->
      <rect x="0" y="5" width="180" height="180" fill="${left}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Right Face -->
      <polygon points="180,5 270,0 270,180 180,185" fill="${right}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Top Face -->
      <polygon points="90,0 270,0 180,5 0,5" fill="${top}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Grid lines -->
      ${lines}
    </g>
  `;
}

function drawHundred(x, y, theme) {
  const { top, left, right, stroke } = theme;
  let lines = '';
  
  // Top face grid lines
  for (let j = 1; j < 10; j++) {
    const xStart = j * 18;
    const yStart = 5;
    const xEnd = 90 + j * 18;
    const yEnd = 0;
    lines += `<line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="${stroke}" stroke-width="0.75" />`;
  }
  for (let j = 1; j < 10; j++) {
    const xStart = j * 9;
    const yStart = 5 - j * 0.5;
    const xEnd = 180 + j * 9;
    const yEnd = 5 - j * 0.5;
    lines += `<line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="${stroke}" stroke-width="0.75" />`;
  }
  
  // Front face vertical separators
  for (let j = 1; j < 10; j++) {
    const xVal = j * 18;
    lines += `<line x1="${xVal}" y1="5" x2="${xVal}" y2="23" stroke="${stroke}" stroke-width="0.75" />`;
  }
  
  // Right face vertical separators
  for (let j = 1; j < 10; j++) {
    const xVal = 180 + j * 9;
    const yStart = 5 - j * 0.5;
    const yEnd = 23 - j * 0.5;
    lines += `<line x1="${xVal}" y1="${yStart}" x2="${xVal}" y2="${yEnd}" stroke="${stroke}" stroke-width="0.75" />`;
  }

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Front Face -->
      <rect x="0" y="5" width="180" height="18" fill="${left}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Right Face -->
      <polygon points="180,5 270,0 270,18 180,23" fill="${right}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Top Face -->
      <polygon points="90,0 270,0 180,5 0,5" fill="${top}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Grid lines -->
      ${lines}
    </g>
  `;
}

function drawTen(x, y, theme) {
  const { top, left, right, stroke } = theme;
  let lines = '';
  
  // Separator lines for front face
  for (let j = 1; j < 10; j++) {
    const yVal = 5 + j * 18;
    lines += `<line x1="0" y1="${yVal}" x2="18" y2="${yVal}" stroke="${stroke}" stroke-width="0.75" />`;
  }
  // Separator lines for right face
  for (let j = 1; j < 10; j++) {
    const yValFront = 5 + j * 18;
    const yValBack = j * 18;
    lines += `<line x1="18" y1="${yValFront}" x2="27" y2="${yValBack}" stroke="${stroke}" stroke-width="0.75" />`;
  }

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Front Face -->
      <rect x="0" y="5" width="18" height="180" fill="${left}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Right Face -->
      <polygon points="18,5 27,0 27,180 18,185" fill="${right}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Top Face -->
      <polygon points="9,0 27,0 18,5 0,5" fill="${top}" stroke="${stroke}" stroke-width="0.75" />
      <!-- Grid lines -->
      ${lines}
    </g>
  `;
}

export function renderPlaceValue(props) {
  const thousands = Math.max(0, Number(props.thousands || props.cubesCount) || 0);
  const hundreds = Math.max(0, Number(props.hundreds || props.flatsCount) || 0);
  const tens = Math.max(0, Number(props.tens || props.rodsCount) || 0);
  const ones = Math.max(0, Number(props.ones || props.blocksCount) || 0);
  const showChart = props.showChart !== undefined ? (props.showChart === 'true' || props.showChart === true) : false;

  const thousandsTheme = getTheme('thousands', props);
  const hundredsTheme = getTheme('hundreds', props);
  const tensTheme = getTheme('tens', props);
  const onesTheme = getTheme('ones', props);

  const hasThousands = thousands > 0;
  const hasHundreds = hundreds > 0 || hasThousands;

  let blocksMarkup = '';

  if (showChart) {
    // ─── Chart-Based Grid Layout ───
    let columns = [];
    if (hasThousands) {
      columns.push({ type: 'thousands', label: 'Thousands (1000s)', width: 300 });
    }
    if (hasHundreds) {
      columns.push({ type: 'hundreds', label: 'Hundreds (100s)', width: 300 });
    }
    columns.push({ type: 'tens', label: 'Tens (10s)', width: 300 });
    columns.push({ type: 'ones', label: 'Ones (1s)', width: 150 });

    let totalWidth = columns.reduce((sum, col) => sum + col.width, 0);
    let canvasWidth = totalWidth + 40;
    let canvasHeight = 280;

    let headerHeight = 35;
    let chartY = 10;
    let columnsMarkup = '';
    let currentX = 20;

    columns.forEach((col) => {
      const colX = currentX;
      const colWidth = col.width;
      const centerX = colX + colWidth / 2;

      columnsMarkup += `
        <!-- Column background header -->
        <rect x="${colX}" y="${chartY}" width="${colWidth}" height="${headerHeight}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" rx="4" />
        <!-- Column boundary lines -->
        <rect x="${colX}" y="${chartY}" width="${colWidth}" height="${canvasHeight - chartY - 10}" fill="none" stroke="#cbd5e1" stroke-width="1.5" rx="6" />
        <!-- Text label -->
        <text x="${centerX}" y="${chartY + 22}" font-family="system-ui, sans-serif" font-size="12px" font-weight="700" fill="#475569" text-anchor="middle">
          ${col.label}
        </text>
      `;

      if (col.type === 'thousands' && thousands > 0) {
        // Draw thousands overlapping slightly horizontally
        const step = 35;
        const totalWidth = (thousands - 1) * step + 270;
        const startX = centerX - totalWidth / 2;
        for (let i = 0; i < thousands; i++) {
          const x = startX + i * step;
          const y = 80 - i * 5;
          blocksMarkup += drawThousand(x, y, thousandsTheme);
        }
      } else if (col.type === 'hundreds' && hundreds > 0) {
        // Stack hundreds flats vertically like pancakes
        for (let i = 0; i < hundreds; i++) {
          const x = centerX - 135;
          const y = 242 - i * 15;
          blocksMarkup += drawHundred(x, y, hundredsTheme);
        }
      } else if (col.type === 'tens' && tens > 0) {
        // Draw tens rods with a clean gap and center them dynamically
        const step = 32; // 5px gap between 27px wide rods
        const totalWidth = (tens - 1) * step + 27;
        const startX = centerX - totalWidth / 2;
        for (let i = 0; i < tens; i++) {
          const x = startX + i * step;
          const y = 80;
          blocksMarkup += drawTen(x, y, tensTheme);
        }
      } else if (col.type === 'ones' && ones > 0) {
        for (let i = 0; i < ones; i++) {
          const row = Math.floor(i / 2);
          const cIdx = i % 2;
          const x = centerX - 30 + cIdx * 32;
          const y = 240 - row * 24;
          blocksMarkup += drawCube(x, y, onesTheme);
        }
      }

      currentX += colWidth;
    });

    return `
      <svg viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${Math.min(canvasWidth, 750)}px; display: block; margin: 15px auto;" filter="url(#shadow)">
        ${SVG_DEFS}
        ${columnsMarkup}
        <g>${blocksMarkup}</g>
      </svg>
    `.trim();

  } else {
    // ─── IXL-Style Vertical Floating Layout with Medium Scaling (0.55x) ───
    const scale = 0.55;

    // 1. Calculate row dimensions and vertical positions (standard coordinates)
    const thousandsRows = Math.ceil(thousands / 5);
    const thousandsHeight = thousands > 0 ? (thousandsRows - 1) * 200 + 185 : 0;
    
    const hundredsHeight = hundreds > 0 ? (hundreds - 1) * 30 + 23 : 0;
    
    const tensAndOnesHeight = (tens > 0 || ones > 0) ? 185 : 0;

    let rawHeight = 0;
    let thousandsY = 0;
    let hundredsY = 0;
    let tensAndOnesY = 0;

    if (thousands > 0) {
      thousandsY = rawHeight;
      rawHeight += thousandsHeight + 40;
    }
    if (hundreds > 0) {
      hundredsY = rawHeight;
      rawHeight += hundredsHeight + 40;
    }
    if (tens > 0 || ones > 0) {
      tensAndOnesY = rawHeight;
      rawHeight += tensAndOnesHeight + 20;
    }

    // 2. Calculate dynamic canvas width (standard coordinates)
    const maxThousandsCols = Math.min(thousands, 5);
    const thousandsWidth = thousands > 0 ? (maxThousandsCols - 1) * 290 + 270 : 0;
    const hundredsWidth = hundreds > 0 ? 270 : 0;
    const tensWidth = tens > 0 ? (tens - 1) * 40 + 27 : 0;
    
    const onesCols = Math.min(ones, 5);
    const onesWidth = ones > 0 ? (onesCols - 1) * 40 + 27 : 0;
    
    const tensAndOnesWidth = tensWidth + (tensWidth > 0 && onesWidth > 0 ? 50 : 0) + onesWidth;
    
    const rawWidth = Math.max(thousandsWidth, hundredsWidth, tensAndOnesWidth, 300);

    // Scaled canvas dimensions with 20px padding on all sides
    const canvasWidth = rawWidth * scale + 40;
    const canvasHeight = rawHeight * scale + 40;

    // 3. Render blocks at their calculated positions
    let blocksMarkup = '';

    // Render Thousands (Row 1)
    if (thousands > 0) {
      const startX = (rawWidth - thousandsWidth) / 2;
      for (let i = 0; i < thousands; i++) {
        const row = Math.floor(i / 5);
        const col = i % 5;
        const x = startX + col * 290;
        const y = thousandsY + row * 200;
        blocksMarkup += drawThousand(x, y, thousandsTheme);
      }
    }

    // Render Hundreds (Row 2)
    if (hundreds > 0) {
      const startX = (rawWidth - 270) / 2;
      for (let i = 0; i < hundreds; i++) {
        const x = startX;
        // Stack bottom flat first (i = 0 is bottom, i = hundreds-1 is top)
        const y = hundredsY + (hundreds - 1 - i) * 30;
        blocksMarkup += drawHundred(x, y, hundredsTheme);
      }
    }

    // Render Tens & Ones (Row 3)
    if (tens > 0 || ones > 0) {
      const startX = (rawWidth - tensAndOnesWidth) / 2;
      
      // Draw Tens rods
      if (tens > 0) {
        for (let i = 0; i < tens; i++) {
          const x = startX + i * 40;
          const y = tensAndOnesY;
          blocksMarkup += drawTen(x, y, tensTheme);
        }
      }

      // Draw Ones cubes (aligned to baseline of tens)
      if (ones > 0) {
        const onesStartX = startX + (tens > 0 ? (tens - 1) * 40 + 27 + 50 : 0);
        for (let i = 0; i < ones; i++) {
          const row = Math.floor(i / 5);
          const col = i % 5;
          const x = onesStartX + col * 40;
          const y = tensAndOnesY + 162 - row * 30;
          blocksMarkup += drawCube(x, y, onesTheme);
        }
      }
    }

    return `
      <svg viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${Math.min(canvasWidth, 750)}px; display: block; margin: 10px auto;" filter="url(#shadow)">
        ${SVG_DEFS}
        <g transform="translate(20, 20) scale(${scale})">${blocksMarkup}</g>
      </svg>
    `.trim();
  }
}
