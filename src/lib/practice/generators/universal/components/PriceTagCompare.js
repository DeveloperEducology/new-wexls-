import { SVG_DEFS } from './defs.js';

function getEmoji(itemName) {
  const map = {
    apple: '🍎',
    banana: '🍌',
    orange: '🍊',
    pencil: '✏️',
    book: '📖',
    toy: '🧸',
    car: '🚗',
    ball: '⚽',
    hat: '🧢',
    bag: '🎒',
    cake: '🍰',
    cookie: '🍪',
    icecream: '🍦',
  };
  const key = String(itemName || '').toLowerCase().trim();
  return map[key] || itemName || '🎁';
}

function drawPriceCard(x, y, itemName, price, tagColor, outlineColor) {
  const emoji = getEmoji(itemName);
  const cardW = 120;
  const cardH = 150;

  // Price tag dimensions
  const tagW = 60;
  const tagH = 34;
  const tagX = x + cardW / 2 - tagW / 2;
  const tagY = y + cardH - 15;

  return `
    <g transform="translate(${x}, ${y})">
      <!-- Outer Card Panel -->
      <rect x="0" y="0" width="${cardW}" height="${cardH}" rx="14" fill="#ffffff" stroke="#cbd5e1" stroke-width="2" filter="url(#shadow)" />
      
      <!-- Inside background card area -->
      <rect x="8" y="8" width="${cardW - 16}" height="${cardH - 30}" rx="10" fill="#f8fafc" stroke="#f1f5f9" stroke-width="1" />
      
      <!-- Big Emoji Item -->
      <text x="${cardW / 2}" y="${cardH / 2 - 2}" font-size="48px" text-anchor="middle" style="user-select: none;">
        ${emoji}
      </text>
      
      <!-- Item Label -->
      <text x="${cardW / 2}" y="${cardH / 2 + 22}" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#64748b" text-anchor="middle">
        ${String(itemName).toUpperCase()}
      </text>

      <!-- Price Tag Ribbon/String -->
      <line x1="${cardW / 2}" y1="${cardH - 25}" x2="${cardW / 2}" y2="${tagY}" stroke="#64748b" stroke-width="2.5" />
      
      <!-- Hanging Price Tag -->
      <g transform="translate(${cardW / 2 - tagW / 2}, ${cardH - 12})" filter="url(#shadow)">
        <!-- Tag base body (angled/clipped tag look) -->
        <path d="
          M 8 0 
          L ${tagW - 8} 0 
          A 4 4 0 0 1 ${tagW} 4 
          L ${tagW} ${tagH - 4} 
          A 4 4 0 0 1 ${tagW - 4} ${tagH} 
          L 4 ${tagH} 
          A 4 4 0 0 1 0 ${tagH - 4} 
          L 0 4 
          A 4 4 0 0 1 4 0 Z
        " fill="${tagColor}" stroke="${outlineColor}" stroke-width="1.5" />
        
        <!-- String tie hole -->
        <circle cx="${tagW / 2}" cy="5" r="2.5" fill="#1e293b" />
        
        <!-- Price Text inside tag -->
        <text x="${tagW / 2}" y="22" font-family="system-ui, sans-serif" font-size="13px" font-weight="900" fill="#ffffff" text-anchor="middle">
          ₹${price}
        </text>
      </g>
    </g>
  `;
}

export function renderPriceTagCompare(props) {
  const itemA = props.itemA || 'Apple';
  const priceA = Number(props.priceA) || 0;
  const itemB = props.itemB || 'Pencil';
  const priceB = Number(props.priceB) || 0;

  const width = 360;
  const height = 230;

  const cardAY = 15;
  const cardAX = width / 2 - 140;

  const cardBY = 15;
  const cardBX = width / 2 + 20;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 360px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <g>
        ${drawPriceCard(cardAX, cardAY, itemA, priceA, '#ef4444', '#b91c1c')}
        ${drawPriceCard(cardBX, cardBY, itemB, priceB, '#3b82f6', '#1d4ed8')}
      </g>
    </svg>
  `.trim();
}
