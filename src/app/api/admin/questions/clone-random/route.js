import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const { subject, topic, skillId, count = 5 } = body;

    if (!subject || !topic) {
      return NextResponse.json({ success: false, error: 'Missing subject or topic' }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const collection = db.collection(collectionName);

    // Build filter query for active/published questions
    const query = {
      subject,
      topic,
      $or: [
        { status: { $exists: false } },
        { status: 'active' },
        { status: 'published' }
      ]
    };

    if (skillId) {
      query.skillId = skillId;
    }

    // Use MongoDB aggregation framework with $sample to get random questions
    const candidates = await collection.aggregate([
      { $match: query },
      { $sample: { size: parseInt(count, 10) || 5 } }
    ]).toArray();

    if (!candidates || candidates.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: `No active questions found in database for ${subject}/${topic}` 
      }, { status: 404 });
    }

    const clonedQuestions = [];
    const now = new Date();

    for (let i = 0; i < candidates.length; i++) {
      const q = candidates[i];
      
      // Generate a new unique ID
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      const clonedId = `${q.subject || subject}_${q.topic || topic}_${q.skillId || 'cloned'}_clone_${Date.now()}_${randomSuffix}`;

      // Create cloned question payload, changing status to 'draft'
      const { _id, id: originalId, ...questionData } = q;
      const clonedDoc = {
        ...questionData,
        id: clonedId,
        status: 'draft',
        createdAt: now,
        updatedAt: now,
        metadata: {
          ...(questionData.metadata || {}),
          status: 'draft',
          originalId: originalId || String(_id)
        }
      };

      await collection.insertOne(clonedDoc);
      clonedQuestions.push(clonedDoc);
    }

    return NextResponse.json({
      success: true,
      clonedCount: clonedQuestions.length,
      questions: clonedQuestions
    });
  } catch (error) {
    console.error('API Error in clone-random questions:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
