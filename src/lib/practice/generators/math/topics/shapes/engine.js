import { buildShapeSvg, getShapeInfo, SUPPORTED_SHAPES, CURATED_COLOR_KEYS } from './shared/svgShapes.js';

const SHAPES_AUDIO_URLS = {
  oval: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/a0e1b285a930528ee716b939441d996a4507292385fca0e847ae49cb4f64c467.wav',
  circle: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/14f80db7719c5616b1dd6d098b1849817196beb02116bb4a1ee3ac76148f4dc2.wav',
  square: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/ba99ad3738da0a667311948c1db39ca2fdb02d885645bbaea794b67eaad8a5ce.wav',
  rectangle: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/7b3c1d1bd3ba3b68014eca8fd0a59d94915af97e294ea0b139e4788e36d27fd4.wav',
  pentagon: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/a9df02f13a3e9e3da8b74525727049c2bd1bb143c6d51fe1334cd1186f117475.wav',
  hexagon: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/f6e592437c32221c7c41e4b074881ff74eb86005d9b66721a86c4f9b79f158b6.wav',
  triangle: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/984eaa473f174bf2fb5b3375c4d5aa52a8ca01d4936866883b8716c1e1afd2ab.wav',
  diamond: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/5e4e4e1e45f01143bba040e86431b5157db6407c47b2aaa87aff2d6216b43d81.wav'
};

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

export function generateShapesQuestion(config = {}) {
  const seed = config.variables?.seed || Date.now().toString();
  const rng = new SeededRandom(seed);
  const difficulty = config.difficulty || 'easy';
  const forcedTask = config.forcedTask || config.engineParams?.forcedTask || 'visual_to_text';

  if (forcedTask === 'text_to_visual') {
    return generateTextToVisualQuestion(rng, seed);
  }

  return generateVisualToTextQuestion(rng, seed);
}

function generateVisualToTextQuestion(rng, seed) {
  const targetShape = rng.pick(SUPPORTED_SHAPES);
  const colorKey = rng.pick(CURATED_COLOR_KEYS);
  
  const shapeInfo = getShapeInfo(targetShape);
  const svgPlain = buildShapeSvg(targetShape, 'plain', colorKey);
  
  // Generate 3 unique distractor shapes
  const distractors = SUPPORTED_SHAPES.filter(s => s !== targetShape);
  const shuffledDistractors = shuffle(distractors, rng);
  const selectedOptions = shuffle([targetShape, shuffledDistractors[0], shuffledDistractors[1], shuffledDistractors[2]], rng);

  const correctAnswerIndex = selectedOptions.indexOf(targetShape);
  
  const options = selectedOptions.map((shapeName, idx) => ({
    id: `opt_${idx}`,
    label: shapeName,
    audioUrl: SHAPES_AUDIO_URLS[shapeName] || null
  }));


  // Build high-quality visual explanation steps
  const explanationSections = [
    { content: `### Let's identify the shape step-by-step:` }
  ];

  if (shapeInfo.sides > 0) {
    const svgSides = buildShapeSvg(targetShape, 'sides', colorKey);
    explanationSections.push({
      content: `**Step 1: Count the sides.**\nSides are the straight lines that make the shape. Count all the sides around the shape.\n\nThis shape has **${shapeInfo.sides} sides**.`
    });
    explanationSections.push({
      type: 'svg',
      content: svgSides
    });
  } else {
    explanationSections.push({
      content: `**Step 1: Look at the outline.**\nThis shape is curved and round. It has **0 straight sides**.`
    });
  }

  if (shapeInfo.corners > 0) {
    const svgCorners = buildShapeSvg(targetShape, 'corners', colorKey);
    explanationSections.push({
      content: `**Step 2: Count the corners.**\nCorners of the shape are where two sides meet. Count the corners.\n\nThis shape has **${shapeInfo.corners} corners**.`
    });
    explanationSections.push({
      type: 'svg',
      content: svgCorners
    });
  } else {
    explanationSections.push({
      content: `**Step 2: Look for corners.**\nSince this shape is round and has no straight sides, it has **0 corners**.`
    });
  }

  if (shapeInfo.hasRightAngles) {
    const svgAngles = buildShapeSvg(targetShape, 'square_corners', colorKey);
    explanationSections.push({
      content: `**Step 3: Look at the corners.**\nNotice the square-shaped corners. They form right angles (90 degrees).\n\nThis shape has **4 square corners**.`
    });
    explanationSections.push({
      type: 'svg',
      content: svgAngles
    });
  }

  let finalRule = '';
  if (targetShape === 'circle') {
    finalRule = `A completely round shape with no sides and no corners is a **circle**.`;
  } else if (targetShape === 'oval') {
    finalRule = `An elongated round shape with no sides and no corners is an **oval**.`;
  } else if (targetShape === 'square') {
    finalRule = `A shape with **4 equal sides** and **4 square corners** is a **square**.`;
  } else if (targetShape === 'rectangle') {
    finalRule = `A shape with **4 sides** (opposite sides equal) and **4 square corners** is a **rectangle**.`;
  } else if (targetShape === 'triangle') {
    finalRule = `A shape with **3 sides** and **3 corners** is a **triangle**.`;
  } else if (targetShape === 'pentagon') {
    finalRule = `A shape with **5 sides** and **5 corners** is a **pentagon**.`;
  } else if (targetShape === 'hexagon') {
    finalRule = `A shape with **6 sides** and **6 corners** is a **hexagon**.`;
  } else {
    finalRule = `A shape with **${shapeInfo.sides} sides** and **${shapeInfo.corners} corners** is a **${targetShape}**.`;
  }

  explanationSections.push({
    content: `**Conclusion:**\n${finalRule}`
  });

  return {
    type: 'mcq',
    questionText: `What shape is this?`,
    audioUrl: 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/audio/tts/Kore/47e62021ae308bee509670178c751d8db874a1da765f829a06b5acad60db132f.wav',
    parts: [
      { type: 'svg', content: svgPlain }
    ],
    options,
    correctAnswerIndex,
    metaConfig: {
      readable: true,
      readOptions: true
    },
    explanation: {
      sections: explanationSections
    },
    remediation: `Recall that a circle has no corners, a triangle has 3 sides, and a square or rectangle has 4 sides.`,
    metadata: {
      subject: 'math',
      topic: 'shapes',
      skillId: 'shapes-g1-identify-visual-text-opts',
      templateId: 'shapes.identify.visual-to-text',
      engine: 'shapes',
      grade: 1,
      targetShape,
      colorKey,
      seed
    }
  };
}

function generateTextToVisualQuestion(rng, seed) {
  const targetShape = rng.pick(SUPPORTED_SHAPES);
  const shapeInfo = getShapeInfo(targetShape);

  // Distractors
  const distractors = SUPPORTED_SHAPES.filter(s => s !== targetShape);
  const shuffledDistractors = shuffle(distractors, rng);
  const targetDistractors = [shuffledDistractors[0], shuffledDistractors[1], shuffledDistractors[2]];

  // Colors
  const colors = shuffle(CURATED_COLOR_KEYS, rng);

  const rawOptions = [
    { shape: targetShape, color: colors[0] },
    { shape: targetDistractors[0], color: colors[1] },
    { shape: targetDistractors[1], color: colors[2] },
    { shape: targetDistractors[2], color: colors[3] }
  ];

  const shuffledOptions = shuffle(rawOptions, rng);
  const correctAnswerIndex = shuffledOptions.findIndex(o => o.shape === targetShape);

  // Map option layout to media objects for MCQRenderer
  const options = shuffledOptions.map((opt, idx) => {
    const svg = buildShapeSvg(opt.shape, 'plain', opt.color);
    return {
      id: `opt_${idx}`,
      label: opt.shape,
      content: svg
    };
  });

  const explanationSvg = buildShapeSvg(targetShape, 'plain', colors[0]);

  return {
    type: 'mcq',
    questionText: `Which shape is a **${targetShape}**?`,
    parts: [],
    options,
    correctAnswerIndex,
    layoutConfig: {
      variant: 'pictureSentence',
      columns: 2,
      optionMedia: {
        cardMinHeight: 160,
        cardPadding: 10,
        width: '100%',
        maxWidth: 200,
        minHeight: 120
      }
    },
    explanation: {
      sections: [
        { content: `### Explanation:` },
        { content: `A **${targetShape}** is shown below. It has **${shapeInfo.sides} sides** and **${shapeInfo.corners} corners**.` },
        { type: 'svg', content: explanationSvg }
      ]
    },
    remediation: `Look for the shape with ${shapeInfo.sides} sides and ${shapeInfo.corners} corners.`,
    metadata: {
      subject: 'math',
      topic: 'shapes',
      skillId: 'shapes-g1-identify-name-visual-opts',
      templateId: 'shapes.identify.text-to-visual',
      engine: 'shapes',
      grade: 1,
      targetShape,
      seed
    }
  };
}
