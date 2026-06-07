export function drawVisualChoicePanel(itemCount, itemType = 'cupcake') {
  const count = Number(itemCount) || 1;
  const panelW = 220;
  const panelH = 180;
  const padding = 12;

  // Max 3 per row
  const itemW = 60;
  const itemH = 68;
  const itemsPerRow = Math.min(count, 3);
  const numRows = Math.ceil(count / itemsPerRow);

  // Center the grid inside the panel
  const gridW = itemsPerRow * itemW;
  const gridH = numRows * itemH;
  const startX = Math.max(padding, (panelW - gridW) / 2);
  const startY = Math.max(padding, (panelH - gridH) / 2);

  // Determine if itemType is a URL
  const isUrl = typeof itemType === 'string' && (
    itemType.startsWith('http://') ||
    itemType.startsWith('https://') ||
    itemType.startsWith('/') ||
    (itemType.includes('/') && !itemType.includes(',')) ||
    (itemType.includes('.') && !itemType.includes(',') && !itemType.includes(' '))
  );

  function getGraphicPaths() {
    if (isUrl) {
      return `<image href="${itemType}" x="4" y="4" width="52" height="60" preserveAspectRatio="xMidYMid meet" />`;
    } else if (itemType === 'cupcake') {
      return `
        <path d="M 16 55 L 20 68 L 44 68 L 48 55 Z" fill="#e2ba99" stroke="#b78560" stroke-width="1.5"/>
        <path d="M 10 55 Q 30 37 52 55 Q 60 42 48 31 Q 30 22 12 31 Q 0 42 10 55 Z" fill="#fef08a" stroke="#ca8a04" stroke-width="1.5"/>
        <circle cx="30" cy="16" r="6" fill="#ef4444" stroke="#b91c1c" stroke-width="1" />
        <path d="M 30 10 Q 33 1 42 3" fill="none" stroke="#22c55e" stroke-width="1.5" stroke-linecap="round"/>
      `;
    } else if (itemType === 'apple') {
      return `
        <path d="M 30 24 C 12 18 8 50 16 66 C 26 78 34 78 44 66 C 52 50 48 18 30 24 Z" fill="#ef4444" stroke="#b91c1c" stroke-width="1.5"/>
        <path d="M 30 24 C 30 12 36 8 36 8" fill="none" stroke="#78350f" stroke-width="1.5"/>
        <path d="M 30 16 C 36 14 40 20 36 22 Z" fill="#22c55e" stroke="#15803d" stroke-width="1"/>
      `;
    } else {
      return `<polygon points="30,6 38,24 58,26 44,40 48,60 30,50 12,60 16,40 2,26 22,24" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/>`;
    }
  }

  let itemsMarkup = '';
  for (let idx = 0; idx < count; idx++) {
    const row = Math.floor(idx / itemsPerRow);
    const col = idx % itemsPerRow;
    const x = startX + col * itemW;
    const y = startY + row * itemH;
    itemsMarkup += `<g transform="translate(${x}, ${y})">${getGraphicPaths()}</g>`;
  }

  // Use width="100%" so it fills the container, constrained by viewBox aspect ratio
  return `<svg viewBox="0 0 ${panelW} ${panelH}" width="100%" height="auto" xmlns="http://www.w3.org/2000/svg" style="display:block;">${itemsMarkup}</svg>`;
}
