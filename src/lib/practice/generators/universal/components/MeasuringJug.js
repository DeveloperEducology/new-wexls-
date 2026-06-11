import { SVG_DEFS } from './defs.js';

export function renderMeasuringJug(props) {
  const capacity = Math.max(10, Number(props.capacity) || 1000);
  const step = Math.max(1, Number(props.step) || 100);
  const value = Math.max(0, Math.min(capacity, Number(props.value) || 500));

  const width = 200;
  const height = 280;

  const jugX = 50;
  const jugY = 40;
  const jugW = 90;
  const jugH = 200;

  const ratio = value / capacity;
  const liquidH = ratio * jugH;
  const liquidY = jugY + jugH - liquidH;

  // Draw ticks
  let ticksMarkup = '';
  const totalTicks = capacity / step;
  
  for (let i = 0; i <= totalTicks; i++) {
    const val = i * step;
    const y = jugY + jugH - (val / capacity) * jugH;
    
    // Draw tick line
    ticksMarkup += `
      <line x1="${jugX + jugW - 15}" y1="${y}" x2="${jugX + jugW}" y2="${y}" stroke="#475569" stroke-width="1.5" />
      <text x="${jugX + jugW + 8}" y="${y + 4}" font-family="system-ui, sans-serif" font-size="10px" font-weight="700" fill="#64748b">${val}</text>
    `;
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 200px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      
      <!-- Blue liquid filling -->
      ${value > 0 ? `
        <rect x="${jugX + 2}" y="${liquidY}" width="${jugW - 4}" height="${liquidH}" fill="#3b82f6" opacity="0.65" />
        <!-- Top surface ellipse for 3D liquid look -->
        <ellipse cx="${jugX + jugW/2}" cy="${liquidY}" rx="${jugW/2 - 2}" ry="4" fill="#60a5fa" opacity="0.8" />
      ` : ''}
      
      <!-- Jug Transparent glass body outline -->
      <path d="
        M ${jugX} ${jugY} 
        L ${jugX} ${jugY + jugH} 
        A 10 10 0 0 0 ${jugX + 10} ${jugY + jugH + 10}
        L ${jugX + jugW - 10} ${jugY + jugH + 10}
        A 10 10 0 0 0 ${jugX + jugW} ${jugY + jugH}
        L ${jugX + jugW} ${jugY}
      " fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />
      
      <!-- Handle -->
      <path d="
        M ${jugX} ${jugY + 40} 
        Q ${jugX - 30} ${jugY + 90} ${jugX} ${jugY + 140}
      " fill="none" stroke="#94a3b8" stroke-width="6" stroke-linecap="round" />
      <path d="
        M ${jugX} ${jugY + 40} 
        Q ${jugX - 30} ${jugY + 90} ${jugX} ${jugY + 140}
      " fill="none" stroke="#f1f5f9" stroke-width="1.5" stroke-linecap="round" />

      <!-- Spout -->
      <path d="M ${jugX} ${jugY} L ${jugX - 6} ${jugY - 6} L ${jugX + 10} ${jugY}" fill="none" stroke="#94a3b8" stroke-width="3" stroke-linecap="round" />

      <!-- Graduations -->
      ${ticksMarkup}

      <!-- Unit Label -->
      <text x="${jugX + jugW/2}" y="${jugY + 24}" font-family="system-ui, sans-serif" font-size="12px" font-weight="900" fill="#64748b" opacity="0.7" text-anchor="middle">ml</text>

      <!-- Value text display box -->
      <g transform="translate(${width/2}, ${height - 15})">
        <text x="0" y="0" font-family="system-ui, sans-serif" font-size="14px" font-weight="900" fill="#2563eb" text-anchor="middle">${value} ml</text>
      </g>
    </svg>
  `.trim();
}
