import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderDecimalGrid(props, rng) {
  const value = Math.max(0, Math.min(1, Number(props.value) || 0));
  const color = props.color || 'orange';

  const theme = resolveColor(color, COLORS, rng);

  const cellWidth = 22;
  const cellHeight = 22;
  const padding = 15;
  const gridSize = 10;
  
  const width = gridSize * cellWidth + padding * 2;
  const height = gridSize * cellHeight + padding * 2;

  const shadedCount = Math.round(value * 100);

  let gridCells = '';

  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      // Standard ordering: fill left-to-right, row-by-row
      const idx = r * gridSize + c;
      const x = padding + c * cellWidth;
      const y = padding + r * cellHeight;
      const isShaded = idx < shadedCount;

      const fill = isShaded ? theme.fill : '#ffffff';
      const stroke = isShaded ? theme.stroke : '#cbd5e1';
      const strokeWidth = isShaded ? 1.5 : 1;

      gridCells += `
        <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" />
      `;
    }
  }

  // Draw outer heavy outline
  const outerBorder = `
    <rect x="${padding}" y="${padding}" width="${gridSize * cellWidth}" height="${gridSize * cellHeight}" fill="none" stroke="#475569" stroke-width="2.5" rx="4" />
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
