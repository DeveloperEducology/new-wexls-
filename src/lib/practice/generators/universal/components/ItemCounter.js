import { SVG_DEFS } from './defs.js';

export function renderItemCounter(props) {
  const count = Number(props.count) || 3;
  const itemType = props.itemType || 'cupcake';
  
  const showNumbers = props.showNumbers === true || props.showNumbers === 'true' || props.showNumbers === 1;
  const hideImages = props.hideImages === true || props.hideImages === 'true' || itemType === 'number';
  const notClickable = props.notClickable === true || props.notClickable === 'true';
  
  const colWidth = Number(props.width || props.customWidth) || 90;
  const rowHeight = Math.round(colWidth * 1.11);
  const scale = colWidth / 90;
  
  // Arrange in grid (max 5 items per row)
  const itemsPerRow = 5;
  const numRows = Math.ceil(count / itemsPerRow);
  const numCols = Math.min(count, itemsPerRow);
  
  const svgWidth = numCols * colWidth + 20;
  const svgHeight = numRows * rowHeight + 20;
  
  let itemsMarkup = '';
  
  for (let idx = 0; idx < count; idx++) {
    const row = Math.floor(idx / itemsPerRow);
    const col = idx % itemsPerRow;
    const xOffset = 10 + col * colWidth;
    const yOffset = 10 + row * rowHeight;
    
    let graphicPaths = '';
    const isUrl = typeof itemType === 'string' && (
      itemType.startsWith('http://') || 
      itemType.startsWith('https://') || 
      itemType.startsWith('/') || 
      itemType.includes('/') || 
      itemType.includes('.')
    );

    if (hideImages) {
      graphicPaths = `
        <circle cx="45" cy="50" r="32" fill="#eff6ff" stroke="#3b82f6" stroke-width="2.5" />
        <text x="45" y="58" fill="#1d4ed8" font-size="24" font-weight="800" font-family='"Inter", sans-serif' text-anchor="middle" style="user-select: none; pointer-events: none;">${idx + 1}</text>
      `;
    } else if (isUrl) {
      graphicPaths = `
        <image href="${itemType}" x="15" y="15" width="60" height="70" preserveAspectRatio="xMidYMid meet" />
      `;
    } else if (itemType === 'cupcake') {
      graphicPaths = `
        <!-- Cupcake Wrapper -->
        <path d="M 25 75 L 30 95 L 60 95 L 65 75 Z" fill="#e2ba99" stroke="#b78560" stroke-width="2"/>
        <line x1="37" y1="75" x2="39" y2="95" stroke="#b78560" stroke-width="1.5"/>
        <line x1="45" y1="75" x2="45" y2="95" stroke="#b78560" stroke-width="1.5"/>
        <line x1="53" y1="75" x2="51" y2="95" stroke="#b78560" stroke-width="1.5"/>
        <!-- Frosting -->
        <path d="M 18 75 Q 45 50 72 75 Q 82 58 68 42 Q 45 30 22 42 Q 8 58 18 75 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="2"/>
        <path d="M 28 50 Q 45 38 62 50 Q 68 40 58 30 Q 45 22 32 30 Q 22 40 28 50 Z" fill="#fef9c3" stroke="#ca8a04" stroke-width="1.5"/>
        <!-- Cherry -->
        <circle cx="45" cy="23" r="8" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5" />
        <path d="M 45 15 Q 49 0 60 3" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round"/>
      `;
    } else if (itemType === 'apple') {
      graphicPaths = `
        <!-- Red apple body -->
        <path d="M 45 35 C 20 28 15 65 25 88 C 38 102 52 102 65 88 C 75 65 70 28 45 35 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="2"/>
        <!-- Stem -->
        <path d="M 45 35 C 45 20 52 15 52 15" fill="none" stroke="#78350f" stroke-width="2"/>
        <!-- Leaf -->
        <path d="M 45 25 C 52 22 58 28 52 32 Z" fill="#22c55e" stroke="#15803d" stroke-width="1.5"/>
      `;
    } else {
      // Default to Star
      graphicPaths = `
        <polygon points="45,15 55,38 80,41 61,59 65,84 45,71 25,84 29,59 10,41 35,38" fill="#fbbf24" stroke="#d97706" stroke-width="2"/>
      `;
    }
    
    let overlayMarkup = '';
    let clickAttr = '';
    let cursorStyle = '';

    if (!hideImages) {
      const visibility = showNumbers ? 'visible' : 'hidden';
      const numberText = showNumbers ? String(idx + 1) : '';
      
      if (!notClickable) {
        cursorStyle = 'style="cursor: pointer;"';
        clickAttr = `onclick="
          var svg = this.ownerSVGElement;
          if (!this.getAttribute('data-clicked')) {
            this.setAttribute('data-clicked', 'true');
            var seq = parseInt(svg.getAttribute('data-seq') || '0') + 1;
            svg.setAttribute('data-seq', seq);
            var lbl = this.querySelector('.lbl');
            var circ = this.querySelector('.circ');
            if (lbl &amp;&amp; circ) {
              lbl.textContent = seq;
              lbl.setAttribute('visibility', 'visible');
              circ.setAttribute('visibility', 'visible');
            }
          }
        "`;
      }
      
      overlayMarkup = `
        <!-- Counter overlay bubble -->
        <circle class="circ" cx="45" cy="55" r="15" fill="#3b82f6" stroke="#ffffff" stroke-width="2.5" visibility="${visibility}" style="pointer-events: none;" />
        <text class="lbl" x="45" y="60" fill="#ffffff" font-size="14" font-weight="800" font-family='&quot;Inter&quot;, sans-serif' text-anchor="middle" visibility="${visibility}" style="pointer-events: none;">${numberText}</text>
      `;
    }
    
    itemsMarkup += `
      <g transform="translate(${xOffset}, ${yOffset})" ${cursorStyle} ${clickAttr}>
        <!-- Background touch hitbox to click easily -->
        <rect x="0" y="0" width="${colWidth}" height="${rowHeight}" fill="transparent" />
        
        <g transform="scale(${scale})">
          <!-- Graphic -->
          ${graphicPaths}
          
          ${overlayMarkup}
        </g>
      </g>
    `;
  }
  
  return `
    <svg viewBox="0 0 ${svgWidth} ${svgHeight}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${numCols * colWidth}px; display: block; margin: 0 auto;" data-seq="0">
      ${SVG_DEFS}
      <g>
        ${itemsMarkup}
      </g>
    </svg>
  `.trim();
}
