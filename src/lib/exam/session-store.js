import { getMongoDb } from '../db/mongo.js';
import { ObjectId } from 'mongodb';

/**
 * session document shape:
 * {
 *   _id, userId, examId, section,
 *   sessionType: 'adaptive' | 'topic-drill' | 'mock',
 *   status: 'active' | 'completed' | 'abandoned',
 *   startedAt, completedAt?,
 *   currentTheta: 0.5,
 *   topicMastery: {},
 *   responses: [{ questionId, topic, difficulty, selectedOption, isCorrect, timeTakenMs, thetaAfter }],
 *   report?: { ... computed on completion },
 * }
 */

export async function createSession({ userId, examId, section, sessionType = 'adaptive', initialTheta = 0.5, topic = null, templateId = null, sessionLength = 15 }) {
  const db = await getMongoDb();
  if (!db) throw new Error('DB not available');
  const doc = {
    userId,
    examId,
    section,
    sessionType,
    topic,
    templateId,
    sessionLength,
    status: 'active',
    startedAt: new Date(),
    completedAt: null,
    currentTheta: initialTheta,
    topicMastery: {},
    responses: [],
    report: null,
  };
  const result = await db.collection('test_sessions').insertOne(doc);
  return { ...doc, _id: result.insertedId };
}

export async function getSession(sessionId) {
  const db = await getMongoDb();
  if (!db || !sessionId) return null;
  
  let session = null;
  if (typeof sessionId === 'string' && sessionId.length === 24 && /^[0-9a-fA-F]{24}$/.test(sessionId)) {
    try {
      session = await db.collection('test_sessions').findOne({ _id: new ObjectId(sessionId) });
    } catch (e) {}
  }

  if (!session) {
    session = await db.collection('test_sessions').findOne({
      $or: [{ id: sessionId }, { sessionId: sessionId }, { _id: sessionId }]
    });
  }

  return session;
}

export async function appendResponse(sessionId, { questionId, topic, difficulty, selectedOption, isCorrect, timeTakenMs, thetaAfter, topicMastery }) {
  const db = await getMongoDb();
  if (!db) return;
  await db.collection('test_sessions').updateOne(
    { _id: new ObjectId(sessionId) },
    {
      $push: {
        responses: { questionId, topic, difficulty, selectedOption, isCorrect, timeTakenMs, thetaAfter },
      },
      $set: {
        currentTheta: thetaAfter,
        topicMastery,
        updatedAt: new Date(),
      },
    }
  );
}

export async function completeSession(sessionId, report) {
  const db = await getMongoDb();
  if (!db) return;
  await db.collection('test_sessions').updateOne(
    { _id: new ObjectId(sessionId) },
    { $set: { status: 'completed', completedAt: new Date(), report } }
  );
}

export async function getUserSessions(userId, { examId, section, limit = 10 } = {}) {
  const db = await getMongoDb();
  if (!db) return [];
  const filter = { userId };
  if (examId) filter.examId = examId;
  if (section) filter.section = section;
  return db.collection('test_sessions')
    .find(filter)
    .sort({ startedAt: -1 })
    .limit(limit)
    .toArray();
}

/** Count sessions started today for free-tier gating */
export async function countTodaySessions(userId, examId, section) {
  const db = await getMongoDb();
  if (!db) return 0;
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  return db.collection('test_sessions').countDocuments({
    userId,
    examId,
    section,
    startedAt: { $gte: startOfDay },
  });
}
