import { getMongoDb } from '@/lib/db/mongo';

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

  return collection.find(filter).sort({ order: 1, title: 1 }).toArray();
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
    await createV2Node('unit', { id: 'counting', title: 'Counting & Cardinality', subjectId: 'math', order: 1 });
    await createV2Node('unit', { id: 'reading', title: 'Phonics & Reading', subjectId: 'english', order: 1 });
    
    // 4. Seed Chapters
    await createV2Node('chapter', { id: 'counting-5', title: 'Numbers up to 5', unitId: 'counting', gradeId: 'lkg', order: 1 });
    await createV2Node('chapter', { id: 'counting-10', title: 'Numbers up to 10', unitId: 'counting', gradeId: 'ukg', order: 2 });
    await createV2Node('chapter', { id: 'phonics-lkg', title: 'Letter Sounds', unitId: 'reading', gradeId: 'lkg', order: 1 });
    
    // 5. Seed Skills
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
    await createV2Node('skill', { 
      id: 'letter-sounds-a', 
      title: 'Identify short a sound', 
      chapterId: 'phonics-lkg', 
      code: 'P.1', 
      templateId: 'fractions-g5-add-like-fractions', 
      engine: 'StickersEngine', 
      order: 1 
    });
    
    console.log('Successfully seeded grades_v2, subjects_v2, units_v2, chapters_v2, and skills_v2.');
  } catch (error) {
    console.error('Error seeding initial v2 database:', error);
  }
}
