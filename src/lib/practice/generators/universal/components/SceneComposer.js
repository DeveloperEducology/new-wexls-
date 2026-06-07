export function generateDynamicSceneSvg(props) {
  const containerType = props.containerType || 'box';
  const targetClipart = props.targetClipart || '';
  const placements = props.placements || [];
  const hotspots = props.hotspots || [];
  const canvasWidth = Number(props.canvasWidth) || 500;
  const canvasHeight = Number(props.canvasHeight) || 320;
  const outsidePosition = props.outsidePosition || 'auto'; // 'auto', 'above', 'below', 'left', 'right'

  let svgElements = [];

  // For each hotspot, draw its container and optional clipart
  hotspots.forEach((hs, idx) => {
    const x = Number(hs.x);
    const y = Number(hs.y);
    const w = Number(hs.width);
    const h = Number(hs.height);

    if (isNaN(x) || isNaN(y) || isNaN(w) || isNaN(h)) return;

    // 1. Draw Container SVG Markup
    let containerMarkup = '';
    
    switch (containerType) {
      case 'bowl': {
        const bowlHeight = h * 0.5;
        const bowlY = y + h - bowlHeight;
        const stroke = '#0284c7';
        const fill = '#e0f2fe';
        containerMarkup = `
          <path d="M ${x} ${bowlY} 
                   L ${x + w} ${bowlY} 
                   C ${x + w} ${bowlY + bowlHeight * 1.3} ${x} ${bowlY + bowlHeight * 1.3} ${x} ${bowlY} Z" 
                fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
        `;
        break;
      }
      case 'basket': {
        const basketHeight = h * 0.55;
        const basketY = y + h - basketHeight;
        const stroke = '#b45309';
        const fill = '#fef3c7';
        containerMarkup = `
          <!-- Basket Handle -->
          <path d="M ${x + w * 0.15} ${basketY} C ${x + w * 0.15} ${basketY - basketHeight * 0.5} ${x + w * 0.85} ${basketY - basketHeight * 0.5} ${x + w * 0.85} ${basketY}" 
                fill="none" stroke="${stroke}" stroke-width="3.5" stroke-linecap="round" />
          <!-- Basket Body -->
          <path d="M ${x + w * 0.1} ${basketY} 
                   L ${x + w * 0.9} ${basketY} 
                   L ${x + w * 0.8} ${basketY + basketHeight} 
                   L ${x + w * 0.2} ${basketY + basketHeight} Z" 
                fill="${fill}" stroke="${stroke}" stroke-width="4" stroke-linejoin="round" />
          <!-- Woven Lines -->
          <path d="M ${x + w * 0.3} ${basketY} L ${x + w * 0.4} ${basketY + basketHeight}
                   M ${x + w * 0.5} ${basketY} L ${x + w * 0.5} ${basketY + basketHeight}
                   M ${x + w * 0.7} ${basketY} L ${x + w * 0.6} ${basketY + basketHeight}
                   M ${x + w * 0.2} ${basketY + basketHeight * 0.4} L ${x + w * 0.8} ${basketY + basketHeight * 0.4}
                   M ${x + w * 0.2} ${basketY + basketHeight * 0.7} L ${x + w * 0.8} ${basketY + basketHeight * 0.7}" 
                stroke="#d97706" stroke-width="1.5" stroke-linecap="round" opacity="0.65" />
        `;
        break;
      }
      case 'circle':
      case 'ring': {
        const cx = x + w / 2;
        const cy = y + h / 2;
        const rx = w / 2 - 4;
        const ry = h / 2 - 4;
        const stroke = '#ef4444';
        containerMarkup = `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="none" stroke="${stroke}" stroke-width="3.5" stroke-dasharray="6,5" />`;
        break;
      }
      case 'plate': {
        const plateHeight = h * 0.22;
        const plateY = y + h - plateHeight;
        const cx = x + w / 2;
        const cy = plateY + plateHeight / 2;
        const rx = w / 2;
        const ry = plateHeight / 2;
        containerMarkup = `
          <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#f1f5f9" stroke="#cbd5e1" stroke-width="3" />
          <ellipse cx="${cx}" cy="${cy + 2}" rx="${rx - 8}" ry="${ry - 3}" fill="none" stroke="#94a3b8" stroke-width="1.5" />
        `;
        break;
      }
      case 'house': {
        const houseY = y + h * 0.18;
        const houseH = h * 0.82;
        const stroke = '#4f46e5';
        const fill = '#e0e7ff';
        containerMarkup = `
          <!-- Roof -->
          <path d="M ${x} ${houseY + houseH * 0.35} L ${x + w / 2} ${y} L ${x + w} ${houseY + houseH * 0.35} Z" fill="#fca5a5" stroke="#ef4444" stroke-width="3.5" stroke-linejoin="round" />
          <!-- Base -->
          <rect x="${x + w * 0.1}" y="${houseY + houseH * 0.35}" width="${w * 0.8}" height="${houseH * 0.65}" fill="${fill}" stroke="${stroke}" stroke-width="3.5" stroke-linejoin="round" />
          <!-- Door -->
          <rect x="${x + w * 0.45}" y="${houseY + houseH * 0.65}" width="${w * 0.22}" height="${houseH * 0.35}" fill="#b45309" stroke="#78350f" stroke-width="1.5" />
          <!-- Window -->
          <rect x="${x + w * 0.22}" y="${houseY + houseH * 0.45}" width="${w * 0.15}" height="${houseH * 0.15}" fill="#ffffff" stroke="${stroke}" stroke-width="1.5" />
        `;
        break;
      }
      case 'box':
      default: {
        const rx = 10;
        const ry = 10;
        const fill = '#f8fafc';
        const stroke = '#64748b';
        containerMarkup = `
          <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="4" />
          <!-- Detail panel line to look like a box -->
          <path d="M ${x - 2} ${y + 16} L ${x + w + 2} ${y + 16}" stroke="${stroke}" stroke-width="2.5" />
        `;
        break;
      }
    }

    svgElements.push(containerMarkup.trim());

    // 2. Determine Clipart and Placement
    const placementVal = placements[idx] || '';
    
    // Support object config in placements: e.g. { type: 'inside', clipart: 'http://...' }
    let placementType = '';
    let clipartUrl = targetClipart;
    
    if (typeof placementVal === 'object' && placementVal !== null) {
      placementType = placementVal.type || '';
      if (placementVal.clipart) clipartUrl = placementVal.clipart;
    } else {
      placementType = String(placementVal);
    }

    if (!clipartUrl || (placementType !== 'inside' && placementType !== 'outside')) {
      return; // No clipart or placement specified for this container
    }

    // Determine clipart sizes
    const cw = Math.min(w, h) * 0.52;
    const ch = cw;
    const cx = x + w / 2;
    const cy = y + h / 2;

    let clipartX = cx - cw / 2;
    let clipartY = cy - ch / 2;

    if (placementType === 'inside') {
      // Align inside container based on its shape
      switch (containerType) {
        case 'bowl':
          clipartY = (y + h - h * 0.5) - ch * 0.45;
          break;
        case 'basket':
          clipartY = (y + h - h * 0.55) - ch * 0.42;
          break;
        case 'plate':
          clipartY = (y + h - h * 0.22) - ch + 6;
          break;
        case 'house':
          clipartY = (y + h * 0.18 + h * 0.82 * 0.35) + (h * 0.82 * 0.65) / 2 - ch / 2;
          break;
        case 'box':
        default:
          clipartY = y + h / 2 - ch / 2 + 6;
          break;
      }
    } else if (placementType === 'outside') {
      // Determine position direction (above, below, left, right)
      let direction = outsidePosition;
      if (direction === 'auto') {
        if (y - ch - 18 >= 8) {
          direction = 'above';
        } else if (x + w + cw + 18 <= canvasWidth) {
          direction = 'right';
        } else if (x - cw - 18 >= 8) {
          direction = 'left';
        } else {
          direction = 'below';
        }
      }

      switch (direction) {
        case 'above':
          clipartX = cx - cw / 2;
          clipartY = y - ch - 12;
          break;
        case 'below':
          clipartX = cx - cw / 2;
          clipartY = y + h + 12;
          break;
        case 'left':
          clipartX = x - cw - 15;
          clipartY = (containerType === 'bowl' || containerType === 'basket' || containerType === 'plate')
            ? (y + h - ch)
            : (cy - ch / 2);
          break;
        case 'right':
        default:
          clipartX = x + w + 15;
          clipartY = (containerType === 'bowl' || containerType === 'basket' || containerType === 'plate')
            ? (y + h - ch)
            : (cy - ch / 2);
          break;
      }
    }

    // Build clipart image markup
    const clipartMarkup = `<image href="${clipartUrl}" x="${clipartX}" y="${clipartY}" width="${cw}" height="${ch}" />`;
    svgElements.push(clipartMarkup);
  });

  // Return full composite SVG string
  return `
    <svg viewBox="0 0 ${canvasWidth} ${canvasHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="display: block; width: 100%; height: 100%;">
      <g>
        ${svgElements.join('\n        ')}
      </g>
    </svg>
  `.trim();
}

// Standalone component support for visuals catalog
export function renderSceneComposer(props) {
  // Mock default hotspots to demonstrate component in general SVG layout
  const hotspots = [
    { id: 'box_a', label: 'Box A', x: 40, y: 40, width: 180, height: 160, optionIndex: 0 },
    { id: 'box_b', label: 'Box B', x: 280, y: 40, width: 180, height: 160, optionIndex: 1 }
  ];

  const targetPosition = String(props.targetPosition || '0');
  const containerType = props.containerType || 'box';
  const targetClipart = props.targetClipart || 'https://pub-cd5e5525b6a34d0b8d5a86d268d0bb5a.r2.dev/images/1780655474062-bunny.png';

  // Build placements array: one inside, one outside
  const placements = [];
  if (targetPosition === '0' || targetPosition === 'inside_left') {
    placements.push('inside', 'outside');
  } else {
    placements.push('outside', 'inside');
  }

  return generateDynamicSceneSvg({
    containerType,
    targetClipart,
    placements,
    hotspots,
    canvasWidth: 500,
    canvasHeight: 250
  });
}
