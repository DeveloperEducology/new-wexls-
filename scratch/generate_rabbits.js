const fs = require('fs');
const path = require('path');

// Read the original rabbit.svg to extract paths
const originalSvgPath = '/Users/vijay/Desktop/antigravity/new wexls/public/images/rabbit.svg';
const originalContent = fs.readFileSync(originalSvgPath, 'utf8');

// Regular expression to parse path tags
const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*fill="([^"]+)"[^>]*\/>/g;
let match;
const originalPaths = [];

while ((match = pathRegex.exec(originalContent)) !== null) {
  originalPaths.push({
    d: match[1],
    fill: match[2]
  });
}

console.log(`Successfully parsed ${originalPaths.length} paths from rabbit.svg`);

// Color mappings helper
function getRabbitPaths(overrides = {}) {
  return originalPaths.map(p => {
    let fill = p.fill;
    // Map standard fills to overrides if present
    if (p.fill === '#FAF1E1' && overrides.fur) fill = overrides.fur;
    if (p.fill === '#524F75' && overrides.outline) fill = overrides.outline;
    if (p.fill === '#FFB8A8' && overrides.ear) fill = overrides.ear;
    if (p.fill === '#FF7E3C' && overrides.carrot) fill = overrides.carrot;
    if (p.fill === '#62CCA3' && overrides.leaf) fill = overrides.leaf;
    if (p.fill === '#FFFFFF' && overrides.white) fill = overrides.white;
    if (p.fill === '#232323' && overrides.black) fill = overrides.black;
    if (p.fill === '#8B674F' && overrides.nose) fill = overrides.nose;
    if (p.fill === '#FF7E3C' && overrides.orange) fill = overrides.orange;
    
    return `    <path d="${p.d}" fill="${fill}" />`;
  }).join('\n');
}

// Generate the beautiful multiple_rabbits.svg
const svgContent = `<?xml version="1.0" encoding="utf-8"?>
<svg viewBox="0 0 1200 800" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <!-- Background Sky Gradient -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#bae6fd" />
      <stop offset="60%" stop-color="#f0f9ff" />
      <stop offset="100%" stop-color="#ccfbf1" />
    </linearGradient>
    
    <!-- Sun Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="15" result="blur" />
      <feComposite in="SourceGraphic" in2="blur" operator="over" />
    </filter>
    
    <!-- Hill Gradients -->
    <linearGradient id="hillFar" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#5eead4" />
      <stop offset="100%" stop-color="#14b8a6" />
    </linearGradient>
    <linearGradient id="hillNear" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#a3e635" />
      <stop offset="100%" stop-color="#65a30d" />
    </linearGradient>
    
    <!-- Cloud Shadow -->
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="120%">
      <feDropShadow dx="0" dy="4" stdDeviation="4" flood-color="#0f172a" flood-opacity="0.06" />
    </filter>
  </defs>

  <!-- Sky -->
  <rect width="1200" height="800" fill="url(#skyGrad)" />
  
  <!-- Glowing Sun -->
  <circle cx="1050" cy="150" r="80" fill="#fef08a" opacity="0.8" filter="url(#glow)" />
  <circle cx="1050" cy="150" r="55" fill="#fef08a" />
  
  <!-- Fluffy Cloud 1 -->
  <g fill="#ffffff" filter="url(#shadow)" opacity="0.9">
    <circle cx="200" cy="180" r="40" />
    <circle cx="250" cy="160" r="50" />
    <circle cx="310" cy="180" r="40" />
    <rect x="200" y="180" width="110" height="40" rx="10" />
  </g>
  
  <!-- Fluffy Cloud 2 -->
  <g fill="#ffffff" filter="url(#shadow)" opacity="0.85">
    <circle cx="680" cy="120" r="30" />
    <circle cx="720" cy="100" r="40" />
    <circle cx="770" cy="120" r="30" />
    <rect x="680" y="120" width="90" height="30" rx="10" />
  </g>

  <!-- Far Hills -->
  <path d="M -50 550 Q 300 400 650 520 T 1250 480 L 1250 850 L -50 850 Z" fill="url(#hillFar)" opacity="0.85" />
  
  <!-- Near Hills / Meadow -->
  <path d="M -50 620 Q 400 500 850 630 T 1250 580 L 1250 850 L -50 850 Z" fill="url(#hillNear)" />

  <!-- Meadow Flowers & Grass -->
  <g fill="#fbbf24" opacity="0.9">
    <!-- Flower 1 -->
    <circle cx="150" cy="690" r="6" />
    <circle cx="140" cy="690" r="5" fill="#f43f5e" />
    <circle cx="160" cy="690" r="5" fill="#f43f5e" />
    <circle cx="150" cy="680" r="5" fill="#f43f5e" />
    <circle cx="150" cy="700" r="5" fill="#f43f5e" />
    
    <!-- Flower 2 -->
    <circle cx="850" cy="720" r="6" />
    <circle cx="840" cy="720" r="5" fill="#a855f7" />
    <circle cx="860" cy="720" r="5" fill="#a855f7" />
    <circle cx="850" cy="710" r="5" fill="#a855f7" />
    <circle cx="850" cy="730" r="5" fill="#a855f7" />
  </g>

  <!-- ==================== RABBIT FAMILY ==================== -->

  <!-- 1. Papa Rabbit (Cream & Deep Slate, Large, Left) -->
  <g transform="translate(40, 240) scale(0.52)" filter="url(#shadow)">
${getRabbitPaths({
  fur: '#FAF1E1',
  outline: '#524F75',
  ear: '#FFB8A8',
  carrot: '#FF7E3C',
  leaf: '#62CCA3'
})}
  </g>

  <!-- 2. Mama Rabbit (Soft Silver & Cool Charcoal, Large, Right - Looking Left) -->
  <g transform="translate(1160, 230) scale(-0.52, 0.52)" filter="url(#shadow)">
${getRabbitPaths({
  fur: '#f1f5f9',
  outline: '#334155',
  ear: '#fda4af',
  carrot: '#f97316',
  leaf: '#22c55e'
})}
  </g>

  <!-- 3. Baby Rabbit Blue (Soft Sky Blue, Small, Middle-Left) -->
  <g transform="translate(420, 440) scale(0.28)" filter="url(#shadow)">
${getRabbitPaths({
  fur: '#e0f2fe',
  outline: '#0369a1',
  ear: '#fecdd3',
  carrot: '#fb923c',
  leaf: '#4ade80'
})}
  </g>

  <!-- 4. Baby Rabbit Gold (Soft Golden-Sand, Small, Middle-Right - Looking Left) -->
  <g transform="translate(800, 460) scale(-0.26, 0.26)" filter="url(#shadow)">
${getRabbitPaths({
  fur: '#fef3c7',
  outline: '#b45309',
  ear: '#fecdd3',
  carrot: '#f97316',
  leaf: '#16a34a'
})}
  </g>

  <!-- 5. Baby Rabbit Lavender (Soft Lilac, Very Small, Center) -->
  <g transform="translate(560, 490) scale(0.22)" filter="url(#shadow)">
${getRabbitPaths({
  fur: '#f3e8ff',
  outline: '#6b21a8',
  ear: '#fbcfe8',
  carrot: '#f97316',
  leaf: '#22c55e'
})}
  </g>

</svg>
`;

fs.writeFileSync('/Users/vijay/Desktop/antigravity/new wexls/public/images/multiple_rabbits.svg', svgContent);
console.log('Successfully created public/images/multiple_rabbits.svg');
