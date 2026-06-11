import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderShapeCanvas(props, rng) {
  const shape = String(props.shape || 'triangle').toLowerCase();
  const label = props.label || '';
  const color = props.color || 'purple';

  const theme = resolveColor(color, COLORS, rng);

  const width = 200;
  const height = 200;
  const cx = width / 2;
  const cy = height / 2;

  let shapeMarkup = '';

  switch (shape) {
    case 'circle':
      shapeMarkup = `
        <circle cx="${cx}" cy="${cy - 10}" r="65" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3.5" filter="url(#shadow)" />
      `;
      break;
    case 'square':
      shapeMarkup = `
        <rect x="${cx - 60}" y="${cy - 70}" width="120" height="120" rx="8" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3.5" filter="url(#shadow)" />
      `;
      break;
    case 'rectangle':
      shapeMarkup = `
        <rect x="${cx - 75}" y="${cy - 50}" width="150" height="90" rx="8" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3.5" filter="url(#shadow)" />
      `;
      break;
    case 'triangle':
      shapeMarkup = `
        <polygon points="${cx},${cy - 70} ${cx - 75},${cy + 55} ${cx + 75},${cy + 55}" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3.5" stroke-linejoin="round" filter="url(#shadow)" />
      `;
      break;
    case 'pentagon':
      shapeMarkup = `
        <polygon points="
          ${cx},${cy - 70} 
          ${cx - 70},${cy - 20} 
          ${cx - 45},${cy + 55} 
          ${cx + 45},${cy + 55} 
          ${cx + 70},${cy - 20}
        " fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3.5" stroke-linejoin="round" filter="url(#shadow)" />
      `;
      break;
    case 'hexagon':
      shapeMarkup = `
        <polygon points="
          ${cx},${cy - 72} 
          ${cx - 65},${cy - 36} 
          ${cx - 65},${cy + 36} 
          ${cx},${cy + 72} 
          ${cx + 65},${cy + 36} 
          ${cx + 65},${cy - 36}
        " fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3.5" stroke-linejoin="round" filter="url(#shadow)" />
      `;
      break;
    case 'trapezoid':
      shapeMarkup = `
        <polygon points="
          ${cx - 45},${cy - 50} 
          ${cx + 45},${cy - 50} 
          ${cx + 80},${cy + 50} 
          ${cx - 80},${cy + 50}
        " fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3.5" stroke-linejoin="round" filter="url(#shadow)" />
      `;
      break;
    default:
      // Fallback rectangle
      shapeMarkup = `
        <rect x="${cx - 60}" y="${cy - 60}" width="120" height="120" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="3" filter="url(#shadow)" />
      `;
  }

  const labelMarkup = label ? `
    <text x="${cx}" y="${height - 12}" font-family="system-ui, sans-serif" font-size="14px" font-weight="900" fill="#334155" text-anchor="middle">
      ${label}
    </text>
  ` : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 200px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <g>
        ${shapeMarkup}
        ${labelMarkup}
      </g>
    </svg>
  `.trim();
}
