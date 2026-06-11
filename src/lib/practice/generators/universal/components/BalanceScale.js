import { SVG_DEFS } from './defs.js';

function renderStackedWeights(panX, panY, totalWeight) {
  let html = '';
  let yCurrent = panY - 2;

  const weights = [];
  let remaining = totalWeight;
  while (remaining >= 5) {
    weights.push(5);
    remaining -= 5;
  }
  while (remaining >= 1) {
    weights.push(1);
    remaining -= 1;
  }

  weights.forEach((w) => {
    const width = w === 5 ? 36 : 28;
    const height = w === 5 ? 18 : 14;
    const color = w === 5 ? '#f59e0b' : '#94a3b8'; // Gold for 5, Silver for 1
    const stroke = w === 5 ? '#b45309' : '#475569';
    const textCol = w === 5 ? '#ffffff' : '#1e293b';

    const x = panX - width / 2;
    const y = yCurrent - height;

    html += `
      <g>
        <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" stroke="${stroke}" stroke-width="1.5" rx="3" />
        <ellipse cx="${panX}" cy="${y}" rx="${width / 2}" ry="3" fill="${color}" stroke="${stroke}" stroke-width="1" />
        <text x="${panX}" y="${y + height / 2 + 4}" font-family="system-ui, sans-serif" font-weight="900" font-size="10px" fill="${textCol}" text-anchor="middle">${w}</text>
      </g>
    `;
    yCurrent -= (height + 2);
  });

  return html;
}

function renderLabeledBox(panX, panY, weight, label, fillColor) {
  const width = 64;
  const height = 46;
  const x = panX - width / 2;
  const y = panY - height - 2;
  const strokeColor = '#1e293b';

  return `
    <g>
      <rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2" rx="4" filter="url(#shadow)" />
      <text x="${panX}" y="${y + 16}" font-family="system-ui, sans-serif" font-weight="bold" font-size="11px" fill="#fff" text-anchor="middle">${label}</text>
      <text x="${panX}" y="${y + 34}" font-family="system-ui, sans-serif" font-weight="800" font-size="13px" fill="#fff" text-anchor="middle">${weight} kg</text>
    </g>
  `;
}

export function renderBalanceScale(props) {
  const leftWeight = Math.max(0, Number(props.leftWeight) || 0);
  const rightWeight = Math.max(0, Number(props.rightWeight) || 0);
  const leftLabel = props.leftLabel || 'Box A';
  const rightLabel = props.rightLabel || 'Box B';
  const showStacked = props.showStacked === true || props.showStacked === 'true' || props.showStacked === 1;

  const width = 450;
  const height = 300;
  const midX = width / 2;
  const pivotY = height - 60;
  const beamY = 120;
  
  let tiltDegrees = 0;
  if (leftWeight > rightWeight) {
    tiltDegrees = -12; // Left goes down
  } else if (rightWeight > leftWeight) {
    tiltDegrees = 12; // Right goes down
  }
  
  const rad = (tiltDegrees * Math.PI) / 180;
  const armLength = 135;
  
  const leftBeamX = midX - armLength * Math.cos(rad);
  const leftBeamY = beamY - armLength * Math.sin(rad);
  const rightBeamX = midX + armLength * Math.cos(rad);
  const rightBeamY = beamY + armLength * Math.sin(rad);
  
  const panH = 80;
  const leftPanX = leftBeamX;
  const leftPanY = leftBeamY + panH;
  const rightPanX = rightBeamX;
  const rightPanY = rightBeamY + panH;

  let leftWeightsHTML = '';
  let rightWeightsHTML = '';

  if (showStacked) {
    leftWeightsHTML = renderStackedWeights(leftPanX, leftPanY, leftWeight);
    rightWeightsHTML = renderStackedWeights(rightPanX, rightPanY, rightWeight);
  } else {
    leftWeightsHTML = renderLabeledBox(leftPanX, leftPanY, leftWeight, leftLabel, '#f87171');
    rightWeightsHTML = renderLabeledBox(rightPanX, rightPanY, rightWeight, rightLabel, '#60a5fa');
  }

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto; background:#fff; border:2px solid #e2e8f0; border-radius:12px;" filter="url(#shadow)">
      ${SVG_DEFS}
      
      <!-- Table Base -->
      <rect x="50" y="${pivotY + 20}" width="350" height="15" rx="3" fill="#78350f" stroke="#451a03" stroke-width="2" />
      
      <!-- Stand Pillar -->
      <polygon points="${midX - 22},${pivotY + 20} ${midX + 22},${pivotY + 20} ${midX + 10},${beamY} ${midX - 10},${beamY}" fill="#475569" stroke="#000" stroke-width="2" />
      
      <!-- Left Pan Assembly cords -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX - 30}" y2="${leftPanY}" stroke="#64748b" stroke-width="2" />
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${leftPanX + 30}" y2="${leftPanY}" stroke="#64748b" stroke-width="2" />
      <!-- Platform Pan Left -->
      <path d="M ${leftPanX - 35},${leftPanY} L ${leftPanX + 35},${leftPanY} Q ${leftPanX},${leftPanY + 12} ${leftPanX - 35},${leftPanY} Z" fill="#cbd5e1" stroke="#334155" stroke-width="2" />
      <!-- Left Pan Weights -->
      ${leftWeightsHTML}
      
      <!-- Right Pan Assembly cords -->
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX - 30}" y2="${rightPanY}" stroke="#64748b" stroke-width="2" />
      <line x1="${rightBeamX}" y1="${rightBeamY}" x2="${rightPanX + 30}" y2="${rightPanY}" stroke="#64748b" stroke-width="2" />
      <!-- Platform Pan Right -->
      <path d="M ${rightPanX - 35},${rightPanY} L ${rightPanX + 35},${rightPanY} Q ${rightPanX},${rightPanY + 12} ${rightPanX - 35},${rightPanY} Z" fill="#cbd5e1" stroke="#334155" stroke-width="2" />
      <!-- Right Pan Weights -->
      ${rightWeightsHTML}
      
      <!-- Central Balance Beam -->
      <line x1="${leftBeamX}" y1="${leftBeamY}" x2="${rightBeamX}" y2="${rightBeamY}" stroke="#334155" stroke-width="5" stroke-linecap="round" />
      <circle cx="${midX}" cy="${beamY}" r="7" fill="#facc15" stroke="#000" stroke-width="2" />
    </svg>
  `.trim();
}
