import { SVG_DEFS } from './defs.js';

export function renderCalendar(props) {
  const month = props.month || 'October';
  const daysInMonth = Math.max(28, Math.min(31, Number(props.daysInMonth) || 31));
  const startDay = Math.max(0, Math.min(6, Number(props.startDay) || 2)); // 0 = Sunday, 6 = Saturday
  const highlightDays = props.highlightDays ? String(props.highlightDays).split(',').map(Number).filter(n => !isNaN(n)) : [];

  const width = 360;
  const headerHeight = 45;
  const daysHeaderHeight = 30;
  const cellWidth = 46;
  const cellHeight = 36;
  const paddingX = 19;
  
  // Max weeks in a month can be 6
  const totalCells = startDay + daysInMonth;
  const weeksCount = Math.ceil(totalCells / 7);
  const gridHeight = weeksCount * cellHeight;
  
  const height = headerHeight + daysHeaderHeight + gridHeight + 25;

  // Render Month Name
  let calendarMarkup = `
    <!-- Top Month Header Background -->
    <path d="M 10 10 L 350 10 A 12 12 0 0 1 350 50 L 10 50 A 12 12 0 0 1 10 10 Z" fill="#eff6ff" stroke="#cbd5e1" stroke-width="1.5" />
    <text x="${width / 2}" y="${34}" font-family="system-ui, sans-serif" font-size="16px" font-weight="900" fill="#1e3a8a" text-anchor="middle">${month}</text>
  `;

  // Render Weekday Labels (S, M, T, W, T, F, S)
  const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  const dayY = headerHeight + 20;

  for (let i = 0; i < 7; i++) {
    const x = paddingX + i * cellWidth + cellWidth / 2;
    calendarMarkup += `
      <text x="${x}" y="${dayY}" font-family="system-ui, sans-serif" font-size="12px" font-weight="800" fill="#64748b" text-anchor="middle">${weekdays[i]}</text>
    `;
  }

  // Render Days Grid
  let daysMarkup = '';
  let dayNum = 1;
  const startY = headerHeight + daysHeaderHeight + 10;

  for (let w = 0; w < weeksCount; w++) {
    for (let d = 0; d < 7; d++) {
      const cellIdx = w * 7 + d;
      
      if (cellIdx >= startDay && dayNum <= daysInMonth) {
        const x = paddingX + d * cellWidth;
        const y = startY + w * cellHeight;
        const isHighlighted = highlightDays.includes(dayNum);

        const circleFill = isHighlighted ? '#f87171' : 'none';
        const textWeight = isHighlighted ? '900' : '700';
        const textCol = isHighlighted ? '#ffffff' : '#334155';

        daysMarkup += `
          <g>
            <rect x="${x}" y="${y}" width="${cellWidth}" height="${cellHeight}" fill="none" />
            ${isHighlighted ? `
              <circle cx="${x + cellWidth / 2}" cy="${y + cellHeight / 2 - 2}" r="14" fill="${circleFill}" filter="url(#shadow)" />
            ` : ''}
            <text x="${x + cellWidth / 2}" y="${y + cellHeight / 2 + 3}" font-family="system-ui, sans-serif" font-size="12px" font-weight="${textWeight}" fill="${textCol}" text-anchor="middle" style="user-select: none;">
              ${dayNum}
            </text>
          </g>
        `;
        dayNum++;
      }
    }
  }

  return `
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 360px; display: block; margin: 10px auto;" filter="url(#shadow)">
      ${SVG_DEFS}
      <!-- Calendar Backing Card -->
      <rect x="10" y="10" width="${width - 20}" height="${height - 20}" rx="12" fill="#ffffff" stroke="#cbd5e1" stroke-width="1.5" />
      
      ${calendarMarkup}
      ${daysMarkup}
    </svg>
  `.trim();
}
