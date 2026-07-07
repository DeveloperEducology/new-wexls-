import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
} catch (e) {}

// Color Hex Codes matching our UI palette
const colors = {
  blue: { fill: '#3b82f6', stroke: '#1d4ed8', label: 'blue' },
  purple: { fill: '#8b5cf6', stroke: '#6d28d9', label: 'purple' },
  green: { fill: '#10b981', stroke: '#047857', label: 'green' },
  yellow: { fill: '#facc15', stroke: '#ca8a04', label: 'yellow' },
  pink: { fill: '#ec4899', stroke: '#be185d', label: 'pink' },
  orange: { fill: '#f97316', stroke: '#c2410c', label: 'orange' }
};

// Shape SVG Markup generator (72x72 viewport)
function patternShapeSvg({ shape = 'square', fill = '#3b82f6', stroke = '#1d4ed8' }) {
  const size = 48;
  const offset = 12;
  const common = `fill="${fill}" stroke="${stroke}" stroke-width="2"`;
  
  const shapeMarkup = {
    square: `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" rx="6" ${common}/>`,
    circle: `<circle cx="36" cy="36" r="24" ${common}/>`,
    triangle: `<path d="M36 10 L62 58 H10 Z" ${common}/>`,
    star: `<path d="M36 6 L44 26 H66 L49 39 L55 60 L36 48 L17 60 L23 39 L6 26 H28 Z" ${common}/>`,
    heart: `<path d="M36 64 L32 60 C18 48 10 40 10 32 C10 24 16 18 24 18 C28.5 18 32.5 20.5 36 24 C39.5 20.5 43.5 18 48 18 C56 18 62 24 62 32 C62 40 54 48 40 60 Z" ${common}/>`,
    diamond: `<polygon points="36,10 62,36 36,62 10,36" ${common}/>`,
    plus: `<path d="M30 14 H42 V30 H58 V42 H42 V58 H30 V42 H14 V30 H30 Z" ${common}/>`,
    dot: `<circle cx="36" cy="36" r="14" ${common}/>`,
    play: `<polygon points="22,14 58,36 22,58" ${common}/>`,
    cross: `<path d="M22 16 L36 30 L50 16 L56 22 L42 36 L56 50 L50 56 L36 42 L22 56 L16 50 L30 36 L16 22 Z" ${common}/>`,
    spade: `<path d="M36 10 C22 24 14 31 14 43 C14 53 22 59 32 54 C31 61 27 65 22 67 H50 C45 65 41 61 40 54 C50 59 58 53 58 43 C58 31 50 24 36 10 Z" ${common}/>`
  }[shape] || `<rect x="${offset}" y="${offset}" width="${size}" height="${size}" rx="6" ${common}/>`;

  return `<svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" width="72" height="72">${shapeMarkup}</svg>`;
}

// Build item configurations
function makePatternItem(id, label, shape, colorKey) {
  const color = colors[colorKey];
  return {
    id,
    label: `${color.label} ${shape}`,
    content: `${color.label} ${shape}`,
    svg: patternShapeSvg({ shape, fill: color.fill, stroke: color.stroke }),
    imageWidth: 92
  };
}

const targetSlots = [
  { id: 'slot_1', label: '' },
  { id: 'slot_2', label: '' },
  { id: 'slot_3', label: '' },
  { id: 'slot_4', label: '' },
  { id: 'slot_5', label: '' },
  { id: 'slot_6', label: '' },
  { id: 'slot_7', label: '' },
  { id: 'slot_8', label: '' },
  { id: 'slot_9', label: '' }
];

// Setups definitions for each difficulty level
const level1Setups = [
  // Setup 0: spade (blue), square (green) -> growing A: AB, AAB, AAAB
  {
    index: 0,
    items: [
      makePatternItem('blue_spade', 'blue spade', 'spade', 'blue'),
      makePatternItem('green_square', 'green square', 'square', 'green')
    ],
    promptIds: ['blue_spade', 'green_square', 'blue_spade', 'blue_spade', 'green_square', 'blue_spade', 'blue_spade', 'blue_spade', 'green_square'],
    answerIds: ['blue_spade', 'green_square', 'blue_spade', 'blue_spade', 'green_square', 'blue_spade', 'blue_spade', 'blue_spade', 'green_square'],
    targets: targetSlots
  },
  // Setup 1: circle (orange), diamond (purple) -> growing A
  {
    index: 1,
    items: [
      makePatternItem('orange_circle', 'orange circle', 'circle', 'orange'),
      makePatternItem('purple_diamond', 'purple diamond', 'diamond', 'purple')
    ],
    promptIds: ['orange_circle', 'purple_diamond', 'orange_circle', 'orange_circle', 'purple_diamond', 'orange_circle', 'orange_circle', 'orange_circle', 'purple_diamond'],
    answerIds: ['orange_circle', 'purple_diamond', 'orange_circle', 'orange_circle', 'purple_diamond', 'orange_circle', 'orange_circle', 'orange_circle', 'purple_diamond'],
    targets: targetSlots
  },
  // Setup 2: star (yellow), heart (pink) -> growing A
  {
    index: 2,
    items: [
      makePatternItem('yellow_star', 'yellow star', 'star', 'yellow'),
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink')
    ],
    promptIds: ['yellow_star', 'pink_heart', 'yellow_star', 'yellow_star', 'pink_heart', 'yellow_star', 'yellow_star', 'yellow_star', 'pink_heart'],
    answerIds: ['yellow_star', 'pink_heart', 'yellow_star', 'yellow_star', 'pink_heart', 'yellow_star', 'yellow_star', 'yellow_star', 'pink_heart'],
    targets: targetSlots
  }
];

const level2Setups = [
  // Setup 0: square (blue), triangle (green) -> growing B: AB, ABB, ABBB
  {
    index: 0,
    items: [
      makePatternItem('blue_square', 'blue square', 'square', 'blue'),
      makePatternItem('green_triangle', 'green triangle', 'triangle', 'green')
    ],
    promptIds: ['blue_square', 'green_triangle', 'blue_square', 'green_triangle', 'green_triangle', 'blue_square', 'green_triangle', 'green_triangle', 'green_triangle'],
    answerIds: ['blue_square', 'green_triangle', 'blue_square', 'green_triangle', 'green_triangle', 'blue_square', 'green_triangle', 'green_triangle', 'green_triangle'],
    targets: targetSlots
  },
  // Setup 1: dot (orange), plus (purple) -> growing B
  {
    index: 1,
    items: [
      makePatternItem('orange_dot', 'orange dot', 'dot', 'orange'),
      makePatternItem('purple_plus', 'purple plus', 'plus', 'purple')
    ],
    promptIds: ['orange_dot', 'purple_plus', 'orange_dot', 'purple_plus', 'purple_plus', 'orange_dot', 'purple_plus', 'purple_plus', 'purple_plus'],
    answerIds: ['orange_dot', 'purple_plus', 'orange_dot', 'purple_plus', 'purple_plus', 'orange_dot', 'purple_plus', 'purple_plus', 'purple_plus'],
    targets: targetSlots
  },
  // Setup 2: play (yellow), star (pink) -> growing B
  {
    index: 2,
    items: [
      makePatternItem('yellow_play', 'yellow play', 'play', 'yellow'),
      makePatternItem('pink_star', 'pink star', 'star', 'pink')
    ],
    promptIds: ['yellow_play', 'pink_star', 'yellow_play', 'pink_star', 'pink_star', 'yellow_play', 'pink_star', 'pink_star', 'pink_star'],
    answerIds: ['yellow_play', 'pink_star', 'yellow_play', 'pink_star', 'pink_star', 'yellow_play', 'pink_star', 'pink_star', 'pink_star'],
    targets: targetSlots
  }
];

const level3Setups = [
  // Setup 0: heart (purple), circle (orange) -> growing B
  {
    index: 0,
    items: [
      makePatternItem('purple_heart', 'purple heart', 'heart', 'purple'),
      makePatternItem('orange_circle', 'orange circle', 'circle', 'orange')
    ],
    promptIds: ['purple_heart', 'orange_circle', 'purple_heart', 'orange_circle', 'orange_circle', 'purple_heart', 'orange_circle', 'orange_circle', 'orange_circle'],
    answerIds: ['purple_heart', 'orange_circle', 'purple_heart', 'orange_circle', 'orange_circle', 'purple_heart', 'orange_circle', 'orange_circle', 'orange_circle'],
    targets: targetSlots
  },
  // Setup 1: spade (green), square (yellow) -> growing B
  {
    index: 1,
    items: [
      makePatternItem('green_spade', 'green spade', 'spade', 'green'),
      makePatternItem('yellow_square', 'yellow square', 'square', 'yellow')
    ],
    promptIds: ['green_spade', 'yellow_square', 'green_spade', 'yellow_square', 'yellow_square', 'green_spade', 'yellow_square', 'yellow_square', 'yellow_square'],
    answerIds: ['green_spade', 'yellow_square', 'green_spade', 'yellow_square', 'yellow_square', 'green_spade', 'yellow_square', 'yellow_square', 'yellow_square'],
    targets: targetSlots
  },
  // Setup 2: play (blue), cross (pink) -> growing B
  {
    index: 2,
    items: [
      makePatternItem('blue_play', 'blue play', 'play', 'blue'),
      makePatternItem('pink_cross', 'pink cross', 'cross', 'pink')
    ],
    promptIds: ['blue_play', 'pink_cross', 'blue_play', 'pink_cross', 'pink_cross', 'blue_play', 'pink_cross', 'pink_cross', 'pink_cross'],
    answerIds: ['blue_play', 'pink_cross', 'blue_play', 'pink_cross', 'pink_cross', 'blue_play', 'pink_cross', 'pink_cross', 'pink_cross'],
    targets: targetSlots
  }
];

const level4Setups = [
  // Setup 0: square (green), triangle (green) -> growing B (same color)
  {
    index: 0,
    items: [
      makePatternItem('green_square', 'green square', 'square', 'green'),
      makePatternItem('green_triangle', 'green triangle', 'triangle', 'green')
    ],
    promptIds: ['green_square', 'green_triangle', 'green_square', 'green_triangle', 'green_triangle', 'green_square', 'green_triangle', 'green_triangle', 'green_triangle'],
    answerIds: ['green_square', 'green_triangle', 'green_square', 'green_triangle', 'green_triangle', 'green_square', 'green_triangle', 'green_triangle', 'green_triangle'],
    targets: targetSlots
  },
  // Setup 1: circle (blue), star (blue) -> growing B (same color)
  {
    index: 1,
    items: [
      makePatternItem('blue_circle', 'blue circle', 'circle', 'blue'),
      makePatternItem('blue_star', 'blue star', 'star', 'blue')
    ],
    promptIds: ['blue_circle', 'blue_star', 'blue_circle', 'blue_star', 'blue_star', 'blue_circle', 'blue_star', 'blue_star', 'blue_star'],
    answerIds: ['blue_circle', 'blue_star', 'blue_circle', 'blue_star', 'blue_star', 'blue_circle', 'blue_star', 'blue_star', 'blue_star'],
    targets: targetSlots
  },
  // Setup 2: heart (pink), dot (pink) -> growing B (same color)
  {
    index: 2,
    items: [
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink'),
      makePatternItem('pink_dot', 'pink dot', 'dot', 'pink')
    ],
    promptIds: ['pink_heart', 'pink_dot', 'pink_heart', 'pink_dot', 'pink_dot', 'pink_heart', 'pink_dot', 'pink_dot', 'pink_dot'],
    answerIds: ['pink_heart', 'pink_dot', 'pink_heart', 'pink_dot', 'pink_dot', 'pink_heart', 'pink_dot', 'pink_dot', 'pink_dot'],
    targets: targetSlots
  }
];

// Helper to construct the dynamic template document structure
function buildTemplateDoc(id, title, questionText, setupsList) {
  const indexValues = setupsList.map(s => s.index);
  const itemsFormula = JSON.stringify(setupsList.map(s => s.items)) + `[index]`;
  const promptItemsFormula = JSON.stringify(setupsList.map(s => s.promptIds)) + `[index]`;
  const targetsFormula = JSON.stringify(setupsList.map(s => s.targets)) + `[index]`;
  
  // Create AnswerMap formula
  const mappings = setupsList.map(s => {
    return s.targets.map((t, idx) => `["${t.id}", "${s.answerIds[idx]}"]`);
  });
  const answerMappingFormula = `[[` + mappings.map(m => `Object.fromEntries([${m.join(', ')}])`).join(', ') + `][index]][0]`;

  const columnsFormula = `[` + setupsList.map(s => s.targets.length).join(', ') + `][index]`;

  return {
    id: id,
    _id: id,
    title: title,
    subject: 'math',
    topic: 'patterns',
    grade: '1',
    optionsType: 'categorizationv2',
    interaction: {
      engine: 'categorizationv2'
    },
    type: 'universal',
    questionText: questionText,
    answer: '[AnswerMap]',
    correctAnswer: '[AnswerMap]',
    parts: [
      { type: 'text', content: questionText },
      {
        type: 'categorizationv2',
        renderer: 'html',
        layoutMode: 'grid_fill',
        isCopiable: true,
        hideItemLabels: true,
        items: '[ItemsList]',
        targets: '[TargetsList]',
        grid: {
          columns: '[ColumnsCount]',
          requiredCount: '[ColumnsCount]',
          fitToWindow: true,
          cellMinHeight: 84
        },
        pattern: {
          promptItems: '[PromptItemsList]',
          hideLabels: true
        },
        behavior: {
          clickToDrop: true,
          clickToNextEmpty: true,
          dragToDrop: true,
          isCopiable: true,
          preserveSourceSlots: true
        }
      }
    ],
    explanation: {
      sections: [
        {
          type: 'text',
          content: 'Copy the growing pattern by dragging the shapes from the tray below into the empty boxes in the exact same order as the pattern shown above.'
        }
      ]
    },
    solution: {
      sections: [
        {
          type: 'text',
          content: '💡 **Pattern Solution:**\n\nCopy the growing pattern by dragging the shapes from the tray below into the empty boxes in the exact same order as the pattern shown above.'
        }
      ]
    },
    variables: [
      { name: 'index', type: 'array', values: indexValues },
      { name: 'ItemsList', type: 'expression', formula: itemsFormula },
      { name: 'PromptItemsList', type: 'expression', formula: promptItemsFormula },
      { name: 'TargetsList', type: 'expression', formula: targetsFormula },
      { name: 'AnswerMap', type: 'expression', formula: answerMappingFormula },
      { name: 'ColumnsCount', type: 'expression', formula: columnsFormula }
    ],
    createdAt: new Date(),
    updatedAt: new Date()
  };
}

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('No MONGODB_URI found.');
    process.exit(1);
  }
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB || 'wexls');

  const templates = [
    buildTemplateDoc('math-patterns-growing-level1', 'Growing Patterns: Level 1 (Grow A, Colors)', 'Copy the pattern.', level1Setups),
    buildTemplateDoc('math-patterns-growing-level2', 'Growing Patterns: Level 2 (Grow B, Colors)', 'Copy the pattern.', level2Setups),
    buildTemplateDoc('math-patterns-growing-level3', 'Growing Patterns: Level 3 (Grow B, Diff Shapes)', 'Copy the pattern.', level3Setups),
    buildTemplateDoc('math-patterns-growing-level4', 'Growing Patterns: Level 4 (Grow B, Same Color)', 'Copy the pattern.', level4Setups)
  ];

  for (const doc of templates) {
    // 1. Insert into dynamic_templates
    await db.collection('dynamic_templates').updateOne(
      { id: doc.id },
      { $set: doc },
      { upsert: true }
    );
    
    // 2. Insert into templates (JNVST support)
    const examTemplateDoc = {
      _id: doc.id,
      name: doc.title,
      type: 'universal',
      examId: 'jnvst',
      section: 'arithmetic',
      topic: doc.topic,
      difficulty: 0.8,
      config: doc,
      generatedCount: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.collection('templates').updateOne(
      { _id: doc.id },
      { $set: examTemplateDoc },
      { upsert: true }
    );
    
    console.log(`Successfully saved template: ${doc.id}`);
  }

  // 3. Update skills_v2 for g1-s-5
  const skillUpdate = {
    id: 'g1-s-5',
    chapterId: 'grade1-patterns',
    code: 'S.5',
    engine: 'universal-template',
    gradeId: 'grade-1',
    order: 5,
    status: 'active',
    templateId: 'math-patterns-growing-level1',
    title: 'Growing patterns',
    unitId: 'patterns',
    metadata: {
      difficultyScaling: true,
      templateLevels: [
        { level: 1, templateIds: ['math-patterns-growing-level1'] },
        { level: 2, templateIds: ['math-patterns-growing-level2'] },
        { level: 3, templateIds: ['math-patterns-growing-level3'] },
        { level: 4, templateIds: ['math-patterns-growing-level4'] }
      ]
    },
    templateLevels: [
      { level: 1, templateIds: ['math-patterns-growing-level1'] },
      { level: 2, templateIds: ['math-patterns-growing-level2'] },
      { level: 3, templateIds: ['math-patterns-growing-level3'] },
      { level: 4, templateIds: ['math-patterns-growing-level4'] }
    ],
    updatedAt: new Date()
  };

  await db.collection('skills_v2').updateOne(
    { id: 'g1-s-5' },
    { $set: skillUpdate },
    { upsert: true }
  );
  console.log('Successfully updated skills_v2 collection for g1-s-5');

  await client.close();
  console.log('Done!');
}

run().catch(console.error);
