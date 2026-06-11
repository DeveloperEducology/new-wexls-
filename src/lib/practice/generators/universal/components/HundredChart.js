import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderHundredChart(props, rng) {
  const missing = props.missing ? String(props.missing).split(',').map(s => s.trim()).map(Number).filter(n => !isNaN(n)) : [];
  const highlighted = props.highlighted ? String(props.highlighted).split(',').map(s => s.trim()).map(Number).filter(n => !isNaN(n)) : [];
  const color = props.color || 'blue';

  const theme = resolveColor(color, COLORS, rng);

  const cellSize = 38;
  const padding = 15;
  const gridWidth = cellSize * 10;
  const gridHeight = cellSize * 10;
  const width = gridWidth + padding * 2;
  const height = gridHeight + padding * 2;

  let cells = '';

  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      const num = r * 10 + c + 1;
      const x = padding + c * cellSize;
      const y = padding + r * cellSize;

      const isMissing = missing.includes(num);
      const isHighlighted = highlighted.includes(num);

      const fill = isHighlighted ? theme.fill : '#ffffff';
      const stroke = isHighlighted ? theme.stroke : '#cbd5e1';
      const textFill = isHighlighted ? '#1e293b' : '#334155';
      const fontWeight = isHighlighted || isMissing ? 'bold' : 'normal';

      cells += `
        <g>
          <rect x="${x}" y="${y}" width="${cellSize}" height="${cellSize}" fill="${fill}" stroke="${stroke}" stroke-width="1.5" />
          <text x="${x + cellSize / 2}" y="${y + cellSize / 2 + 5}" font-family="system-ui, sans-serif" font-size="13px" font-weight="${fontWeight}" fill="${isMissing ? '#ef4444' : textFill}" text-anchor="middle">
            ${isMissing ? '?' : num}
          </text>
        </g>
      `;
    }
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 410px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="12" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2.5" filter="url(#shadow)" />
      <g>
        ${cells}
      </g>
    </svg>
  `.trim();
}
