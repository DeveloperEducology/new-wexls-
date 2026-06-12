import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { hashPin } from '@/lib/authService';
import { authorizeApi } from '@/lib/apiGuard';

export async function POST(request) {
  try {
    // 1. Authorize (Teachers and Admins only)
    const userPayload = authorizeApi(request, ['teacher', 'admin']);

    const body = await request.json();
    const { name, username, pin, classId } = body;

    if (!name || !username || !pin) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: name, username, and pin' },
        { status: 400 }
      );
    }

    // Normalize classId (e.g. "5A" -> "class_5a")
    const mappedClassId = classId 
      ? (classId.toLowerCase().startsWith('class_') ? classId.toLowerCase() : `class_${classId.toLowerCase()}`)
      : 'class_5a';

    const db = await getMongoDb();
    if (!db) {
      // Offline fallback
      return NextResponse.json({
        success: true,
        message: 'Database offline. Student added in simulated state.',
        student: { name, username, classId: mappedClassId },
      });
    }

    // Check if user already exists
    const usersColl = db.collection('users');
    const existingUser = await usersColl.findOne({ username: username.trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'A student with this username already exists.' },
        { status: 400 }
      );
    }

    const now = new Date();
    const schoolId = userPayload.schoolId || 'school_1';

    // 2. Insert into users collection
    const newUserDoc = {
      name: name.trim(),
      username: username.trim(),
      role: 'student',
      pin: await hashPin(pin),
      schoolId,
      classId: mappedClassId,
      isActive: true,
      createdAt: now,
    };
    const userResult = await usersColl.insertOne(newUserDoc);
    const insertedId = userResult.insertedId;

    // Resolve grade from class code
    let grade = 'Grade 5';
    if (mappedClassId.includes('3')) {
      grade = 'Grade 3';
    } else if (mappedClassId.includes('ukg')) {
      grade = 'UKG';
    }

    // 3. Insert into students collection
    const studentsColl = db.collection('students');
    await studentsColl.insertOne({
      _id: `stud_${insertedId}`,
      userId: username.trim(),
      parentId: null,
      classId: mappedClassId,
      name: name.trim(),
      streakDays: 0,
      totalXp: 0,
      avatar: '🐱',
      grade,
    });

    return NextResponse.json({
      success: true,
      message: `Successfully registered student ${name} in Class ${classId.toUpperCase()}!`,
      userId: String(insertedId),
      studentId: `stud_${insertedId}`,
    });
  } catch (error) {
    console.error('API Quick Add Student error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: error.status || 500 }
    );
  }
}
