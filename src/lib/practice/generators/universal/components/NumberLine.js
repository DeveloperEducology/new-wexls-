import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderNumberLine(props, rng) {
  const min = Number(props.min) !== undefined && !isNaN(Number(props.min)) ? Number(props.min) : 0;
  const max = Number(props.max) !== undefined && !isNaN(Number(props.max)) ? Number(props.max) : 10;
  const step = Number(props.step) || 1;
  const pointValue = props.pointValue !== undefined && !isNaN(Number(props.pointValue)) ? Number(props.pointValue) : null;
  const pointLabel = props.pointLabel || '';
  const markedPoints = props.markedPoints ? String(props.markedPoints).split(',').map(Number).filter(n => !isNaN(n)) : [];
  const jumps = props.jumps ? String(props.jumps).split('->').map(s => s.trim()).map(Number).filter(n => !isNaN(n)) : [];
  const interactive = props.interactive === true || props.interactive === 'true' || props.interactive === 1;
  const highlightBoxes = props.highlightBoxes ? String(props.highlightBoxes).split(',').map(s => s.trim()).map(Number).filter(n => !isNaN(n)) : [];
  const color = props.color || 'blue';

  const selectedColor = resolveColor(color, COLORS, rng);
  
  const width = 600;
  const height = jumps.length > 0 ? 160 : 100;
  const paddingX = 40;
  const lineY = jumps.length > 0 ? 110 : 50;
  
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
  let interactivePointsMarkup = '';

  for (let val = min; val <= max; val += step) {
    const idx = (val - min) / step;
    const x = paddingX + idx * stepWidth;
    
    const boxWidth = String(val).length * 8 + 12;
    const boxX = x - boxWidth / 2;
    const boxY = lineY + 14;
    const boxHeight = 20;

    if (interactive) {
      // Interactive tap zone for clicks (covers the whole tick area)
      const clickAttr = `onclick="
        var svg = this.ownerSVGElement;
        // Hide/Show correct indicator
        var dots = svg.querySelectorAll('.interactive-dot');
        for (var i = 0; i < dots.length; i++) {
          dots[i].setAttribute('visibility', 'hidden');
        }
        var activeDot = this.querySelector('.interactive-dot');
        if (activeDot) activeDot.setAttribute('visibility', 'visible');
        
        // Update input
        var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
        if (input) {
          input.value = ${val};
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      "`;

      const isInitiallySelected = pointValue !== null && val === pointValue;
      ticksMarkup += `
        <g style="cursor: pointer;" ${clickAttr}>
          <!-- Expanded click capture box (covers tick line, dot, and label area) -->
          <rect x="${x - 18}" y="${lineY - 20}" width="36" height="65" fill="transparent" />
          <line x1="${x}" y1="${lineY - 8}" x2="${x}" y2="${lineY + 8}" stroke="#475569" stroke-width="2.5" />
          ${highlightBoxes.includes(val) ? `
            <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" fill="none" stroke="${selectedColor.stroke}" stroke-width="2" rx="3" />
          ` : ''}
          <text x="${x}" y="${lineY + 28}" font-family="system-ui, sans-serif" font-size="14px" font-weight="700" fill="#334155" text-anchor="middle" style="user-select: none;">${val}</text>
          <circle class="interactive-dot" cx="${x}" cy="${lineY}" r="7" fill="${selectedColor.fill}" stroke="${selectedColor.stroke}" stroke-width="2" visibility="${isInitiallySelected ? 'visible' : 'hidden'}" />
        </g>
      `;
    } else {
      // Static ticks
      ticksMarkup += `
        <line x1="${x}" y1="${lineY - 8}" x2="${x}" y2="${lineY + 8}" stroke="#475569" stroke-width="2.5" />
        ${highlightBoxes.includes(val) ? `
          <rect x="${boxX}" y="${boxY}" width="${boxWidth}" height="${boxHeight}" fill="none" stroke="${selectedColor.stroke}" stroke-width="2" rx="3" />
        ` : ''}
        <text x="${x}" y="${lineY + 28}" font-family="system-ui, sans-serif" font-size="14px" font-weight="700" fill="#334155" text-anchor="middle" style="user-select: none;">${val}</text>
      `;
    }
  }

  // Draw point indicators
  let pointMarkup = '';
  if (!interactive && pointValue !== null && pointValue >= min && pointValue <= max) {
    const idx = (pointValue - min) / step;
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

  // Draw static marked points
  markedPoints.forEach(val => {
    if (val >= min && val <= max) {
      const idx = (val - min) / step;
      const x = paddingX + idx * stepWidth;
      pointMarkup += `
        <circle cx="${x}" cy="${lineY}" r="6" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" />
      `;
    }
  });

  // Draw jumps (curved paths)
  let jumpsMarkup = '';
  if (jumps.length > 1) {
    for (let i = 0; i < jumps.length - 1; i++) {
      const fromVal = jumps[i];
      const toVal = jumps[i + 1];
      
      const fromIdx = (fromVal - min) / step;
      const toIdx = (toVal - min) / step;
      
      const x1 = paddingX + fromIdx * stepWidth;
      const x2 = paddingX + toIdx * stepWidth;
      
      const midX = (x1 + x2) / 2;
      const curveHeight = Math.min(80, Math.abs(x2 - x1) * 0.4);
      const topY = lineY - curveHeight;

      // Draw quadratic bezier curved arrow
      const isForward = toVal > fromVal;
      const arrowDx = isForward ? 4 : -4;
      const arrowDy = 2;

      jumpsMarkup += `
        <path d="M ${x1} ${lineY} Q ${midX} ${topY} ${x2} ${lineY}" fill="none" stroke="${selectedColor.stroke}" stroke-width="3" stroke-dasharray="1 0" />
        <!-- Arrowhead -->
        <path d="M ${x2} ${lineY} L ${x2 - arrowDx * 2 - arrowDy} ${lineY - curveHeight/5} M ${x2} ${lineY} L ${x2 - arrowDx * 2 + arrowDy} ${lineY + curveHeight/5}" stroke="${selectedColor.stroke}" stroke-width="3" stroke-linecap="round" />
      `;
    }
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      ${linesMarkup}
      ${ticksMarkup}
      ${jumpsMarkup}
      ${pointMarkup}
      ${interactivePointsMarkup}
    </svg>
  `.trim();
}
