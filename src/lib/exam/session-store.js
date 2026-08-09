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

const IN_MEMORY_SESSIONS = new Map();

export async function createSession({ userId, examId, section, sessionType = 'adaptive', initialTheta = 0.5, topic = null, templateId = null, sessionLength = 15 }) {
  const db = await getMongoDb();
  const doc = {
    _id: db ? undefined : `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
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

  if (!db) {
    const sId = String(doc._id);
    IN_MEMORY_SESSIONS.set(sId, doc);
    return doc;
  }

  delete doc._id;
  try {
    const result = await db.collection('test_sessions').insertOne(doc);
    const created = { ...doc, _id: result.insertedId };
    IN_MEMORY_SESSIONS.set(String(created._id), created);
    return created;
  } catch (e) {
    doc._id = `sess_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const sId = String(doc._id);
    IN_MEMORY_SESSIONS.set(sId, doc);
    return doc;
  }
}

export async function getSession(sessionId) {
  if (!sessionId) return null;
  const strId = String(sessionId);
  if (IN_MEMORY_SESSIONS.has(strId)) {
    return IN_MEMORY_SESSIONS.get(strId);
  }

  const db = await getMongoDb();
  if (!db) return null;
  
  let session = null;
  if (typeof sessionId === 'string' && sessionId.length === 24 && /^[0-9a-fA-F]{24}$/.test(sessionId)) {
    try {
      session = await db.collection('test_sessions').findOne({ _id: new ObjectId(sessionId) });
    } catch (e) {}
  }

  if (!session) {
    try {
      session = await db.collection('test_sessions').findOne({
        $or: [{ id: sessionId }, { sessionId: sessionId }, { _id: sessionId }]
      });
    } catch (e) {}
  }

  if (session) {
    IN_MEMORY_SESSIONS.set(strId, session);
  }

  return session;
}

export async function appendResponse(sessionId, { questionId, topic, difficulty, selectedOption, isCorrect, timeTakenMs, thetaAfter, topicMastery }) {
  const strId = String(sessionId);
  if (IN_MEMORY_SESSIONS.has(strId)) {
    const s = IN_MEMORY_SESSIONS.get(strId);
    if (!s.responses) s.responses = [];
    s.responses.push({ questionId, topic, difficulty, selectedOption, isCorrect, timeTakenMs, thetaAfter });
    s.currentTheta = thetaAfter;
    s.topicMastery = topicMastery;
    s.updatedAt = new Date();
  }

  const db = await getMongoDb();
  if (!db) return;
  try {
    let query = {};
    if (typeof sessionId === 'string' && sessionId.length === 24 && /^[0-9a-fA-F]{24}$/.test(sessionId)) {
      query = { _id: new ObjectId(sessionId) };
    } else {
      query = { $or: [{ _id: sessionId }, { id: sessionId }] };
    }
    await db.collection('test_sessions').updateOne(
      query,
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
  } catch (e) {}
}

export async function completeSession(sessionId, report) {
  const strId = String(sessionId);
  if (IN_MEMORY_SESSIONS.has(strId)) {
    const s = IN_MEMORY_SESSIONS.get(strId);
    s.status = 'completed';
    s.completedAt = new Date();
    s.report = report;
  }

  const db = await getMongoDb();
  if (!db) return;
  try {
    let query = {};
    if (typeof sessionId === 'string' && sessionId.length === 24 && /^[0-9a-fA-F]{24}$/.test(sessionId)) {
      query = { _id: new ObjectId(sessionId) };
    } else {
      query = { $or: [{ _id: sessionId }, { id: sessionId }] };
    }
    await db.collection('test_sessions').updateOne(
      query,
      { $set: { status: 'completed', completedAt: new Date(), report } }
    );
  } catch (e) {}
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
