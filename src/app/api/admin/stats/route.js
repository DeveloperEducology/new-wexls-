import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { isR2Configured } from '@/lib/r2Service';

export async function GET() {
  try {
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
      topics: topics.filter(Boolean)
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
