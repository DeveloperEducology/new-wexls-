import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { isR2Configured } from '@/lib/r2Service';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const studentFilter = searchParams.get('student');

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({
        success: false,
        dbConnected: false,
        r2Configured: isR2Configured(),
        totalQuestions: 0,
        questionsWithAudio: 0,
        missingAudio: 0,
        mcqQuestions: 0,
        fibQuestions: 0,
        ttsCacheItems: 0,
        subjects: [],
        topics: [],
        error: 'Database connection failed'
      });
    }

    const questionsCollectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const questionsCollection = db.collection(questionsCollectionName);
    const cacheCollection = db.collection('tts_cache');

    // Perform queries
    const totalQuestions = await questionsCollection.countDocuments();
    
    const questionsWithAudio = await questionsCollection.countDocuments({
      audioUrl: { $exists: true, $ne: null, $ne: '' }
    });

    const mcqQuestions = await questionsCollection.countDocuments({
      type: { $in: ['mcq', 'multiplechoice', 'multipleChoice'] }
    });

    const fibQuestions = await questionsCollection.countDocuments({
      type: { $in: ['fillInTheBlank', 'fillinblank', 'fib'] }
    });

    const ttsCacheItems = await cacheCollection.countDocuments();

    // Fetch unique subjects and topics for filtering
    const subjects = await questionsCollection.distinct('subject');
    const topics = await questionsCollection.distinct('topic');

    // Retrieve Student Practice & Analytics Stats
    const attemptsCollection = db.collection('student_attempts');

    // Build query filter
    const query = {};
    if (studentFilter) {
      query.userId = studentFilter;
    }

    const totalAttempts = await attemptsCollection.countDocuments(query);
    const correctAttempts = await attemptsCollection.countDocuments({ ...query, isCorrect: true });
    const recentAttempts = await attemptsCollection
      .find(query)
      .sort({ loggedAt: -1, createdAt: -1 })
      .limit(10)
      .toArray();

    // Fetch distinct active students
    const activeStudents = await attemptsCollection.distinct('userId');

    // Calculate Topic Breakdown for Donut Chart
    const topicBreakdownRaw = await attemptsCollection.aggregate([
      { $match: query },
      { $group: { _id: '$topic', count: { $sum: 1 } } }
    ]).toArray();

    const topicBreakdown = topicBreakdownRaw.map(item => ({
      topic: item._id || 'unknown',
      count: item.count
    }));

    // Calculate Friction Points (skills with lowest accuracy, min 1 attempt)
    const frictionPointsRaw = await attemptsCollection.aggregate([
      { $match: query },
      { 
        $group: { 
          _id: '$skillId', 
          topic: { $first: '$topic' },
          total: { $sum: 1 }, 
          correct: { $sum: { $cond: [{ $eq: ['$isCorrect', true] }, 1, 0] } },
          avgTimeSpent: { $avg: '$timeSpentMs' }
        } 
      },
      { 
        $project: {
          skillId: '$_id',
          topic: 1,
          total: 1,
          correct: 1,
          avgTimeSpent: 1,
          accuracy: { $multiply: [{ $divide: ['$correct', '$total'] }, 100] }
        }
      },
      { $match: { total: { $gte: 1 } } },
      { $sort: { accuracy: 1, total: -1 } },
      { $limit: 5 }
    ]).toArray();

    return NextResponse.json({
      success: true,
      dbConnected: true,
      r2Configured: isR2Configured(),
      totalQuestions,
      questionsWithAudio,
      missingAudio: Math.max(0, totalQuestions - questionsWithAudio),
      mcqQuestions,
      fibQuestions,
      ttsCacheItems,
      subjects: subjects.filter(Boolean),
      topics: topics.filter(Boolean),
      students: activeStudents.filter(Boolean),
      topicBreakdown,
      frictionPoints: frictionPointsRaw.map(fp => ({
        ...fp,
        accuracy: Math.round(fp.accuracy),
        avgTimeSpent: fp.avgTimeSpent ? Math.round(fp.avgTimeSpent / 1000 * 10) / 10 : null
      })),
      analytics: {
        totalAttempts,
        correctAttempts,
        recentAttempts: recentAttempts.map(att => ({
          ...att,
          _id: String(att._id)
        }))
      }
    });
  } catch (error) {
    console.error('Stats API error:', error);
    return NextResponse.json({
      success: false,
      dbConnected: false,
      r2Configured: isR2Configured(),
      error: error.message
    }, { status: 500 });
  }
}
