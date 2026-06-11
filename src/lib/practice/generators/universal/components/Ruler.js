import { SVG_DEFS } from './defs.js';

export function renderRuler(props) {
  const length = Math.max(1, Number(props.length) || 10);
  const objectLength = Math.max(0, Math.min(length, Number(props.objectLength) || 5));
  const objectType = props.objectType || 'pencil'; // pencil, crayon, bar

  const width = 500;
  const height = 150;
  const paddingX = 40;
  const rulerY = 90;
  const rulerHeight = 45;

  const rulerWidth = width - paddingX * 2;
  const pixelsPerUnit = rulerWidth / length;

  // Draw Ruler Base
  let rulerMarkup = `
    <!-- Ruler wooden body -->
    <rect x="${paddingX}" y="${rulerY}" width="${rulerWidth}" height="${rulerHeight}" fill="#fef08a" stroke="#ca8a04" stroke-width="2.5" rx="4" filter="url(#shadow)" />
  `;

  // Draw ticks for each unit
  for (let i = 0; i <= length; i++) {
    const x = paddingX + i * pixelsPerUnit;
    
    // Major tick (whole unit)
    rulerMarkup += `
      <line x1="${x}" y1="${rulerY}" x2="${x}" y2="${rulerY + 18}" stroke="#ca8a04" stroke-width="2" />
      <text x="${x}" y="${rulerY + 34}" font-family="system-ui, sans-serif" font-size="12px" font-weight="700" fill="#854d0e" text-anchor="middle" style="user-select: none;">${i}</text>
    `;

    // Half tick
    if (i < length) {
      const halfX = x + 0.5 * pixelsPerUnit;
      rulerMarkup += `<line x1="${halfX}" y1="${rulerY}" x2="${halfX}" y2="${rulerY + 12}" stroke="#ca8a04" stroke-width="1.5" />`;
      
      // Tenths/Millimeter ticks
      for (let j = 1; j < 10; j++) {
        if (j === 5) continue;
        const mmX = x + (j / 10) * pixelsPerUnit;
        rulerMarkup += `<line x1="${mmX}" y1="${rulerY}" x2="${mmX}" y2="${rulerY + 7}" stroke="#ca8a04" stroke-width="1" />`;
      }
    }
  }

  // Draw the object to be measured
  let objectMarkup = '';
  const objX1 = paddingX;
  const objWidth = objectLength * pixelsPerUnit;
  const objHeight = 24;
  const objY = rulerY - objHeight - 12;

  if (objectType === 'pencil') {
    // A cute yellow pencil drawing in SVG
    const bodyW = objWidth - 25; // leave 25px for tip and lead
    objectMarkup = `
      <g filter="url(#shadow)">
        <!-- Eraser metal band -->
        <rect x="${objX1}" y="${objY + 2}" width="8" height="${objHeight - 4}" fill="#94a3b8" />
        <rect x="${objX1}" y="${objY}" width="3" height="${objHeight}" fill="#f43f5e" rx="1" />
        <!-- Pencil main wooden yellow body -->
        <rect x="${objX1 + 8}" y="${objY}" width="${bodyW}" height="${objHeight}" fill="#fbbf24" stroke="#d97706" stroke-width="1" />
        <!-- Stripes -->
        <line x1="${objX1 + 8}" y1="${objY + 6}" x2="${objX1 + 8 + bodyW}" y2="${objY + 6}" stroke="#d97706" stroke-width="1.5" />
        <line x1="${objX1 + 8}" y1="${objY + 12}" x2="${objX1 + 8 + bodyW}" y2="${objY + 12}" stroke="#d97706" stroke-width="1.5" />
        <line x1="${objX1 + 8}" y1="${objY + 18}" x2="${objX1 + 8 + bodyW}" y2="${objY + 18}" stroke="#d97706" stroke-width="1.5" />
        <!-- Pencil wood cone head -->
        <polygon points="${objX1 + 8 + bodyW},${objY} ${objX1 + objWidth - 6},${objY + objHeight/2} ${objX1 + 8 + bodyW},${objY + objHeight}" fill="#fed7aa" />
        <!-- Graphite lead tip -->
        <polygon points="${objX1 + objWidth - 6},${objY + objHeight/2 - 3} ${objX1 + objWidth},${objY + objHeight/2} ${objX1 + objWidth - 6},${objY + objHeight/2 + 3} ${objX1 + 8 + bodyW + 12},${objY + objHeight/2}" fill="#334155" />
      </g>
    `;
  } else if (objectType === 'crayon') {
    // A cute purple crayon drawing in SVG
    const wrapW = objWidth * 0.6;
    objectMarkup = `
      <g filter="url(#shadow)">
        <!-- Crayon body -->
        <rect x="${objX1}" y="${objY}" width="${objWidth - 14}" height="${objHeight}" fill="#a855f7" rx="3" stroke="#7e22ce" stroke-width="1" />
        <!-- Crayon tip/cone -->
        <path d="M ${objX1 + objWidth - 14} ${objY} Q ${objX1 + objWidth} ${objY + objHeight/2} ${objX1 + objWidth - 14} ${objY + objHeight} Z" fill="#a855f7" stroke="#7e22ce" stroke-width="1" />
        <!-- Crayon wrapper -->
        <rect x="${objX1 + objWidth * 0.2}" y="${objY + 1}" width="${wrapW}" height="${objHeight - 2}" fill="#c084fc" />
        <!-- Crayon wavy wrapper decoration -->
        <path d="M ${objX1 + objWidth * 0.3} ${objY + 5} Q ${objX1 + objWidth * 0.4} ${objY + 12} ${objX1 + objWidth * 0.5} ${objY + 5}" fill="none" stroke="#7e22ce" stroke-width="2" />
        <path d="M ${objX1 + objWidth * 0.3} ${objY + 18} Q ${objX1 + objWidth * 0.4} ${objY + 12} ${objX1 + objWidth * 0.5} ${objY + 18}" fill="none" stroke="#7e22ce" stroke-width="2" />
      </g>
    `;
  } else {
    // Plain bar for standard measurement
    objectMarkup = `
      <rect x="${objX1}" y="${objY}" width="${objWidth}" height="${objHeight}" fill="#3b82f6" stroke="#2563eb" stroke-width="2.5" rx="4" filter="url(#shadow)" />
    `;
  }

  // Draw guidelines aligning starts and ends
  const guideLines = `
    <!-- Start line alignment -->
    <line x1="${paddingX}" y1="${objY - 5}" x2="${paddingX}" y2="${rulerY}" stroke="#e2e8f0" stroke-width="1.5" stroke-dasharray="3,3" />
    <!-- End line alignment -->
    <line x1="${paddingX + objWidth}" y1="${objY - 5}" x2="${paddingX + objWidth}" y2="${rulerY}" stroke="#ef4444" stroke-width="1.5" stroke-dasharray="3,3" />
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 500px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      ${guideLines}
      ${objectMarkup}
      ${rulerMarkup}
    </svg>
  `.trim();
}
