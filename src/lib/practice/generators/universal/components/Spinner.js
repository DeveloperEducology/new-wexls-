import { COLORS, SVG_DEFS } from './defs.js';

export function renderSpinner(props) {
  const colorA = props.colorA;
  const sectorsA = Number(props.sectorsA) || 1;
  const colorB = props.colorB;
  const sectorsB = Number(props.sectorsB) || 0;

  const totalSectors = sectorsA + sectorsB;
  const radius = 90;
  const cx = 100;
  const cy = 100;

  // Make list of sectors
  const sectors = [];
  for (let i = 0; i < sectorsA; i++) sectors.push(colorA);
  for (let i = 0; i < sectorsB; i++) sectors.push(colorB);

  const angleStep = 360 / totalSectors;
  let sectorsMarkup = '';

  sectors.forEach((color, index) => {
    const startAngle = index * angleStep;
    const endAngle = (index + 1) * angleStep;
    
    // Draw slice path
    const radStart = (startAngle - 90) * Math.PI / 180;
    const radEnd = (endAngle - 90) * Math.PI / 180;
    
    const x1 = cx + radius * Math.cos(radStart);
    const y1 = cy + radius * Math.sin(radStart);
    const x2 = cx + radius * Math.cos(radEnd);
    const y2 = cy + radius * Math.sin(radEnd);

    const largeArc = angleStep > 180 ? 1 : 0;
    
    const path = `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} Z`;
    const colObj = COLORS[color] || COLORS.red;

    sectorsMarkup += `<path d="${path}" fill="${colObj.fill}" stroke="#ffffff" stroke-width="2" />`;
  });

  return `
    <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 220px; display: block; margin: 0 auto;">
      ${SVG_DEFS}
      <!-- Outer metallic ring -->
      <circle cx="${cx}" cy="${cy}" r="${radius + 5}" fill="none" stroke="#cbd5e1" stroke-width="4" filter="url(#shadow)" />
      
      <!-- Spinner Wheel Slices -->
      <g>
        ${sectorsMarkup}
      </g>
      
      <!-- Center Pin and Arrow Indicator -->
      <g filter="url(#shadow)">
        <!-- Arrow pointing to a random spot, e.g. angle -45 degrees -->
        <g transform="rotate(-45 ${cx} ${cy})">
          <line x1="${cx}" y1="${cy}" x2="${cx}" y2="${cy - 80}" stroke="#1e293b" stroke-width="4" stroke-linecap="round" />
          <polygon points="${cx},${cy - 84} ${cx - 7},${cy - 68} ${cx + 7},${cy - 68}" fill="#1e293b" />
        </g>
        <!-- Center brass/metallic pin -->
        <circle cx="${cx}" cy="${cy}" r="12" fill="#e2e8f0" stroke="#94a3b8" stroke-width="2" />
        <circle cx="${cx}" cy="${cy}" r="5" fill="#64748b" />
      </g>
    </svg>
  `.trim();
}
