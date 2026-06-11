import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderTenFrame(props, rng) {
  const filledCount = props.filledCount;
  const crossedOutCount = props.crossedOutCount || 0;
  const color = props.color || 'red';
  const clickToFill = props.clickToFill === true || props.clickToFill === 'true' || props.clickToFill === 1;

  const cellWidth = 70;
  const cellHeight = 70;
  const padding = 20;
  const gridWidth = cellWidth * 5;
  const gridHeight = cellHeight * 2;
  const svgWidth = gridWidth + padding * 2;
  
  // Increase height if click to fill buttons are displayed underneath
  const extraHeight = clickToFill ? 60 : 0;
  const svgHeight = gridHeight + padding * 2 + extraHeight;
  
  const selectedColor = resolveColor(color, COLORS, rng);
  const initialFilled = Number(filledCount) || 0;
  const crossed = Number(crossedOutCount) || 0;

  let gridCells = '';
  let countersMarkup = '';

  if (clickToFill) {
    let idx = 0;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const xBox = padding + c * cellWidth;
        const yBox = padding + r * cellHeight;
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
            if (circle) circle.setAttribute('visibility', 'hidden');
            if (cross) cross.setAttribute('visibility', 'hidden');
          } else {
            this.setAttribute('data-filled', 'true');
            if (circle) circle.setAttribute('visibility', 'visible');
            if (cross) cross.setAttribute('visibility', 'visible');
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

        gridCells += `
          <g ${fillAttr} style="cursor: pointer;" ${clickAttr}>
            <rect x="${xBox}" y="${yBox}" width="${cellWidth}" height="${cellHeight}" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />
            <circle class="counter-dot" cx="${cx}" cy="${cy}" r="${radius}" fill="${selectedColor.fill}" stroke="${selectedColor.stroke}" stroke-width="2" filter="url(#shadow)" visibility="${dotVisibility}" style="pointer-events: none;" />
            ${crossMarkup}
          </g>
        `;
        idx++;
      }
    }

    const btnY = gridHeight + padding + 15;
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
            if (circle) circle.setAttribute('visibility', 'visible');
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
        <rect x="50" y="${btnY}" width="130" height="${btnHeight}" rx="8" fill="#3b82f6" stroke="#2563eb" stroke-width="1.5" />
        <circle cx="75" cy="${btnY + btnHeight/2}" r="10" fill="${selectedColor.fill}" stroke="${selectedColor.stroke}" stroke-width="1.5" />
        <text x="130" y="${btnY + btnHeight/2 + 5}" fill="#ffffff" font-size="13" font-weight="700" font-family='&quot;Inter&quot;, sans-serif' text-anchor="middle" style="user-select: none;">Place Dot</text>
      </g>
      
      <!-- Clear Button (Trash) -->
      <g style="cursor: pointer;" onclick="
        var svg = this.ownerSVGElement;
        var cells = svg.querySelectorAll('[data-filled]');
        for (var i = 0; i < cells.length; i++) {
          cells[i].setAttribute('data-filled', 'false');
          var circle = cells[i].querySelector('.counter-dot');
          var cross = cells[i].querySelector('.counter-cross');
          if (circle) circle.setAttribute('visibility', 'hidden');
          if (cross) cross.setAttribute('visibility', 'hidden');
        }
        var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
        if (input) {
          input.value = 0;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      ">
        <rect x="210" y="${btnY}" width="130" height="${btnHeight}" rx="8" fill="#ef4444" stroke="#dc2626" stroke-width="1.5" />
        <path d="M 230 ${btnY + 12} L 246 ${btnY + 12} M 233 ${btnY + 12} L 233 ${btnY + 26} L 243 ${btnY + 26} L 243 ${btnY + 12} M 237 ${btnY + 16} L 237 ${btnY + 22} M 240 ${btnY + 16} L 240 ${btnY + 22}" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" />
        <text x="290" y="${btnY + btnHeight/2 + 5}" fill="#ffffff" font-size="13" font-weight="700" font-family='&quot;Inter&quot;, sans-serif' text-anchor="middle" style="user-select: none;">Clear All</text>
      </g>
    `;
  } else {
    // Draw cell boxes
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        const x = padding + c * cellWidth;
        const y = padding + r * cellHeight;
        gridCells += `<rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />`;
      }
    }

    const totalCounters = Number(filledCount) || 0;
    const crossed = Number(crossedOutCount) || 0;

    let idx = 0;
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 5; c++) {
        if (idx >= totalCounters) break;
        
        const x = padding + c * cellWidth + cellWidth / 2;
        const y = padding + r * cellHeight + cellHeight / 2;
        const radius = 24;

        countersMarkup += `
          <circle cx="${x}" cy="${y}" r="${radius}" fill="${selectedColor.fill}" stroke="${selectedColor.stroke}" stroke-width="2" filter="url(#shadow)" />
        `;

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

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 420px; display: block; margin: 0 auto;">
      ${SVG_DEFS}
      <rect x="5" y="5" width="${svgWidth - 10}" height="${svgHeight - 10}" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow)" />
      <g>
        ${gridCells}
        ${countersMarkup}
      </g>
    </svg>
  `.trim();
}
