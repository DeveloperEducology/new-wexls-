import { SVG_DEFS } from './defs.js';

export function renderPictograph(props) {
  const categories = props.categories ? String(props.categories).split(',').map(s => s.trim()) : ['Apple', 'Banana'];
  const values = props.values ? String(props.values).split(',').map(Number).map(v => isNaN(v) ? 0 : v) : [3, 5];
  
  // Emojis: can be a comma-separated list or a single fallback emoji
  const rawEmojis = props.emoji ? String(props.emoji).split(',') : ['🍎'];
  const valueKey = Math.max(1, Number(props.key) || 1);
  const showCount = props.showCount !== false && props.showCount !== 'false';

  const rowHeight = 50;
  const headerHeight = 36;
  const tableWidth = showCount ? 440 : 360;
  const tableHeight = headerHeight + categories.length * rowHeight;

  const width = tableWidth + 30;
  const height = tableHeight + 55; // extra space for key explanation at the bottom

  let headerRow = `
    <!-- Category Header -->
    <rect x="15" y="15" width="120" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="75" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Category</text>
    
    <!-- Pictograph Header -->
    <rect x="135" y="15" width="220" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="245" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Pictures</text>
  `;

  if (showCount) {
    headerRow += `
      <!-- Count Header -->
      <rect x="355" y="15" width="100" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="405" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Value</text>
    `;
  }

  let rows = '';

  for (let i = 0; i < categories.length; i++) {
    const y = 15 + headerHeight + i * rowHeight;
    const cat = categories[i];
    const val = values[i] || 0;
    
    // Choose emoji for category
    const catEmoji = rawEmojis[i] || rawEmojis[0] || '⭐';

    const isEven = i % 2 === 0;
    const fill = isEven ? '#ffffff' : '#f8fafc';

    // How many icons to draw
    const iconCount = Math.floor(val / valueKey);

    let iconsMarkup = '';
    for (let k = 0; k < iconCount; k++) {
      iconsMarkup += `
        <text x="${152 + k * 28}" y="${y + rowHeight / 2 + 8}" font-size="24px" style="user-select: none;">${catEmoji}</text>
      `;
    }

    rows += `
      <!-- Category Column -->
      <rect x="15" y="${y}" width="120" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="75" y="${y + rowHeight/2 + 5}" font-family="system-ui, sans-serif" font-size="13px" font-weight="700" fill="#334155" text-anchor="middle">${cat}</text>
      
      <!-- Pictures Column -->
      <rect x="135" y="${y}" width="220" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
      <g>
        ${iconsMarkup}
      </g>
    `;

    if (showCount) {
      rows += `
        <!-- Count Column -->
        <rect x="355" y="${y}" width="100" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="405" y="${y + rowHeight/2 + 5}" font-family="system-ui, sans-serif" font-size="15px" font-weight="800" fill="#0f172a" text-anchor="middle">${val}</text>
      `;
    }
  }

  // Draw Key Explanation box at the bottom
  const keyY = 15 + headerHeight + categories.length * rowHeight + 12;
  const keyExplanation = `
    <rect x="15" y="${keyY}" width="${tableWidth}" height="32" rx="6" fill="#f8fafc" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="${15 + tableWidth / 2}" y="${keyY + 20}" font-family="system-ui, sans-serif" font-size="12px" font-weight="700" fill="#475569" text-anchor="middle">
      Key: Each ${rawEmojis[0] || '⭐'} = ${valueKey} unit${valueKey > 1 ? 's' : ''}
    </text>
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;" filter="url(#shadow)">
      ${SVG_DEFS}
      ${headerRow}
      ${rows}
      ${keyExplanation}
    </svg>
  `.trim();
}
