import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderDecimalLine(props, rng) {
  const min = Number(props.min) !== undefined && !isNaN(Number(props.min)) ? Number(props.min) : 0;
  const max = Number(props.max) !== undefined && !isNaN(Number(props.max)) ? Number(props.max) : 1;
  const step = Number(props.step) || 0.1;
  const markedPoint = props.markedPoint !== undefined && !isNaN(Number(props.markedPoint)) ? Number(props.markedPoint) : null;
  const pointLabel = props.pointLabel || '';
  const color = props.color || 'blue';

  const selectedColor = resolveColor(color, COLORS, rng);

  const width = 600;
  const height = 100;
  const paddingX = 40;
  const lineY = 50;

  const totalSteps = (max - min) / step;
  const stepWidth = (width - paddingX * 2) / totalSteps;

  // Render arrows at line ends
  let linesMarkup = `
    <!-- Main line -->
    <line x1="${paddingX - 10}" y1="${lineY}" x2="${width - paddingX + 10}" y2="${lineY}" stroke="#475569" stroke-width="4" stroke-linecap="round" />
    <!-- Left Arrow -->
    <path d="M ${paddingX - 18} ${lineY} L ${paddingX - 6} ${lineY - 6} M ${paddingX - 18} ${lineY} L ${paddingX - 6} ${lineY + 6}" stroke="#475569" stroke-width="4" stroke-linecap="round" />
    <!-- Right Arrow -->
    <path d="M ${width - paddingX + 18} ${lineY} L ${width - paddingX + 6} ${lineY - 6} M ${width - paddingX + 18} ${lineY} L ${width - paddingX + 6} ${lineY + 6}" stroke="#475569" stroke-width="4" stroke-linecap="round" />
  `;

  let ticksMarkup = '';

  // Calculate decimal places to format nicely
  const stepString = String(step);
  const decimalPlaces = stepString.includes('.') ? stepString.split('.')[1].length : 0;

  for (let val = min; val <= max + 0.0001; val += step) {
    const idx = (val - min) / step;
    const x = paddingX + idx * stepWidth;
    const formattedVal = val.toFixed(decimalPlaces);
    
    // Draw tick line
    ticksMarkup += `
      <line x1="${x}" y1="${lineY - 8}" x2="${x}" y2="${lineY + 8}" stroke="#475569" stroke-width="2.5" />
      <text x="${x}" y="${lineY + 28}" font-family="system-ui, sans-serif" font-size="12px" font-weight="700" fill="#334155" text-anchor="middle" style="user-select: none;">${formattedVal}</text>
    `;
  }

  // Draw point indicator
  let pointMarkup = '';
  if (markedPoint !== null && markedPoint >= min && markedPoint <= max) {
    const idx = (markedPoint - min) / step;
    const x = paddingX + idx * stepWidth;
    pointMarkup += `
      <g>
        <circle cx="${x}" cy="${lineY}" r="8" fill="${selectedColor.fill}" stroke="${selectedColor.stroke}" stroke-width="2.5" filter="url(#shadow)" />
        ${pointLabel ? `
          <text x="${x}" y="${lineY - 16}" font-family="system-ui, sans-serif" font-size="16px" font-weight="900" fill="${selectedColor.stroke}" text-anchor="middle">${pointLabel}</text>
        ` : ''}
      </g>
    `;
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      ${linesMarkup}
      ${ticksMarkup}
      ${pointMarkup}
    </svg>
  `.trim();
}
