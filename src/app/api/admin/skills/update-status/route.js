import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';

export async function POST(request) {
  try {
    const body = await request.json();
    const { skillId, templateAdded, testingStatus, status, templateId, engine } = body;

    if (!skillId) {
      return NextResponse.json({ success: false, error: 'skillId is required' }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const updateDoc = {
      updatedAt: new Date(),
    };

    if (typeof templateAdded === 'boolean') {
      updateDoc.manualTemplateAdded = templateAdded;
      updateDoc.templateAdded = templateAdded;
    }

    if (testingStatus && typeof testingStatus === 'string') {
      updateDoc.manualTestingStatus = testingStatus;
      updateDoc.testingStatus = testingStatus;
      updateDoc.status = testingStatus.toLowerCase().includes('active') ? 'active' : 'draft';
    }

    if (templateId !== undefined) {
      updateDoc.templateId = String(templateId).trim();
    }

    if (engine !== undefined) {
      updateDoc.engine = String(engine).trim();
    }

    const result = await db.collection('skills_v2').updateOne(
      { id: skillId },
      { $set: updateDoc },
      { upsert: true }
    );

    return NextResponse.json({
      success: true,
      skillId,
      updatedFields: updateDoc,
      result
    });
  } catch (error) {
    console.error('Error updating skill status:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
