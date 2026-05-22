const escapeXml = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

export const INDIAN_PLACES = [
  { key: 'crore', label: 'Crores', value: 10000000 },
  { key: 'tenLakh', label: 'Ten Lakhs', value: 1000000 },
  { key: 'lakh', label: 'Lakhs', value: 100000 },
  { key: 'tenThousand', label: 'Ten Thousands', value: 10000 },
  { key: 'thousand', label: 'Thousands', value: 1000 },
  { key: 'hundred', label: 'Hundreds', value: 100 },
  { key: 'ten', label: 'Tens', value: 10 },
  { key: 'one', label: 'Ones', value: 1 },
];

export const INTERNATIONAL_PLACES = [
  { key: 'hundredMillion', label: 'Hundred Millions', value: 100000000 },
  { key: 'tenMillion', label: 'Ten Millions', value: 10000000 },
  { key: 'million', label: 'Millions', value: 1000000 },
  { key: 'hundredThousand', label: 'Hundred Thousands', value: 100000 },
  { key: 'tenThousand', label: 'Ten Thousands', value: 10000 },
  { key: 'thousand', label: 'Thousands', value: 1000 },
  { key: 'hundred', label: 'Hundreds', value: 100 },
  { key: 'ten', label: 'Tens', value: 10 },
  { key: 'one', label: 'Ones', value: 1 },
];

export function formatIndianNumber(number) {
  const raw = String(Math.trunc(Math.abs(Number(number))));
  if (raw.length <= 3) return raw;
  const lastThree = raw.slice(-3);
  const rest = raw.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',');
  return `${rest},${lastThree}`;
}

export function formatInternationalNumber(number) {
  return String(Math.trunc(Math.abs(Number(number)))).replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

export function buildPlaceValueChartSvg(number, options = {}) {
  const places = options.system === 'international' ? INTERNATIONAL_PLACES : INDIAN_PLACES;
  const digits = String(Math.trunc(Math.abs(Number(number)))).padStart(places.length, '0').slice(-places.length);
  const cellWidth = 104;
  const width = cellWidth * places.length + 24;
  const height = 176;
  const highlightKey = options.highlightPlace || null;

  const cells = places
    .map((place, index) => {
      const x = 12 + index * cellWidth;
      const highlighted = place.key === highlightKey;
      return `
        <g>
          <rect x="${x}" y="18" width="${cellWidth}" height="68" fill="${highlighted ? '#dcfce7' : '#eff6ff'}" stroke="${highlighted ? '#16a34a' : '#93c5fd'}" stroke-width="${highlighted ? 3 : 1.5}" />
          <text x="${x + cellWidth / 2}" y="44" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="800" fill="#334155">${escapeXml(place.label)}</text>
          <text x="${x + cellWidth / 2}" y="70" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="12" font-weight="700" fill="#64748b">${escapeXml(formatIndianNumber(place.value))}</text>
          <rect x="${x}" y="86" width="${cellWidth}" height="70" fill="#ffffff" stroke="${highlighted ? '#16a34a' : '#cbd5e1'}" stroke-width="${highlighted ? 3 : 1.5}" />
          <text x="${x + cellWidth / 2}" y="131" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="34" font-weight="900" fill="#0f172a">${digits[index]}</text>
        </g>`;
    })
    .join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;">
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="#ffffff" stroke="#e2e8f0" />
    ${cells}
  </svg>`;
}

export function buildCommaGroupingSvg(number, system = 'indian') {
  const formatted = system === 'international' ? formatInternationalNumber(number) : formatIndianNumber(number);
  const chunks = formatted.split(',');
  const colors = ['#f97316', '#06b6d4', '#8b5cf6', '#22c55e', '#f59e0b'];
  const width = Math.max(360, chunks.length * 130 + 60);
  const chunkWidth = (width - 80) / chunks.length;

  const groups = chunks
    .map((chunk, index) => {
      const x = 40 + index * chunkWidth;
      const label = system === 'indian'
        ? ['crore/lakh group', 'lakh group', 'thousand group', 'ones group'].slice(-chunks.length)[index]
        : ['millions group', 'thousands group', 'ones group'].slice(-chunks.length)[index];
      return `
        <g>
          <rect x="${x}" y="38" width="${chunkWidth - 10}" height="74" rx="14" fill="${colors[index % colors.length]}" opacity="0.13" stroke="${colors[index % colors.length]}" stroke-width="2" />
          <text x="${x + (chunkWidth - 10) / 2}" y="83" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="32" font-weight="900" fill="#0f172a">${escapeXml(chunk)}</text>
          <text x="${x + (chunkWidth - 10) / 2}" y="137" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800" fill="#475569">${escapeXml(label)}</text>
        </g>`;
    })
    .join('');

  return `<svg width="${width}" height="166" viewBox="0 0 ${width} 166" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;">
    <rect x="1" y="1" width="${width - 2}" height="164" rx="18" fill="#ffffff" stroke="#e2e8f0" />
    ${groups}
  </svg>`;
}

export function buildMagnitudeBarsSvg(values = []) {
  const normalized = values.map((item) => ({
    ...item,
    value: Number(item.value),
  }));
  const max = Math.max(...normalized.map((item) => item.value), 1);
  const width = 620;
  const rowHeight = 48;
  const height = 34 + normalized.length * rowHeight;
  const rows = normalized
    .map((item, index) => {
      const barWidth = Math.max(18, Math.round((item.value / max) * 380));
      const y = 24 + index * rowHeight;
      return `
        <text x="28" y="${y + 24}" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#334155">${escapeXml(item.label)}</text>
        <rect x="190" y="${y + 7}" width="390" height="24" rx="12" fill="#f1f5f9" />
        <rect x="190" y="${y + 7}" width="${barWidth}" height="24" rx="12" fill="${item.color || '#38bdf8'}" />
        <text x="${Math.min(570, 200 + barWidth)}" y="${y + 25}" font-family="Inter, Arial, sans-serif" font-size="13" font-weight="900" fill="#0f172a">${escapeXml(item.formatted || formatIndianNumber(item.value))}</text>`;
    })
    .join('');

  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;">
    <rect x="1" y="1" width="${width - 2}" height="${height - 2}" rx="18" fill="#ffffff" stroke="#e2e8f0" />
    ${rows}
  </svg>`;
}

export function buildNumberLineRoundingSvg({ number, lower, upper, midpoint, rounded, label }) {
  const width = 640;
  const xFor = (value) => 70 + ((value - lower) / (upper - lower)) * 500;
  const dotX = Math.max(70, Math.min(570, xFor(number)));
  const midX = xFor(midpoint);

  return `<svg width="${width}" height="178" viewBox="0 0 ${width} 178" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;">
    <rect x="1" y="1" width="${width - 2}" height="176" rx="18" fill="#ffffff" stroke="#e2e8f0" />
    <text x="320" y="34" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="17" font-weight="900" fill="#0f172a">${escapeXml(label || 'Nearest benchmark')}</text>
    <line x1="70" y1="92" x2="570" y2="92" stroke="#94a3b8" stroke-width="5" stroke-linecap="round" />
    <line x1="${midX}" y1="74" x2="${midX}" y2="110" stroke="#f97316" stroke-width="3" stroke-dasharray="6 5" />
    <circle cx="${dotX}" cy="92" r="13" fill="#2563eb" />
    <text x="${dotX}" y="67" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="900" fill="#2563eb">${escapeXml(formatIndianNumber(number))}</text>
    <text x="70" y="137" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#475569">${escapeXml(formatIndianNumber(lower))}</text>
    <text x="${midX}" y="137" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#f97316">${escapeXml(formatIndianNumber(midpoint))}</text>
    <text x="570" y="137" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="15" font-weight="800" fill="#475569">${escapeXml(formatIndianNumber(upper))}</text>
    <text x="320" y="164" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="800" fill="#16a34a">Rounds to ${escapeXml(formatIndianNumber(rounded))}</text>
  </svg>`;
}

export function buildButtonMachineSvg(number) {
  const buttons = ['+1', '+10', '+100', '+1000', '+10000', '+100000'];
  const buttonSvg = buttons
    .map((button, index) => {
      const x = 30 + (index % 3) * 135;
      const y = 92 + Math.floor(index / 3) * 54;
      return `
        <rect x="${x}" y="${y}" width="112" height="38" rx="10" fill="#eff6ff" stroke="#60a5fa" stroke-width="2" />
        <text x="${x + 56}" y="${y + 25}" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="16" font-weight="900" fill="#1d4ed8">${escapeXml(button)}</text>`;
    })
    .join('');

  return `<svg width="460" height="230" viewBox="0 0 460 230" fill="none" xmlns="http://www.w3.org/2000/svg" style="max-width:100%;height:auto;display:block;">
    <rect x="1" y="1" width="458" height="228" rx="22" fill="#ffffff" stroke="#e2e8f0" />
    <rect x="30" y="28" width="400" height="46" rx="12" fill="#0f172a" />
    <text x="230" y="59" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="900" fill="#ffffff">${escapeXml(formatIndianNumber(number))}</text>
    ${buttonSvg}
  </svg>`;
}
