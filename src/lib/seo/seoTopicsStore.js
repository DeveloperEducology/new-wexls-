import { getMongoDb } from '@/lib/db/mongo';
import { ObjectId } from 'mongodb';

const COLLECTION = 'seo_topics';

async function getCollection() {
  const db = await getMongoDb();
  if (!db) throw new Error('Database not configured. Set MONGODB_URI.');
  const col = db.collection(COLLECTION);
  // Idempotent indexes
  await col.createIndex({ slug: 1, examName: 1 }, { unique: true });
  await col.createIndex({ examName: 1 });
  await col.createIndex({ subject: 1 });
  await col.createIndex({ published: 1 });
  return col;
}

/** List all topics, optionally filtered by exam/subject/published */
export async function listSeoTopics({ examName, subject, published } = {}) {
  const col = await getCollection();
  const query = {};
  if (examName) query.examName = examName;
  if (subject)  query.subject  = subject;
  if (published !== undefined) query.published = published;
  const docs = await col.find(query).sort({ updatedAt: -1 }).toArray();
  return docs.map(serializeTopic);
}

/** Get a single topic by MongoDB _id */
export async function getSeoTopicById(id) {
  const col = await getCollection();
  const doc = await col.findOne({ _id: new ObjectId(id) });
  return doc ? serializeTopic(doc) : null;
}

/** Get a single topic by slug + examName (used by page.js at render time) */
export async function getSeoTopicBySlug(slug, examName) {
  const col = await getCollection();
  const doc = await col.findOne({ slug, examName });
  return doc ? serializeTopic(doc) : null;
}

/** Create a new SEO topic */
export async function createSeoTopic(data) {
  const col = await getCollection();
  const now = new Date();
  const doc = {
    slug:              data.slug || '',
    examName:          data.examName || 'jnvst',
    subject:           data.subject || 'math',
    displayName:       data.displayName || '',
    description:       data.description || '',
    relatedTopics:     data.relatedTopics || [],
    fallbackQuestions: data.fallbackQuestions || [],
    published:         data.published ?? false,
    lessonJson:        data.lessonJson || null,
    metaTitle:         data.metaTitle || '',
    metaDescription:   data.metaDescription || '',
    metaKeywords:      data.metaKeywords || '',
    createdAt:         now,
    updatedAt:         now,
  };
  const result = await col.insertOne(doc);
  return serializeTopic({ ...doc, _id: result.insertedId });
}

/** Update an existing SEO topic by _id */
export async function updateSeoTopic(id, data) {
  const col = await getCollection();
  const update = {
    $set: {
      ...data,
      updatedAt: new Date(),
    },
  };
  delete update.$set._id;
  await col.updateOne({ _id: new ObjectId(id) }, update);
  return getSeoTopicById(id);
}

/** Delete an SEO topic by _id */
export async function deleteSeoTopic(id) {
  const col = await getCollection();
  await col.deleteOne({ _id: new ObjectId(id) });
  return { success: true };
}

function serializeTopic(doc) {
  return {
    ...doc,
    _id: String(doc._id),
    createdAt: doc.createdAt?.toISOString?.() || doc.createdAt,
    updatedAt: doc.updatedAt?.toISOString?.() || doc.updatedAt,
  };
}
