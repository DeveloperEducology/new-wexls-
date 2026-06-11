import { SVG_DEFS } from './defs.js';

export function renderAnalogClock(props) {
  const initialHour = Math.max(1, Math.min(12, Number(props.hour) || 12));
  const initialMinute = Math.max(0, Math.min(59, Number(props.minute) || 0));
  const interactive = props.interactive === true || props.interactive === 'true' || props.interactive === 1;

  const width = 240;
  const extraHeight = interactive ? 60 : 0;
  const height = width + extraHeight;
  const cx = width / 2;
  const cy = width / 2;
  const r = width / 2 - 15;

  // Calculate angles
  // Minute hand: 6 deg per minute
  // Hour hand: 30 deg per hour + 0.5 deg per minute
  const getAngles = (h, m) => {
    const minAngle = m * 6;
    const hrAngle = (h % 12) * 30 + m * 0.5;
    return { hrAngle, minAngle };
  };

  const { hrAngle, minAngle } = getAngles(initialHour, initialMinute);

  // Draw hour markers (1 to 12)
  let markers = '';
  for (let i = 1; i <= 12; i++) {
    const angleRad = (i * 30 * Math.PI) / 180 - Math.PI / 2;
    const mx = cx + (r - 18) * Math.cos(angleRad);
    const my = cy + (r - 18) * Math.sin(angleRad);

    markers += `
      <text x="${mx}" y="${my + 4}" font-family="system-ui, sans-serif" font-size="14px" font-weight="900" fill="#1e293b" text-anchor="middle" style="user-select: none;">
        ${i}
      </text>
    `;

    // Minor minute ticks
    for (let j = 1; j < 5; j++) {
      const minAngleRad = ((i * 30 - j * 6) * Math.PI) / 180 - Math.PI / 2;
      const tx1 = cx + (r - 6) * Math.cos(minAngleRad);
      const ty1 = cy + (r - 6) * Math.sin(minAngleRad);
      const tx2 = cx + r * Math.cos(minAngleRad);
      const ty2 = cy + r * Math.sin(minAngleRad);
      markers += `<line x1="${tx1}" y1="${ty1}" x2="${tx2}" y2="${ty2}" stroke="#94a3b8" stroke-width="1.5" />`;
    }
  }

  let controls = '';
  if (interactive) {
    const btnY = width + 10;
    const btnH = 34;

    controls = `
      <!-- Time state holders -->
      <g id="clock-state" data-hour="${initialHour}" data-min="${initialMinute}"></g>
      
      <!-- Hour Adjust buttons -->
      <g style="cursor: pointer;" onclick="
        var state = this.parentNode.querySelector('#clock-state');
        var h = parseInt(state.getAttribute('data-hour'));
        var m = parseInt(state.getAttribute('data-min'));
        
        h = h === 12 ? 1 : h + 1;
        state.setAttribute('data-hour', h);
        
        var hrHand = this.ownerSVGElement.querySelector('.hour-hand');
        var hrAngle = (h % 12) * 30 + m * 0.5;
        hrHand.setAttribute('transform', 'rotate(' + hrAngle + ', ${cx}, ${cy})');
        
        var timeStr = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
        var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
        if (input) {
          input.value = timeStr;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      ">
        <rect x="15" y="${btnY}" width="95" height="${btnH}" rx="8" fill="#3b82f6" stroke="#2563eb" stroke-width="1" />
        <text x="62.5" y="${btnY + btnH/2 + 5}" font-family="system-ui, sans-serif" font-size="11px" font-weight="800" fill="#ffffff" text-anchor="middle" style="user-select: none;">+1 Hour</text>
      </g>
      
      <!-- Minute Adjust buttons -->
      <g style="cursor: pointer;" onclick="
        var state = this.parentNode.querySelector('#clock-state');
        var h = parseInt(state.getAttribute('data-hour'));
        var m = parseInt(state.getAttribute('data-min'));
        
        m = (m + 5) % 60;
        if (m === 0) {
          h = h === 12 ? 1 : h + 1;
          state.setAttribute('data-hour', h);
        }
        state.setAttribute('data-min', m);
        
        var hrHand = this.ownerSVGElement.querySelector('.hour-hand');
        var minHand = this.ownerSVGElement.querySelector('.minute-hand');
        
        var hrAngle = (h % 12) * 30 + m * 0.5;
        var minAngle = m * 6;
        
        hrHand.setAttribute('transform', 'rotate(' + hrAngle + ', ${cx}, ${cy})');
        minHand.setAttribute('transform', 'rotate(' + minAngle + ', ${cx}, ${cy})');
        
        var timeStr = (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m);
        var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
        if (input) {
          input.value = timeStr;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      ">
        <rect x="130" y="${btnY}" width="95" height="${btnH}" rx="8" fill="#10b981" stroke="#059669" stroke-width="1" />
        <text x="177.5" y="${btnY + btnH/2 + 5}" font-family="system-ui, sans-serif" font-size="11px" font-weight="800" fill="#ffffff" text-anchor="middle" style="user-select: none;">+5 Mins</text>
      </g>
    `;
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: ${width}px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      
      <!-- Outer clock body -->
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="#f8fafc" stroke="#cbd5e1" stroke-width="6" filter="url(#shadow)" />
      <circle cx="${cx}" cy="${cy}" r="${r - 8}" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      
      <!-- Hour markings -->
      ${markers}
      
      <!-- Hands -->
      <g>
        <!-- Hour Hand (Shorter, Thicker) -->
        <line class="hour-hand" x1="${cx}" y1="${cy + 8}" x2="${cx}" y2="${cy - r + 38}" stroke="#0f172a" stroke-width="5" stroke-linecap="round" transform="rotate(${hrAngle}, ${cx}, ${cy})" />
        
        <!-- Minute Hand (Longer, Thinner) -->
        <line class="minute-hand" x1="${cx}" y1="${cy + 12}" x2="${cx}" y2="${cy - r + 18}" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" transform="rotate(${minAngle}, ${cx}, ${cy})" />
        
        <!-- Pin center -->
        <circle cx="${cx}" cy="${cy}" r="6" fill="#0f172a" />
        <circle cx="${cx}" cy="${cy}" r="2.5" fill="#facc15" />
      </g>
      
      ${controls}
    </svg>
  `.trim();
}
