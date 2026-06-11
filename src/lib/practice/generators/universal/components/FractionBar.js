import { FLAT_COLORS, SVG_DEFS, resolveColor } from './defs.js';

export function renderFractionBar(props, rng) {
  const denominator = Math.max(1, Number(props.denominator) || 4);
  const numerator = Math.max(0, Math.min(denominator, Number(props.numerator) || 1));
  const interactive = props.interactive === true || props.interactive === 'true' || props.interactive === 1 || props.clickToFill === true || props.clickToFill === 'true';

  const theme = resolveColor(props.color, FLAT_COLORS, rng);

  const width = 400;
  const height = 80;
  const padding = 15;
  const barWidth = width - padding * 2;
  const barHeight = height - padding * 2;
  
  const cellWidth = barWidth / denominator;

  let cells = '';

  for (let i = 0; i < denominator; i++) {
    const x = padding + i * cellWidth;
    const y = padding;
    const isShaded = i < numerator;

    const initialFill = isShaded ? theme.fill : '#ffffff';
    const initialStroke = isShaded ? theme.stroke : '#94a3b8';
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

    cells += `
      <rect x="${x}" y="${y}" width="${cellWidth}" height="${barHeight}" fill="${initialFill}" stroke="${initialStroke}" stroke-width="${strokeWidth}" ${clickAttr} />
    `;
  }

  const outerBorder = `
    <rect x="${padding}" y="${padding}" width="${barWidth}" height="${barHeight}" fill="none" stroke="#475569" stroke-width="2.5" rx="4" style="pointer-events: none;" />
  `;

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 400px; display: block; margin: 10px auto;">
      ${SVG_DEFS}
      <g>
        ${cells}
        ${outerBorder}
      </g>
    </svg>
  `.trim();
}
