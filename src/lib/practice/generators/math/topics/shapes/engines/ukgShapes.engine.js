import { buildShapeSvg, getShapeInfo } from '../shared/svgShapes.js';

// SeededRandom class
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

// 3D shape SVGs
const DRAW_3D = {
  cube: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
    <polygon points="50,110 100,135 100,190 50,165" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    <polygon points="100,135 150,110 150,165 100,190" fill="${color}" opacity="0.8" stroke="#0f172a" stroke-width="2.5" />
    <polygon points="50,110 100,85 150,110 100,135" fill="${color}" opacity="0.6" stroke="#0f172a" stroke-width="2.5" />
  </svg>`,
  cylinder: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
    <path d="M 50,70 L 50,150 A 50,20 0 0,0 150,150 L 150,70 Z" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 50,150 A 50,20 0 0,1 150,150" fill="none" stroke="#0f172a" stroke-dasharray="4,4" stroke-width="2.5" />
    <ellipse cx="100" cy="70" rx="50" ry="20" fill="${color}" opacity="0.7" stroke="#0f172a" stroke-width="2.5" />
  </svg>`,
  sphere: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
    <circle cx="100" cy="100" r="60" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 40,100 A 60,18 0 0,0 160,100" fill="none" stroke="#0f172a" stroke-width="1.5" />
    <path d="M 40,100 A 60,18 0 0,1 160,100" fill="none" stroke="#0f172a" stroke-dasharray="4,4" stroke-width="1.5" />
  </svg>`,
  cone: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
    <path d="M 100,45 L 50,150 A 50,18 0 0,0 150,150 Z" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    <path d="M 50,150 A 50,18 0 0,1 150,150" fill="none" stroke="#0f172a" stroke-dasharray="4,4" stroke-width="2.5" />
  </svg>`
};

// Symmetric vs asymmetric drawing functions for Q.10
const SYMMETRIC_PICS = {
  butterfly: {
    name: 'butterfly',
    symmetric: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
      <g transform="translate(25, 25)">
        <path d="M 75,80 Q 20,20 40,80 Q 20,130 75,100" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
        <path d="M 75,80 Q 130,20 110,80 Q 130,130 75,100" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
        <rect x="72" y="45" width="6" height="70" rx="3" fill="#0f172a" />
        <path d="M 75,45 Q 65,25 58,28 M 75,45 Q 85,25 92,28" stroke="#0f172a" stroke-width="2" fill="none" />
      </g>
    </svg>`,
    asymmetric: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
      <g transform="translate(25, 25)">
        <path d="M 75,80 Q 20,20 40,80 Q 20,130 75,100" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
        <path d="M 75,80 Q 145,50 125,90 Q 145,150 75,100" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
        <rect x="72" y="45" width="6" height="70" rx="3" fill="#0f172a" />
        <path d="M 75,45 Q 65,25 58,28 M 75,45 Q 95,20 100,25" stroke="#0f172a" stroke-width="2" fill="none" />
      </g>
    </svg>`
  },
  star: {
    name: 'star',
    symmetric: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
      <polygon points="100,20 125,75 185,75 135,115 155,170 100,135 45,170 65,115 15,75 75,75" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    </svg>`,
    asymmetric: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
      <polygon points="100,20 135,75 185,60 135,115 165,170 100,135 45,170 55,115 15,75 75,75" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    </svg>`
  },
  heart: {
    name: 'heart',
    symmetric: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
      <path d="M 100,60 C 80,20 30,30 30,80 C 30,130 80,160 100,180 C 120,160 170,130 170,80 C 170,30 120,20 100,60 Z" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    </svg>`,
    asymmetric: (color) => `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">
      <path d="M 100,60 C 80,20 30,30 30,80 C 30,130 80,160 100,180 C 110,160 180,110 160,80 C 150,30 120,20 100,60 Z" fill="${color}" stroke="#0f172a" stroke-width="2.5" />
    </svg>`
  }
};

function generateSingleShapeFocus(rng, target, shapeNames, seed) {
  const isIdentifyType = rng.next() > 0.5;
  const colorKey = rng.pick(['green', 'blue', 'yellow', 'pink', 'purple']);
  
  if (isIdentifyType) {
    const distractors = shapeNames.filter(s => s !== target);
    const shuffledDistractors = shuffle(distractors, rng);
    
    const choices = [
      { id: 'correct', label: target, svg: buildShapeSvg(target, 'plain', colorKey), isCorrect: true },
      { id: 'dist1', label: shuffledDistractors[0], svg: buildShapeSvg(shuffledDistractors[0], 'plain', colorKey), isCorrect: false },
      { id: 'dist2', label: shuffledDistractors[1], svg: buildShapeSvg(shuffledDistractors[1], 'plain', colorKey), isCorrect: false }
    ];
    
    const shuffledChoices = shuffle(choices, rng);
    const correctAnswerIndex = shuffledChoices.findIndex(c => c.isCorrect);
    
    const questionText = `Which shape is a **${target}**?`;
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: shuffledChoices.map((c, idx) => ({
        id: `opt_${idx}`,
        label: c.label.charAt(0).toUpperCase() + c.label.slice(1),
        svg: c.svg,
        hideLabel: true
      })),
      correctAnswerIndex,
      layoutConfig: { columns: 3 },
      solution: { sections: [{ type: 'text', content: `The correct option displays a **${target}**.` }] }
    };
  } else {
    const displayShape = rng.next() > 0.5 ? target : rng.pick(shapeNames.filter(s => s !== target));
    const svg = buildShapeSvg(displayShape, 'plain', colorKey);
    
    const questionText = `Is this a **${target}**?`;
    const isCorrect = displayShape === target;
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: svg }
      ],
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ],
      correctAnswerIndex: isCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: isCorrect ? `Yes! This is indeed a ${target}.` : `No! This is a ${displayShape}.` }] }
    };
  }
}

function generateSingle3DShapeFocus(rng, target, shapeNames, seed) {
  const isIdentifyType = rng.next() > 0.5;
  const colorKey = rng.pick(['green', 'blue', 'yellow', 'pink', 'purple']);
  
  if (isIdentifyType) {
    const distractors = shapeNames.filter(s => s !== target);
    const shuffledDistractors = shuffle(distractors, rng);
    
    const choices = [
      { id: 'correct', label: target, svg: DRAW_3D[target](colorKey), isCorrect: true },
      { id: 'dist1', label: shuffledDistractors[0], svg: DRAW_3D[shuffledDistractors[0]](colorKey), isCorrect: false },
      { id: 'dist2', label: shuffledDistractors[1], svg: DRAW_3D[shuffledDistractors[1]](colorKey), isCorrect: false }
    ];
    
    const shuffledChoices = shuffle(choices, rng);
    const correctAnswerIndex = shuffledChoices.findIndex(c => c.isCorrect);
    
    const questionText = `Which shape is a **${target}**?`;
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: shuffledChoices.map((c, idx) => ({
        id: `opt_${idx}`,
        label: c.label.charAt(0).toUpperCase() + c.label.slice(1),
        svg: c.svg,
        hideLabel: true
      })),
      correctAnswerIndex,
      layoutConfig: { columns: 3 },
      solution: { sections: [{ type: 'text', content: `The correct option displays a **${target}**.` }] }
    };
  } else {
    const displayShape = rng.next() > 0.5 ? target : rng.pick(shapeNames.filter(s => s !== target));
    const svg = DRAW_3D[displayShape](colorKey);
    
    const questionText = `Is this a **${target}**?`;
    const isCorrect = displayShape === target;
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: svg }
      ],
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ],
      correctAnswerIndex: isCorrect ? 0 : 1,
      solution: { sections: [{ type: 'text', content: isCorrect ? `Yes! This is indeed a ${target}.` : `No! This is a ${displayShape}.` }] }
    };
  }
}


export function generateUkgShapesQuestion(template, variables) {
  const seed = variables.seed || String(Date.now());
  const rng = new SeededRandom(seed);
  const config = template.config || {};
  const { mode } = config;
  
  const colorsList = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6'];
  const shapeNames = ['circle', 'triangle', 'square', 'rectangle', 'hexagon'];
  const shapeNames3D = ['cube', 'cylinder', 'sphere', 'cone'];

  // Q.1 Name the two-dimensional shape
  if (mode === 'shapes_name') {
    const targetShape = rng.pick(shapeNames);
    const colorKey = rng.pick(['green', 'blue', 'yellow', 'pink', 'purple']);
    const svg = buildShapeSvg(targetShape, 'plain', colorKey);

    const distractors = shapeNames.filter(s => s !== targetShape);
    const shuffledDistractors = shuffle(distractors, rng);
    const rawOptions = [targetShape, shuffledDistractors[0], shuffledDistractors[1], shuffledDistractors[2]];
    const optionsList = shuffle(rawOptions, rng);
    const correctAnswerIndex = optionsList.indexOf(targetShape);

    return {
      type: 'mcq',
      questionText: 'What shape is this?',
      parts: [
        { type: 'text', content: 'What shape is this?' },
        { type: 'svg', content: svg }
      ],
      options: optionsList.map((name, idx) => ({ id: `opt_${idx}`, label: name.charAt(0).toUpperCase() + name.slice(1) })),
      correctAnswerIndex,
      solution: { sections: [{ type: 'text', content: `This shape has straight boundaries or is curved. It is a **${targetShape}**.` }] }
    };
  }

  // Q.2 Circles
  if (mode === 'circles') {
    return generateSingleShapeFocus(rng, 'circle', shapeNames, seed);
  }

  // Q.3 Triangles
  if (mode === 'triangles') {
    return generateSingleShapeFocus(rng, 'triangle', shapeNames, seed);
  }

  // Q.4 Squares and rectangles
  if (mode === 'squares_rectangles') {
    const isSquare = rng.next() > 0.5;
    const target = isSquare ? 'square' : 'rectangle';
    return generateSingleShapeFocus(rng, target, shapeNames, seed);
  }

  // Q.5 Hexagons
  if (mode === 'hexagons') {
    return generateSingleShapeFocus(rng, 'hexagon', shapeNames, seed);
  }

  // Q.6 Select two-dimensional shapes
  if (mode === 'select_2d') {
    const all2D = ['circle', 'triangle', 'square', 'rectangle', 'hexagon'];
    const all3D = ['cube', 'cylinder', 'sphere', 'cone'];
    
    const askFor2D = rng.next() > 0.5;
    const color = rng.pick(colorsList);
    
    let correctAnswer, correctSvg;
    let dist1, dist1Svg, dist2, dist2Svg;
    
    if (askFor2D) {
      correctAnswer = rng.pick(all2D);
      correctSvg = buildShapeSvg(correctAnswer, 'plain', 'green');
      
      const shuffled3D = shuffle(all3D, rng);
      dist1 = shuffled3D[0];
      dist1Svg = DRAW_3D[dist1](color);
      dist2 = shuffled3D[1];
      dist2Svg = DRAW_3D[dist2](color);
    } else {
      correctAnswer = rng.pick(all3D);
      correctSvg = DRAW_3D[correctAnswer](color);
      
      const shuffled2D = shuffle(all2D, rng);
      dist1 = shuffled2D[0];
      dist1Svg = buildShapeSvg(dist1, 'plain', 'green');
      dist2 = shuffled2D[1];
      dist2Svg = buildShapeSvg(dist2, 'plain', 'green');
    }
    
    const choices = [
      { id: 'correct', label: correctAnswer, svg: correctSvg, isCorrect: true },
      { id: 'dist1', label: dist1, svg: dist1Svg, isCorrect: false },
      { id: 'dist2', label: dist2, svg: dist2Svg, isCorrect: false }
    ];
    
    const shuffledChoices = shuffle(choices, rng);
    const correctAnswerIndex = shuffledChoices.findIndex(c => c.isCorrect);
    
    const questionText = askFor2D ? "Which of these is a flat 2D shape?" : "Which of these is a solid 3D shape?";
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: shuffledChoices.map((c, idx) => ({
        id: `opt_${idx}`,
        label: c.label.charAt(0).toUpperCase() + c.label.slice(1),
        svg: c.svg,
        hideLabel: true
      })),
      correctAnswerIndex,
      layoutConfig: { columns: 3 },
      solution: {
        sections: [{
          type: 'text',
          content: askFor2D
            ? `A **${correctAnswer}** is flat (2D). Solid shapes like **${dist1}** and **${dist2}** are 3D.`
            : `A **${correctAnswer}** is solid (3D). Flat shapes like **${dist1}** and **${dist2}** are 2D.`
        }]
      }
    };
  }

  // Q.7 Count sides and corners
  if (mode === 'count_sides_corners') {
    const targetShape = rng.pick(['triangle', 'square', 'rectangle', 'hexagon', 'circle']);
    const shapeInfo = getShapeInfo(targetShape);
    const colorKey = rng.pick(['green', 'blue', 'yellow', 'pink', 'purple']);
    
    const askSides = rng.next() > 0.5;
    const value = askSides ? shapeInfo.sides : shapeInfo.corners;
    
    const svg = buildShapeSvg(targetShape, askSides ? 'sides' : 'corners', colorKey);
    const questionText = askSides 
      ? `How many straight sides does this ${targetShape} have?`
      : `How many corners does this ${targetShape} have?`;
      
    const options = [0, 3, 4, 5, 6];
    const finalChoices = new Set([value]);
    while (finalChoices.size < 3) {
      finalChoices.add(rng.pick(options));
    }
    const sortedChoices = Array.from(finalChoices).sort((a, b) => a - b);
    const correctAnswerIndex = sortedChoices.indexOf(value);
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: svg }
      ],
      options: sortedChoices.map((c, idx) => ({ id: `opt_${idx}`, label: String(c) })),
      correctAnswerIndex,
      solution: {
        sections: [{
          type: 'text',
          content: `A **${targetShape}** has **${value}** ${askSides ? 'sides' : 'corners'}.`
        }]
      }
    };
  }

  // Q.8 Compare sides and corners
  if (mode === 'compare_sides_corners') {
    const shapesConfig = [
      { name: 'circle', sides: 0, corners: 0 },
      { name: 'triangle', sides: 3, corners: 3 },
      { name: 'square', sides: 4, corners: 4 },
      { name: 'rectangle', sides: 4, corners: 4 },
      { name: 'hexagon', sides: 6, corners: 6 }
    ];
    
    const shA = rng.pick(shapesConfig);
    let shB = rng.pick(shapesConfig);
    while (shA.name === shB.name) {
      shB = rng.pick(shapesConfig);
    }
    
    const compareSides = rng.next() > 0.5;
    const valA = compareSides ? shA.sides : shA.corners;
    const valB = compareSides ? shB.sides : shB.corners;
    
    const compareMore = rng.next() > 0.5;
    
    if (valA === valB) {
      const questionText = `Do a **square** and a **rectangle** have the same number of ${compareSides ? 'sides' : 'corners'}?`;
      return {
        type: 'mcq',
        questionText,
        parts: [
          { type: 'text', content: questionText },
          { type: 'svg', content: buildShapeSvg('square', 'plain', 'green') },
          { type: 'svg', content: buildShapeSvg('rectangle', 'plain', 'blue') }
        ],
        options: [
          { id: 'yes', label: 'Yes' },
          { id: 'no', label: 'No' }
        ],
        correctAnswerIndex: 0,
        solution: { sections: [{ type: 'text', content: `Yes! Both a square and a rectangle have exactly 4 sides and 4 corners.` }] }
      };
    }
    
    let isCorrectA;
    if (compareMore) {
      isCorrectA = valA > valB;
    } else {
      isCorrectA = valA < valB;
    }
    
    const questionText = compareMore 
      ? `Which shape has **more** ${compareSides ? 'sides' : 'corners'}?`
      : `Which shape has **fewer** ${compareSides ? 'sides' : 'corners'}?`;
      
    const choices = [
      { id: 'a', label: shA.name, svg: buildShapeSvg(shA.name, 'plain', 'green'), isCorrect: isCorrectA },
      { id: 'b', label: shB.name, svg: buildShapeSvg(shB.name, 'plain', 'blue'), isCorrect: !isCorrectA }
    ];
    
    const correctAnswerIndex = choices.findIndex(c => c.isCorrect);
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: choices.map((c, idx) => ({
        id: `opt_${idx}`,
        label: c.label.charAt(0).toUpperCase() + c.label.slice(1),
        svg: c.svg,
        hideLabel: true
      })),
      correctAnswerIndex,
      layoutConfig: { columns: 2 },
      solution: {
        sections: [{
          type: 'text',
          content: `A **${shA.name}** has ${valA} ${compareSides ? 'sides' : 'corners'}. A **${shB.name}** has ${valB} ${compareSides ? 'sides' : 'corners'}. The correct option is **${isCorrectA ? shA.name : shB.name}**.`
        }]
      }
    };
  }

  // Q.9 Introduction to symmetry
  if (mode === 'intro_symmetry') {
    const shapesWithSym = [
      { name: 'square', isSymmetric: true, svg: `<rect x="50" y="50" width="100" height="100" fill="#fce7f3" stroke="#0f172a" stroke-width="2.5" /><line x1="100" y1="30" x2="100" y2="170" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,8" />` },
      { name: 'rectangle', isSymmetric: true, svg: `<rect x="40" y="60" width="120" height="80" fill="#ffedd5" stroke="#0f172a" stroke-width="2.5" /><line x1="100" y1="40" x2="100" y2="160" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,8" />` },
      { name: 'triangle', isSymmetric: true, svg: `<polygon points="100,30 40,150 160,150" fill="#d1fae5" stroke="#0f172a" stroke-width="2.5" /><line x1="100" y1="20" x2="100" y2="170" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,8" />` },
      { name: 'circle', isSymmetric: true, svg: `<circle cx="100" cy="100" r="60" fill="#e0f2fe" stroke="#0f172a" stroke-width="2.5" /><line x1="100" y1="25" x2="100" y2="175" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,8" />` },
      { name: 'triangle_asymmetric', isSymmetric: false, svg: `<polygon points="100,30 40,150 160,150" fill="#d1fae5" stroke="#0f172a" stroke-width="2.5" /><line x1="130" y1="20" x2="130" y2="170" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,8" />` },
      { name: 'rectangle_asymmetric', isSymmetric: false, svg: `<rect x="40" y="60" width="120" height="80" fill="#ffedd5" stroke="#0f172a" stroke-width="2.5" /><line x1="130" y1="40" x2="130" y2="160" stroke="#e11d48" stroke-width="3" stroke-dasharray="6,8" />` },
    ];
    
    const target = rng.pick(shapesWithSym);
    const questionText = "Is the red dashed line a line of symmetry? (Does it split the shape into two matching halves?)";
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">${target.svg}</svg>` }
      ],
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ],
      correctAnswerIndex: target.isSymmetric ? 0 : 1,
      solution: {
        sections: [{
          type: 'text',
          content: target.isSymmetric
            ? `Yes, the red dashed line splits the shape into two matching halves that fit perfectly if folded.`
            : `No, the red dashed line does not split the shape into matching halves.`
        }]
      }
    };
  }

  // Q.10 Identify pictures with symmetry
  if (mode === 'pictures_symmetry') {
    const keys = Object.keys(SYMMETRIC_PICS);
    const pickedKey = rng.pick(keys);
    const color = rng.pick(colorsList);
    const isSymmetric = rng.next() > 0.5;
    
    const pic = SYMMETRIC_PICS[pickedKey];
    const svg = isSymmetric ? pic.symmetric(color) : pic.asymmetric(color);
    
    const questionText = `Is this **${pic.name}** symmetric? (Do the left and right sides match perfectly?)`;
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: svg }
      ],
      options: [
        { id: 'yes', label: 'Yes' },
        { id: 'no', label: 'No' }
      ],
      correctAnswerIndex: isSymmetric ? 0 : 1,
      solution: {
        sections: [{
          type: 'text',
          content: isSymmetric
            ? `Yes! The left and right sides of this ${pic.name} are mirror images and match perfectly.`
            : `No! The left and right sides of this ${pic.name} do not match. One side is different.`
        }]
      }
    };
  }

  // R.1 Two-dimensional and three-dimensional shapes
  if (mode === 'two_three_3d') {
    const is3D = rng.next() > 0.5;
    const target = is3D ? rng.pick(shapeNames3D) : rng.pick(shapeNames);
    const colorKey = rng.pick(['green', 'blue', 'yellow', 'pink', 'purple']);
    const svg = is3D ? DRAW_3D[target](colorKey) : buildShapeSvg(target, 'plain', colorKey);
    
    const questionText = "Is this shape a **2D shape (flat)** or a **3D shape (solid)**?";
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: svg }
      ],
      options: [
        { id: '2d', label: '2D shape (flat)' },
        { id: '3d', label: '3D shape (solid)' }
      ],
      correctAnswerIndex: is3D ? 1 : 0,
      solution: {
        sections: [{
          type: 'text',
          content: `A **${target}** is a **${is3D ? '3D shape (solid)' : '2D shape (flat)'}**.`
        }]
      }
    };
  }

  // R.2 Name the three-dimensional shape
  if (mode === 'name_3d') {
    const target = rng.pick(shapeNames3D);
    const colorKey = rng.pick(['green', 'blue', 'yellow', 'pink', 'purple']);
    const svg = DRAW_3D[target](colorKey);
    
    const questionText = "What 3D shape is this?";
    
    const rawOptions = ['cube', 'cylinder', 'sphere', 'cone'];
    const optionsList = shuffle(rawOptions, rng);
    const correctAnswerIndex = optionsList.indexOf(target);
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: svg }
      ],
      options: optionsList.map((name, idx) => ({ id: `opt_${idx}`, label: name.charAt(0).toUpperCase() + name.slice(1) })),
      correctAnswerIndex,
      solution: {
        sections: [{
          type: 'text',
          content: `This shape is a **${target}**.`
        }]
      }
    };
  }

  // R.3 Spheres
  if (mode === 'spheres') {
    return generateSingle3DShapeFocus(rng, 'sphere', shapeNames3D, seed);
  }

  // R.4 Cubes
  if (mode === 'cubes') {
    return generateSingle3DShapeFocus(rng, 'cube', shapeNames3D, seed);
  }

  // R.5 Cones
  if (mode === 'cones') {
    return generateSingle3DShapeFocus(rng, 'cone', shapeNames3D, seed);
  }

  // R.6 Cylinders
  if (mode === 'cylinders') {
    return generateSingle3DShapeFocus(rng, 'cylinder', shapeNames3D, seed);
  }

  // R.7 Select three-dimensional shapes
  if (mode === 'select_3d') {
    const target = rng.pick(shapeNames3D);
    const colorKey = rng.pick(['green', 'blue', 'yellow', 'pink', 'purple']);
    const correctSvg = DRAW_3D[target](colorKey);
    
    const shuffled2D = shuffle(shapeNames, rng);
    const dist1 = shuffled2D[0];
    const dist1Svg = buildShapeSvg(dist1, 'plain', colorKey);
    const dist2 = shuffled2D[1];
    const dist2Svg = buildShapeSvg(dist2, 'plain', colorKey);
    
    const choices = [
      { id: 'correct', label: target, svg: correctSvg, isCorrect: true },
      { id: 'dist1', label: dist1, svg: dist1Svg, isCorrect: false },
      { id: 'dist2', label: dist2, svg: dist2Svg, isCorrect: false }
    ];
    
    const shuffledChoices = shuffle(choices, rng);
    const correctAnswerIndex = shuffledChoices.findIndex(c => c.isCorrect);
    
    const questionText = "Which of these is a solid 3D shape?";
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: shuffledChoices.map((c, idx) => ({
        id: `opt_${idx}`,
        label: c.label.charAt(0).toUpperCase() + c.label.slice(1),
        svg: c.svg,
        hideLabel: true
      })),
      correctAnswerIndex,
      layoutConfig: { columns: 3 },
      solution: {
        sections: [{
          type: 'text',
          content: `A **${target}** is a solid (3D) shape. Flat shapes like **${dist1}** and **${dist2}** are 2D.`
        }]
      }
    };
  }

  // R.8 Identify shapes traced from solids
  if (mode === 'traced_solids') {
    const traceCases = [
      { solid: 'cube', flat: 'square', desc: 'any face of a cube', svg: DRAW_3D.cube('purple') },
      { solid: 'cone', flat: 'circle', desc: 'the bottom flat face of a cone', svg: DRAW_3D.cone('orange') },
      { solid: 'cylinder', flat: 'circle', desc: 'the bottom flat face of a cylinder', svg: DRAW_3D.cylinder('green') }
    ];
    const picked = rng.pick(traceCases);
    const questionText = `If you place a **${picked.solid}** flat on a piece of paper and trace around ${picked.desc}, what flat shape do you draw?`;
    
    const rawOptions = ['square', 'circle', 'triangle', 'rectangle'];
    const uniqueOptions = new Set([picked.flat]);
    while (uniqueOptions.size < 3) {
      uniqueOptions.add(rng.pick(rawOptions));
    }
    const optionsList = shuffle(Array.from(uniqueOptions), rng);
    const correctAnswerIndex = optionsList.indexOf(picked.flat);
    
    return {
      type: 'mcq',
      questionText,
      parts: [
        { type: 'text', content: questionText },
        { type: 'svg', content: picked.svg }
      ],
      options: optionsList.map((name, idx) => ({ id: `opt_${idx}`, label: name.charAt(0).toUpperCase() + name.slice(1) })),
      correctAnswerIndex,
      solution: {
        sections: [{
          type: 'text',
          content: `Tracing ${picked.desc} yields a **${picked.flat}**.`
        }]
      }
    };
  }

  // R.9 Shapes of everyday objects I
  if (mode === 'everyday_objects_1') {
    const objects = [
      { name: 'soccer ball', shape: 'sphere' },
      { name: 'playing die', shape: 'cube' },
      { name: 'ice cream cone', shape: 'cone' },
      { name: 'soda can', shape: 'cylinder' }
    ];
    const picked = rng.pick(objects);
    const questionText = `A **${picked.name}** is shaped like which 3D shape?`;
    
    const rawOptions = ['sphere', 'cube', 'cone', 'cylinder'];
    const optionsList = shuffle(rawOptions, rng);
    const correctAnswerIndex = optionsList.indexOf(picked.shape);
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: optionsList.map((name, idx) => ({ id: `opt_${idx}`, label: name.charAt(0).toUpperCase() + name.slice(1) })),
      correctAnswerIndex,
      solution: {
        sections: [{
          type: 'text',
          content: `A **${picked.name}** is shaped like a **${picked.shape}**.`
        }]
      }
    };
  }

  // R.10 Shapes of everyday objects II
  if (mode === 'everyday_objects_2') {
    const objects = [
      { name: 'globe of the Earth', shape: 'sphere' },
      { name: 'wooden toy block', shape: 'cube' },
      { name: 'party hat', shape: 'cone' },
      { name: 'soup can', shape: 'cylinder' }
    ];
    const picked = rng.pick(objects);
    const questionText = `A **${picked.name}** is shaped like which 3D shape?`;
    
    const rawOptions = ['sphere', 'cube', 'cone', 'cylinder'];
    const optionsList = shuffle(rawOptions, rng);
    const correctAnswerIndex = optionsList.indexOf(picked.shape);
    
    return {
      type: 'mcq',
      questionText,
      parts: [{ type: 'text', content: questionText }],
      options: optionsList.map((name, idx) => ({ id: `opt_${idx}`, label: name.charAt(0).toUpperCase() + name.slice(1) })),
      correctAnswerIndex,
      solution: {
        sections: [{
          type: 'text',
          content: `A **${picked.name}** is shaped like a **${picked.shape}**.`
        }]
      }
    };
  }

  // Fallback
  return {
    type: 'mcq',
    questionText: 'What shape is this?',
    parts: [
      { type: 'text', content: 'What shape is this?' },
      { type: 'svg', content: buildShapeSvg('circle', 'plain', 'green') }
    ],
    options: [{ id: 'circle', label: 'Circle' }],
    correctAnswerIndex: 0,
    solution: { sections: [{ type: 'text', content: 'It is a circle.' }] }
  };
}
