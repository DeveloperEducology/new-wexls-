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
  { id: 'slot_8', label: '' }
];

// Setups definitions for each difficulty level
const level1Setups = [
  // Setup 0: orange circle, green triangle (AB pattern)
  {
    index: 0,
    items: [
      makePatternItem('orange_circle', 'orange circle', 'circle', 'orange'),
      makePatternItem('green_triangle', 'green triangle', 'triangle', 'green')
    ],
    promptIds: ['orange_circle', 'green_triangle'],
    answerIds: [
      'orange_circle', 'green_triangle',
      'orange_circle', 'green_triangle',
      'orange_circle', 'green_triangle',
      'orange_circle', 'green_triangle'
    ],
    targets: targetSlots
  },
  // Setup 1: blue plus, pink dot
  {
    index: 1,
    items: [
      makePatternItem('blue_plus', 'blue plus', 'plus', 'blue'),
      makePatternItem('pink_dot', 'pink dot', 'dot', 'pink')
    ],
    promptIds: ['blue_plus', 'pink_dot'],
    answerIds: [
      'blue_plus', 'pink_dot',
      'blue_plus', 'pink_dot',
      'blue_plus', 'pink_dot',
      'blue_plus', 'pink_dot'
    ],
    targets: targetSlots
  },
  // Setup 2: yellow star, purple square
  {
    index: 2,
    items: [
      makePatternItem('yellow_star', 'yellow star', 'star', 'yellow'),
      makePatternItem('purple_square', 'purple square', 'square', 'purple')
    ],
    promptIds: ['yellow_star', 'purple_square'],
    answerIds: [
      'yellow_star', 'purple_square',
      'yellow_star', 'purple_square',
      'yellow_star', 'purple_square',
      'yellow_star', 'purple_square'
    ],
    targets: targetSlots
  }
];

const level2Setups = [
  // Setup 0: purple spade, green circle, green circle (ABB pattern)
  {
    index: 0,
    items: [
      makePatternItem('purple_spade', 'purple spade', 'spade', 'purple'),
      makePatternItem('green_circle', 'green circle', 'circle', 'green')
    ],
    promptIds: ['purple_spade', 'green_circle', 'green_circle'],
    answerIds: [
      'purple_spade', 'green_circle', 'green_circle',
      'purple_spade', 'green_circle', 'green_circle',
      'purple_spade', 'green_circle'
    ],
    targets: targetSlots
  },
  // Setup 1: blue star, pink heart, pink heart
  {
    index: 1,
    items: [
      makePatternItem('blue_star', 'blue star', 'star', 'blue'),
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink')
    ],
    promptIds: ['blue_star', 'pink_heart', 'pink_heart'],
    answerIds: [
      'blue_star', 'pink_heart', 'pink_heart',
      'blue_star', 'pink_heart', 'pink_heart',
      'blue_star', 'pink_heart'
    ],
    targets: targetSlots
  },
  // Setup 2: yellow triangle, orange cross, orange cross
  {
    index: 2,
    items: [
      makePatternItem('yellow_triangle', 'yellow triangle', 'triangle', 'yellow'),
      makePatternItem('orange_cross', 'orange cross', 'cross', 'orange')
    ],
    promptIds: ['yellow_triangle', 'orange_cross', 'orange_cross'],
    answerIds: [
      'yellow_triangle', 'orange_cross', 'orange_cross',
      'yellow_triangle', 'orange_cross', 'orange_cross',
      'yellow_triangle', 'orange_cross'
    ],
    targets: targetSlots
  }
];

const level3Setups = [
  // Setup 0: green star, green star, purple square (AAB pattern)
  {
    index: 0,
    items: [
      makePatternItem('green_star', 'green star', 'star', 'green'),
      makePatternItem('purple_square', 'purple square', 'square', 'purple')
    ],
    promptIds: ['green_star', 'green_star', 'purple_square'],
    answerIds: [
      'green_star', 'green_star', 'purple_square',
      'green_star', 'green_star', 'purple_square',
      'green_star', 'green_star'
    ],
    targets: targetSlots
  },
  // Setup 1: orange circle, orange circle, blue plus
  {
    index: 1,
    items: [
      makePatternItem('orange_circle', 'orange circle', 'circle', 'orange'),
      makePatternItem('blue_plus', 'blue plus', 'plus', 'blue')
    ],
    promptIds: ['orange_circle', 'orange_circle', 'blue_plus'],
    answerIds: [
      'orange_circle', 'orange_circle', 'blue_plus',
      'orange_circle', 'orange_circle', 'blue_plus',
      'orange_circle', 'orange_circle'
    ],
    targets: targetSlots
  },
  // Setup 2: pink heart, pink heart, yellow spade
  {
    index: 2,
    items: [
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink'),
      makePatternItem('yellow_spade', 'yellow spade', 'spade', 'yellow')
    ],
    promptIds: ['pink_heart', 'pink_heart', 'yellow_spade'],
    answerIds: [
      'pink_heart', 'pink_heart', 'yellow_spade',
      'pink_heart', 'pink_heart', 'yellow_spade',
      'pink_heart', 'pink_heart'
    ],
    targets: targetSlots
  }
];

const level4Setups = [
  // Setup 0: blue star, green circle, orange square (ABC pattern)
  {
    index: 0,
    items: [
      makePatternItem('blue_star', 'blue star', 'star', 'blue'),
      makePatternItem('green_circle', 'green circle', 'circle', 'green'),
      makePatternItem('orange_square', 'orange square', 'square', 'orange')
    ],
    promptIds: ['blue_star', 'green_circle', 'orange_square'],
    answerIds: [
      'blue_star', 'green_circle', 'orange_square',
      'blue_star', 'green_circle', 'orange_square',
      'blue_star', 'green_circle'
    ],
    targets: targetSlots
  },
  // Setup 1: pink heart, purple diamond, yellow play
  {
    index: 1,
    items: [
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink'),
      makePatternItem('purple_diamond', 'purple diamond', 'diamond', 'purple'),
      makePatternItem('yellow_play', 'yellow play', 'play', 'yellow')
    ],
    promptIds: ['pink_heart', 'purple_diamond', 'yellow_play'],
    answerIds: [
      'pink_heart', 'purple_diamond', 'yellow_play',
      'pink_heart', 'purple_diamond', 'yellow_play',
      'pink_heart', 'purple_diamond'
    ],
    targets: targetSlots
  },
  // Setup 2: orange square, blue plus, green cross
  {
    index: 2,
    items: [
      makePatternItem('orange_square', 'orange square', 'square', 'orange'),
      makePatternItem('blue_plus', 'blue plus', 'plus', 'blue'),
      makePatternItem('green_cross', 'green cross', 'cross', 'green')
    ],
    promptIds: ['orange_square', 'blue_plus', 'green_cross'],
    answerIds: [
      'orange_square', 'blue_plus', 'green_cross',
      'orange_square', 'blue_plus', 'green_cross',
      'orange_square', 'blue_plus'
    ],
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
          hideLabels: true,
          isInline: true
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
          content: 'Identify the pattern rule (e.g. AB, ABB, AAB, ABC), then drag the shapes into the empty boxes to continue it in the exact same sequence.'
        }
      ]
    },
    solution: {
      sections: [
        {
          type: 'text',
          content: '💡 **Pattern Solution:**\n\nIdentify the repeating pattern, then drag the correct shapes from the tray to continue the sequence.'
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
    buildTemplateDoc('math-patterns-make-level1', 'Make the Pattern: Level 1 (AB)', 'Use the shapes to continue the AB pattern.', level1Setups),
    buildTemplateDoc('math-patterns-make-level2', 'Make the Pattern: Level 2 (ABB)', 'Use the shapes to continue the ABB pattern.', level2Setups),
    buildTemplateDoc('math-patterns-make-level3', 'Make the Pattern: Level 3 (AAB)', 'Use the shapes to continue the AAB pattern.', level3Setups),
    buildTemplateDoc('math-patterns-make-level4', 'Make the Pattern: Level 4 (ABC)', 'Use the shapes to continue the ABC pattern.', level4Setups)
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

  // 3. Update skills_v2 for g1-s-4
  const skillUpdate = {
    id: 'g1-s-4',
    chapterId: 'grade1-patterns',
    code: 'S.4',
    engine: 'universal-template',
    gradeId: 'grade-1',
    order: 4,
    status: 'active',
    templateId: 'math-patterns-make-level1',
    title: 'Make a pattern',
    unitId: 'patterns',
    metadata: {
      difficultyScaling: true,
      templateLevels: [
        { level: 1, templateIds: ['math-patterns-make-level1'] },
        { level: 2, templateIds: ['math-patterns-make-level2'] },
        { level: 3, templateIds: ['math-patterns-make-level3'] },
        { level: 4, templateIds: ['math-patterns-make-level4'] }
      ]
    },
    templateLevels: [
      { level: 1, templateIds: ['math-patterns-make-level1'] },
      { level: 2, templateIds: ['math-patterns-make-level2'] },
      { level: 3, templateIds: ['math-patterns-make-level3'] },
      { level: 4, templateIds: ['math-patterns-make-level4'] }
    ],
    updatedAt: new Date()
  };

  await db.collection('skills_v2').updateOne(
    { id: 'g1-s-4' },
    { $set: skillUpdate },
    { upsert: true }
  );
  console.log('Successfully updated skills_v2 collection for g1-s-4');

  await client.close();
  console.log('Done!');
}

run().catch(console.error);
