import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';

const COLLECTION_NAME = 'student_attempts';

export async function POST(request) {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed. Set MONGODB_URI first.' }, { status: 500 });
    }

    const body = await request.json();
    const { attempt } = body;

    if (!attempt || !attempt.skillId) {
      return NextResponse.json({ success: false, error: 'Invalid attempt payload' }, { status: 400 });
    }

    const collection = db.collection(COLLECTION_NAME);

    // Save the attempt record to MongoDB
    const result = await collection.insertOne({
      ...attempt,
      loggedAt: new Date(),
    });

    return NextResponse.json({ 
      success: true, 
      id: String(result.insertedId)
    });
  } catch (error) {
    console.error('Failed to log student analytics:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
