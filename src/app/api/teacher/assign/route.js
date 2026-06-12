import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { authorizeApi } from '@/lib/apiGuard';

export async function POST(request) {
  try {
    // 1. Authorize user (Teachers and Admins are permitted)
    const userPayload = authorizeApi(request, ['teacher', 'admin']);

    const body = await request.json();
    const { classId, skillId } = body;

    if (!classId || !skillId) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: classId and skillId' },
        { status: 400 }
      );
    }

    // Normalized class ID (e.g. "5A" -> "class_5a")
    const mappedClassId = classId.toLowerCase().startsWith('class_')
      ? classId.toLowerCase()
      : `class_${classId.toLowerCase()}`;

    const db = await getMongoDb();
    if (!db) {
      // Offline fallback for testing
      return NextResponse.json({
        success: true,
        message: 'Database offline. Simulated assignment created successfully.',
        assignment: {
          classId: mappedClassId,
          skillId,
          teacherId: userPayload.userId,
          createdAt: new Date(),
        },
      });
    }

    const assignmentsColl = db.collection('assignments');
    const newAssignment = {
      classId: mappedClassId,
      skillId,
      teacherId: userPayload.userId,
      createdAt: new Date(),
      isActive: true,
    };

    const result = await assignmentsColl.insertOne(newAssignment);
    const assignmentId = result.insertedId;

    // Find students registered in this class
    const studentsColl = db.collection('students');
    const students = await studentsColl.find({ classId: mappedClassId }).toArray();

    let progressInitialized = 0;
    if (students.length > 0) {
      const progressColl = db.collection('assignment_progress');
      const progressDocs = students.map((stud) => ({
        assignmentId,
        studentId: stud._id || stud.userId,
        status: 'pending',
        score: null,
        timeSpentMs: 0,
        completedAt: null,
      }));
      await progressColl.insertMany(progressDocs);
      progressInitialized = students.length;
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned skill ${skillId} to Class ${classId}.`,
      assignmentId,
      studentsCount: progressInitialized,
    });
  } catch (error) {
    console.error('API Assign Skill error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}
