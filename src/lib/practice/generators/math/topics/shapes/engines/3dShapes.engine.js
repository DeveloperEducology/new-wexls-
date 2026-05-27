class SeededRandom {
  constructor(seed) {
    this.seed = typeof seed === 'number' ? seed : parseInt(seed) || Date.now();
  }
  next() {
    this.seed = (this.seed * 9301 + 49297) % 233280;
    return this.seed / 233280;
  }
  int(min, max) {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }
  pick(arr) {
    return arr[this.int(0, arr.length - 1)];
  }
}

const shuffle = (array, rng) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

// Curated colors for premium visual aesthetics
const CURATED_COLORS = {
  purple: { main: '#ede9fe', top: '#faf5ff', dark: '#ddd6fe' },
  blue: { main: '#e0f2fe', top: '#f0f9ff', dark: '#bae6fd' },
  green: { main: '#d1fae5', top: '#f0fdf4', dark: '#a7f3d0' },
  orange: { main: '#ffedd5', top: '#fff7ed', dark: '#fed7aa' },
  pink: { main: '#fce7f3', top: '#fdf2f8', dark: '#fbcfe8' },
};

const getColors = (rng) => {
  const keys = Object.keys(CURATED_COLORS);
  const pickedKey = rng.pick(keys);
  return CURATED_COLORS[pickedKey];
};

const SHAPE_3D_DEFINITIONS = {
  cube: {
    name: 'cube',
    faces: 6,
    edges: 12,
    vertices: 8,
    is2D: false,
    description: 'A 3D shape with 6 equal square faces, 12 edges, and 8 vertices.',
    draw: (colors) => `
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
        <!-- Front-left face -->
        <polygon points="50,110 100,135 100,190 50,165" fill="${colors.main}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Front-right face -->
        <polygon points="100,135 150,110 150,165 100,190" fill="${colors.dark}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Top face -->
        <polygon points="50,110 100,85 150,110 100,135" fill="${colors.top}" stroke="#0f172a" stroke-width="2.5" />
      </svg>
    `
  },
  cylinder: {
    name: 'cylinder',
    faces: 3, // 2 flat circular faces, 1 curved face
    edges: 2, // 2 curved edges
    vertices: 0,
    is2D: false,
    description: 'A 3D shape with 2 flat circular faces, 1 curved face, 2 curved edges, and 0 vertices.',
    draw: (colors) => `
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
        <!-- Cylinder body -->
        <path d="M 50,70 L 50,150 A 50,20 0 0,0 150,150 L 150,70 Z" fill="${colors.main}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Hidden back curve (dashed) -->
        <path d="M 50,150 A 50,20 0 0,1 150,150" fill="none" stroke="#0f172a" stroke-dasharray="4,4" stroke-width="2.5" />
        <!-- Top circular face -->
        <ellipse cx="100" cy="70" rx="50" ry="20" fill="${colors.top}" stroke="#0f172a" stroke-width="2.5" />
      </svg>
    `
  },
  sphere: {
    name: 'sphere',
    faces: 1, // 1 curved face
    edges: 0,
    vertices: 0,
    is2D: false,
    description: 'A completely round 3D shape with 1 continuous curved face, 0 edges, and 0 vertices.',
    draw: (colors) => `
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
        <!-- Main circle -->
        <circle cx="100" cy="100" r="60" fill="${colors.main}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Front equator curve -->
        <path d="M 40,100 A 60,18 0 0,0 160,100" fill="none" stroke="#0f172a" stroke-width="1.5" />
        <!-- Back equator curve (dashed) -->
        <path d="M 40,100 A 60,18 0 0,1 160,100" fill="none" stroke="#0f172a" stroke-dasharray="4,4" stroke-width="1.5" />
      </svg>
    `
  },
  cone: {
    name: 'cone',
    faces: 2, // 1 flat circular base, 1 curved face
    edges: 1, // 1 curved edge
    vertices: 1, // 1 apex point
    is2D: false,
    description: 'A 3D shape with 1 flat circular base, 1 curved face, 1 circular edge, and 1 vertex (apex) at the top.',
    draw: (colors) => `
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
        <!-- Cone body/front -->
        <path d="M 100,45 L 50,150 A 50,18 0 0,0 150,150 Z" fill="${colors.main}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Hidden back curve (dashed) -->
        <path d="M 50,150 A 50,18 0 0,1 150,150" fill="none" stroke="#0f172a" stroke-dasharray="4,4" stroke-width="2.5" />
      </svg>
    `
  },
  'rectangular prism': {
    name: 'rectangular prism',
    faces: 6,
    edges: 12,
    vertices: 8,
    is2D: false,
    description: 'A 3D shape with 6 rectangular faces (which can include opposite square faces), 12 edges, and 8 vertices.',
    draw: (colors) => `
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
        <!-- Front face -->
        <polygon points="40,100 110,120 110,180 40,160" fill="${colors.main}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Right face -->
        <polygon points="110,120 160,95 160,155 110,180" fill="${colors.dark}" stroke="#0f172a" stroke-width="2.5" />
        <!-- Top face -->
        <polygon points="40,100 90,75 160,95 110,120" fill="${colors.top}" stroke="#0f172a" stroke-width="2.5" />
      </svg>
    `
  },
  'square pyramid': {
    name: 'square pyramid',
    faces: 5, // 1 square base, 4 triangular faces
    edges: 8,
    vertices: 5,
    is2D: false,
    description: 'A 3D shape with 1 square base, 4 flat triangular sides, 8 edges, and 5 vertices.',
    draw: (colors) => `
      <svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
        <!-- Base back lines (dashed) -->
        <path d="M 40,150 L 90,130 L 160,150" fill="none" stroke="#0f172a" stroke-dasharray="4,4" stroke-width="2" />
        <!-- Left front face -->
        <polygon points="100,45 40,150 110,175" fill="${colors.main}" fill-opacity="0.85" stroke="#0f172a" stroke-width="2.5" />
        <!-- Right front face -->
        <polygon points="100,45 110,175 160,150" fill="${colors.dark}" fill-opacity="0.85" stroke="#0f172a" stroke-width="2.5" />
        <!-- Front base edge outline -->
        <path d="M 40,150 L 110,175 L 160,150" fill="none" stroke="#0f172a" stroke-width="2.5" />
      </svg>
    `
  }
};

const SHAPE_2D_DEFINITIONS = {
  circle: { name: 'circle', is2D: true, faces: 1, edges: 1, vertices: 0, description: 'A round flat 2D shape.' },
  square: { name: 'square', is2D: true, faces: 1, edges: 4, vertices: 4, description: 'A flat 2D shape with 4 equal sides.' },
  triangle: { name: 'triangle', is2D: true, faces: 1, edges: 3, vertices: 3, description: 'A flat 2D shape with 3 sides.' },
  rectangle: { name: 'rectangle', is2D: true, faces: 1, edges: 4, vertices: 4, description: 'A flat 2D shape with 4 sides and opposite sides equal.' },
  pentagon: { name: 'pentagon', is2D: true, faces: 1, edges: 5, vertices: 5, description: 'A flat 2D shape with 5 sides.' },
  hexagon: { name: 'hexagon', is2D: true, faces: 1, edges: 6, vertices: 6, description: 'A flat 2D shape with 6 sides.' }
};

export function generate3DShapesQuestion(config = {}) {
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const rng = new SeededRandom(seed);
  const task = config.forcedTask || 'shapes-g2-2d-vs-3d';

  if (task === 'shapes-g2-vertices-edges-faces') {
    return generateVerticesEdgesFacesQuestion(rng, seed);
  }

  return generate2Dvs3DQuestion(rng, seed);
}

function generate2Dvs3DQuestion(rng, seed) {
  const all3D = Object.keys(SHAPE_3D_DEFINITIONS);
  const all2D = Object.keys(SHAPE_2D_DEFINITIONS);
  const isTarget3D = rng.next() > 0.5;

  const targetName = isTarget3D ? rng.pick(all3D) : rng.pick(all2D);
  const targetInfo = isTarget3D ? SHAPE_3D_DEFINITIONS[targetName] : SHAPE_2D_DEFINITIONS[targetName];

  const questionText = `Is a **${targetName}** a 2D shape (flat) or a 3D shape (solid)?`;

  const options = [
    { id: 'opt_2d', label: '2D shape (flat)' },
    { id: 'opt_3d', label: '3D shape (solid)' }
  ];

  const correctAnswerIndex = isTarget3D ? 1 : 0;
  const colors = getColors(rng);

  let parts = [];
  if (isTarget3D) {
    parts.push({ type: 'svg', content: targetInfo.draw(colors) });
  }

  const explanation = {
    sections: [
      { content: `### Classification Explanation:` },
      { content: `A **${targetName}** is a **${isTarget3D ? '3D shape (solid)' : '2D shape (flat)'}**.` },
      { content: isTarget3D 
        ? `Solid 3D shapes have depth, width, and height. They take up space.` 
        : `Flat 2D shapes are flat. They only have length and width, but no depth/thickness.`
      }
    ]
  };

  return {
    type: 'mcq',
    questionText,
    parts,
    options,
    correctAnswerIndex,
    explanation,
    remediation: `Remember: 2D shapes like circles, triangles, and squares are flat drawings. 3D shapes like cubes, cones, and spheres are solid objects like a box, a party hat, or a ball.`,
    metadata: {
      subject: 'math',
      topic: 'shapes',
      skillId: 'shapes-g2-2d-vs-3d',
      templateId: 'shapes.3d.identify',
      engine: '3dShapes',
      targetShape: targetName,
      isTarget3D,
      seed
    }
  };
}

function generateVerticesEdgesFacesQuestion(rng, seed) {
  const all3D = Object.keys(SHAPE_3D_DEFINITIONS);
  const targetName = rng.pick(all3D);
  const targetInfo = SHAPE_3D_DEFINITIONS[targetName];

  const properties = ['faces', 'edges', 'vertices'];
  const property = rng.pick(properties);
  const correctAnswerValue = targetInfo[property];

  const questionText = `How many **${property}** does a **${targetName}** have?`;

  const colors = getColors(rng);
  const svg = targetInfo.draw(colors);

  // Generate unique MCQ choices
  const answerChoices = new Set([correctAnswerValue]);
  while (answerChoices.size < 4) {
    const offset = rng.int(-3, 4);
    const candidate = Math.max(0, correctAnswerValue + offset);
    if (candidate !== correctAnswerValue || rng.next() > 0.8) {
      answerChoices.add(candidate);
    }
  }

  const sortedChoices = Array.from(answerChoices).sort((a, b) => a - b);
  const correctAnswerIndex = sortedChoices.indexOf(correctAnswerValue);

  const options = sortedChoices.map((val, idx) => ({
    id: `opt_${idx}`,
    label: String(val)
  }));

  const explanation = {
    sections: [
      { content: `### Properties of a ${targetName}:` },
      { content: `A **${targetName}** has:` },
      { content: `- **${targetInfo.faces}** faces (flat or curved surfaces)
- **${targetInfo.edges}** edges (where two faces meet)
- **${targetInfo.vertices}** vertices (corners where edges meet)` },
      { content: `Therefore, a **${targetName}** has exactly **${correctAnswerValue} ${property}**.` }
    ]
  };

  return {
    type: 'mcq',
    questionText,
    parts: [
      { type: 'svg', content: svg }
    ],
    options,
    correctAnswerIndex,
    explanation,
    remediation: `Recall the properties:
- **Cube / Rectangular Prism**: 6 faces, 12 edges, 8 vertices.
- **Sphere**: 1 curved face, 0 edges, 0 vertices.
- **Cylinder**: 3 faces (2 circular, 1 curved), 2 edges, 0 vertices.
- **Cone**: 2 faces (1 circular, 1 curved), 1 edge, 1 vertex.
- **Square Pyramid**: 5 faces, 8 edges, 5 vertices.`,
    metadata: {
      subject: 'math',
      topic: 'shapes',
      skillId: 'shapes-g2-vertices-edges-faces',
      templateId: 'shapes.3d.properties',
      engine: '3dShapes',
      targetShape: targetName,
      property,
      correctAnswerValue,
      seed
    }
  };
}
