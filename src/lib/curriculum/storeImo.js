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

  const updateDoc = { ...normalized };
  delete updateDoc._id;
  await collection.updateOne({ id }, { $set: updateDoc, $setOnInsert: { _id: id } }, { upsert: true });
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

    // 6. Seed Dynamic Templates — ALL MCQ type.
    // - questionText must NOT contain [[blank1]] or [[mcq]] tokens (those cause double-print).
    // - Provide exactly 3 distractors (distractor_1, distractor_2, distractor_3) so the
    //   difficulty engine can slice: easy→2 opts, medium→3 opts, hard→4 opts.
    // - correct_answer maps to the Result variable.
    const templates = [
      // ── Skill 1: Place Value vs Face Value ──────────────────────────────────
      {
        id: 'template-imo-g3-place-face-value',
        title: 'Place Value vs Face Value (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'Find the difference between the place value of [digit1] and the face value of [digit2] in the number [number].',
        explanationTemplate: 'Place value of [digit1] at hundreds place = [digit1] × 100 = [pv].\nFace value of [digit2] = [digit2].\nDifference = [pv] − [digit2] = [Result].',
        variables: {
          numObj: {
            type: 'choice',
            pool: [
              { val: 8754, d3: 8, d2: 7, d1: 5, d0: 4 },
              { val: 6982, d3: 6, d2: 9, d1: 8, d0: 2 },
              { val: 7523, d3: 7, d2: 5, d1: 2, d0: 3 },
              { val: 9861, d3: 9, d2: 8, d1: 6, d0: 1 },
              { val: 4317, d3: 4, d2: 3, d1: 1, d0: 7 },
              { val: 5240, d3: 5, d2: 2, d1: 4, d0: 0 },
            ]
          }
        },
        derivations: {
          digit1: 'numObj.d2',
          digit2: 'numObj.d0',
          number: 'numObj.val',
          pv: 'digit1 * 100',
          Result: 'pv - digit2',
          correct_answer: 'Result',
          distractor_1: 'Result + 10',
          distractor_2: 'Result - digit2',
          distractor_3: 'pv + digit2',
        }
      },

      // ── Skill 2: Reading & Writing 4-Digit Numbers ──────────────────────────
      {
        id: 'template-imo-g3-write-read-numbers',
        title: 'Read and Write 4-Digit Numbers (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'Choose the numeric representation of: "[numObj.words]".',
        explanationTemplate: '"[numObj.words]" is written as [Result] in standard form.',
        variables: {
          numObj: {
            type: 'choice',
            pool: [
              { val: 7205, words: 'Seven thousand two hundred five' },
              { val: 6052, words: 'Six thousand fifty-two' },
              { val: 8901, words: 'Eight thousand nine hundred one' },
              { val: 5004, words: 'Five thousand four' },
              { val: 3410, words: 'Three thousand four hundred ten' },
              { val: 9070, words: 'Nine thousand seventy' },
            ]
          }
        },
        derivations: {
          Result: 'numObj.val',
          correct_answer: 'numObj.val',
          distractor_1: 'numObj.val + 9',
          distractor_2: 'numObj.val - 9',
          distractor_3: 'numObj.val + 90',
        }
      },

      // ── Skill 3: Expanded vs Standard Form ──────────────────────────────────
      {
        id: 'template-imo-g3-expanded-standard',
        title: 'Expanded vs Standard Form (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'Which number is represented by the expanded form: [numObj.expanded]?',
        explanationTemplate: '[numObj.expanded] = [Result] in standard form.',
        variables: {
          numObj: {
            type: 'choice',
            pool: [
              { val: 5048, expanded: '5000 + 40 + 8' },
              { val: 7302, expanded: '7000 + 300 + 2' },
              { val: 9080, expanded: '9000 + 80' },
              { val: 4610, expanded: '4000 + 600 + 10' },
              { val: 2007, expanded: '2000 + 7' },
              { val: 6415, expanded: '6000 + 400 + 10 + 5' },
            ]
          }
        },
        derivations: {
          Result: 'numObj.val',
          correct_answer: 'numObj.val',
          distractor_1: 'numObj.val + 9',
          distractor_2: 'numObj.val - 9',
          distractor_3: 'numObj.val + 100',
        }
      },

      // ── Skill 4: Successor & Predecessor ────────────────────────────────────
      {
        id: 'template-imo-g3-successor-predecessor',
        title: 'Successor and Predecessor (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'The predecessor of the successor of [number] is:',
        explanationTemplate: 'Successor of [number] = [number] + 1 = [succ].\nPredecessor of [succ] = [succ] − 1 = [Result].\nThe predecessor of the successor of any number equals that number itself.',
        variables: {
          number: {
            type: 'choice',
            pool: [1250, 3780, 5499, 6001, 2999, 7800, 4321, 8050]
          }
        },
        derivations: {
          succ: 'number + 1',
          Result: 'number',
          correct_answer: 'number',
          distractor_1: 'number + 1',
          distractor_2: 'number - 1',
          distractor_3: 'number + 2',
        }
      },

      // ── Skill 5: Building Greatest & Smallest Numbers ────────────────────────
      {
        id: 'template-imo-g3-building-numbers',
        title: 'Forming Smallest 4-Digit Number (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'Form the SMALLEST 4-digit number using the digits [numObj.d1], [numObj.d2], [numObj.d3], [numObj.d4] (without repetition).',
        explanationTemplate: 'Digits: [numObj.d1], [numObj.d2], [numObj.d3], [numObj.d4].\nSort ascending; if 0 appears, place next-smallest digit first.\nSmallest number = [Result].',
        variables: {
          numObj: {
            type: 'choice',
            pool: [
              { d1: 4, d2: 0, d3: 8, d4: 3, ans: 3048, w1: 3408, w2: 3804, w3: 4038 },
              { d1: 6, d2: 1, d3: 0, d4: 9, ans: 1069, w1: 1096, w2: 1609, w3: 1906 },
              { d1: 5, d2: 0, d3: 2, d4: 7, ans: 2057, w1: 2075, w2: 2507, w3: 2570 },
              { d1: 8, d2: 3, d3: 0, d4: 1, ans: 1038, w1: 1083, w2: 1308, w3: 1380 },
              { d1: 9, d2: 2, d3: 0, d4: 5, ans: 2059, w1: 2095, w2: 2509, w3: 5029 },
            ]
          }
        },
        derivations: {
          Result: 'numObj.ans',
          correct_answer: 'numObj.ans',
          distractor_1: 'numObj.w1',
          distractor_2: 'numObj.w2',
          distractor_3: 'numObj.w3',
        }
      },

      // ── Skill 6: Rounding Off ────────────────────────────────────────────────
      {
        id: 'template-imo-g3-rounding-off',
        title: 'Rounding Off Quantities (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'What is [num1] rounded to the nearest ten ADDED to [num2] rounded to the nearest hundred?',
        explanationTemplate: '[num1] rounded to nearest ten = [r1].\n[num2] rounded to nearest hundred = [r2].\nSum = [r1] + [r2] = [Result].',
        variables: {
          numObj: {
            type: 'choice',
            pool: [
              { n1: 342, n2: 567, r1: 340, r2: 600, ans: 940, w1: 950, w2: 930, w3: 960 },
              { n1: 581, n2: 234, r1: 580, r2: 200, ans: 780, w1: 790, w2: 770, w3: 810 },
              { n1: 219, n2: 881, r1: 220, r2: 900, ans: 1120, w1: 1110, w2: 1130, w3: 1100 },
              { n1: 456, n2: 149, r1: 460, r2: 100, ans: 560, w1: 570, w2: 550, w3: 580 },
              { n1: 375, n2: 750, r1: 380, r2: 800, ans: 1180, w1: 1190, w2: 1170, w3: 1200 },
            ]
          }
        },
        derivations: {
          num1: 'numObj.n1',
          num2: 'numObj.n2',
          r1: 'numObj.r1',
          r2: 'numObj.r2',
          Result: 'numObj.ans',
          correct_answer: 'numObj.ans',
          distractor_1: 'numObj.w1',
          distractor_2: 'numObj.w2',
          distractor_3: 'numObj.w3',
        }
      },

      // ── Skill 7: Roman Numerals ──────────────────────────────────────────────
      {
        id: 'template-imo-g3-roman-numerals',
        title: 'Roman Numerals Math (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'Solve and choose the correct Roman Numeral: [numObj.expr]',
        explanationTemplate: 'Evaluate [numObj.expr].\nThe answer in Roman Numerals is [Result].',
        variables: {
          numObj: {
            type: 'choice',
            pool: [
              { expr: 'XLIV + XXVI', ans: 'LXX',    dist1: 'LXVI',  dist2: 'LXXVI', dist3: 'LX' },
              { expr: 'LXII − XIV',  ans: 'XLVIII',  dist1: 'XLVII', dist2: 'LIII',  dist3: 'LIV' },
              { expr: 'XXXV + XV',   ans: 'L',        dist1: 'XL',    dist2: 'LV',    dist3: 'LX' },
              { expr: 'XCIX − LIX',  ans: 'XL',       dist1: 'L',     dist2: 'XXXIX', dist3: 'XLI' },
              { expr: 'XX + XXX',    ans: 'L',        dist1: 'XL',    dist2: 'LX',    dist3: 'LV' },
            ]
          }
        },
        derivations: {
          Result: 'numObj.ans',
          correct_answer: 'numObj.ans',
          distractor_1: 'numObj.dist1',
          distractor_2: 'numObj.dist2',
          distractor_3: 'numObj.dist3',
        },
        // Roman answers are strings — override numeric fallback
        options: [
          { label: '[numObj.ans]',   isCorrect: 'true' },
          { label: '[numObj.dist1]', isCorrect: 'false' },
          { label: '[numObj.dist2]', isCorrect: 'false' },
          { label: '[numObj.dist3]', isCorrect: 'false' },
        ]
      },

      // ── Skill 8: Even & Odd Operations ──────────────────────────────────────
      {
        id: 'template-imo-g3-even-odd',
        title: 'Even & Odd Operations Rules (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'If A is an odd number and B is an even number, what type is (A × B) + A?',
        explanationTemplate: 'Odd × Even = Even.\nEven + Odd = Odd.\nSo (A × B) + A is Always Odd.',
        // Static options (no numeric derivation needed)
        options: [
          { label: 'Always Odd',    isCorrect: true },
          { label: 'Always Even',   isCorrect: false },
          { label: 'Can be either', isCorrect: false },
          { label: 'Always Zero',   isCorrect: false },
        ],
        variables: {}
      },

      // ── Skill 9: Number Patterns & Skip Counting ─────────────────────────────
      {
        id: 'template-imo-g3-patterns-skip',
        title: 'Skip Counting Sequence (IMO G3)',
        subject: 'math',
        topic: 'number-sense',
        grade: '3',
        type: 'parameterized',
        optionsType: 'mcq',
        questionTemplate: 'Find the missing number: [numObj.seq1], [numObj.seq2], [numObj.seq3], ____, [numObj.seq5].',
        explanationTemplate: 'Common difference = [numObj.seq2] − [numObj.seq1] = [step].\nMissing term = [numObj.seq3] + [step] = [Result].',
        variables: {
          numObj: {
            type: 'choice',
            pool: [
              { seq1: 1245, seq2: 1270, seq3: 1295, ans: 1320, seq5: 1345, step: 25, w1: 1310, w2: 1330, w3: 1295 },
              { seq1: 500,  seq2: 525,  seq3: 550,  ans: 575,  seq5: 600,  step: 25, w1: 565,  w2: 585,  w3: 600  },
              { seq1: 2010, seq2: 2020, seq3: 2030, ans: 2040, seq5: 2050, step: 10, w1: 2035, w2: 2045, w3: 2050 },
              { seq1: 4150, seq2: 4200, seq3: 4250, ans: 4300, seq5: 4350, step: 50, w1: 4275, w2: 4325, w3: 4350 },
              { seq1: 1100, seq2: 1200, seq3: 1300, ans: 1400, seq5: 1500, step: 100, w1: 1350, w2: 1450, w3: 1500 },
            ]
          }
        },
        derivations: {
          step: 'numObj.step',
          Result: 'numObj.ans',
          correct_answer: 'numObj.ans',
          distractor_1: 'numObj.w1',
          distractor_2: 'numObj.w2',
          distractor_3: 'numObj.w3',
        }
      },
    ];

    for (const t of templates) {
      await saveDynamicTemplate(t);
    }

    console.log('Seeded IMO Grade 3 curriculum and templates successfully.');
  } catch (err) {
    console.error('Error seeding IMO curriculum:', err);
  }
}
