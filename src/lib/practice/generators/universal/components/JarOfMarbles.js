import { COLORS, SVG_DEFS } from './defs.js';

export function renderJarOfMarbles(props, rng) {
  const colorA = props.colorA;
  const countA = Number(props.countA) || 0;
  const colorB = props.colorB;
  const countB = Number(props.countB) || 0;

  const svgWidth = 240;
  const svgHeight = 280;
  
  // Make a list of marbles
  const marblesList = [];
  for (let i = 0; i < countA; i++) marblesList.push(colorA);
  for (let i = 0; i < countB; i++) marblesList.push(colorB);

  // Position marbles deterministically inside the jar's belly
  // Jar center is cx=120, belly radius is rx=70, ry=80. bottom is y=220.
  const placedMarbles = [];
  const radius = 14;

  let attempts = 0;
  for (const col of marblesList) {
    let placed = false;
    attempts = 0;
    while (!placed && attempts < 100) {
      attempts++;
      // Generate x/y in the jar belly
      const angle = rng() * Math.PI * 2;
      // Spread them more towards the bottom of the jar (gravity)
      const distPercent = 0.2 + rng() * 0.75;
      const cx = 120 + Math.cos(angle) * 60 * distPercent;
      const cy = 175 + Math.sin(angle) * 55 * distPercent;

      // Check collision with other marbles
      let collision = false;
      for (const other of placedMarbles) {
        const dist = Math.sqrt((cx - other.x) ** 2 + (cy - other.y) ** 2);
        if (dist < radius * 2.1) {
          collision = true;
          break;
        }
      }
      // Also ensure it is inside the jar limits
      if (!collision && cy > 105 && cy < 235 && cx > 60 && cx < 180) {
        placedMarbles.push({ x: cx, y: cy, color: col });
        placed = true;
      }
    }
  }

  let marblesMarkup = '';
  for (const m of placedMarbles) {
    const colObj = COLORS[m.color] || COLORS.red;
    marblesMarkup += `<circle cx="${m.x}" cy="${m.y}" r="${radius}" fill="${colObj.fill}" stroke="${colObj.stroke}" stroke-width="1.5" filter="url(#shadow)" />`;
  }

  // Draw the glass jar SVG path
  const jarPath = `
    M 90,60 
    L 150,60 
    C 160,60 160,75 160,75 
    L 170,95 
    C 195,115 205,145 205,180
    C 205,230 180,250 120,250
    C 60,250 35,230 35,180
    C 35,145 45,115 70,95
    L 80,75
    C 80,75 80,60 90,60 Z
  `;

  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 200px; display: block; margin: 0 auto;">
      ${SVG_DEFS}
      <!-- Jar fill (liquid/translucent glass) -->
      <path d="${jarPath}" fill="#f1f5f9" fill-opacity="0.6" stroke="#94a3b8" stroke-width="4" stroke-linejoin="round" />
      
      <!-- Lid / Rim -->
      <ellipse cx="120" cy="65" rx="32" ry="7" fill="#cbd5e1" stroke="#94a3b8" stroke-width="2" />
      <rect x="92" y="56" width="56" height="6" rx="2" fill="#94a3b8" />
      
      <!-- Marbles -->
      <g>
        ${marblesMarkup}
      </g>
      
      <!-- Glass reflection highlight -->
      <path d="M 60,120 A 55,60 0 0,1 60,220" fill="none" stroke="#ffffff" stroke-width="4" stroke-linecap="round" opacity="0.6" />
    </svg>
  `.trim();
}
