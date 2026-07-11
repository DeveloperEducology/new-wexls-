import { getMongoDb } from '@/lib/db/mongo';
import { saveDynamicTemplate } from '../practice/questionBank/dynamicTemplatesRepository';

const COLLECTION_MAP = {
  grade: 'imo_grades',
  subject: 'imo_subjects',
  unit: 'imo_units',
  chapter: 'imo_chapters',
  skill: 'imo_skills',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getImoCollection(type) {
  const db = await getMongoDb();
  if (!db) throw new Error('Database connection failed.');
  const collectionName = COLLECTION_MAP[type];
  if (!collectionName) throw new Error(`Unknown IMO curriculum type: ${type}`);
  const collection = db.collection(collectionName);
  
  // Ensure indexes
  await collection.createIndex({ id: 1 }, { unique: true });
  if (type === 'unit') {
    await collection.createIndex({ subjectId: 1 });
  } else if (type === 'chapter') {
    await collection.createIndex({ unitId: 1, gradeId: 1 });
  } else if (type === 'skill') {
    await collection.createIndex({ chapterId: 1 });
  }
  
  return collection;
}

export async function createImoNode(type, data) {
  const collection = await getImoCollection(type);
  const id = slugify(data.id || data.title || data.name);
  if (!id) throw new Error('ID or Title is required to create a node.');
  
  const now = new Date();
  const normalized = {
    ...data,
    id,
    _id: id,
    status: data.status || 'active',
    order: Number.isFinite(Number(data.order)) ? Number(data.order) : 0,
    createdAt: data.createdAt || now,
    updatedAt: now,
  };

  if (normalized.title && typeof normalized.title === 'string') {
    normalized.title = normalized.title.trim();
  }
  if (normalized.code && typeof normalized.code === 'string') {
    normalized.code = normalized.code.trim();
  }
  if (normalized.engine && typeof normalized.engine === 'string') {
    normalized.engine = normalized.engine.trim();
  }

  // Normalize relation IDs
  if (normalized.subjectId) normalized.subjectId = slugify(normalized.subjectId);
  if (normalized.unitId) normalized.unitId = slugify(normalized.unitId);
  if (normalized.gradeId) normalized.gradeId = slugify(normalized.gradeId);
  if (normalized.chapterId) normalized.chapterId = slugify(normalized.chapterId);

  await collection.updateOne({ id }, { $set: normalized }, { upsert: true });
  return collection.findOne({ id });
}

export async function listImoNodes(type, query = {}) {
  const collection = await getImoCollection(type);
  const filter = { ...query };
  
  if (filter.subjectId) filter.subjectId = slugify(filter.subjectId);
  if (filter.unitId) filter.unitId = slugify(filter.unitId);
  if (filter.gradeId) filter.gradeId = slugify(filter.gradeId);
  if (filter.chapterId) filter.chapterId = slugify(filter.chapterId);

  const docs = await collection.find(filter).sort({ order: 1, title: 1 }).toArray();
  return docs.map(doc => ({
    ...doc,
    _id: doc._id ? String(doc._id) : undefined
  }));
}

export async function deleteImoNode(type, id) {
  const collection = await getImoCollection(type);
  const result = await collection.deleteOne({ id: slugify(id) });
  return { deletedCount: result.deletedCount };
}

export async function seedImoInitial() {
  try {
    console.log('Seeding IMO Grade 3 curriculum and dynamic templates...');

    // 1. Seed Grade
    await createImoNode('grade', { id: 'grade-3', title: 'Grade 3 (Olympiad/IMO)', order: 3 });

    // 2. Seed Subject
    await createImoNode('subject', { id: 'math', title: 'Mathematics', icon: '🧮', order: 1 });

    // 3. Seed Unit (Topic)
    await createImoNode('unit', { id: 'number-sense', title: 'Number Sense & Place Value', subjectId: 'math', color: '#6366f1', order: 1 });

    // 4. Seed Chapter
    await createImoNode('chapter', { id: 'number-sense-ch', title: 'Chapter 1: Number Sense', unitId: 'number-sense', gradeId: 'grade-3', order: 1 });

    // 5. Seed Skills
    const skills = [
      { id: 'imo-g3-place-face', title: 'Place Value vs. Face Value', chapterId: 'number-sense-ch', code: 'N.3.1.1', templateId: 'template-imo-g3-place-face-value', engine: 'universal-template', order: 1 },
      { id: 'imo-g3-write-read', title: 'Reading & Writing 4-Digit Numbers', chapterId: 'number-sense-ch', code: 'N.3.1.2', templateId: 'template-imo-g3-write-read-numbers', engine: 'universal-template', order: 2 },
      { id: 'imo-g3-expanded-std', title: 'Expanded and Standard Form', chapterId: 'number-sense-ch', code: 'N.3.1.3', templateId: 'template-imo-g3-expanded-standard', engine: 'universal-template', order: 3 },
      { id: 'imo-g3-succ-pred', title: 'Successor, Predecessor & Comparing', chapterId: 'number-sense-ch', code: 'N.3.1.4', templateId: 'template-imo-g3-successor-predecessor', engine: 'universal-template', order: 4 },
      { id: 'imo-g3-build-numbers', title: 'Building Greatest & Smallest Numbers', chapterId: 'number-sense-ch', code: 'N.3.1.5', templateId: 'template-imo-g3-building-numbers', engine: 'universal-template', order: 5 },
      { id: 'imo-g3-rounding', title: 'Rounding Off to Tens & Hundreds', chapterId: 'number-sense-ch', code: 'N.3.1.6', templateId: 'template-imo-g3-rounding-off', engine: 'universal-template', order: 6 },
      { id: 'imo-g3-roman', title: 'Roman Numerals up to 100', chapterId: 'number-sense-ch', code: 'N.3.1.7', templateId: 'template-imo-g3-roman-numerals', engine: 'universal-template', order: 7 },
      { id: 'imo-g3-even-odd', title: 'Even and Odd Number Rules', chapterId: 'number-sense-ch', code: 'N.3.1.8', templateId: 'template-imo-g3-even-odd', engine: 'universal-template', order: 8 },
      { id: 'imo-g3-patterns', title: 'Number Patterns & Skip Counting', chapterId: 'number-sense-ch', code: 'N.3.1.9', templateId: 'template-imo-g3-patterns-skip', engine: 'universal-template', order: 9 },
    ];

    for (const s of skills) {
      await createImoNode('skill', s);
    }

    // 6. Seed Dynamic Templates
    const templates = [
      {
        id: 'template-imo-g3-place-face-value',
        title: 'Place Value vs Face Value (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'fill_blank',
        questionText: 'Find the difference between the place value of [digit1] and the face value of [digit2] in the number **[number]**.\n[[blank1]]',
        solution: 'Step 1: The place value of [digit1] at hundreds place is [digit1 * 100].\nStep 2: The face value of [digit2] is simply [digit2] itself.\nStep 3: Subtract: [digit1 * 100] - [digit2] = [Result]!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { blank1: '[Result]' } }
        ],
        variables: [
          {
            name: 'numObj',
            type: 'choice',
            pool: [
              { val: 8754, d3: 8, d2: 7, d1: 5, d0: 4 },
              { val: 6982, d3: 6, d2: 9, d1: 8, d0: 2 },
              { val: 7523, d3: 7, d2: 5, d1: 2, d0: 3 },
              { val: 9861, d3: 9, d2: 8, d1: 6, d0: 1 }
            ]
          },
          { name: 'digit1', type: 'expression', formula: 'numObj.d2' },
          { name: 'digit2', type: 'expression', formula: 'numObj.d0' },
          { name: 'number', type: 'expression', formula: 'numObj.val' },
          { name: 'Result', type: 'expression', formula: 'digit1 * 100 - digit2' }
        ]
      },
      {
        id: 'template-imo-g3-write-read-numbers',
        title: 'Read and Write 4-Digit Numbers (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'mcq',
        questionText: 'Choose the numeric representation of the number: **"[numObj.words]"**.\n[[mcq]]',
        solution: 'Step 1: Break down the word name:\n- [numObj.words] corresponds to [numObj.val].\nStep 2: Correct standard form value is [Result]!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { mcq: '[Result]' } }
        ],
        variables: [
          {
            name: 'numObj',
            type: 'choice',
            pool: [
              { val: 7205, words: 'Seven thousand two hundred five' },
              { val: 6052, words: 'Six thousand fifty-two' },
              { val: 8901, words: 'Eight thousand nine hundred one' },
              { val: 5004, words: 'Five thousand four' }
            ]
          },
          { name: 'Result', type: 'expression', formula: 'numObj.val' },
          { name: 'distractor_1', type: 'expression', formula: 'numObj.val + 9' },
          { name: 'distractor_2', type: 'expression', formula: 'numObj.val - 9' },
          { name: 'distractor_3', type: 'expression', formula: 'numObj.val + 90' }
        ]
      },
      {
        id: 'template-imo-g3-expanded-standard',
        title: 'Expanded vs Standard Form (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'mcq',
        questionText: 'Which number is represented by the expanded form: **[numObj.expanded]**?\n[[mcq]]',
        solution: 'Step 1: Sum each place value: [numObj.expanded] = [Result]!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { mcq: '[Result]' } }
        ],
        variables: [
          {
            name: 'numObj',
            type: 'choice',
            pool: [
              { val: 5048, expanded: '5000 + 40 + 8' },
              { val: 7302, expanded: '7000 + 300 + 2' },
              { val: 9080, expanded: '9000 + 80' },
              { val: 4610, expanded: '4000 + 600 + 10' }
            ]
          },
          { name: 'Result', type: 'expression', formula: 'numObj.val' },
          { name: 'distractor_1', type: 'expression', formula: 'numObj.val + 9' },
          { name: 'distractor_2', type: 'expression', formula: 'numObj.val - 9' },
          { name: 'distractor_3', type: 'expression', formula: 'numObj.val + 90' }
        ]
      },
      {
        id: 'template-imo-g3-successor-predecessor',
        title: 'Successor and Predecessor (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'fill_blank',
        questionText: 'Find the predecessor of the successor of **[number]**.\n[[blank1]]',
        solution: 'Step 1: The successor of [number] is [number + 1].\nStep 2: The predecessor of [number + 1] is predecessor([number + 1]) = [number].\nStep 3: Predecessor of a successor of any number is the number itself!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { blank1: '[Result]' } }
        ],
        variables: [
          { name: 'number', type: 'range', min: 100, max: 9999 },
          { name: 'Result', type: 'expression', formula: 'number' }
        ]
      },
      {
        id: 'template-imo-g3-building-numbers',
        title: 'Forming Smallest 4-Digit Number (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'fill_blank',
        questionText: 'Form the smallest 4-digit number using the digits **[numObj.d1], [numObj.d2], [numObj.d3], [numObj.d4]** without repetition (remember a 4-digit number cannot start with 0).\n[[blank1]]',
        solution: 'Step 1: Sort digits in ascending order.\nStep 2: If 0 is present, place the next smallest digit first, then 0.\nStep 3: Smallest number is [Result]!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { blank1: '[Result]' } }
        ],
        variables: [
          {
            name: 'numObj',
            type: 'choice',
            pool: [
              { d1: 4, d2: 0, d3: 8, d4: 3, ans: 3048 },
              { d1: 6, d2: 1, d3: 0, d4: 9, ans: 1069 },
              { d1: 5, d2: 0, d3: 2, d4: 7, ans: 2057 },
              { d1: 8, d2: 3, d3: 0, d4: 1, ans: 1038 }
            ]
          },
          { name: 'Result', type: 'expression', formula: 'numObj.ans' }
        ]
      },
      {
        id: 'template-imo-g3-rounding-off',
        title: 'Rounding Off Quantities (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'fill_blank',
        questionText: 'What is the sum of **[num1]** rounded to the nearest ten and **[num2]** rounded to the nearest hundred?\n[[blank1]]',
        solution: 'Step 1: Round [num1] to the nearest ten: [r1].\nStep 2: Round [num2] to the nearest hundred: [r2].\nStep 3: Add: [r1] + [r2] = [Result]!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { blank1: '[Result]' } }
        ],
        variables: [
          { name: 'num1', type: 'choice', pool: [342, 581, 219, 456] },
          { name: 'num2', type: 'choice', pool: [567, 234, 881, 149] },
          { name: 'r1', type: 'expression', formula: 'Math.round(num1 / 10) * 10' },
          { name: 'r2', type: 'expression', formula: 'Math.round(num2 / 100) * 100' },
          { name: 'Result', type: 'expression', formula: 'r1 + r2' }
        ]
      },
      {
        id: 'template-imo-g3-roman-numerals',
        title: 'Roman Numerals Math (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'mcq',
        questionText: 'Solve the expression and choose the correct Roman Numeral: **[numObj.expr]**\n[[mcq]]',
        solution: 'Step 1: Evaluate expression values in standard digits.\nStep 2: Convert standard result back to Roman Numeral: [Result]!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { mcq: '[Result]' } }
        ],
        variables: [
          {
            name: 'numObj',
            type: 'choice',
            pool: [
              { expr: 'XLIV + XXVI', ans: 'LXX', dist1: 'LXVI', dist2: 'LXXVI', dist3: 'LX' },
              { expr: 'LXII - XIV', ans: 'XLVIII', dist1: 'XLVII', dist2: 'LIII', dist3: 'LIV' },
              { expr: 'XXXV + XV', ans: 'L', dist1: 'XL', dist2: 'LV', dist3: 'LX' },
              { expr: 'XCIX - LIX', ans: 'XL', dist1: 'L', dist2: 'XXXIX', dist3: 'XLI' }
            ]
          },
          { name: 'Result', type: 'expression', formula: 'numObj.ans' },
          { name: 'distractor_1', type: 'expression', formula: 'numObj.dist1' },
          { name: 'distractor_2', type: 'expression', formula: 'numObj.dist2' },
          { name: 'distractor_3', type: 'expression', formula: 'numObj.dist3' }
        ]
      },
      {
        id: 'template-imo-g3-even-odd',
        title: 'Even & Odd Operations Rules (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'mcq',
        questionText: 'If **A** is an odd number and **B** is an even number, what type of number is **(A * B) + A**?\n[[mcq]]',
        solution: 'Step 1: Odd (A) * Even (B) = Even.\nStep 2: Even (A*B) + Odd (A) = Odd.\nStep 3: Result is always Odd!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { mcq: '[Result]' } }
        ],
        variables: [
          { name: 'Result', type: 'choice', pool: ['Always Odd'] },
          { name: 'distractor_1', type: 'choice', pool: ['Always Even'] },
          { name: 'distractor_2', type: 'choice', pool: ['Can be either'] }
        ]
      },
      {
        id: 'template-imo-g3-patterns-skip',
        title: 'Skip Counting Sequence (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'universal',
        optionsType: 'fill_blank',
        questionText: 'Find the missing number in the sequence: **[numObj.seq1], [numObj.seq2], [numObj.seq3], ____, [numObj.seq5]**.\n[[blank1]]',
        solution: 'Step 1: Find difference: [numObj.seq2] - [numObj.seq1] = [numObj.seq2 - numObj.seq1].\nStep 2: Add difference to third term: [numObj.seq3] + [numObj.seq2 - numObj.seq1] = [Result]!',
        validationRules: [
          { type: 'exact_match', target: 'answer', value: { blank1: '[Result]' } }
        ],
        variables: [
          {
            name: 'numObj',
            type: 'choice',
            pool: [
              { seq1: 1245, seq2: 1270, seq3: 1295, ans: 1320, seq5: 1345 },
              { seq1: 500, seq2: 525, seq3: 550, ans: 575, seq5: 600 },
              { seq1: 2010, seq2: 2020, seq3: 2030, ans: 2040, seq5: 2050 },
              { seq1: 4150, seq2: 4200, seq3: 4250, ans: 4300, seq5: 4350 }
            ]
          },
          { name: 'Result', type: 'expression', formula: 'numObj.ans' }
        ]
      }
    ];

    for (const t of templates) {
      await saveDynamicTemplate(t);
    }

    console.log('Seeded IMO Grade 3 curriculum and templates successfully.');
  } catch (err) {
    console.error('Error seeding IMO curriculum:', err);
  }
}
