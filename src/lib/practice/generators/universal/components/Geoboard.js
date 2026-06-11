import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderGeoboard(props, rng) {
  const gridSize = Math.max(2, Math.min(10, Number(props.gridSize) || 5));
  const rawPoly = props.polygon ? String(props.polygon).split(';').map(s => s.trim()).filter(Boolean) : [];
  const color = props.color || 'red';

  const theme = resolveColor(color, COLORS, rng);

  const width = 300;
  const height = 300;
  const padding = 30;
  const boardSize = width - padding * 2;
  const spacing = boardSize / (gridSize - 1);

  const getPos = (val) => {
    // Safely parse coordinate, support 0-indexed values
    const idx = Math.max(0, Math.min(gridSize - 1, Number(val) || 0));
    return padding + idx * spacing;
  };

  // Draw board base
  let boardMarkup = `
    <!-- Geoboard background board -->
    <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="16" fill="#0f172a" stroke="#1e293b" stroke-width="6" filter="url(#shadow)" />
    <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="12" fill="#1e293b" stroke="#334155" stroke-width="2" />
  `;

  // Draw pegs
  let pegsMarkup = '';
  for (let r = 0; r < gridSize; r++) {
    for (let c = 0; c < gridSize; c++) {
      const px = padding + c * spacing;
      const py = padding + r * spacing;

      pegsMarkup += `
        <!-- Peg shadow -->
        <circle cx="${px}" cy="${py + 2}" r="6" fill="#020617" opacity="0.6" />
        <!-- Peg body -->
        <circle cx="${px}" cy="${py}" r="6" fill="#cbd5e1" stroke="#94a3b8" stroke-width="1" />
        <circle cx="${px}" cy="${py}" r="2.5" fill="#f8fafc" />
      `;
    }
  }

  // Draw Rubber band polygon
  let bandMarkup = '';
  if (rawPoly.length > 1) {
    const pointsString = rawPoly.map(pt => {
      const [pc, pr] = pt.split(',').map(Number);
      return `${getPos(pc)},${getPos(pr)}`;
    }).join(' ');

    bandMarkup = `
      <!-- Rubber band area fill -->
      <polygon points="${pointsString}" fill="${theme.fill}" opacity="0.45" />
      <!-- Rubber band outline -->
      <polygon points="${pointsString}" fill="none" stroke="${theme.stroke}" stroke-width="4.5" stroke-linecap="round" stroke-linejoin="round" filter="url(#shadow)" />
      <!-- Inner core highlight -->
      <polygon points="${pointsString}" fill="none" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" opacity="0.7" />
    `;
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 300px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      ${boardMarkup}
      ${bandMarkup}
      ${pegsMarkup}
    </svg>
  `.trim();
}
