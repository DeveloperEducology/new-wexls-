import { SVG_DEFS } from './defs.js';

export function renderThermometer(props) {
  const min = Number(props.min) !== undefined && !isNaN(Number(props.min)) ? Number(props.min) : -20;
  const max = Number(props.max) !== undefined && !isNaN(Number(props.max)) ? Number(props.max) : 50;
  const value = Number(props.value) !== undefined && !isNaN(Number(props.value)) ? Number(props.value) : 20;
  const unit = props.unit || 'C';

  const width = 160;
  const height = 260;
  const cx = width / 2 - 15;

  const tubeTopY = 40;
  const tubeBottomY = 200;
  const tubeH = tubeBottomY - tubeTopY;
  const tubeRadius = 10;
  const bulbRadius = 18;
  const bulbCy = tubeBottomY + bulbRadius - 2;

  // Calculate liquid level
  const clampedVal = Math.max(min, Math.min(max, value));
  const ratio = (clampedVal - min) / (max - min);
  const liquidY = tubeBottomY - ratio * tubeH;

  // Draw temperature graduation ticks
  let ticksMarkup = '';
  const tickStep = (max - min) / 7;
  const pixelsPerDeg = tubeH / (max - min);

  for (let val = min; val <= max + 0.01; val += tickStep) {
    const y = tubeBottomY - (val - min) * pixelsPerDeg;
    const isMajor = Math.round(val) % 10 === 0 || val === min || val === max;
    const len = isMajor ? 10 : 5;
    
    ticksMarkup += `
      <!-- Tick mark -->
      <line x1="${cx + tubeRadius}" y1="${y}" x2="${cx + tubeRadius + len}" y2="${y}" stroke="#475569" stroke-width="1.5" />
      ${isMajor ? `
        <!-- Tick Label -->
        <text x="${cx + tubeRadius + len + 6}" y="${y + 4}" font-family="system-ui, sans-serif" font-size="10px" font-weight="700" fill="#64748b">${Math.round(val)}°</text>
      ` : ''}
    `;
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 160px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      
      <!-- Thermometer Outer glass shell outline -->
      <!-- Top cap cap -->
      <path d="
        M ${cx - tubeRadius} ${tubeBottomY} 
        L ${cx - tubeRadius} ${tubeTopY} 
        A ${tubeRadius} ${tubeRadius} 0 0 1 ${cx + tubeRadius} ${tubeTopY} 
        L ${cx + tubeRadius} ${tubeBottomY}
      " fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />
      
      <!-- Bottom bulb circle -->
      <circle cx="${cx}" cy="${bulbCy}" r="${bulbRadius}" fill="#f8fafc" stroke="#94a3b8" stroke-width="2.5" />
      
      <!-- Connect glass bulb and tube together (erase overlapping borders) -->
      <rect x="${cx - tubeRadius + 1}" y="${tubeBottomY - 2}" width="${tubeRadius * 2 - 2}" height="10" fill="#f8fafc" />

      <!-- Thermometer Liquid Filling -->
      <!-- Red Bulb -->
      <circle cx="${cx}" cy="${bulbCy}" r="${bulbRadius - 3.5}" fill="#ef4444" />
      
      <!-- Red Liquid column in tube -->
      <rect x="${cx - tubeRadius + 3.5}" y="${liquidY}" width="${(tubeRadius - 3.5) * 2}" height="${tubeBottomY - liquidY + 2}" fill="#ef4444" rx="1.5" />

      <!-- Scale Ticks -->
      ${ticksMarkup}

      <!-- Unit Tag (e.g. °C) -->
      <text x="${cx}" y="${tubeTopY - 18}" font-family="system-ui, sans-serif" font-size="14px" font-weight="900" fill="#334155" text-anchor="middle">°${unit}</text>
      
      <!-- Reading Display Box -->
      <g transform="translate(${width - 40}, ${height - 45})">
        <rect x="-25" y="-12" width="55" height="24" rx="6" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="1.5" />
        <text x="2.5" y="5" font-family="system-ui, sans-serif" font-size="12px" font-weight="900" fill="#ef4444" text-anchor="middle">${clampedVal}°${unit}</text>
      </g>
    </svg>
  `.trim();
}
