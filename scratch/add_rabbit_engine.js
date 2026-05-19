const fs = require('fs');
const path = require('path');

// 1. Read original rabbit paths
const originalSvgPath = '/Users/vijay/Desktop/antigravity/new wexls/public/images/rabbit.svg';
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

console.log(`Parsed ${originalPaths.length} paths from rabbit.svg`);

// Build the renderRabbit helper string
const renderRabbitFunction = `
function renderRabbit({ x, y, color }) {
  const paths = [
${originalPaths.map(p => {
  let fill = p.fill;
  // Replace standard cream fill with dynamic color
  if (p.fill === '#FAF1E1') {
    fill = '\${color}';
  }
  return `    \`<path d="${p.d}" fill="${fill}" />\``;
}).join(',\n')}
  ].join('');

  // Center rabbit at (x, y) with a scale of 0.045
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

// Modify SHAPES to include rabbit
const shapesTarget = `const SHAPES = [
  { id: 'dot', singular: 'dot', plural: 'dots', color: '#7c6ee6' },
  { id: 'triangle', singular: 'triangle', plural: 'triangles', color: '#079145' },
  { id: 'circle', singular: 'circle', plural: 'circles', color: '#5fba2d' },
];`;

const shapesReplacement = `const SHAPES = [
  { id: 'dot', singular: 'dot', plural: 'dots', color: '#7c6ee6' },
  { id: 'triangle', singular: 'triangle', plural: 'triangles', color: '#079145' },
  { id: 'circle', singular: 'circle', plural: 'circles', color: '#5fba2d' },
  { id: 'rabbit', singular: 'rabbit', plural: 'rabbits', color: '#FAF1E1' },
];`;

engineContent = engineContent.replace(shapesTarget, shapesReplacement);

// Insert renderRabbitFunction before renderItem
const renderItemTarget = `function renderItem({ x, y, shape, color, label }) {`;
const renderItemReplacement = `${renderRabbitFunction}\nfunction renderItem({ x, y, shape, color, label }) {
  if (shape === 'rabbit') {
    return renderRabbit({ x, y, color });
  }`;

engineContent = engineContent.replace(renderItemTarget, renderItemReplacement);

// Save back
fs.writeFileSync(enginePath, engineContent, 'utf8');
console.log('Successfully added rabbit to visualGroups.engine.js!');
