import { SVG_DEFS } from './defs.js';

function drawNote(x, y, value) {
  let fill = '#ffffff';
  let stroke = '#94a3b8';
  let textCol = '#334155';

  // Indian currency note colors
  switch (value) {
    case 100:
      fill = '#e0e7ff'; // Lavender
      stroke = '#4f46e5';
      textCol = '#3730a3';
      break;
    case 50:
      fill = '#e0f2fe'; // Cyan
      stroke = '#0284c7';
      textCol = '#075985';
      break;
    case 20:
      fill = '#f0fdf4'; // Light Green
      stroke = '#16a34a';
      textCol = '#166534';
      break;
    case 10:
      fill = '#fef3c7'; // Orange/Yellowish brown
      stroke = '#d97706';
      textCol = '#92400e';
      break;
  }

  return `
    <g transform="translate(${x}, ${y})" filter="url(#shadow)">
      <rect x="0" y="0" width="85" height="42" rx="4" fill="${fill}" stroke="${stroke}" stroke-width="2" />
      <rect x="5" y="5" width="75" height="32" rx="2" fill="none" stroke="${stroke}" stroke-dasharray="2,2" opacity="0.6" />
      <!-- Mahatma Gandhi oval watermark placeholder -->
      <circle cx="18" cy="21" r="10" fill="#ffffff" opacity="0.5" stroke="${stroke}" stroke-width="1" />
      <!-- Rupee value text -->
      <text x="62" y="26" font-family="system-ui, sans-serif" font-size="14px" font-weight="900" fill="${textCol}" text-anchor="middle">₹${value}</text>
      <!-- Tiny value text in corners -->
      <text x="78" y="12" font-family="system-ui, sans-serif" font-size="6px" font-weight="900" fill="${textCol}" text-anchor="end">${value}</text>
      <text x="78" y="36" font-family="system-ui, sans-serif" font-size="6px" font-weight="900" fill="${textCol}" text-anchor="end">${value}</text>
    </g>
  `;
}

function drawCoin(x, y, value) {
  let r = 16;
  let outerFill = '#cbd5e1';
  let innerFill = '#e2e8f0';
  let stroke = '#64748b';
  let textCol = '#334155';

  switch (value) {
    case 10:
      // ₹10 is bimetallic (gold outer, silver inner)
      outerFill = '#fbbf24';
      innerFill = '#e2e8f0';
      stroke = '#b45309';
      textCol = '#451a03';
      break;
    case 5:
      // ₹5 is golden/brass
      outerFill = '#f59e0b';
      innerFill = '#fbbf24';
      stroke = '#b45309';
      textCol = '#78350f';
      break;
    case 2:
      // ₹2 is silver
      outerFill = '#cbd5e1';
      innerFill = '#f1f5f9';
      stroke = '#475569';
      textCol = '#1e293b';
      break;
    case 1:
      // ₹1 is smaller silver
      r = 13;
      outerFill = '#cbd5e1';
      innerFill = '#f1f5f9';
      stroke = '#475569';
      textCol = '#1e293b';
      break;
  }

  return `
    <g transform="translate(${x}, ${y})" filter="url(#shadow)">
      <circle cx="0" cy="0" r="${r}" fill="${outerFill}" stroke="${stroke}" stroke-width="1.5" />
      <circle cx="0" cy="0" r="${r - 3.5}" fill="${innerFill}" stroke="${stroke}" stroke-width="1" />
      <text x="0" y="4" font-family="system-ui, sans-serif" font-size="${r * 0.75}px" font-weight="900" fill="${textCol}" text-anchor="middle">₹${value}</text>
    </g>
  `;
}

export function renderMoneyDisplay(props) {
  const amount = Math.max(0, Number(props.amount) || 0);

  // Divide into bills/coins
  let remaining = amount;
  const notesToShow = [];
  const coinsToShow = [];

  [100, 50, 20, 10].forEach(denom => {
    const count = Math.floor(remaining / denom);
    for (let i = 0; i < count; i++) {
      notesToShow.push(denom);
    }
    remaining %= denom;
  });

  [10, 5, 2, 1].forEach(denom => {
    const count = Math.floor(remaining / denom);
    for (let i = 0; i < count; i++) {
      coinsToShow.push(denom);
    }
    remaining %= denom;
  });

  const width = 450;
  
  // Arrange in rows
  let markup = '';
  let currentY = 15;
  let currentX = 15;

  // Render Notes
  if (notesToShow.length > 0) {
    notesToShow.forEach((val) => {
      if (currentX + 90 > width - 15) {
        currentX = 15;
        currentY += 55;
      }
      markup += drawNote(currentX, currentY, val);
      currentX += 95;
    });
    currentY += 60;
  }

  // Render Coins
  if (coinsToShow.length > 0) {
    currentX = 35; // margin offset for coins (cx centered)
    coinsToShow.forEach((val) => {
      const radius = val === 1 ? 13 : 16;
      if (currentX + 25 > width - 15) {
        currentX = 35;
        currentY += 45;
      }
      markup += drawCoin(currentX, currentY, val);
      currentX += 50;
    });
    currentY += 35;
  }

  const height = Math.max(80, currentY + 15);

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <rect x="5" y="5" width="${width - 10}" height="${height - 10}" rx="12" fill="#ffffff" stroke="#e2e8f0" stroke-width="2.5" filter="url(#shadow)" />
      <g>
        ${markup}
      </g>
    </svg>
  `.trim();
}
