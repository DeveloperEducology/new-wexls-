import { getMongoDb } from '../db/mongo.js';

export async function getOrCreateProfile(userId, examId) {
  const db = await getMongoDb();
  if (!db) return null;
  const existing = await db.collection('user_exam_profiles').findOne({ userId, examId });
  if (existing) return existing;

  const profile = {
    userId,
    examId,
    overallTheta: 0.5,
    sectionTheta: {},
    topicMastery: {},
    sessionsCompleted: 0,
    totalQuestionsAnswered: 0,
    lastPracticed: null,
    estimatedScore: 50,
    weakTopics: [],
    strongTopics: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  await db.collection('user_exam_profiles').insertOne(profile);
  return profile;
}

export async function updateProfileAfterSession(userId, examId, { section, finalTheta, topicMastery, weakTopics, strongTopics, report }) {
  const db = await getMongoDb();
  if (!db) return;

  const profile = await getOrCreateProfile(userId, examId);

  // Blend section theta with overall (rolling average)
  const prevOverall = profile.overallTheta;
  const newOverall = Math.round(((prevOverall * 0.7) + (finalTheta * 0.3)) * 1000) / 1000;

  // Merge topic mastery
  const mergedTopicMastery = { ...profile.topicMastery, ...topicMastery };

  await db.collection('user_exam_profiles').updateOne(
    { userId, examId },
    {
      $set: {
        overallTheta: newOverall,
        [`sectionTheta.${section}`]: finalTheta,
        topicMastery: mergedTopicMastery,
        weakTopics,
        strongTopics,
        estimatedScore: report.estimatedScore,
        lastPracticed: new Date(),
        updatedAt: new Date(),
      },
      $inc: {
        sessionsCompleted: 1,
        totalQuestionsAnswered: report.total,
      },
    },
    { upsert: true }
  );
}

export async function getProfile(userId, examId) {
  const db = await getMongoDb();
  if (!db) return null;
  return db.collection('user_exam_profiles').findOne({ userId, examId });
}
