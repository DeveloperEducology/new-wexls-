import { getMongoDb } from '../db/mongo.js';

/**
 * Creates or updates a Test Series document in MongoDB
 */
export async function createOrUpdateTestSeries(seriesData) {
  const db = await getMongoDb();
  if (!db) throw new Error('Database connection unavailable');

  const seriesId = seriesData.id || seriesData._id || `series_${Date.now()}`;
  const now = new Date();

  const doc = {
    ...seriesData,
    _id: seriesId,
    id: seriesId,
    status: seriesData.status || 'published',
    updatedAt: now,
  };

  await db.collection('test_series').updateOne(
    { _id: seriesId },
    { $set: doc, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  return doc;
}

/**
 * Retrieves all Test Series for an exam (e.g. 'jnvst')
 */
export async function getTestSeriesByExam(examId) {
  const db = await getMongoDb();
  if (!db) return [];

  return db.collection('test_series')
    .find({ examId, status: { $ne: 'deleted' } })
    .sort({ createdAt: -1 })
    .toArray();
}

/**
 * Creates or updates an individual Mock Test document in MongoDB
 */
export async function createOrUpdateMockTest(mockTestData) {
  const db = await getMongoDb();
  if (!db) throw new Error('Database connection unavailable');

  const mockTestId = mockTestData.id || mockTestData._id || `mock_${Date.now()}`;
  const now = new Date();

  const doc = {
    ...mockTestData,
    _id: mockTestId,
    id: mockTestId,
    status: mockTestData.status || 'published',
    updatedAt: now,
  };

  // 1. Save in mock_tests collection
  await db.collection('mock_tests').updateOne(
    { _id: mockTestId },
    { $set: doc, $setOnInsert: { createdAt: now } },
    { upsert: true }
  );

  // 2. If attached to a testSeriesId, push/update item in test_series.tests array
  if (mockTestData.testSeriesId) {
    const testItem = {
      mockTestId,
      title: mockTestData.title || 'Full Mock Test',
      durationMinutes: Math.round((mockTestData.timeLimitSeconds || 7200) / 60),
      totalQuestions: mockTestData.totalQuestions || 80,
      totalMarks: mockTestData.totalMarks || 100,
      status: mockTestData.status || 'published'
    };

    await db.collection('test_series').updateOne(
      { _id: mockTestData.testSeriesId },
      {
        $pull: { tests: { mockTestId } }
      }
    );

    await db.collection('test_series').updateOne(
      { _id: mockTestData.testSeriesId },
      {
        $push: { tests: testItem },
        $set: { updatedAt: now }
      }
    );
  }

  return doc;
}

/**
 * Retrieves a Mock Test by ID from MongoDB
 */
export async function getMockTestById(mockTestId) {
  const db = await getMongoDb();
  if (!db) return null;

  return db.collection('mock_tests').findOne({
    $or: [{ _id: mockTestId }, { id: mockTestId }]
  });
}

/**
 * Links a specific array of question IDs or template IDs to a Mock Test in MongoDB
 */
export async function linkQuestionsToMockTest(mockTestId, questionIds) {
  const db = await getMongoDb();
  if (!db) throw new Error('Database connection unavailable');

  const now = new Date();

  await db.collection('mock_tests').updateOne(
    { $or: [{ _id: mockTestId }, { id: mockTestId }] },
    {
      $set: {
        questionIds: Array.isArray(questionIds) ? questionIds : [],
        totalQuestions: Array.isArray(questionIds) ? questionIds.length : 80,
        updatedAt: now
      }
    }
  );

  return { success: true, mockTestId, questionCount: questionIds.length };
}
