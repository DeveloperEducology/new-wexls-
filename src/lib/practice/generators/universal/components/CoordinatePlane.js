import { SVG_DEFS } from './defs.js';

export function renderCoordinatePlane(props) {
  const xMin = Number(props.xMin) !== undefined && !isNaN(Number(props.xMin)) ? Number(props.xMin) : -5;
  const xMax = Number(props.xMax) !== undefined && !isNaN(Number(props.xMax)) ? Number(props.xMax) : 5;
  const yMin = Number(props.yMin) !== undefined && !isNaN(Number(props.yMin)) ? Number(props.yMin) : -5;
  const yMax = Number(props.yMax) !== undefined && !isNaN(Number(props.yMax)) ? Number(props.yMax) : 5;

  const rawPoints = props.points ? String(props.points).split(';').map(s => s.trim()).filter(Boolean) : [];
  const rawPoly = props.polygon ? String(props.polygon).split(';').map(s => s.trim()).filter(Boolean) : [];

  const width = 360;
  const height = 360;
  const padding = 35;
  const gridW = width - padding * 2;
  const gridH = height - padding * 2;

  const scaleX = (x) => padding + ((x - xMin) / (xMax - xMin)) * gridW;
  const scaleY = (y) => padding + ((yMax - y) / (yMax - yMin)) * gridH;

  let gridLines = '';
  let tickMarks = '';

  // Draw vertical grid lines and X ticks
  for (let x = xMin; x <= xMax; x++) {
    const cx = scaleX(x);
    // Grid line
    gridLines += `<line x1="${cx}" y1="${padding}" x2="${cx}" y2="${height - padding}" stroke="#e2e8f0" stroke-width="1" />`;
    // Tick mark on X-axis (y = 0)
    const cyZero = scaleY(0);
    if (x !== 0) {
      tickMarks += `
        <line x1="${cx}" y1="${cyZero - 4}" x2="${cx}" y2="${cyZero + 4}" stroke="#475569" stroke-width="1.5" />
        <text x="${cx}" y="${cyZero + 16}" font-family="system-ui, sans-serif" font-size="10px" font-weight="700" fill="#64748b" text-anchor="middle">${x}</text>
      `;
    }
  }

  // Draw horizontal grid lines and Y ticks
  for (let y = yMin; y <= yMax; y++) {
    const cy = scaleY(y);
    // Grid line
    gridLines += `<line x1="${padding}" y1="${cy}" x2="${width - padding}" y2="${cy}" stroke="#e2e8f0" stroke-width="1" />`;
    // Tick mark on Y-axis (x = 0)
    const cxZero = scaleX(0);
    if (y !== 0) {
      tickMarks += `
        <line x1="${cxZero - 4}" y1="${cy}" x2="${cxZero + 4}" y2="${cy}" stroke="#475569" stroke-width="1.5" />
        <text x="${cxZero - 12}" y="${cy + 3}" font-family="system-ui, sans-serif" font-size="10px" font-weight="700" fill="#64748b" text-anchor="end">${y}</text>
      `;
    }
  }

  // Draw Origin "0" label
  const oX = scaleX(0);
  const oY = scaleY(0);
  tickMarks += `
    <text x="${oX - 6}" y="${oY + 12}" font-family="system-ui, sans-serif" font-size="10px" font-weight="700" fill="#64748b" text-anchor="end">0</text>
  `;

  // Draw Axes
  const axes = `
    <!-- X-axis -->
    <line x1="${padding - 10}" y1="${oY}" x2="${width - padding + 10}" y2="${oY}" stroke="#475569" stroke-width="2.5" />
    <path d="M ${width - padding + 15} ${oY} L ${width - padding + 7} ${oY - 4} M ${width - padding + 15} ${oY} L ${width - padding + 7} ${oY + 4}" stroke="#475569" stroke-width="2" stroke-linecap="round" />
    <text x="${width - padding + 18}" y="${oY - 6}" font-family="system-ui, sans-serif" font-size="11px" font-weight="bold" fill="#475569">x</text>
    
    <!-- Y-axis -->
    <line x1="${oX}" y1="${padding - 10}" x2="${oX}" y2="${height - padding + 10}" stroke="#475569" stroke-width="2.5" />
    <path d="M ${oX} ${padding - 15} L ${oX - 4} ${padding - 7} M ${oX} ${padding - 15} L ${oX + 4} ${padding - 7}" stroke="#475569" stroke-width="2" stroke-linecap="round" />
    <text x="${oX + 8}" y="${padding - 10}" font-family="system-ui, sans-serif" font-size="11px" font-weight="bold" fill="#475569">y</text>
  `;

  // Draw plotted polygon
  let polyMarkup = '';
  if (rawPoly.length > 0) {
    const pointsString = rawPoly.map(p => {
      const [px, py] = p.split(',').map(Number);
      return `${scaleX(px)},${scaleY(py)}`;
    }).join(' ');
    
    polyMarkup = `
      <polygon points="${pointsString}" fill="rgba(59, 130, 246, 0.15)" stroke="#3b82f6" stroke-width="2.5" stroke-linejoin="round" />
    `;
  }

  // Draw plotted points
  let pointsMarkup = '';
  rawPoints.forEach((pt, i) => {
    const parts = pt.split(',');
    const px = Number(parts[0]);
    const py = Number(parts[1]);
    const label = parts[2] || '';

    if (!isNaN(px) && !isNaN(py)) {
      const sx = scaleX(px);
      const sy = scaleY(py);
      pointsMarkup += `
        <g>
          <circle cx="${sx}" cy="${sy}" r="5" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" />
          <text x="${sx + 8}" y="${sy - 8}" font-family="system-ui, sans-serif" font-size="11px" font-weight="900" fill="#b91c1c" text-anchor="start">
            ${label ? `${label}(${px},${py})` : `(${px},${py})`}
          </text>
        </g>
      `;
    }
  });

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 360px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow)" />
      <g>
        ${gridLines}
        ${polyMarkup}
        ${axes}
        ${tickMarks}
        ${pointsMarkup}
      </g>
    </svg>
  `.trim();
}
