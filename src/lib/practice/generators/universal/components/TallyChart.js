import { SVG_DEFS } from './defs.js';

function drawTallyGroup(startX, startY, count) {
  let tallies = '';
  const spacing = 7;
  const lineH = 26;

  // Draw full groups of 5
  const groupsOf5 = Math.floor(count / 5);
  const remainder = count % 5;

  let currentX = startX;

  for (let g = 0; g < groupsOf5; g++) {
    const groupStartX = currentX;
    // Draw 4 vertical lines
    for (let i = 0; i < 4; i++) {
      tallies += `<line x1="${currentX}" y1="${startY}" x2="${currentX}" y2="${startY + lineH}" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />`;
      currentX += spacing;
    }
    // Draw diagonal crossing line
    tallies += `<line x1="${groupStartX - 3}" y1="${startY + lineH - 2}" x2="${currentX}" y2="${startY + 2}" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />`;
    currentX += spacing + 8; // extra gap between groups
  }

  // Draw remainder vertical lines
  for (let i = 0; i < remainder; i++) {
    tallies += `<line x1="${currentX}" y1="${startY}" x2="${currentX}" y2="${startY + lineH}" stroke="#0f172a" stroke-width="2.5" stroke-linecap="round" />`;
    currentX += spacing;
  }

  return tallies;
}

export function renderTallyChart(props) {
  const categories = props.categories ? String(props.categories).split(',').map(s => s.trim()) : ['Apples', 'Oranges'];
  const counts = props.counts ? String(props.counts).split(',').map(Number).map(v => isNaN(v) ? 0 : v) : [5, 3];
  const showFrequency = props.showFrequency !== false && props.showFrequency !== 'false';

  const rowHeight = 44;
  const headerHeight = 36;
  const tableWidth = showFrequency ? 400 : 300;
  const tableHeight = headerHeight + categories.length * rowHeight;
  
  const width = tableWidth + 30;
  const height = tableHeight + 30;

  let headerRow = '';
  if (showFrequency) {
    headerRow = `
      <rect x="15" y="15" width="120" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="75" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Category</text>
      
      <rect x="135" y="15" width="180" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="225" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Tally Marks</text>
      
      <rect x="315" y="15" width="100" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="365" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Count</text>
    `;
  } else {
    headerRow = `
      <rect x="15" y="15" width="120" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="75" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Category</text>
      
      <rect x="135" y="15" width="180" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="225" y="38" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">Tally Marks</text>
    `;
  }

  let rows = '';
  for (let i = 0; i < categories.length; i++) {
    const y = 15 + headerHeight + i * rowHeight;
    const cat = categories[i];
    const val = counts[i] || 0;
    const isEven = i % 2 === 0;
    const fill = isEven ? '#ffffff' : '#f8fafc';

    rows += `
      <!-- Category column cell -->
      <rect x="15" y="${y}" width="120" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="75" y="${y + rowHeight/2 + 5}" font-family="system-ui, sans-serif" font-size="13px" font-weight="700" fill="#334155" text-anchor="middle">${cat}</text>
      
      <!-- Tally marks cell -->
      <rect x="135" y="${y}" width="180" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
      <g>
        ${drawTallyGroup(150, y + (rowHeight - 26)/2, val)}
      </g>
    `;

    if (showFrequency) {
      rows += `
        <!-- Frequency count cell -->
        <rect x="315" y="${y}" width="100" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="365" y="${y + rowHeight/2 + 5}" font-family="system-ui, sans-serif" font-size="15px" font-weight="800" fill="#0f172a" text-anchor="middle">${val}</text>
      `;
    }
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;" filter="url(#shadow)">
      ${SVG_DEFS}
      ${headerRow}
      ${rows}
    </svg>
  `.trim();
}
