import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { authorizeApi } from '@/lib/apiGuard';

export async function POST(request) {
  try {
    // 1. Authorize user (Teachers and Admins are permitted)
    const userPayload = authorizeApi(request, ['teacher', 'admin']);

    const body = await request.json();
    const { studentName, content, recommendations } = body;

    if (!studentName || !content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: studentName and content' },
        { status: 400 }
      );
    }

    const db = await getMongoDb();
    if (!db) {
      // Offline fallback for testing
      return NextResponse.json({
        success: true,
        message: 'Database offline. Simulated teacher note created successfully.',
        note: {
          studentId: 'stud_mock',
          teacherId: userPayload.userId,
          content,
          recommendations: recommendations || '',
          createdAt: new Date(),
        },
      });
    }

    // Try finding the student by name (case-insensitive regex) or username/userId
    const studentsColl = db.collection('students');
    let studentDoc = await studentsColl.findOne({
      name: { $regex: new RegExp(`^${studentName.trim()}$`, 'i') },
    });

    if (!studentDoc) {
      studentDoc = await studentsColl.findOne({
        userId: studentName.trim(),
      });
    }

    if (!studentDoc) {
      return NextResponse.json(
        { success: false, error: `Student with name or ID "${studentName}" not found.` },
        { status: 404 }
      );
    }

    const notesColl = db.collection('teacher_notes');
    const newNote = {
      studentId: studentDoc._id,
      teacherId: userPayload.userId,
      content,
      recommendations: recommendations || '',
      createdAt: new Date(),
    };

    const result = await notesColl.insertOne(newNote);

    return NextResponse.json({
      success: true,
      message: `Added note to student profile ${studentDoc.name} successfully.`,
      noteId: result.insertedId,
      studentId: studentDoc._id,
    });
  } catch (error) {
    console.error('API Save Note error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}
