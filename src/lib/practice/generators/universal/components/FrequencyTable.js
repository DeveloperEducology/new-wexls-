import { SVG_DEFS } from './defs.js';

export function renderFrequencyTable(props) {
  const title = props.title || '';
  const categories = props.categories ? String(props.categories).split(',').map(s => s.trim()) : ['Red', 'Blue'];
  const values = props.values ? String(props.values).split(',').map(Number).map(v => isNaN(v) ? 0 : v) : [5, 8];
  const headers = props.headers ? String(props.headers).split(',') : ['Category', 'Frequency'];

  const rowHeight = 44;
  const headerHeight = 36;
  const tableWidth = 300;
  
  const titlePadding = title ? 35 : 0;
  const tableHeight = headerHeight + categories.length * rowHeight;
  const width = tableWidth + 30;
  const height = tableHeight + 30 + titlePadding;

  let yOffset = 15;
  let titleMarkup = '';
  
  if (title) {
    titleMarkup = `
      <text x="${width / 2}" y="${28}" font-family="system-ui, sans-serif" font-size="14px" font-weight="900" fill="#1e293b" text-anchor="middle">${title}</text>
    `;
    yOffset += titlePadding;
  }

  const headerRow = `
    <!-- Header Left -->
    <rect x="15" y="${yOffset}" width="150" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="90" y="${yOffset + 22}" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">${headers[0] || 'Category'}</text>
    
    <!-- Header Right -->
    <rect x="165" y="${yOffset}" width="150" height="${headerHeight}" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="240" y="${yOffset + 22}" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#1e3a8a" text-anchor="middle">${headers[1] || 'Frequency'}</text>
  `;

  let rows = '';

  for (let i = 0; i < categories.length; i++) {
    const y = yOffset + headerHeight + i * rowHeight;
    const cat = categories[i];
    const val = values[i] || 0;
    const isEven = i % 2 === 0;
    const fill = isEven ? '#ffffff' : '#f8fafc';

    rows += `
      <!-- Category column cell -->
      <rect x="15" y="${y}" width="150" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="90" y="${y + rowHeight/2 + 5}" font-family="system-ui, sans-serif" font-size="13px" font-weight="700" fill="#334155" text-anchor="middle">${cat}</text>
      
      <!-- Value column cell -->
      <rect x="165" y="${y}" width="150" height="${rowHeight}" fill="${fill}" stroke="#cbd5e1" stroke-width="1.5" />
      <text x="240" y="${y + rowHeight/2 + 5}" font-family="system-ui, sans-serif" font-size="16px" font-weight="800" fill="#0f172a" text-anchor="middle">${val}</text>
    `;
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;" filter="url(#shadow)">
      ${SVG_DEFS}
      ${titleMarkup}
      ${headerRow}
      ${rows}
    </svg>
  `.trim();
}
