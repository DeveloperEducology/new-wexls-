import { FLAT_COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderFractionCircle(props, rng) {
  const denominator = Math.max(1, Number(props.denominator) || 4);
  const numerator = Math.max(0, Math.min(denominator, Number(props.numerator) || 1));
  const interactive = props.interactive === true || props.interactive === 'true' || props.interactive === 1 || props.clickToFill === true || props.clickToFill === 'true';

  const theme = resolveColor(props.color, FLAT_COLORS, rng);

  const width = 200;
  const height = 200;
  const cx = width / 2;
  const cy = height / 2;
  const radius = 80;

  let sectors = '';

  for (let i = 0; i < denominator; i++) {
    const angle1 = (i * 2 * Math.PI) / denominator - Math.PI / 2;
    const angle2 = ((i + 1) * 2 * Math.PI) / denominator - Math.PI / 2;

    const x1 = cx + radius * Math.cos(angle1);
    const y1 = cy + radius * Math.sin(angle1);
    const x2 = cx + radius * Math.cos(angle2);
    const y2 = cy + radius * Math.sin(angle2);

    const isShaded = i < numerator;
    const fill = isShaded ? theme.fill : '#ffffff';
    const stroke = isShaded ? theme.stroke : '#94a3b8';
    const strokeWidth = isShaded ? 3.5 : 1.5;

    const clickAttr = interactive ? `
      style="cursor: pointer;"
      data-filled="${isShaded ? 'true' : 'false'}"
      onclick="
        var isFilled = this.getAttribute('data-filled') === 'true';
        if (isFilled) {
          this.setAttribute('data-filled', 'false');
          this.setAttribute('fill', '#ffffff');
          this.setAttribute('stroke', '#94a3b8');
          this.setAttribute('stroke-width', '1.5');
        } else {
          this.setAttribute('data-filled', 'true');
          this.setAttribute('fill', '${theme.fill}');
          this.setAttribute('stroke', '${theme.stroke}');
          this.setAttribute('stroke-width', '3.5');
        }
        var svg = this.ownerSVGElement;
        var filled = svg.querySelectorAll('[data-filled=true]').length;
        var input = document.querySelector('.responsive-input input') || document.querySelector('input[type=text]') || document.getElementById('ans') || document.querySelector('input');
        if (input) {
          input.value = filled;
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      "
    ` : '';

    if (denominator === 1) {
      sectors += `
        <circle cx="${cx}" cy="${cy}" r="${radius}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${clickAttr} />
      `;
    } else {
      sectors += `
        <path d="M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 0 1 ${x2} ${y2} Z" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" ${clickAttr} />
      `;
    }
  }

  const outerBorder = `
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none" stroke="#475569" stroke-width="2.5" style="pointer-events: none;" />
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 200px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <g>
        ${sectors}
        ${outerBorder}
      </g>
    </svg>
  `.trim();
}
