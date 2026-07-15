import { COLORS, FLAT_COLORS, SVG_DEFS, resolveColor } from './defs.js';

function renderCellShape(shape, cx, cy, colorInfo, className = '', style = '') {
  const classAttr = className ? `class="${className}"` : '';
  const styleAttr = style ? `style="${style}"` : '';
  
  if (shape === 'triangle') {
    return `<polygon ${classAttr} ${styleAttr} points="${cx},${cy - 22} ${cx - 24},${cy + 20} ${cx + 24},${cy + 20}" fill="${colorInfo.fill}" stroke="${colorInfo.stroke}" stroke-width="2.5" filter="url(#shadow)" />`;
  }
  if (shape === 'star') {
    const getStarPoints = (cx, cy, rOuter, rInner) => {
      const points = [];
      for (let i = 0; i < 10; i++) {
        const angle = (Math.PI * i) / 5 - Math.PI / 2;
        const r = i % 2 === 0 ? rOuter : rInner;
        points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
      }
      return points.join(' ');
    };
    return `<polygon ${classAttr} ${styleAttr} points="${getStarPoints(cx, cy, 22, 9)}" fill="${colorInfo.fill}" stroke="${colorInfo.stroke}" stroke-width="2" filter="url(#shadow)" />`;
  }
  if (shape === 'square') {
    return `<rect ${classAttr} ${styleAttr} x="${cx - 20}" y="${cy - 20}" width="40" height="40" rx="6" fill="${colorInfo.fill}" stroke="${colorInfo.stroke}" stroke-width="2.5" filter="url(#shadow)" />`;
  }
  // Default is circle
  return `<circle ${classAttr} ${styleAttr} cx="${cx}" cy="${cy}" r="24" fill="${colorInfo.fill}" stroke="${colorInfo.stroke}" stroke-width="2" filter="url(#shadow)" />`;
}

export function renderTenFrame(props, rng) {
  const filledCount = props.filledCount;
  const crossedOutCount = props.crossedOutCount || 0;
  const color = props.color || 'red';
  const clickToFill = props.clickToFill === true || props.clickToFill === 'true' || props.clickToFill === 1;
  const frameCount = Number(props.frameCount) || 1;
  const shape = props.shape || 'circle';

  const cellWidth = 70;
  const cellHeight = 70;
  const padding = 20;
  const gridWidth = cellWidth * 5; // 350
  const gridHeight = cellHeight * 2; // 140
  const frameSpacing = 30;

  let colsCount = 1;
  let rowsCount = 1;

  if (frameCount === 2) {
    colsCount = 2;
  } else if (frameCount >= 3) {
    colsCount = 2;
    rowsCount = 2;
  }

  const svgWidth = gridWidth * colsCount + frameSpacing * (colsCount - 1) + padding * 2;
  // Increase height if click to fill buttons are displayed underneath
  const extraHeight = clickToFill ? 60 : 0;
  const svgHeight = gridHeight * rowsCount + frameSpacing * (rowsCount - 1) + padding * 2 + extraHeight;

  const selectedColor = resolveColor(color, COLORS, rng);
  const initialFilled = Number(filledCount) || 0;
  const crossed = Number(crossedOutCount) || 0;

  let gridCells = '';
  let countersMarkup = '';

  const totalCells = frameCount * 10;

  if (clickToFill) {
    let idx = 0;
    for (let f = 0; f < frameCount; f++) {
      const fRow = colsCount > 1 ? Math.floor(f / 2) : 0;
      const fCol = colsCount > 1 ? f % 2 : f;
      
      const offsetX = fCol * (gridWidth + frameSpacing);
      const offsetY = fRow * (gridHeight + frameSpacing);

      // Draw grid container outline for premium look
      const frameX = padding + offsetX;
      const frameY = padding + offsetY;
      gridCells += `<rect x="${frameX}" y="${frameY}" width="${gridWidth}" height="${gridHeight}" fill="none" stroke="#bae6fd" stroke-width="4" rx="4" />`;

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
          const xBox = padding + offsetX + c * cellWidth;
          const yBox = padding + offsetY + r * cellHeight;
          const cx = xBox + cellWidth / 2;
          const cy = yBox + cellHeight / 2;
          const radius = 24;

          const isPrefilled = idx < initialFilled;
          const isCrossed = isPrefilled && idx >= (initialFilled - crossed);
          const fillAttr = isPrefilled ? 'data-filled="true"' : 'data-filled="false"';
          const dotVisibility = isPrefilled ? 'visible' : 'hidden';
          const crossVisibility = isCrossed ? 'visible' : 'hidden';

          const clickAttr = `onclick="
            var isFilled = this.getAttribute('data-filled') === 'true';
            var circle = this.querySelector('.counter-dot');
            var cross = this.querySelector('.counter-cross');
            if (isFilled) {
              this.setAttribute('data-filled', 'false');
              if (circle) {
                circle.setAttribute('visibility', 'hidden');
                circle.style.visibility = 'hidden';
              }
              if (cross) {
                cross.setAttribute('visibility', 'hidden');
                cross.style.visibility = 'hidden';
              }
            } else {
              this.setAttribute('data-filled', 'true');
              if (circle) {
                circle.setAttribute('visibility', 'visible');
                circle.style.visibility = 'visible';
              }
              if (cross) {
                cross.setAttribute('visibility', 'visible');
                cross.style.visibility = 'visible';
              }
            }
            var svg = this.ownerSVGElement;
            var filled = svg.querySelectorAll('[data-filled=true]').length;
            var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
            if (input) {
              input.value = filled;
              input.dispatchEvent(new Event('input', { bubbles: true }));
            }
          "`;

          let crossMarkup = '';
          if (crossed > 0) {
            crossMarkup = `
              <g class="counter-cross" visibility="${crossVisibility}" style="pointer-events: none;">
                <line x1="${cx - 16}" y1="${cy - 16}" x2="${cx + 16}" y2="${cy + 16}" stroke="#dc2626" stroke-width="6" stroke-linecap="round" />
                <line x1="${cx + 16}" y1="${cy - 16}" x2="${cx - 16}" y2="${cy + 16}" stroke="#dc2626" stroke-width="6" stroke-linecap="round" />
              </g>
            `;
          }

          const shapeHtml = renderCellShape(shape, cx, cy, selectedColor, 'counter-dot', `visibility: ${dotVisibility}; pointer-events: none;`);

          gridCells += `
            <g ${fillAttr} style="cursor: pointer;" ${clickAttr}>
              <rect x="${xBox}" y="${yBox}" width="${cellWidth}" height="${cellHeight}" fill="#f0f9ff" stroke="#bae6fd" stroke-width="2.5" />
              ${shapeHtml}
              ${crossMarkup}
            </g>
          `;
          idx++;
        }
      }
    }

    const btnWidth = 140;
    const btnSpacing = 30;
    const totalBtnWidth = btnWidth * 2 + btnSpacing;
    const btnStartX = (svgWidth - totalBtnWidth) / 2;
    const btnY = gridHeight * rowsCount + frameSpacing * (rowsCount - 1) + padding + 15;
    const btnHeight = 36;
    
    countersMarkup += `
      <!-- Add Dot Button -->
      <g style="cursor: pointer;" onclick="
        var svg = this.ownerSVGElement;
        var cells = svg.querySelectorAll('[data-filled]');
        for (var i = 0; i < cells.length; i++) {
          if (cells[i].getAttribute('data-filled') === 'false') {
            cells[i].setAttribute('data-filled', 'true');
            var circle = cells[i].querySelector('.counter-dot');
            if (circle) {
              circle.setAttribute('visibility', 'visible');
              circle.style.visibility = 'visible';
            }
            break;
          }
        }
        var filled = svg.querySelectorAll('[data-filled=true]').length;
        var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
        if (input) {
          input.value = filled;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      ">
        <rect x="${btnStartX}" y="${btnY}" width="${btnWidth}" height="${btnHeight}" rx="8" fill="#3b82f6" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="${btnStartX + 20}" cy="${btnY + btnHeight/2}" r="10" fill="${selectedColor.fill}" stroke="${selectedColor.stroke}" stroke-width="1.5" />
        <text x="${btnStartX + 80}" y="${btnY + btnHeight/2 + 5}" fill="#ffffff" font-size="13" font-weight="700" font-family='&quot;Inter&quot;, sans-serif' text-anchor="middle" style="user-select: none;">Place Dot</text>
      </g>
      
      <!-- Clear Button (Trash) -->
      <g style="cursor: pointer;" onclick="
        var svg = this.ownerSVGElement;
        var cells = svg.querySelectorAll('[data-filled]');
        for (var i = 0; i < cells.length; i++) {
          cells[i].setAttribute('data-filled', 'false');
          var circle = cells[i].querySelector('.counter-dot');
          var cross = cells[i].querySelector('.counter-cross');
          if (circle) {
            circle.setAttribute('visibility', 'hidden');
            circle.style.visibility = 'hidden';
          }
          if (cross) {
            cross.setAttribute('visibility', 'hidden');
            cross.style.visibility = 'hidden';
          }
        }
        var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
        if (input) {
          input.value = 0;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      ">
        <rect x="${btnStartX + btnWidth + btnSpacing}" y="${btnY}" width="${btnWidth}" height="${btnHeight}" rx="8" fill="#ef4444" stroke="#dc2626" stroke-width="1.5" />
        <path d="M ${btnStartX + btnWidth + btnSpacing + 20} ${btnY + 12} L ${btnStartX + btnWidth + btnSpacing + 36} ${btnY + 12} M ${btnStartX + btnWidth + btnSpacing + 23} ${btnY + 12} L ${btnStartX + btnWidth + btnSpacing + 23} ${btnY + 26} L ${btnStartX + btnWidth + btnSpacing + 33} ${btnY + 26} L ${btnStartX + btnWidth + btnSpacing + 33} ${btnY + 12} M ${btnStartX + btnWidth + btnSpacing + 27} ${btnY + 16} L ${btnStartX + btnWidth + btnSpacing + 27} ${btnY + 22} M ${btnStartX + btnWidth + btnSpacing + 30} ${btnY + 16} L ${btnStartX + btnWidth + btnSpacing + 30} ${btnY + 22}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        <text x="${btnStartX + btnWidth + btnSpacing + 85}" y="${btnY + btnHeight/2 + 5}" fill="#ffffff" font-size="13" font-weight="700" font-family='&quot;Inter&quot;, sans-serif' text-anchor="middle" style="user-select: none;">Clear All</text>
      </g>
    `;
  } else {
    // Draw cells
    for (let f = 0; f < frameCount; f++) {
      const fRow = colsCount > 1 ? Math.floor(f / 2) : 0;
      const fCol = colsCount > 1 ? f % 2 : f;
      
      const offsetX = fCol * (gridWidth + frameSpacing);
      const offsetY = fRow * (gridHeight + frameSpacing);

      // Draw grid container outline for premium look
      const frameX = padding + offsetX;
      const frameY = padding + offsetY;
      gridCells += `<rect x="${frameX}" y="${frameY}" width="${gridWidth}" height="${gridHeight}" fill="none" stroke="#bae6fd" stroke-width="4" rx="4" />`;

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
          const x = padding + offsetX + c * cellWidth;
          const y = padding + offsetY + r * cellHeight;
          gridCells += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="#f0f9ff" stroke="#bae6fd" stroke-width="2.5" />`;
        }
      }
    }

    const totalCounters = Number(filledCount) || 0;
    const crossed = Number(crossedOutCount) || 0;

    let idx = 0;
    for (let f = 0; f < frameCount; f++) {
      const fRow = colsCount > 1 ? Math.floor(f / 2) : 0;
      const fCol = colsCount > 1 ? f % 2 : f;
      
      const offsetX = fCol * (gridWidth + frameSpacing);
      const offsetY = fRow * (gridHeight + frameSpacing);

      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 5; c++) {
          if (idx >= totalCounters) break;
          
          const x = padding + offsetX + c * cellWidth + cellWidth / 2;
          const y = padding + offsetY + r * cellHeight + cellHeight / 2;

          const shapeHtml = renderCellShape(shape, x, y, selectedColor);
          countersMarkup += shapeHtml;

          // Draw red cross if it's subtraction
          if (idx >= (totalCounters - crossed)) {
            countersMarkup += `
              <line x1="${x - 16}" y1="${y - 16}" x2="${x + 16}" y2="${y + 16}" stroke="#dc2626" stroke-width="6" stroke-linecap="round" />
              <line x1="${x + 16}" y1="${y - 16}" x2="${x - 16}" y2="${y + 16}" stroke="#dc2626" stroke-width="6" stroke-linecap="round" />
            `;
          }

          idx++;
        }
      }
    }
  }

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${Math.min(svgWidth + 40, 800)}px; display: block; margin: 0 auto;">
      ${SVG_DEFS}
      <rect x="5" y="5" width="${svgWidth - 10}" height="${svgHeight - 10}" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow)" />
      <g>
        ${gridCells}
        ${countersMarkup}
      </g>
    </svg>
  `.trim();
}
