import { SVG_DEFS } from './defs.js';

export function renderProtractor(props) {
  const angle = Math.max(0, Math.min(180, Number(props.angle) || 45));

  const width = 360;
  const height = 220;
  const cx = width / 2;
  const cy = height - 30;
  const radius = 130;

  // Rays coordinates
  const rayLen = radius + 20;
  // Baseline ray (always pointing to 0 deg on the right, which is angle = 0 rad)
  const baseRx = cx + rayLen;
  const baseRy = cy;

  // Angle ray (pointing to 'angle' degrees)
  const angleRad = (angle * Math.PI) / 180;
  const armX = cx + rayLen * Math.cos(angleRad);
  const armY = cy - rayLen * Math.sin(angleRad); // Upwards in SVG is negative Y

  // Draw ticks for the protractor (0 to 180 every 10 deg)
  let ticks = '';
  for (let deg = 0; deg <= 180; deg += 10) {
    const rad = (deg * Math.PI) / 180;
    const isMajor = deg % 30 === 0;
    const len = isMajor ? 12 : 7;
    const xStart = cx + (radius - len) * Math.cos(rad);
    const yStart = cy - (radius - len) * Math.sin(rad);
    const xEnd = cx + radius * Math.cos(rad);
    const yEnd = cy - radius * Math.sin(rad);

    ticks += `<line x1="${xStart}" y1="${yStart}" x2="${xEnd}" y2="${yEnd}" stroke="#475569" stroke-width="${isMajor ? 1.5 : 1}" />`;

    if (isMajor) {
      const textR = radius - 22;
      const tx = cx + textR * Math.cos(rad);
      const ty = cy - textR * Math.sin(rad);
      ticks += `
        <text x="${tx}" y="${ty + 4}" font-family="system-ui, sans-serif" font-size="9px" font-weight="700" fill="#475569" text-anchor="middle">
          ${deg}
        </text>
      `;
    }
  }

  // Draw small arc representing the angle
  const arcR = 35;
  const arcX = cx + arcR * Math.cos(angleRad);
  const arcY = cy - arcR * Math.sin(angleRad);
  const largeArc = angle > 180 ? 1 : 0;
  const sweep = 0; // Sweep left (since 0 deg is on right and angle goes counter-clockwise)

  const angleArcPath = angle > 0 ? `
    <path d="M ${cx + arcR} ${cy} A ${arcR} ${arcR} 0 ${largeArc} ${sweep} ${arcX} ${arcY}" fill="none" stroke="#ef4444" stroke-width="2.5" />
    <text x="${cx + (arcR + 15) * Math.cos(angleRad / 2)}" y="${cy - (arcR + 15) * Math.sin(angleRad / 2) + 4}" font-family="system-ui, sans-serif" font-size="12px" font-weight="900" fill="#ef4444" text-anchor="middle">
      ${angle}°
    </text>
  ` : '';

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 360px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      
      <!-- Angle lines to measure -->
      <g>
        <line x1="${cx}" y1="${cy}" x2="${baseRx}" y2="${baseRy}" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
        <line x1="${cx}" y1="${cy}" x2="${armX}" y2="${armY}" stroke="#1e293b" stroke-width="3" stroke-linecap="round" />
        <circle cx="${cx}" cy="${cy}" r="6" fill="#1e293b" />
        ${angleArcPath}
      </g>
      
      <!-- Semi-transparent Protractor Overlay -->
      <g opacity="0.82" style="pointer-events: none;">
        <!-- Protractor fill shape -->
        <path d="M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy} Z" fill="rgba(239, 246, 255, 0.6)" stroke="#3b82f6" stroke-width="2.5" />
        <!-- Inner arc boundary -->
        <path d="M ${cx - (radius - 12)} ${cy} A ${radius - 12} ${radius - 12} 0 0 1 ${cx + (radius - 12)} ${cy} Z" fill="none" stroke="#3b82f6" stroke-width="1" />
        <!-- Tiny center hole crosshair -->
        <circle cx="${cx}" cy="${cy}" r="16" fill="none" stroke="#3b82f6" stroke-width="1.5" />
        <line x1="${cx - 20}" y1="${cy}" x2="${cx + 20}" y2="${cy}" stroke="#3b82f6" stroke-width="1" />
        <line x1="${cx}" y1="${cy - 20}" x2="${cx}" y2="${cy}" stroke="#3b82f6" stroke-width="1" />
        ${ticks}
      </g>
    </svg>
  `.trim();
}
