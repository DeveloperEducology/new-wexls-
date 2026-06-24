import { getMongoDb } from '../db/mongo.js';

export async function createTemplate(templateData) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  const doc = {
    ...templateData,
    generatedCount: 0,
    status: 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('templates').insertOne(doc);
  return result.insertedId;
}

export async function getTemplate(id) {
  const db = await getMongoDb();
  if (!db) return null;
  const { ObjectId } = await import('mongodb');
  let queryId;
  try {
    queryId = new ObjectId(id);
  } catch {
    queryId = id;
  }
  return db.collection('templates').findOne({ _id: queryId });
}

export async function listTemplates({ examId, section, type, status } = {}) {
  const db = await getMongoDb();
  if (!db) return [];
  const filter = {};
  if (examId) filter.examId = examId;
  if (section) filter.section = section;
  if (type) filter.type = type;
  if (status) filter.status = status;
  return db.collection('templates').find(filter).sort({ createdAt: -1 }).toArray();
}

export async function incrementGeneratedCount(templateId, count) {
  const db = await getMongoDb();
  if (!db) return;
  const { ObjectId } = await import('mongodb');
  let queryId;
  try {
    queryId = new ObjectId(templateId);
  } catch {
    queryId = templateId;
  }
  await db.collection('templates').updateOne(
    { _id: queryId },
    { $inc: { generatedCount: count }, $set: { lastGeneratedAt: new Date(), updatedAt: new Date() } }
  );
}

export async function updateTemplate(id, updates) {
  const db = await getMongoDb();
  if (!db) return;
  const { ObjectId } = await import('mongodb');
  let queryId;
  try {
    queryId = new ObjectId(id);
  } catch {
    queryId = id;
  }
  await db.collection('templates').updateOne(
    { _id: queryId },
    { $set: { ...updates, updatedAt: new Date() } }
  );
}
