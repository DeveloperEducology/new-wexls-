import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { hashPassword, hashPin } from '@/lib/authService';
import { authorizeApi } from '@/lib/apiGuard';

export async function POST(request) {
  try {
    authorizeApi(request, ['admin']);

    const body = await request.json();
    const { role, name, email, password, username, pin, mobile, schoolId, classId, parentId, grade } = body;

    if (!role || !name) {
      return NextResponse.json({ success: false, error: "Missing required fields: role and name" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      // Mock successful creation for demo purposes when DB is offline
      return NextResponse.json({
        success: true,
        message: "Database offline. User created in demo state.",
        user: { role, name, username: username || email, pin }
      });
    }

    const usersColl = db.collection('users');
    const now = new Date();

    // Check if user already exists
    const existingUser = await usersColl.findOne({
      $or: [
        { email: email || '____invalid_email____' },
        { username: username || '____invalid_username____' }
      ]
    });

    if (existingUser) {
      return NextResponse.json({ success: false, error: "A user with this email or username already exists" }, { status: 400 });
    }

    // Hash credentials securely
    const hashedPassword = password ? await hashPassword(password) : null;
    const hashedPin = pin ? await hashPin(pin) : null;

    // 1. Insert into users collection
    const newUserDoc = {
      name,
      role,
      createdAt: now
    };
    if (email) newUserDoc.email = email;
    if (username) newUserDoc.username = username;
    if (mobile) newUserDoc.mobile = mobile;
    if (hashedPassword) newUserDoc.password = hashedPassword;
    if (hashedPin) newUserDoc.pin = hashedPin;
    if (schoolId) newUserDoc.schoolId = schoolId;
    if (classId) newUserDoc.classId = classId;
    if (grade) newUserDoc.grade = grade;

    const userResult = await usersColl.insertOne(newUserDoc);

    const insertedId = userResult.insertedId;

    // 2. Insert into role-specific profile collection
    if (role === 'student') {
      await db.collection('students').insertOne({
        _id: `stud_${insertedId}`,
        userId: username,
        parentId: parentId || null,
        classId: classId || null,
        name,
        streakDays: 0,
        totalXp: 0,
        avatar: '🐱',
        grade: grade || 'Grade 5'
      });

      if (parentId) {
        await db.collection('parent_student_links').insertOne({
          parentId,
          studentId: `stud_${insertedId}`,
          relation: 'Guardian',
          createdAt: now
        });
      }
    } else if (role === 'parent') {
      await db.collection('parents').insertOne({
        _id: `parent_${insertedId}`,
        userId: email || mobile,
        email: email || null,
        mobile: mobile || null,
        childIds: []
      });
    } else if (role === 'teacher') {
      await db.collection('teachers').insertOne({
        _id: `teach_${insertedId}`,
        userId: email,
        email: email || null,
        classIds: classId ? [classId] : []
      });
    }

    return NextResponse.json({
      success: true,
      message: `User created successfully as ${role}`,
      user: {
        id: String(insertedId),
        name,
        role,
        username: username || email
      }
    });
  } catch (error) {
    console.error("User creation API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
