// Shared money assets and rendering helper for Math Money topics
// Renders vector SVG coins and real Indian notes dynamically

export const NOTE_IMAGES = {
  1: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773484418376-norxwu3nja.jpg',
  2: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773484351761-4iiizqpq85i.jpg',
  5: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1777177780818-o0d57jggadk.jpg',
  10: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773482717771-iccioja4ttq.jpeg',
  20: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773482718448-pjb6um8690p.jpg',
  50: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773482718951-tvl0xvezk4.jpg',
  100: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773481483413-j2sdzsvnvus.jpg',
  200: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773482719931-8zk7msk3jj.jpg',
  500: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/1773482720778-qtwnbtb2c2.jpg'
};

export function coinsGroupSvg(coinsList) {
  const height = 110;
  
  const defs = `
    <defs>
      <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f8fafc" />
        <stop offset="30%" stop-color="#cbd5e1" />
        <stop offset="70%" stop-color="#94a3b8" />
        <stop offset="100%" stop-color="#64748b" />
      </linearGradient>
      <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#fef08a" />
        <stop offset="30%" stop-color="#fef08a" />
        <stop offset="70%" stop-color="#eab308" />
        <stop offset="100%" stop-color="#ca8a04" />
      </linearGradient>
      <clipPath id="note-clip">
        <rect x="0" y="0" width="150" height="80" rx="8" ry="8" />
      </clipPath>
    </defs>
  `;

  let coinsHtml = '';
  let xOffset = 10;

  coinsList.forEach((val) => {
    const isNote = val >= 10;
    
    if (isNote) {
      const imgUrl = NOTE_IMAGES[val] || NOTE_IMAGES[10];
      coinsHtml += `
        <!-- Note Group at xOffset -->
        <g transform="translate(${xOffset}, 15)">
          <!-- Note Shadow -->
          <rect x="1.5" y="2" width="150" height="80" rx="8" ry="8" fill="#0f172a" opacity="0.15" />
          <!-- Rounded Border/Background -->
          <rect x="0" y="0" width="150" height="80" rx="8" ry="8" fill="#f8fafc" stroke="#94a3b8" stroke-width="1.5" />
          <!-- Note Image -->
          <image href="${imgUrl}" x="0" y="0" width="150" height="80" clip-path="url(#note-clip)" preserveAspectRatio="none" />
        </g>
      `;
      xOffset += 160;
    } else {
      // Coin (1, 2, 5)
      let size = 72;
      let fillType = 'url(#silver-grad)';
      
      if (val === 1) {
        size = 64;
        fillType = 'url(#silver-grad)';
      } else if (val === 2) {
        size = 72;
        fillType = 'url(#silver-grad)';
      } else if (val === 5) {
        size = 68;
        fillType = 'url(#gold-grad)';
      }
      
      const cx = xOffset + size / 2;
      const cy = 55;
      
      const outerR = size / 2;
      const innerR = outerR - 4;
      
      const coinBody = `
        <circle cx="${cx}" cy="${cy}" r="${outerR}" fill="${fillType}" stroke="${val === 5 ? '#a16207' : '#475569'}" stroke-width="1.5" />
        <circle cx="${cx}" cy="${cy}" r="${innerR}" fill="none" stroke="${val === 5 ? '#fef08a' : '#f1f5f9'}" stroke-width="1" stroke-dasharray="2,2" />
        <circle cx="${cx}" cy="${cy}" r="${innerR - 2}" fill="none" stroke="${val === 5 ? '#854d0e' : '#64748b'}" stroke-width="0.5" />
      `;
        
      const decoration = `<path d="M ${cx - outerR + 10} ${cy} Q ${cx - outerR + 16} ${cy - 12} ${cx - 12} ${cy - 16} M ${cx + outerR - 10} ${cy} Q ${cx + outerR - 16} ${cy - 12} ${cx + 12} ${cy - 16}" fill="none" stroke="${val === 5 ? '#854d0e' : '#475569'}" stroke-width="1" stroke-linecap="round" opacity="0.6" />`;
  
      const textColor = val === 5 ? '#713f12' : '#1e293b';
  
      coinsHtml += `
        <!-- Coin Shadow -->
        <circle cx="${cx + 1.5}" cy="${cy + 2}" r="${outerR}" fill="#0f172a" opacity="0.12" />
        ${coinBody}
        ${decoration}
        <text x="${cx}" y="${cy + 7}" font-size="20" font-weight="900" fill="${textColor}" font-family="system-ui, sans-serif" text-anchor="middle">₹${val}</text>
      `;
      xOffset += size + 10;
    }
  });

  const width = xOffset + 10;

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible;">
    ${defs}
    ${coinsHtml}
  </svg>`;
}
