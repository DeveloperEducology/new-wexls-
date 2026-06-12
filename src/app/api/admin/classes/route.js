import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { writeAuditLog } from '@/lib/auditService';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const schoolId = searchParams.get('schoolId');

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, classes: [] });
    }

    const query = { isActive: { $ne: false } };
    if (schoolId) {
      query.schoolId = schoolId;
    }

    const classes = await db.collection('classes').find(query).toArray();
    return NextResponse.json({ success: true, classes });
  } catch (error) {
    console.error("Classes list API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { classCode, schoolId, grade, section, teacherId } = body;

    if (!classCode || !schoolId || !grade || !section) {
      return NextResponse.json({ success: false, error: "Missing required class parameters" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({
        success: true,
        message: "DB offline. Class creation simulated successfully."
      });
    }

    const classesColl = db.collection('classes');
    
    // Check if class Code already exists in that school
    const existing = await classesColl.findOne({ schoolId, classCode: classCode.toUpperCase(), isActive: true });
    if (existing) {
      return NextResponse.json({ success: false, error: "Class code already exists in this school" }, { status: 400 });
    }

    const newClass = {
      classCode: classCode.toUpperCase(),
      schoolId,
      grade,
      section: section.toUpperCase(),
      teacherId: teacherId || null,
      isActive: true,
      createdAt: new Date()
    };

    const result = await classesColl.insertOne(newClass);

    // Link teacher to class if assigned
    if (teacherId) {
      await db.collection('teacher_class_links').updateOne(
        { teacherId, classId: String(result.insertedId) },
        { $set: { createdAt: new Date() } },
        { upsert: true }
      );
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: 'admin',
      actorRole: 'admin',
      action: 'class create',
      targetType: 'class',
      targetId: String(result.insertedId),
      metadata: { classCode, schoolId }
    });

    return NextResponse.json({
      success: true,
      message: "Class created successfully",
      classId: result.insertedId
    });
  } catch (error) {
    console.error("Class creation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
