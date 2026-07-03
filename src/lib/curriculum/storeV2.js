import { getMongoDb } from '@/lib/db/mongo';
import { lkgEnglishMicroSkillRegistry } from '@/lib/practice/generators/english/topics/lkg/registry';
import { lkgMicroSkillRegistry, lkgTemplateRegistry } from '@/lib/practice/generators/math/topics/lkg/registry';
import { ukgNumbersCountingSkills } from '@/lib/practice/generators/math/topics/ukg-numbers-counting/skills';

const COLLECTION_MAP = {
  grade: 'grades_v2',
  subject: 'subjects_v2',
  unit: 'units_v2',
  chapter: 'chapters_v2',
  skill: 'skills_v2',
};

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function getV2Collection(type) {
  const db = await getMongoDb();
  if (!db) throw new Error('Database connection failed.');
  const collectionName = COLLECTION_MAP[type];
  if (!collectionName) throw new Error(`Unknown v2 curriculum type: ${type}`);
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

export async function createV2Node(type, data) {
  const collection = await getV2Collection(type);
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

  // Normalize templateId to array of strings if it represents multiple template IDs
  if (type === 'skill' && data.templateId) {
    if (typeof data.templateId === 'string') {
      const trimmed = data.templateId.trim();
      let parsedArray = null;
      if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            parsedArray = parsed;
          }
        } catch (e) {}
      }
      if (!parsedArray && trimmed.includes(',')) {
        parsedArray = trimmed.split(',').map(s => s.trim()).filter(Boolean);
      }
      if (parsedArray) {
        normalized.templateId = parsedArray.map(s => String(s).trim()).filter(Boolean);
      } else {
        normalized.templateId = trimmed;
      }
    }
  }
  
  // Normalize relational IDs
  if (normalized.subjectId) normalized.subjectId = slugify(normalized.subjectId);
  if (normalized.unitId) normalized.unitId = slugify(normalized.unitId);
  if (normalized.gradeId) normalized.gradeId = slugify(normalized.gradeId);
  if (normalized.chapterId) normalized.chapterId = slugify(normalized.chapterId);

  await collection.updateOne({ id }, { $set: normalized }, { upsert: true });
  return collection.findOne({ id });
}

export async function listV2Nodes(type, query = {}) {
  const collection = await getV2Collection(type);
  const filter = { ...query };
  
  // Clean IDs in filters
  if (filter.subjectId) filter.subjectId = slugify(filter.subjectId);
  if (filter.unitId) filter.unitId = slugify(filter.unitId);
  if (filter.gradeId) filter.gradeId = slugify(filter.gradeId);
  if (filter.chapterId) filter.chapterId = slugify(filter.chapterId);
  if (filter.status) filter.status = filter.status;

  const docs = await collection.find(filter).sort({ order: 1, title: 1 }).toArray();
  return docs.map(doc => ({
    ...doc,
    _id: doc._id ? String(doc._id) : undefined
  }));
}

export async function deleteV2Node(type, id) {
  const collection = await getV2Collection(type);
  const result = await collection.deleteOne({ id: slugify(id) });
  return { deletedCount: result.deletedCount };
}

export async function seedV2Initial() {
  try {
    // 1. Seed Grades
    await createV2Node('grade', { id: 'lkg', title: 'LKG', order: 1 });
    await createV2Node('grade', { id: 'ukg', title: 'UKG', order: 2 });
    
    // 2. Seed Subjects
    await createV2Node('subject', { id: 'math', title: 'Math', icon: '🧮', order: 1 });
    await createV2Node('subject', { id: 'english', title: 'English', icon: '📚', order: 2 });
    
    // 3. Seed Units (Topics)
    // - Math LKG maps to topic 'lkg'
    // - Math UKG maps to topic 'ukg-numbers-counting'
    // - English LKG/UKG maps to topic 'english-lkg'
    await createV2Node('unit', { id: 'counting', title: 'Counting & Cardinality', subjectId: 'math', order: 1 });
    await createV2Node('unit', { id: 'reading', title: 'Phonics & Reading', subjectId: 'english', order: 1 });
    await createV2Node('unit', { id: 'lkg', title: 'Lower Kindergarten Math', subjectId: 'math', order: 2 });
    await createV2Node('unit', { id: 'ukg-numbers-counting', title: 'Upper Kindergarten Math', subjectId: 'math', order: 3 });
    await createV2Node('unit', { id: 'english-lkg', title: 'Phonics & Reading (LKG/UKG)', subjectId: 'english', order: 1 });
    
    // 4. Seed Chapters (Math)
    await createV2Node('chapter', { id: 'counting-5', title: 'Numbers up to 5', unitId: 'counting', gradeId: 'lkg', order: 1 });
    await createV2Node('chapter', { id: 'counting-10', title: 'Numbers up to 10', unitId: 'counting', gradeId: 'ukg', order: 2 });
    
    let mathChapterOrder = 1;
    for (const [key, tpl] of Object.entries(lkgTemplateRegistry)) {
      await createV2Node('chapter', {
        id: slugify(key),
        title: tpl.title,
        unitId: 'lkg',
        gradeId: 'lkg',
        order: mathChapterOrder++
      });
    }
    
    // 5. Seed Skills (Math)
    await createV2Node('skill', { 
      id: 'count-1-to-5', 
      title: 'Count objects up to 5', 
      chapterId: 'counting-5', 
      code: 'C.1', 
      templateId: 'fractions-g5-add-like-fractions', 
      engine: 'StickersEngine', 
      order: 1 
    });
    await createV2Node('skill', { 
      id: 'count-1-to-10', 
      title: 'Count objects up to 10', 
      chapterId: 'counting-10', 
      code: 'C.2', 
      templateId: 'fractions-g5-add-like-fractions', 
      engine: 'StickersEngine', 
      order: 1 
    });

    let mathSkillOrder = 1;
    for (const [id, s] of Object.entries(lkgMicroSkillRegistry)) {
      if (id === 'lkg_counting_5' || id === 'lkg_comparison_5') continue;
      await createV2Node('skill', {
        id,
        title: s.title,
        chapterId: slugify(s.templateId || 'lkg-counting'),
        code: s.code || '',
        templateId: s.templateId || '',
        engine: 'questionBank',
        gradeId: 'lkg',
        order: mathSkillOrder++
      });
    }

    // 5b. Seed UKG Math Chapters and Skills
    const ukgMathChapters = new Map();
    let ukgMathChapterOrder = 1;
    for (const s of ukgNumbersCountingSkills) {
      const rawChapter = s.chapter;
      const chapterId = slugify('ukg-' + rawChapter);
      if (!ukgMathChapters.has(chapterId)) {
        ukgMathChapters.set(chapterId, {
          id: chapterId,
          title: rawChapter,
          unitId: 'ukg-numbers-counting',
          gradeId: 'ukg',
          order: ukgMathChapterOrder++,
          status: 'active'
        });
      }
    }

    for (const ch of ukgMathChapters.values()) {
      await createV2Node('chapter', ch);
    }

    let ukgMathSkillOrder = 1;
    for (const s of ukgNumbersCountingSkills) {
      const chapterId = slugify('ukg-' + s.chapter);
      await createV2Node('skill', {
        id: s.skillId,
        title: s.title,
        chapterId,
        code: s.code || '',
        templateId: s.templateId || '',
        engine: 'ukg-numbers-counting',
        gradeId: 'ukg',
        order: ukgMathSkillOrder++,
        status: 'active'
      });
    }

    // 6. Seed English Chapters and Skills from registry
    const skillsEntries = Object.entries(lkgEnglishMicroSkillRegistry);
    let chapterOrder = 1;
    const chaptersMap = new Map();

    for (const [id, s] of skillsEntries) {
      const grade = slugify(s.grade || 'LKG');
      const rawChapterId = s.chapterId || 'general';
      const chapterTitle = s.chapterTitle || 'General Skills';
      const chapterId = slugify(rawChapterId);

      if (!chaptersMap.has(chapterId)) {
        chaptersMap.set(chapterId, {
          id: chapterId,
          title: chapterTitle,
          unitId: 'english-lkg',
          gradeId: grade,
          order: chapterOrder++,
          status: 'active'
        });
      }
    }

    for (const ch of chaptersMap.values()) {
      await createV2Node('chapter', ch);
    }

    let skillOrder = 1;
    for (const [id, s] of skillsEntries) {
      const grade = slugify(s.grade || 'LKG');
      const rawChapterId = s.chapterId || 'general';
      const chapterId = slugify(rawChapterId);

      await createV2Node('skill', {
        id,
        title: s.title,
        chapterId,
        code: s.code || '',
        templateId: s.templateId || '',
        engine: 'questionBank',
        gradeId: grade,
        order: skillOrder++,
        status: 'active'
      });
    }
    
    console.log('Successfully seeded grades_v2, subjects_v2, units_v2, chapters_v2, and skills_v2 with Registry English and Math skills.');
  } catch (error) {
    console.error('Error seeding initial v2 database:', error);
  }
}
