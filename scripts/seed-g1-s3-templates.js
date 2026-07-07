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

// Setups definitions for each difficulty level
const level1Setups = [
  {
    index: 0,
    items: [
      makePatternItem('blue_plus', 'blue plus', 'plus', 'blue'),
      makePatternItem('pink_dot', 'pink dot', 'dot', 'pink')
    ],
    promptIds: ['blue_plus', 'pink_dot', 'blue_plus', 'pink_dot', 'blue_plus', 'pink_dot', 'blue_plus', 'pink_dot'],
    answerIds: ['blue_plus', 'pink_dot'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }]
  },
  {
    index: 1,
    items: [
      makePatternItem('orange_square', 'orange square', 'square', 'orange'),
      makePatternItem('green_circle', 'green circle', 'circle', 'green')
    ],
    promptIds: ['orange_square', 'green_circle', 'orange_square', 'green_circle', 'orange_square', 'green_circle', 'orange_square', 'green_circle'],
    answerIds: ['orange_square', 'green_circle'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }]
  },
  {
    index: 2,
    items: [
      makePatternItem('yellow_triangle', 'yellow triangle', 'triangle', 'yellow'),
      makePatternItem('blue_star', 'blue star', 'star', 'blue')
    ],
    promptIds: ['yellow_triangle', 'blue_star', 'yellow_triangle', 'blue_star', 'yellow_triangle', 'blue_star', 'yellow_triangle', 'blue_star'],
    answerIds: ['yellow_triangle', 'blue_star'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }]
  }
];

const level2Setups = [
  {
    index: 0,
    items: [
      makePatternItem('blue_star', 'blue star', 'star', 'blue'),
      makePatternItem('yellow_spade', 'yellow spade', 'spade', 'yellow')
    ],
    promptIds: ['blue_star', 'yellow_spade', 'blue_star', 'yellow_spade', 'blue_star', 'yellow_spade', 'blue_star', 'yellow_spade'],
    answerIds: ['blue_star', 'yellow_spade'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }]
  },
  {
    index: 1,
    items: [
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink'),
      makePatternItem('purple_diamond', 'purple diamond', 'diamond', 'purple')
    ],
    promptIds: ['pink_heart', 'purple_diamond', 'pink_heart', 'purple_diamond', 'pink_heart', 'purple_diamond', 'pink_heart', 'purple_diamond'],
    answerIds: ['pink_heart', 'purple_diamond'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }]
  },
  {
    index: 2,
    items: [
      makePatternItem('green_play', 'green play', 'play', 'green'),
      makePatternItem('orange_cross', 'orange cross', 'cross', 'orange')
    ],
    promptIds: ['green_play', 'orange_cross', 'green_play', 'orange_cross', 'green_play', 'orange_cross', 'green_play', 'orange_cross'],
    answerIds: ['green_play', 'orange_cross'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }]
  }
];

const level3Setups = [
  {
    index: 0,
    items: [
      makePatternItem('green_play', 'green play', 'play', 'green'),
      makePatternItem('purple_square', 'purple square', 'square', 'purple')
    ],
    promptIds: ['green_play', 'purple_square', 'purple_square', 'slot_1', 'slot_2', 'slot_3', 'green_play', 'purple_square', 'purple_square', 'green_play', 'purple_square', 'purple_square'],
    answerIds: ['green_play', 'purple_square', 'purple_square'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }, { id: 'slot_3', label: '' }]
  },
  {
    index: 1,
    items: [
      makePatternItem('blue_circle', 'blue circle', 'circle', 'blue'),
      makePatternItem('yellow_triangle', 'yellow triangle', 'triangle', 'yellow')
    ],
    promptIds: ['blue_circle', 'yellow_triangle', 'yellow_triangle', 'slot_1', 'slot_2', 'slot_3', 'blue_circle', 'yellow_triangle', 'yellow_triangle', 'blue_circle', 'yellow_triangle', 'yellow_triangle'],
    answerIds: ['blue_circle', 'yellow_triangle', 'yellow_triangle'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }, { id: 'slot_3', label: '' }]
  },
  {
    index: 2,
    items: [
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink'),
      makePatternItem('orange_star', 'orange star', 'star', 'orange')
    ],
    promptIds: ['pink_heart', 'orange_star', 'orange_star', 'slot_1', 'slot_2', 'slot_3', 'pink_heart', 'orange_star', 'orange_star', 'pink_heart', 'orange_star', 'orange_star'],
    answerIds: ['pink_heart', 'orange_star', 'orange_star'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }, { id: 'slot_3', label: '' }]
  }
];

const level4Setups = [
  {
    index: 0,
    items: [
      makePatternItem('orange_square', 'orange square', 'square', 'orange'),
      makePatternItem('green_cross', 'green cross', 'cross', 'green')
    ],
    promptIds: ['orange_square', 'orange_square', 'green_cross', 'orange_square', 'orange_square', 'green_cross', 'slot_1', 'slot_2', 'slot_3', 'orange_square', 'orange_square', 'green_cross'],
    answerIds: ['orange_square', 'orange_square', 'green_cross'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }, { id: 'slot_3', label: '' }]
  },
  {
    index: 1,
    items: [
      makePatternItem('blue_star', 'blue star', 'star', 'blue'),
      makePatternItem('yellow_spade', 'yellow spade', 'spade', 'yellow')
    ],
    promptIds: ['blue_star', 'blue_star', 'yellow_spade', 'blue_star', 'blue_star', 'yellow_spade', 'slot_1', 'slot_2', 'slot_3', 'blue_star', 'blue_star', 'yellow_spade'],
    answerIds: ['blue_star', 'blue_star', 'yellow_spade'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }, { id: 'slot_3', label: '' }]
  },
  {
    index: 2,
    items: [
      makePatternItem('pink_heart', 'pink heart', 'heart', 'pink'),
      makePatternItem('purple_diamond', 'purple diamond', 'diamond', 'purple')
    ],
    promptIds: ['pink_heart', 'pink_heart', 'purple_diamond', 'pink_heart', 'pink_heart', 'purple_diamond', 'slot_1', 'slot_2', 'slot_3', 'pink_heart', 'pink_heart', 'purple_diamond'],
    answerIds: ['pink_heart', 'pink_heart', 'purple_diamond'],
    targets: [{ id: 'slot_1', label: '' }, { id: 'slot_2', label: '' }, { id: 'slot_3', label: '' }]
  }
];

// Helper to construct the dynamic template document structure
function buildTemplateDoc(id, title, questionText, setupsList) {
  const indexValues = setupsList.map(s => s.index);
  const itemsFormula = JSON.stringify(setupsList.map(s => s.items)) + `[index]`;
  const promptItemsFormula = JSON.stringify(setupsList.map(s => s.promptIds)) + `[index]`;
  const targetsFormula = JSON.stringify(setupsList.map(s => s.targets)) + `[index]`;
  
  // Create AnswerMap formula
  // E.g., for Level 1, we want {"slot_1": answerIds[0], "slot_2": answerIds[1]}
  // We can construct this using Object.fromEntries inside expressionParser
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
          content: 'Look at the shape pattern and place the missing shapes from the tray into the empty boxes to complete the pattern.'
        }
      ]
    },
    solution: {
      sections: [
        {
          type: 'text',
          content: '💡 **Pattern Solution:**\n\nFind the repeating unit of the pattern, then drag the correct shapes from the tray into the empty boxes in order.'
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
    buildTemplateDoc('math-patterns-complete-level1', 'Complete the Pattern: Level 1 (AB Continue)', 'Use the shapes to continue the pattern.', level1Setups),
    buildTemplateDoc('math-patterns-complete-level2', 'Complete the Pattern: Level 2 (AB Continue)', 'Use the shapes to continue the pattern.', level2Setups),
    buildTemplateDoc('math-patterns-complete-level3', 'Complete the Pattern: Level 3 (ABB Complete)', 'Use the shapes to complete the pattern.', level3Setups),
    buildTemplateDoc('math-patterns-complete-level4', 'Complete the Pattern: Level 4 (AAB Complete)', 'Use the shapes to complete the pattern.', level4Setups)
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

  // 3. Update skills_v2 for g1-s-3
  const skillUpdate = {
    id: 'g1-s-3',
    chapterId: 'grade1-patterns',
    code: 'S.3',
    engine: 'universal-template',
    gradeId: 'grade-1',
    order: 3,
    status: 'active',
    templateId: 'math-patterns-complete-level1',
    title: 'Complete a pattern',
    unitId: 'patterns',
    metadata: {
      difficultyScaling: true,
      templateLevels: [
        { level: 1, templateIds: ['math-patterns-complete-level1'] },
        { level: 2, templateIds: ['math-patterns-complete-level2'] },
        { level: 3, templateIds: ['math-patterns-complete-level3'] },
        { level: 4, templateIds: ['math-patterns-complete-level4'] }
      ]
    },
    templateLevels: [
      { level: 1, templateIds: ['math-patterns-complete-level1'] },
      { level: 2, templateIds: ['math-patterns-complete-level2'] },
      { level: 3, templateIds: ['math-patterns-complete-level3'] },
      { level: 4, templateIds: ['math-patterns-complete-level4'] }
    ],
    updatedAt: new Date()
  };

  await db.collection('skills_v2').updateOne(
    { id: 'g1-s-3' },
    { $set: skillUpdate },
    { upsert: true }
  );
  console.log('Successfully updated skills_v2 collection for g1-s-3');

  await client.close();
  console.log('Done!');
}

run().catch(console.error);
