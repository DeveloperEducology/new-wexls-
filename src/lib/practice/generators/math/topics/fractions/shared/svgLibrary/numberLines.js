/**
 * SVG Generators for Number Lines
 */

export const buildNumberLineSvg = ({
  min = 0,
  max = 1,
  denominator = 4,
  showLabels = true,      // Show fraction labels under ticks
  showWholeNumbersOnly = false, // If true, only show 0, 1, etc.
  showTickMarks = true,   // Show the vertical tick marks
  markedPoints = [],      // Array of objects: { numerator, label, color, size, labelPosition, labelFraction: {num, den} }
  width = 600,
  height = 140,
  padding = 40
}) => {
  const lineY = height / 2;
  const startX = padding;
  const endX = width - padding;
  const usableWidth = endX - startX;
  
  // Total number of segments
  const totalSegments = (max - min) * denominator;
  const segmentWidth = usableWidth / totalSegments;

  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="max-width: ${width}px;" role="img" aria-label="Number line from ${min} to ${max}">
      <defs>
        <marker id="arrow-right" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#374151" />
        </marker>
        <marker id="arrow-left" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 10 0 L 0 5 L 10 10 z" fill="#374151" />
        </marker>
      </defs>
      
      <!-- Main Line -->
      <line x1="${startX - 15}" y1="${lineY}" x2="${endX + 15}" y2="${lineY}" stroke="#374151" stroke-width="4" marker-end="url(#arrow-right)" marker-start="url(#arrow-left)" />
  `;

  // Draw ticks and labels
  for (let i = 0; i <= totalSegments; i++) {
    const x = startX + i * segmentWidth;
    const isWholeNumber = i % denominator === 0;
    const tickHeight = isWholeNumber ? 40 : 28;
    const strokeWidth = isWholeNumber ? 4 : 3;
    
    if (showTickMarks) {
      svgContent += `
        <line x1="${x}" y1="${lineY - tickHeight/2}" x2="${x}" y2="${lineY + tickHeight/2}" stroke="#374151" stroke-width="${strokeWidth}" stroke-linecap="round"/>
      `;
    }

    if (showLabels) {
      if (isWholeNumber) {
        const wholeValue = min + (i / denominator);
        svgContent += `
          <text x="${x}" y="${lineY + 40}" text-anchor="middle" font-family="sans-serif" font-size="20" font-weight="bold" fill="#1f2937">${wholeValue}</text>
        `;
      } else if (!showWholeNumbersOnly) {
        const currentNumerator = (min * denominator) + i;
        svgContent += `
          <g transform="translate(${x}, ${lineY + 30})">
            <text x="0" y="0" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#4b5563">${currentNumerator}</text>
            <line x1="-10" y1="6" x2="10" y2="6" stroke="#4b5563" stroke-width="2"/>
            <text x="0" y="22" text-anchor="middle" font-family="sans-serif" font-size="16" fill="#4b5563">${denominator}</text>
          </g>
        `;
      }
    }
  }

  // Draw marked points
  markedPoints.forEach(point => {
    // point.numerator is the absolute numerator (e.g., if min=0, 3/4 -> 3)
    // We calculate offset relative to min
    const offsetNumerator = point.numerator - (min * denominator);
    if (offsetNumerator >= 0 && offsetNumerator <= totalSegments) {
      const x = startX + offsetNumerator * segmentWidth;
      const pointColor = point.color || '#3b82f6';
      const pointSize = point.size || 8;
      
      svgContent += `
        <circle cx="${x}" cy="${lineY}" r="${pointSize}" fill="${pointColor}" stroke="#ffffff" stroke-width="3" />
      `;

      if (point.label) {
        const yPos = point.labelPosition === 'bottom' ? lineY + 30 : lineY - 25;
        svgContent += `
          <text x="${x}" y="${yPos}" text-anchor="middle" font-family="sans-serif" font-size="22" font-weight="bold" fill="#000000">${point.label}</text>
        `;
      }

      if (point.labelFraction) {
        const yPos = point.labelPosition === 'bottom' ? lineY + 30 : lineY - 35;
        svgContent += `
          <g transform="translate(${x}, ${yPos})">
            <text x="0" y="0" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#000000">${point.labelFraction.num}</text>
            <line x1="-12" y1="6" x2="12" y2="6" stroke="#000000" stroke-width="2"/>
            <text x="0" y="24" text-anchor="middle" font-family="sans-serif" font-size="20" fill="#000000">${point.labelFraction.den}</text>
          </g>
        `;
      }
    }
  });

  svgContent += `</svg>`;
  return svgContent;
};

export const buildEquivalentNumberLinesSvg = ({
  min = 0,
  max = 1,
  denom1 = 4,
  num1 = 1,
  color1 = '#f97316', // Orange
  denom2 = 8,
  num2 = 2,
  color2 = '#0ea5e9', // Blue
  highlight = false,
  width = 700,
  height = 280,
  padding = 50
}) => {
  const lineY1 = 70;
  const lineY2 = 190;
  const startX = padding;
  const endX = width - padding;
  const usableWidth = endX - startX;

  let svgContent = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="100%" style="max-width: ${width}px; background: #ffffff;" role="img" aria-label="Comparison of two number lines">
      <defs>
        <marker id="arrow-right" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 0 0 L 10 5 L 0 10 z" fill="#6b7280" />
        </marker>
        <marker id="arrow-left" viewBox="0 0 10 10" refX="2" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M 10 0 L 0 5 L 10 10 z" fill="#6b7280" />
        </marker>
      </defs>
  `;

  const isEquivalent = Math.abs((num1 / denom1) - (num2 / denom2)) < 0.001;
  const segmentWidth1 = usableWidth / ((max - min) * denom1);
  const x1 = startX + (num1 - min * denom1) * segmentWidth1;
  const segmentWidth2 = usableWidth / ((max - min) * denom2);
  const x2 = startX + (num2 - min * denom2) * segmentWidth2;

  if (highlight) {
    if (isEquivalent) {
      svgContent += `
        <rect x="${x1 - 22}" y="40" width="44" height="180" rx="12" fill="none" stroke="#f97316" stroke-width="3" />
      `;
    } else {
      svgContent += `
        <line x1="${x1}" y1="40" x2="${x1}" y2="100" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 4" />
        <line x1="${x2}" y1="160" x2="${x2}" y2="220" stroke="#ef4444" stroke-width="2" stroke-dasharray="4 4" />
      `;
    }
  }

  svgContent += `
    <!-- Top line -->
    <line x1="${startX - 15}" y1="${lineY1}" x2="${endX + 15}" y2="${lineY1}" stroke="#9ca3af" stroke-width="3" marker-end="url(#arrow-right)" marker-start="url(#arrow-left)" />
  `;

  const totalSegments1 = (max - min) * denom1;
  for (let i = 0; i <= totalSegments1; i++) {
    const x = startX + i * segmentWidth1;
    const isWhole = i % denom1 === 0;
    const tickH = isWhole ? 24 : 16;
    svgContent += `
      <line x1="${x}" y1="${lineY1 - tickH/2}" x2="${x}" y2="${lineY1 + tickH/2}" stroke="#4b5563" stroke-width="${isWhole ? 3 : 2}" stroke-linecap="round" />
    `;

    if (isWhole) {
      const val = min + (i / denom1);
      svgContent += `
        <text x="${x}" y="${lineY1 + 35}" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">${val}</text>
      `;
    } else {
      const curNum = (min * denom1) + i;
      svgContent += `
        <g transform="translate(${x}, ${lineY1 + 25})">
          <text x="0" y="0" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#4b5563">${curNum}</text>
          <line x1="-8" y1="5" x2="8" y2="5" stroke="#4b5563" stroke-width="1.5"/>
          <text x="0" y="18" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#4b5563">${denom1}</text>
        </g>
      `;
    }
  }

  svgContent += `
    <!-- Bottom line -->
    <line x1="${startX - 15}" y1="${lineY2}" x2="${endX + 15}" y2="${lineY2}" stroke="#9ca3af" stroke-width="3" marker-end="url(#arrow-right)" marker-start="url(#arrow-left)" />
  `;

  const totalSegments2 = (max - min) * denom2;
  for (let i = 0; i <= totalSegments2; i++) {
    const x = startX + i * segmentWidth2;
    const isWhole = i % denom2 === 0;
    const tickH = isWhole ? 24 : 16;
    svgContent += `
      <line x1="${x}" y1="${lineY2 - tickH/2}" x2="${x}" y2="${lineY2 + tickH/2}" stroke="#4b5563" stroke-width="${isWhole ? 3 : 2}" stroke-linecap="round" />
    `;

    if (isWhole) {
      const val = min + (i / denom2);
      svgContent += `
        <text x="${x}" y="${lineY2 + 35}" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="bold" fill="#1f2937">${val}</text>
      `;
    } else {
      const curNum = (min * denom2) + i;
      svgContent += `
        <g transform="translate(${x}, ${lineY2 + 25})">
          <text x="0" y="0" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#4b5563">${curNum}</text>
          <line x1="-8" y1="5" x2="8" y2="5" stroke="#4b5563" stroke-width="1.5"/>
          <text x="0" y="18" text-anchor="middle" font-family="sans-serif" font-size="15" fill="#4b5563">${denom2}</text>
        </g>
      `;
    }
  }

  svgContent += `
    <circle cx="${x1}" cy="${lineY1}" r="9" fill="${color1}" stroke="#ffffff" stroke-width="2" />
    <circle cx="${x2}" cy="${lineY2}" r="9" fill="${color2}" stroke="#ffffff" stroke-width="2" />
  `;

  svgContent += `</svg>`;
  return svgContent;
};

