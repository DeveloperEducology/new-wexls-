import { FLAT_COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderFractionGrid(props, rng) {
  const rows = Math.max(1, Number(props.rows) || 3);
  const cols = Math.max(1, Number(props.cols) || 4);
  const total = rows * cols;
  const shaded = Math.max(0, Math.min(total, Number(props.shaded) || 1));
  const interactive = props.interactive === true || props.interactive === 'true' || props.interactive === 1 || props.clickToFill === true || props.clickToFill === 'true';

  const theme = resolveColor(props.color, FLAT_COLORS, rng);

  const cellWidth = 50;
  const cellHeight = 50;
  const padding = 15;
  
  const width = cols * cellWidth + padding * 2;
  const height = rows * cellHeight + padding * 2;

  let gridCells = '';

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = padding + c * cellWidth;
      const y = padding + r * cellHeight;
      const isShaded = idx < shaded;

      const fill = isShaded ? theme.fill : '#ffffff';
      const stroke = isShaded ? theme.stroke : '#94a3b8';
      const strokeWidth = isShaded ? 3.5 : 1.5;

      const clickAttr = interactive ? `
        style="cursor: pointer;"
        data-filled="${isShaded ? 'true' : 'false'}"
        onclick="
          var isFilled = this.getAttribute('data-filled') === 'true';
          if (isFilled) {
            this.setAttribute('data-filled', 'false');
            this.setAttribute('fill', '#ffffff');
            this.setAttribute('stroke', '#94a3b8');
            this.setAttribute('stroke-width', '1.5');
          } else {
            this.setAttribute('data-filled', 'true');
            this.setAttribute('fill', '${theme.fill}');
            this.setAttribute('stroke', '${theme.stroke}');
            this.setAttribute('stroke-width', '3.5');
          }
          var svg = this.ownerSVGElement;
          var filled = svg.querySelectorAll('[data-filled=true]').length;
          var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
          if (input) {
            input.value = filled;
            input.dispatchEvent(new Event('input', { bubbles: true }));
          }
        "
      ` : '';

      gridCells += `
        <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${clickAttr} />
      `;
    }
  }

  const outerBorder = `
    <rect x="${padding}" y="${padding}" width="${cols * cellWidth}" height="${rows * cellHeight}" fill="none" stroke="#475569" stroke-width="2.5" rx="4" style="pointer-events: none;" />
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;" filter="url(#shadow)">
      ${SVG_DEFS}
      <g>
        ${gridCells}
        ${outerBorder}
      </g>
    </svg>
  `.trim();
}
