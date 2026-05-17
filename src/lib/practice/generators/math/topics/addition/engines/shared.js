let _uid = 0;

export const uid = () => `addition_topic_${Date.now()}_${++_uid}`;

export function createSeededRandom(seedInput = 'addition-topic') {
  const str = String(seedInput);
  let seed = 0;
  for (let i = 0; i < str.length; i += 1) {
    seed = (seed * 31 + str.charCodeAt(i)) % 2147483647;
  }
  if (seed <= 0) seed += 2147483646;
  return () => {
    seed = (seed * 48271) % 2147483647;
    return seed / 2147483647;
  };
}

export const randInt = (min, max, random) => Math.floor(random() * (max - min + 1)) + min;

export function normalizeRange(range = [1, 10]) {
  if (Array.isArray(range)) {
    return { min: Number(range[0] ?? 1), max: Number(range[1] ?? 10) };
  }
  return {
    min: Number(range.min ?? 1),
    max: Number(range.max ?? 10)
  };
}

export function cubeWord(count) {
  return count === 1 ? 'cube' : 'cubes';
}

export function buildCubeTrainSvg({
  firstCount,
  secondCount,
  firstColor = '#fbbf24',
  firstAccent = '#d97706',
  secondColor = '#3b82f6',
  secondAccent = '#1d4ed8',
  large = false,
  showFrame = true
}) {
  const cubeW = large ? 64 : 56;
  const cubeH = large ? 58 : 52;
  const gap = 2;
  const total = firstCount + secondCount;
  const rowWidth = Math.max(420, 28 + total * cubeW + Math.max(0, total - 1) * gap + 28);
  const startX = 24;
  const startY = large ? 18 : 20;

  const renderCube = (x, y, fill, accent) => `
    <g transform="translate(${x}, ${y})">
      <rect x="0" y="0" width="${cubeW}" height="${cubeH}" rx="8" fill="${fill}" />
      <rect x="0" y="0" width="${cubeW}" height="${cubeH}" rx="8" fill="#ffffff" opacity="0.12" />
      <rect x="${cubeW - 10}" y="10" width="10" height="${cubeH - 18}" rx="2" fill="${accent}" opacity="0.45" />
      <circle cx="${cubeW / 2}" cy="${cubeH / 2}" r="${large ? 16 : 14}" fill="#000" opacity="0.10" />
      <circle cx="${cubeW / 2}" cy="${cubeH / 2}" r="${large ? 13 : 12}" fill="#ffffff" opacity="0.16" />
      <circle cx="${cubeW / 2}" cy="${cubeH / 2}" r="${large ? 10 : 9}" fill="#000" opacity="0.06" />
    </g>
  `;

  const cubes = [
    ...Array.from({ length: firstCount }).map((_, idx) => renderCube(startX + idx * (cubeW + gap), startY, firstColor, firstAccent)),
    ...Array.from({ length: secondCount }).map((_, idx) => renderCube(startX + (firstCount + idx) * (cubeW + gap), startY, secondColor, secondAccent))
  ].join('');

  return `
    <svg width="${rowWidth}" height="${large ? 112 : 96}" viewBox="0 0 ${rowWidth} ${large ? 112 : 96}" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:100%;height:auto;display:block;">
      ${showFrame ? `<rect x="1.5" y="1.5" width="${rowWidth - 3}" height="${large ? 108 : 92}" rx="12" fill="#ffffff" stroke="#bfe8ff" stroke-width="3" />` : ''}
      ${cubes}
    </svg>
  `.trim();
}
