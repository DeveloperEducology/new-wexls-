import { SVG_DEFS } from './defs.js';

export function renderRekenrek(props) {
  const rowsCount = Math.max(1, Math.min(2, Number(props.rows) || 2));
  const values = String(props.values || '0,0').split(',').map(Number).map(v => Math.max(0, Math.min(10, v)));
  
  const width = 450;
  const height = rowsCount === 1 ? 90 : 150;
  const paddingX = 40;
  const beadRadius = 12;
  const beadWidth = beadRadius * 2;
  const rodLength = width - paddingX * 2;

  let rodsMarkup = '';
  
  for (let r = 0; r < rowsCount; r++) {
    const y = 45 + r * 60;
    const activeCount = values[r] || 0;

    // Draw metal rod
    rodsMarkup += `<line x1="${paddingX}" y1="${y}" x2="${width - paddingX}" y2="${y}" stroke="#94a3b8" stroke-width="4" />`;

    // Draw beads
    // Total beads = 10. Active are pushed to the left, inactive remain on the right.
    // Active beads start from left.
    let beadX = paddingX + beadRadius;
    
    // Draw active beads (slid to the left)
    for (let i = 0; i < activeCount; i++) {
      // 1st 5 beads are red, next 5 are white
      const beadColor = i < 5 ? '#ef4444' : '#f8fafc';
      const beadStroke = i < 5 ? '#b91c1c' : '#cbd5e1';
      rodsMarkup += `
        <circle cx="${beadX}" cy="${y}" r="${beadRadius}" fill="${beadColor}" stroke="${beadStroke}" stroke-width="1.5" filter="url(#shadow)" />
      `;
      beadX += beadWidth + 2;
    }

    // Inactive beads (slid to the right)
    let inactiveX = width - paddingX - beadRadius;
    for (let i = 9; i >= activeCount; i--) {
      const beadColor = i < 5 ? '#ef4444' : '#f8fafc';
      const beadStroke = i < 5 ? '#b91c1c' : '#cbd5e1';
      rodsMarkup += `
        <circle cx="${inactiveX}" cy="${y}" r="${beadRadius}" fill="${beadColor}" stroke="${beadStroke}" stroke-width="1.5" filter="url(#shadow)" />
      `;
      inactiveX -= (beadWidth + 2);
    }
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 450px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <!-- Wooden Outer Frame -->
      <rect x="15" y="15" width="${width - 30}" height="${height - 30}" rx="8" fill="none" stroke="#78350f" stroke-width="12" />
      <rect x="21" y="21" width="${width - 42}" height="${height - 42}" rx="4" fill="none" stroke="#b45309" stroke-width="2" />
      <!-- Left wooden panel -->
      <rect x="15" y="15" width="25" height="${height - 30}" fill="#78350f" />
      <rect x="20" y="20" width="15" height="${height - 40}" fill="#b45309" rx="3" />
      <!-- Right wooden panel -->
      <rect x="${width - 40}" y="15" width="25" height="${height - 30}" fill="#78350f" />
      <rect x="${width - 35}" y="20" width="15" height="${height - 40}" fill="#b45309" rx="3" />
      
      <g>
        ${rodsMarkup}
      </g>
    </svg>
  `.trim();
}
