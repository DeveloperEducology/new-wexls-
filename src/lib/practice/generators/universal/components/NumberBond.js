import { SVG_DEFS } from './defs.js';

export function renderNumberBond(props) {
  const wholeVal = props.whole !== undefined ? String(props.whole) : '';
  const leftVal = props.left !== undefined ? String(props.left) : '';
  const rightVal = props.right !== undefined ? String(props.right) : '';
  const missing = props.missing || ''; // 'whole', 'left', 'right'

  const width = 360;
  const height = 240;

  const wholeX = width / 2;
  const wholeY = 60;
  const wholeRadius = 40;

  const leftX = width / 2 - 70;
  const leftY = 170;
  const partRadius = 32;

  const rightX = width / 2 + 70;
  const rightY = 170;

  const drawBubble = (cx, cy, r, val, isMissing, fill, stroke) => {
    const strokeDash = isMissing ? 'stroke-dasharray="6,4"' : '';
    const displayVal = isMissing ? '?' : val;
    const fontColor = isMissing ? '#ef4444' : '#1e293b';
    const finalStroke = isMissing ? '#ef4444' : stroke;
    const finalFill = isMissing ? '#fef2f2' : fill;

    return `
      <g>
        <circle cx="${cx}" cy="${cy}" r="${r}" fill="${finalFill}" stroke="${finalStroke}" stroke-width="3" ${strokeDash} filter="url(#shadow)" />
        <text x="${cx}" y="${cy + (r * 0.2) + 2}" font-family="system-ui, sans-serif" font-size="${r * 0.7}px" font-weight="900" fill="${fontColor}" text-anchor="middle" style="user-select: none;">
          ${displayVal}
        </text>
      </g>
    `;
  };

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 360px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <g>
        <!-- Connecting lines -->
        <line x1="${wholeX}" y1="${wholeY}" x2="${leftX}" y2="${leftY}" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round" />
        <line x1="${wholeX}" y1="${wholeY}" x2="${rightX}" y2="${rightY}" stroke="#94a3b8" stroke-width="4.5" stroke-linecap="round" />
        
        <!-- Whole Bubble -->
        ${drawBubble(wholeX, wholeY, wholeRadius, wholeVal, missing === 'whole', '#eff6ff', '#2563eb')}
        
        <!-- Left Part Bubble -->
        ${drawBubble(leftX, leftY, partRadius, leftVal, missing === 'left', '#f0fdf4', '#16a34a')}
        
        <!-- Right Part Bubble -->
        ${drawBubble(rightX, rightY, partRadius, rightVal, missing === 'right', '#f0fdf4', '#16a34a')}
      </g>
    </svg>
  `.trim();
}
