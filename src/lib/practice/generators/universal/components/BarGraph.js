import { COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderBarGraph(props, rng) {
  const title = props.title || '';
  const categories = props.categories ? String(props.categories).split(',').map(s => s.trim()) : ['Red', 'Blue', 'Green'];
  const values = props.values ? String(props.values).split(',').map(Number).map(v => isNaN(v) ? 0 : v) : [4, 7, 3];
  
  const maxVal = Math.max(...values, 1);
  const yMax = Number(props.yMax) !== undefined && !isNaN(Number(props.yMax)) ? Number(props.yMax) : Math.ceil(maxVal * 1.2);
  const color = props.color || 'blue';

  const theme = resolveColor(color, COLORS, rng);

  const width = 450;
  const height = 300;
  const padLeft = 45;
  const padRight = 20;
  const padTop = 40;
  const padBottom = 45;

  const graphW = width - padLeft - padRight;
  const graphH = height - padTop - padBottom;

  let yAxisGrid = '';
  // Draw Y grid lines and labels
  const yTicksCount = 5;
  for (let i = 0; i <= yTicksCount; i++) {
    const tickVal = Math.round((yMax / yTicksCount) * i);
    const y = padTop + graphH - (tickVal / yMax) * graphH;
    
    yAxisGrid += `
      <!-- Grid line -->
      <line x1="${padLeft}" y1="${y}" x2="${width - padRight}" y2="${y}" stroke="#e2e8f0" stroke-width="1" />
      <!-- Label -->
      <text x="${padLeft - 8}" y="${y + 4}" font-family="system-ui, sans-serif" font-size="11px" font-weight="700" fill="#64748b" text-anchor="end">${tickVal}</text>
    `;
  }

  // Draw Bars and X-axis labels
  let barsMarkup = '';
  const colCount = categories.length;
  const colWidth = graphW / colCount;
  const barWidth = colWidth * 0.6; // 60% of column width

  for (let i = 0; i < colCount; i++) {
    const cat = categories[i];
    const val = values[i] || 0;
    const barH = (val / yMax) * graphH;
    
    const x = padLeft + i * colWidth + (colWidth - barWidth) / 2;
    const y = padTop + graphH - barH;

    barsMarkup += `
      <!-- Bar -->
      <rect x="${x}" y="${y}" width="${barWidth}" height="${barH}" fill="${theme.fill}" stroke="${theme.stroke}" stroke-width="2.5" rx="4" filter="url(#shadow)" />
      <!-- Value text on top of bar -->
      ${val > 0 ? `
        <text x="${x + barWidth / 2}" y="${y - 6}" font-family="system-ui, sans-serif" font-size="12px" font-weight="900" fill="${theme.stroke}" text-anchor="middle">${val}</text>
      ` : ''}
      <!-- Category Label -->
      <text x="${padLeft + i * colWidth + colWidth / 2}" y="${padTop + graphH + 20}" font-family="system-ui, sans-serif" font-size="11px" font-weight="700" fill="#475569" text-anchor="middle">${cat}</text>
    `;
  }

  const titleMarkup = title ? `
    <text x="${width / 2}" y="${22}" font-family="system-ui, sans-serif" font-size="14px" font-weight="900" fill="#1e293b" text-anchor="middle">${title}</text>
  ` : '';

  const axes = `
    <!-- Y Axis -->
    <line x1="${padLeft}" y1="${padTop}" x2="${padLeft}" y2="${padTop + graphH}" stroke="#94a3b8" stroke-width="2.5" />
    <!-- X Axis -->
    <line x1="${padLeft}" y1="${padTop + graphH}" x2="${width - padRight}" y2="${padTop + graphH}" stroke="#94a3b8" stroke-width="2.5" />
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2" filter="url(#shadow)" />
      ${titleMarkup}
      ${yAxisGrid}
      ${barsMarkup}
      ${axes}
    </svg>
  `.trim();
}
