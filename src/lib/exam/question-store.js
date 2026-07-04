import { getMongoDb } from '../db/mongo.js';

/**
 * question document shape:
 * {
 *   _id, examId, section, topic, subTopic?,
 *   difficulty: 0.0–1.0,
 *   cognitiveLevel: 'recall'|'comprehension'|'application'|'analytical',
 *   questionText, questionImageUrl?,
 *   options: { A, B, C, D },
 *   correctOption: 'A'|'B'|'C'|'D',
 *   explanationText, explanationMath?,
 *   isPYQ: bool, pyqYear?,
 *   templateId?, templateVariables?,
 *   metadata: {
 *     source: string,
 *     exam: string[],
 *     isBilingual: bool,
 *     language: string
 *   },
 *   tags: [],
 *   status: 'active'|'draft'|'rejected',
 *   createdAt, updatedAt,
 * }
 */

export async function insertQuestion(q) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  const doc = {
    ...q,
    status: q.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  const result = await db.collection('questions').insertOne(doc);
  return result.insertedId;
}

export async function insertQuestions(questions) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  const docs = questions.map(q => ({
    ...q,
    status: q.status || 'active',
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
  const result = await db.collection('questions').insertMany(docs);
  return result.insertedIds;
}

export async function getQuestion(id) {
  const db = await getMongoDb();
  if (!db) return null;
  const { ObjectId } = await import('mongodb');
  return db.collection('questions').findOne({ _id: new ObjectId(id) });
}

/**
 * Fetch candidate questions for adaptive selection.
 * Returns questions near `theta` difficulty, excluding already-used IDs.
 */
export async function getAdaptiveCandidates({ examId, section, topic = null, templateId = null, theta, usedIds = [], limit = 20 }) {
  const db = await getMongoDb();
  if (!db) return [];
  const { ObjectId } = await import('mongodb');

  const usedObjectIds = usedIds.map(id => { try { return new ObjectId(id); } catch { return null; } }).filter(Boolean);

  const window = 0.2;
  const low = Math.max(0, theta - window);
  const high = Math.min(1, theta + window);

  const filter = {
    examId,
    section,
    status: 'active',
    difficulty: { $gte: low, $lte: high },
    ...(topic ? { topic } : {}),
    ...(templateId ? { templateId } : {}),
    ...(usedObjectIds.length ? { _id: { $nin: usedObjectIds } } : {}),
  };

  let questions = await db.collection('questions').find(filter).limit(limit).toArray();

  // Fallback: widen the window if not enough candidates
  if (questions.length < 3) {
    const fallbackFilter = {
      examId,
      section,
      status: 'active',
      ...(topic ? { topic } : {}),
      ...(templateId ? { templateId } : {}),
      ...(usedObjectIds.length ? { _id: { $nin: usedObjectIds } } : {}),
    };
    questions = await db.collection('questions').find(fallbackFilter).sort({ difficulty: 1 }).limit(limit).toArray();
  }

  return questions;
}

export async function listQuestions({ examId, section, topic, status, isPYQ, limit = 50, skip = 0 } = {}) {
  const db = await getMongoDb();
  if (!db) return [];
  const filter = {};
  if (examId) filter.examId = examId;
  if (section) filter.section = section;
  if (topic) filter.topic = topic;
  if (status) filter.status = status;
  if (isPYQ !== undefined) filter.isPYQ = isPYQ;
  return db.collection('questions').find(filter).skip(skip).limit(limit).toArray();
}

export async function countQuestions({ examId, section } = {}) {
  const db = await getMongoDb();
  if (!db) return 0;
  const filter = { status: 'active' };
  if (examId) filter.examId = examId;
  if (section) filter.section = section;
  return db.collection('questions').countDocuments(filter);
}

export async function updateQuestionStatus(id, status) {
  const db = await getMongoDb();
  if (!db) return;
  const { ObjectId } = await import('mongodb');
  await db.collection('questions').updateOne(
    { _id: new ObjectId(id) },
    { $set: { status, updatedAt: new Date() } }
  );
}

export async function updateQuestion(id, updates) {
  const db = await getMongoDb();
  if (!db) return;
  const { ObjectId } = await import('mongodb');
  await db.collection('questions').updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updates, updatedAt: new Date() } }
  );
}
