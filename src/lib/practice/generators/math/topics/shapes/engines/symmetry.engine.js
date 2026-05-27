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

const QUADRILATERAL_DEFINITIONS = {
  trapezoid: {
    name: 'trapezoid',
    description: 'A quadrilateral with exactly one pair of parallel sides.',
    svg: `<polygon points="50,140 150,140 120,70 80,70" fill="#d1fae5" stroke="#0f172a" stroke-width="2.5" />`,
    correctDescription: 'exactly one pair of parallel sides'
  },
  parallelogram: {
    name: 'parallelogram',
    description: 'A quadrilateral with opposite sides parallel and equal.',
    svg: `<polygon points="50,130 140,130 160,70 70,70" fill="#e0f2fe" stroke="#0f172a" stroke-width="2.5" />`,
    correctDescription: 'opposite sides parallel and opposite angles equal'
  },
  rhombus: {
    name: 'rhombus',
    description: 'A quadrilateral with 4 equal sides and opposite sides parallel.',
    svg: `<polygon points="100,40 150,100 100,160 50,100" fill="#ede9fe" stroke="#0f172a" stroke-width="2.5" />`,
    correctDescription: 'four equal sides and opposite sides parallel'
  },
  rectangle: {
    name: 'rectangle',
    description: 'A quadrilateral with 4 right angles and opposite sides equal.',
    svg: `<rect x="40" y="60" width="120" height="80" fill="#ffedd5" stroke="#0f172a" stroke-width="2.5" />`,
    correctDescription: 'four right angles and opposite sides equal'
  },
  square: {
    name: 'square',
    description: 'A quadrilateral with 4 equal sides and 4 right angles.',
    svg: `<rect x="50" y="50" width="100" height="100" fill="#fce7f3" stroke="#0f172a" stroke-width="2.5" />`,
    correctDescription: 'four equal sides and four right angles'
  }
};

const SYMMETRY_SHAPE_DEFINITIONS = {
  square: { name: 'square', lines: 4, description: 'A square has 4 lines of symmetry: 1 vertical, 1 horizontal, and 2 diagonal.' },
  rectangle: { name: 'rectangle', lines: 2, description: 'A rectangle has 2 lines of symmetry: 1 vertical and 1 horizontal. Diagonal lines are NOT lines of symmetry.' },
  rhombus: { name: 'rhombus', lines: 2, description: 'A rhombus has 2 lines of symmetry, going through the opposite corners (diagonals).' },
  'equilateral triangle': { name: 'equilateral triangle', lines: 3, description: 'An equilateral triangle has 3 lines of symmetry, each starting from a corner and splitting the opposite side in half.' },
  circle: { name: 'circle', lines: 'infinite', description: 'A circle has infinite (countless) lines of symmetry. Any straight line drawn through the center splits it into two equal halves.' },
  parallelogram: { name: 'parallelogram', lines: 0, description: 'A non-rhombus parallelogram has 0 lines of symmetry. Folding it along any line does not make the halves match up.' }
};

export function generateSymmetryQuestion(config = {}) {
  const seed = config.variables?.seed || config.seed || Date.now().toString();
  const rng = new SeededRandom(seed);
  const task = config.forcedTask || 'shapes-g3-quadrilaterals';

  if (task === 'shapes-g3-symmetry-lines') {
    return generateSymmetryLinesQuestion(rng, seed);
  }
  if (task === 'shapes-g3-symmetry-check') {
    return generateSymmetryCheckQuestion(rng, seed);
  }

  return generateQuadrilateralQuestion(rng, seed);
}

function generateQuadrilateralQuestion(rng, seed) {
  const list = Object.keys(QUADRILATERAL_DEFINITIONS);
  const targetName = rng.pick(list);
  const targetInfo = QUADRILATERAL_DEFINITIONS[targetName];

  const questionTypes = ['byDescription', 'byVisual'];
  const qType = rng.pick(questionTypes);

  let questionText = '';
  let parts = [];

  if (qType === 'byDescription') {
    questionText = `Which quadrilateral has **${targetInfo.correctDescription}**?`;
  } else {
    questionText = `Identify this quadrilateral:`;
    parts.push({
      type: 'svg',
      content: `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">${targetInfo.svg}</svg>`
    });
  }

  const distractors = list.filter(n => n !== targetName);
  const shuffledDistractors = shuffle(distractors, rng);
  const rawOptions = [targetName, shuffledDistractors[0], shuffledDistractors[1], shuffledDistractors[2]];
  const optionsList = shuffle(rawOptions, rng);

  const correctAnswerIndex = optionsList.indexOf(targetName);
  const options = optionsList.map((name, idx) => ({
    id: `opt_${idx}`,
    label: name.charAt(0).toUpperCase() + name.slice(1)
  }));

  const explanation = {
    sections: [
      { content: `### Quadrilateral Classification:` },
      { content: `The correct shape is a **${targetName}**.` },
      { content: `Recall the properties of quadrilaterals:` },
      { content: `- **Square**: 4 equal sides, 4 right angles.
- **Rectangle**: opposite sides equal, 4 right angles.
- **Rhombus**: 4 equal sides, opposite sides parallel.
- **Parallelogram**: opposite sides parallel and equal.
- **Trapezoid**: exactly one pair of parallel sides.` }
    ]
  };

  return {
    type: 'mcq',
    questionText,
    parts,
    options,
    correctAnswerIndex,
    explanation,
    remediation: `Remember, a square has 4 equal sides and 4 right angles. A rectangle has 4 right angles but adjacent sides can be unequal. A rhombus has 4 equal sides but no right angles. A trapezoid has only one set of parallel sides.`,
    metadata: {
      subject: 'math',
      topic: 'shapes',
      skillId: 'shapes-g3-quadrilaterals',
      templateId: 'shapes.quadrilaterals',
      engine: 'symmetry',
      targetShape: targetName,
      qType,
      seed
    }
  };
}

function generateSymmetryLinesQuestion(rng, seed) {
  const list = Object.keys(SYMMETRY_SHAPE_DEFINITIONS);
  const targetName = rng.pick(list);
  const targetInfo = SYMMETRY_SHAPE_DEFINITIONS[targetName];

  const questionText = `How many lines of symmetry does a **${targetName}** have?`;

  const choices = ['0', '1', '2', '3', '4', 'infinite'];
  const correctAnswerLabel = String(targetInfo.lines);

  const finalChoices = new Set([correctAnswerLabel]);
  while (finalChoices.size < 4) {
    finalChoices.add(rng.pick(choices));
  }

  const sortedChoices = Array.from(finalChoices).sort((a, b) => {
    if (a === 'infinite') return 1;
    if (b === 'infinite') return -1;
    return parseInt(a) - parseInt(b);
  });

  const correctAnswerIndex = sortedChoices.indexOf(correctAnswerLabel);

  const options = sortedChoices.map((label, idx) => ({
    id: `opt_${idx}`,
    label: label.charAt(0).toUpperCase() + label.slice(1)
  }));

  const explanation = {
    sections: [
      { content: `### Lines of Symmetry:` },
      { content: `A **${targetName}** has **${targetInfo.lines}** line(s) of symmetry.` },
      { content: targetInfo.description }
    ]
  };

  return {
    type: 'mcq',
    questionText,
    parts: [],
    options,
    correctAnswerIndex,
    explanation,
    remediation: `A line of symmetry is a folding line that splits a shape into two mirror-image halves that fit exactly on top of each other. A square has 4, a rectangle 2, an equilateral triangle 3, and a circle has infinite lines of symmetry.`,
    metadata: {
      subject: 'math',
      topic: 'shapes',
      skillId: 'shapes-g3-symmetry-lines',
      templateId: 'shapes.symmetry.lines',
      engine: 'symmetry',
      targetShape: targetName,
      correctAnswerLabel,
      seed
    }
  };
}

function generateSymmetryCheckQuestion(rng, seed) {
  // Test cases: Shape, Draw, dashed line properties, isItSymmetric (true/false)
  const testCases = [
    {
      shape: 'rectangle',
      isSymmetric: true,
      svg: `
        <rect x="40" y="60" width="120" height="80" fill="#ffedd5" stroke="#0f172a" stroke-width="2.5" />
        <line x1="100" y1="40" x2="100" y2="160" stroke="#0f172a" stroke-width="5.5" stroke-dasharray="8,10" stroke-linecap="round" />
        <line x1="100" y1="40" x2="100" y2="160" stroke="#e11d48" stroke-width="3" stroke-dasharray="8,10" stroke-linecap="round" />
      `,
      desc: 'a vertical line cutting the rectangle in half.'
    },
    {
      shape: 'rectangle',
      isSymmetric: true,
      svg: `
        <rect x="40" y="60" width="120" height="80" fill="#ffedd5" stroke="#0f172a" stroke-width="2.5" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#0f172a" stroke-width="5.5" stroke-dasharray="8,10" stroke-linecap="round" />
        <line x1="20" y1="100" x2="180" y2="100" stroke="#e11d48" stroke-width="3" stroke-dasharray="8,10" stroke-linecap="round" />
      `,
      desc: 'a horizontal line cutting the rectangle in half.'
    },
    {
      shape: 'rectangle',
      isSymmetric: false,
      svg: `
        <rect x="40" y="60" width="120" height="80" fill="#ffedd5" stroke="#0f172a" stroke-width="2.5" />
        <line x1="40" y1="60" x2="160" y2="140" stroke="#0f172a" stroke-width="5.5" stroke-dasharray="8,10" stroke-linecap="round" />
        <line x1="40" y1="60" x2="160" y2="140" stroke="#e11d48" stroke-width="3" stroke-dasharray="8,10" stroke-linecap="round" />
      `,
      desc: 'a diagonal line from top-left corner to bottom-right corner.'
    },
    {
      shape: 'square',
      isSymmetric: true,
      svg: `
        <rect x="50" y="50" width="100" height="100" fill="#fce7f3" stroke="#0f172a" stroke-width="2.5" />
        <line x1="50" y1="50" x2="150" y2="150" stroke="#0f172a" stroke-width="5.5" stroke-dasharray="8,10" stroke-linecap="round" />
        <line x1="50" y1="50" x2="150" y2="150" stroke="#e11d48" stroke-width="3" stroke-dasharray="8,10" stroke-linecap="round" />
      `,
      desc: 'a diagonal line across the corners.'
    },
    {
      shape: 'square',
      isSymmetric: false,
      svg: `
        <rect x="50" y="50" width="100" height="100" fill="#fce7f3" stroke="#0f172a" stroke-width="2.5" />
        <line x1="50" y1="50" x2="100" y2="150" stroke="#0f172a" stroke-width="5.5" stroke-dasharray="8,10" stroke-linecap="round" />
        <line x1="50" y1="50" x2="100" y2="150" stroke="#e11d48" stroke-width="3" stroke-dasharray="8,10" stroke-linecap="round" />
      `,
      desc: 'an off-center line.'
    },
    {
      shape: 'triangle',
      isSymmetric: true,
      svg: `
        <polygon points="100,30 40,150 160,150" fill="#d1fae5" stroke="#0f172a" stroke-width="2.5" />
        <line x1="100" y1="20" x2="100" y2="170" stroke="#0f172a" stroke-width="5.5" stroke-dasharray="8,10" stroke-linecap="round" />
        <line x1="100" y1="20" x2="100" y2="170" stroke="#e11d48" stroke-width="3" stroke-dasharray="8,10" stroke-linecap="round" />
      `,
      desc: 'a vertical line from the top corner straight down to the base.'
    },
    {
      shape: 'triangle',
      isSymmetric: false,
      svg: `
        <polygon points="100,30 40,150 160,150" fill="#d1fae5" stroke="#0f172a" stroke-width="2.5" />
        <line x1="40" y1="90" x2="160" y2="90" stroke="#0f172a" stroke-width="5.5" stroke-dasharray="8,10" stroke-linecap="round" />
        <line x1="40" y1="90" x2="160" y2="90" stroke="#e11d48" stroke-width="3" stroke-dasharray="8,10" stroke-linecap="round" />
      `,
      desc: 'a horizontal line across the triangle.'
    }
  ];

  const target = rng.pick(testCases);
  const questionText = `Is the red dashed line a **line of symmetry** for this shape?`;

  const options = [
    { id: 'yes', label: 'Yes' },
    { id: 'no', label: 'No' }
  ];

  const correctAnswerIndex = target.isSymmetric ? 0 : 1;

  const explanation = {
    sections: [
      { content: `### Line of Symmetry Check:` },
      { content: `The red dashed line shows **${target.desc}**.` },
      { content: target.isSymmetric
        ? `**Yes**, the dashed line divides the shape into two parts that are exact mirror images of each other. If you fold it along this line, the halves match up perfectly.`
        : `**No**, the dashed line is not a line of symmetry. Even if it cuts the shape, folding along this line does not result in the corners and edges matching up exactly. (For example, diagonals of a rectangle are not lines of symmetry).`
      }
    ]
  };

  return {
    type: 'mcq',
    questionText,
    parts: [
      {
        type: 'svg',
        content: `<svg viewBox="0 0 200 200" width="100%" height="100%" xmlns="http://www.w3.org/2000/svg" style="max-width: 180px; display: block; margin: 0 auto;">${target.svg}</svg>`
      }
    ],
    options,
    correctAnswerIndex,
    explanation,
    remediation: `Recall that a line of symmetry cuts a shape in such a way that both halves fit exactly on top of each other when folded. Diagonals of rectangles, or horizontal lines on vertical-only shapes, are common non-examples.`,
    metadata: {
      subject: 'math',
      topic: 'shapes',
      skillId: 'shapes-g3-symmetry-check',
      templateId: 'shapes.symmetry.check',
      engine: 'symmetry',
      targetShape: target.shape,
      isSymmetric: target.isSymmetric,
      seed
    }
  };
}
