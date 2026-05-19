const fs = require('fs');
const path = require('path');

// 1. Read original penguin paths
const originalSvgPath = '/Users/vijay/Desktop/antigravity/new wexls/public/images/penguin.svg';
const originalContent = fs.readFileSync(originalSvgPath, 'utf8');

const pathRegex = /<path\s+[^>]*d="([^"]+)"[^>]*fill="([^"]+)"[^>]*\/>/g;
let match;
const originalPaths = [];
while ((match = pathRegex.exec(originalContent)) !== null) {
  originalPaths.push({
    d: match[1],
    fill: match[2]
  });
}

console.log(`Parsed ${originalPaths.length} paths from penguin.svg`);

// Build the renderPenguin helper string
const renderPenguinFunction = `
function renderPenguin({ x, y, color }) {
  const paths = [
${originalPaths.map(p => {
  let fill = p.fill;
  // Replace base blue/body color with dynamic color if needed, or keep original rich colorful styling!
  // Let's replace the light blue fill (#3D96C8) with dynamic color!
  if (p.fill === '#3D96C8') {
    fill = '\${color}';
  }
  return `    \`<path d="${p.d}" fill="${fill}" />\``;
}).join(',\n')}
  ].join('');

  // Center penguin at (x, y) with a scale of 0.045
  return \`
    <g transform="translate(\${x - 23} \${y - 23}) scale(0.045)">
      \${paths}
    </g>
  \`;
}
`;

// 2. Read visualGroups.engine.js
const enginePath = '/Users/vijay/Desktop/antigravity/new wexls/src/lib/practice/generators/math/topics/multiplication/engines/visualGroups.engine.js';
let engineContent = fs.readFileSync(enginePath, 'utf8');

// Modify SHAPES to include penguin
const shapesTarget = `const SHAPES = [
  { id: 'dot', singular: 'dot', plural: 'dots', color: '#7c6ee6' },
  { id: 'triangle', singular: 'triangle', plural: 'triangles', color: '#079145' },
  { id: 'circle', singular: 'circle', plural: 'circles', color: '#5fba2d' },
  { id: 'rabbit', singular: 'rabbit', plural: 'rabbits', color: '#FAF1E1' },
];`;

const shapesReplacement = `const SHAPES = [
  { id: 'dot', singular: 'dot', plural: 'dots', color: '#7c6ee6' },
  { id: 'triangle', singular: 'triangle', plural: 'triangles', color: '#079145' },
  { id: 'circle', singular: 'circle', plural: 'circles', color: '#5fba2d' },
  { id: 'rabbit', singular: 'rabbit', plural: 'rabbits', color: '#FAF1E1' },
  { id: 'penguin', singular: 'penguin', plural: 'penguins', color: '#3d96c8' },
];`;

engineContent = engineContent.replace(shapesTarget, shapesReplacement);

// Insert renderPenguinFunction before renderItem
const renderItemTarget = `function renderItem({ x, y, shape, color, label }) {`;
const renderItemReplacement = `${renderPenguinFunction}\nfunction renderItem({ x, y, shape, color, label }) {
  if (shape === 'penguin') {
    return renderPenguin({ x, y, color });
  }`;

engineContent = engineContent.replace(renderItemTarget, renderItemReplacement);

// Save back
fs.writeFileSync(enginePath, engineContent, 'utf8');
console.log('Successfully added penguin to visualGroups.engine.js!');
