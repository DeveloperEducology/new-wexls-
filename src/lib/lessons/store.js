import { getMongoDb } from '@/lib/db/mongo';

const COLLECTION = 'lessons';

function slugify(value) {
  const base = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  
  if (base.length <= 80) return base;
  // Truncate to 80 chars, splitting on clean boundary
  const truncated = base.substring(0, 80);
  const lastDash = truncated.lastIndexOf('-');
  return lastDash > 10 ? truncated.substring(0, lastDash) : truncated;
}

async function getCollection() {
  const db = await getMongoDb();
  if (!db) throw new Error('Database not configured. Set MONGODB_URI.');
  const col = db.collection(COLLECTION);

  // Ensure indexes (idempotent)
  await col.createIndex({ slug: 1 }, { unique: true });
  await col.createIndex({
    title: 'text',
    topic: 'text',
    'metadata.subject': 'text',
    'metadata.grade': 'text',
  });
  await col.createIndex({ 'metadata.grade': 1 });
  await col.createIndex({ 'metadata.subject': 1 });
  await col.createIndex({ createdAt: -1 });

  return col;
}

/**
 * Upsert a generated lesson into MongoDB.
 * Re-saves every time to support regeneration with same topic+tone combo.
 */
export async function saveLesson({ topic, tone, worksheetJson, markdownContent, metadata = {}, title }) {
  const col = await getCollection();
  const slugSource = title || worksheetJson.title || topic;
  const slug = slugify(slugSource);
  const now = new Date();

  const doc = {
    slug,
    topic,
    title: title || worksheetJson.title || topic,
    tone,
    worksheetJson,
    markdownContent, // { student: '...md', yearbook: '...md', teacher: '...md' }
    metadata: {
      subject: metadata.subject || 'general',
      grade: metadata.grade || '',
      ...metadata,
    },
    updatedAt: now,
  };

  const result = await col.findOneAndUpdate(
    { slug },
    {
      $set: doc,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return result;
}

/**
 * Fetch a single lesson by slug.
 */
export async function getLessonBySlug(slug) {
  const col = await getCollection();
  return col.findOne({ slug });
}

/**
 * List lessons with optional filters and pagination.
 */
export async function listLessons({ subject, grade, search, limit = 20, skip = 0 } = {}) {
  const col = await getCollection();
  const query = {};

  if (subject) query['metadata.subject'] = subject;
  if (grade) query['metadata.grade'] = grade;
  if (search) {
    query.$text = { $search: search };
  }

  return col
    .find(query)
    .sort({ createdAt: -1 })
    .skip(Number(skip))
    .limit(Math.min(Number(limit), 100))
    .toArray();
}

/**
 * Save a raw Gemini generation to the raw_gemini collection.
 */
export async function saveRawGeminiGeneration({ topic, tone, format, activeSections, customInstructions, worksheetJson, usage }) {
  const db = await getMongoDb();
  if (!db) return null;
  const col = db.collection('raw_gemini');
  const now = new Date();

  const doc = {
    topic,
    tone,
    format,
    activeSections,
    customInstructions,
    worksheetJson,
    usage,
    createdAt: now,
  };

  const result = await col.insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

/**
 * List the most recent raw Gemini generations.
 */
export async function listRawGeminiGenerations({ limit = 30 } = {}) {
  const db = await getMongoDb();
  if (!db) return [];
  const col = db.collection('raw_gemini');

  // Ensure index on createdAt for sorting (idempotent)
  try {
    await col.createIndex({ createdAt: -1 });
  } catch (err) {
    console.error('Failed to create raw_gemini index:', err);
  }

  return col
    .find({})
    .sort({ createdAt: -1 })
    .limit(limit)
    .toArray();
}

