/**
 * SVG Shape generator for dynamic shape learning
 */

const CURATED_COLORS = {
  green: '#ecfdf5',
  yellow: '#fefcbd',
  blue: '#f0f9ff',
  pink: '#fdf2f8',
  purple: '#f5f3ff',
  indigo: '#e0e7ff',
  red: '#fef2f2'
};

const SHAPE_DEFINITIONS = {
  circle: {
    sides: 0,
    corners: 0,
    isEqual: true,
    hasRightAngles: false,
    textDesc: 'circle',
    draw: (color) => `<circle cx="100" cy="100" r="75" fill="${color}" stroke="#0f172a" stroke-width="3" />`
  },
  square: {
    sides: 4,
    corners: 4,
    isEqual: true,
    hasRightAngles: true,
    textDesc: 'square',
    draw: (color) => `<rect x="25" y="25" width="150" height="150" fill="${color}" stroke="#0f172a" stroke-width="3" />`,
    getSideLabels: () => [
      { text: "1", x: 185, y: 100 },
      { text: "2", x: 100, y: 190 },
      { text: "3", x: 15, y: 100 },
      { text: "4", x: 100, y: 18 }
    ],
    getCornerLabels: () => [
      { text: "1", x: 185, y: 20, cx: 175, cy: 25 },
      { text: "2", x: 185, y: 185, cx: 175, cy: 175 },
      { text: "3", x: 15, y: 185, cx: 25, cy: 175 },
      { text: "4", x: 15, y: 20, cx: 25, cy: 25 }
    ],
    getRightAngleBrackets: () => `
      <path d="M 40,25 L 40,40 L 25,40" fill="none" stroke="#047857" stroke-width="2.5" />
      <path d="M 160,25 L 160,40 L 175,40" fill="none" stroke="#047857" stroke-width="2.5" />
      <path d="M 175,160 L 160,160 L 160,175" fill="none" stroke="#047857" stroke-width="2.5" />
      <path d="M 25,160 L 40,160 L 40,175" fill="none" stroke="#047857" stroke-width="2.5" />
    `
  },
  triangle: {
    sides: 3,
    corners: 3,
    isEqual: false, // In general triangle
    hasRightAngles: false,
    textDesc: 'triangle',
    draw: (color) => `<polygon points="100,25 25,175 175,175" fill="${color}" stroke="#0f172a" stroke-width="3" />`,
    getSideLabels: () => [
      { text: "1", x: 150, y: 95 },
      { text: "2", x: 100, y: 190 },
      { text: "3", x: 50, y: 95 }
    ],
    getCornerLabels: () => [
      { text: "1", x: 100, y: 15, cx: 100, cy: 25 },
      { text: "2", x: 185, y: 185, cx: 175, cy: 175 },
      { text: "3", x: 15, y: 185, cx: 25, cy: 175 }
    ]
  },
  rectangle: {
    sides: 4,
    corners: 4,
    isEqual: false, // 2 pairs of equal sides
    hasRightAngles: true,
    textDesc: 'rectangle',
    draw: (color) => `<rect x="15" y="45" width="170" height="110" fill="${color}" stroke="#0f172a" stroke-width="3" />`,
    getSideLabels: () => [
      { text: "1", x: 195, y: 100 },
      { text: "2", x: 100, y: 172 },
      { text: "3", x: 5, y: 100 },
      { text: "4", x: 100, y: 35 }
    ],
    getCornerLabels: () => [
      { text: "1", x: 195, y: 40, cx: 185, cy: 45 },
      { text: "2", x: 195, y: 165, cx: 185, cy: 155 },
      { text: "3", x: 5, y: 165, cx: 15, cy: 155 },
      { text: "4", x: 5, y: 40, cx: 15, cy: 45 }
    ],
    getRightAngleBrackets: () => `
      <path d="M 30,45 L 30,60 L 15,60" fill="none" stroke="#047857" stroke-width="2.5" />
      <path d="M 170,45 L 170,60 L 185,60" fill="none" stroke="#047857" stroke-width="2.5" />
      <path d="M 185,140 L 170,140 L 170,155" fill="none" stroke="#047857" stroke-width="2.5" />
      <path d="M 15,140 L 30,140 L 30,155" fill="none" stroke="#047857" stroke-width="2.5" />
    `
  },
  oval: {
    sides: 0,
    corners: 0,
    isEqual: true,
    hasRightAngles: false,
    textDesc: 'oval',
    draw: (color) => `<ellipse cx="100" cy="100" rx="85" ry="55" fill="${color}" stroke="#0f172a" stroke-width="3" />`
  },
  diamond: {
    sides: 4,
    corners: 4,
    isEqual: true,
    hasRightAngles: false,
    textDesc: 'diamond',
    draw: (color) => `<polygon points="100,15 180,100 100,185 20,100" fill="${color}" stroke="#0f172a" stroke-width="3" />`,
    getSideLabels: () => [
      { text: "1", x: 150, y: 50 },
      { text: "2", x: 150, y: 150 },
      { text: "3", x: 50, y: 150 },
      { text: "4", x: 50, y: 50 }
    ],
    getCornerLabels: () => [
      { text: "1", x: 100, y: 10, cx: 100, cy: 15 },
      { text: "2", x: 190, y: 100, cx: 180, cy: 100 },
      { text: "3", x: 100, y: 195, cx: 100, cy: 185 },
      { text: "4", x: 10, y: 100, cx: 20, cy: 100 }
    ]
  },
  pentagon: {
    sides: 5,
    corners: 5,
    isEqual: true,
    hasRightAngles: false,
    textDesc: 'pentagon',
    draw: (color) => `<polygon points="100,20 180,78 150,172 50,172 20,78" fill="${color}" stroke="#0f172a" stroke-width="3" />`,
    getSideLabels: () => [
      { text: "1", x: 150, y: 40 },
      { text: "2", x: 175, y: 125 },
      { text: "3", x: 100, y: 185 },
      { text: "4", x: 25, y: 125 },
      { text: "5", x: 50, y: 40 }
    ],
    getCornerLabels: () => [
      { text: "1", x: 100, y: 10, cx: 100, cy: 20 },
      { text: "2", x: 190, y: 73, cx: 180, cy: 78 },
      { text: "3", x: 160, y: 180, cx: 150, cy: 172 },
      { text: "4", x: 40, y: 180, cx: 50, cy: 172 },
      { text: "5", x: 10, y: 73, cx: 20, cy: 78 }
    ]
  },
  hexagon: {
    sides: 6,
    corners: 6,
    isEqual: true,
    hasRightAngles: false,
    textDesc: 'hexagon',
    draw: (color) => `<polygon points="100,15 175,58 175,142 100,185 25,142 25,58" fill="${color}" stroke="#0f172a" stroke-width="3" />`,
    getSideLabels: () => [
      { text: "1", x: 145, y: 30 },
      { text: "2", x: 185, y: 100 },
      { text: "3", x: 145, y: 170 },
      { text: "4", x: 55, y: 170 },
      { text: "5", x: 15, y: 100 },
      { text: "6", x: 55, y: 30 }
    ],
    getCornerLabels: () => [
      { text: "1", x: 100, y: 10, cx: 100, cy: 15 },
      { text: "2", x: 185, y: 53, cx: 175, cy: 58 },
      { text: "3", x: 185, y: 147, cx: 175, cy: 142 },
      { text: "4", x: 100, y: 195, cx: 100, cy: 185 },
      { text: "5", x: 15, y: 147, cx: 25, cy: 142 },
      { text: "6", x: 15, y: 53, cx: 25, cy: 58 }
    ]
  }
};

/**
 * Builds the SVG string based on shape configuration
 */
export function buildShapeSvg(shapeType, mode = 'plain', colorKey = 'green') {
  const shape = SHAPE_DEFINITIONS[shapeType] || SHAPE_DEFINITIONS.square;
  const color = CURATED_COLORS[colorKey] || CURATED_COLORS.green;

  let elements = [];
  elements.push(shape.draw(color));

  if (mode === 'sides' && typeof shape.getSideLabels === 'function') {
    const labels = shape.getSideLabels();
    labels.forEach(lbl => {
      // Draw a small background for number
      elements.push(`
        <circle cx="${lbl.x}" cy="${lbl.y - 4}" r="10" fill="#f8fafc" stroke="#0f172a" stroke-width="1" />
        <text x="${lbl.x}" y="${lbl.y}" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="900" fill="#047857" text-anchor="middle">${lbl.text}</text>
      `);
    });
  }

  if (mode === 'corners' && typeof shape.getCornerLabels === 'function') {
    const labels = shape.getCornerLabels();
    labels.forEach(lbl => {
      // Corner Green dot
      elements.push(`
        <circle cx="${lbl.cx}" cy="${lbl.cy}" r="5" fill="#10b981" stroke="#0f172a" stroke-width="1.5" />
        <circle cx="${lbl.x}" cy="${lbl.y - 4}" r="10" fill="#f8fafc" stroke="#0f172a" stroke-width="1" />
        <text x="${lbl.x}" y="${lbl.y}" font-family="Inter, system-ui, sans-serif" font-size="12" font-weight="900" fill="#047857" text-anchor="middle">${lbl.text}</text>
      `);
    });
  }

  if (mode === 'square_corners' && typeof shape.getRightAngleBrackets === 'function') {
    elements.push(shape.getRightAngleBrackets());
  }

  return `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 200px; display: block; margin: 0 auto;">
    ${elements.join('\n')}
  </svg>`;
}

export function getShapeInfo(shapeType) {
  return SHAPE_DEFINITIONS[shapeType] || SHAPE_DEFINITIONS.square;
}

export const SUPPORTED_SHAPES = Object.keys(SHAPE_DEFINITIONS);
export const CURATED_COLOR_KEYS = Object.keys(CURATED_COLORS);
