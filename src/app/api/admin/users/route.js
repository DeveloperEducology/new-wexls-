import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { hashPassword, hashPin } from '@/lib/authService';
import { writeAuditLog } from '@/lib/auditService';
import { authorizeApi } from '@/lib/apiGuard';

// GET: Lists users with extensive filtering (excluding soft-deleted unless requested)
export async function GET(request) {
  try {
    authorizeApi(request, ['admin']);

    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const schoolId = searchParams.get('schoolId');
    const classId = searchParams.get('classId');
    const grade = searchParams.get('grade');
    const includeArchived = searchParams.get('includeArchived') === 'true';

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, users: [] });
    }

    const query = {};
    
    // Soft delete status
    if (!includeArchived) {
      query.isActive = { $ne: false };
    }

    // Role filtering
    if (role) {
      query.role = role;
    }

    // School filtering
    if (schoolId) {
      query.schoolId = schoolId;
    }

    // Class filtering
    if (classId) {
      query.classId = classId;
    }

    // Grade filtering
    if (grade) {
      query.grade = grade;
    }

    // Search query
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { username: new RegExp(search, 'i') }
      ];
    }

    const users = await db.collection('users').find(query).limit(100).toArray();

    return NextResponse.json({
      success: true,
      users: users.map(u => {
        const { password, pin, ...safeUser } = u;
        return safeUser;
      })
    });
  } catch (error) {
    console.error("Users list API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}

// PATCH: Updates a user's details (password, PIN, name, role linkages)
export async function PATCH(request) {
  try {
    authorizeApi(request, ['admin']);

    const body = await request.json();
    const { userId, name, email, password, pin, schoolId, classId, role } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing parameter: userId" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, message: "DB offline. Update simulated successfully." });
    }

    const updateFields = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email;
    if (schoolId !== undefined) updateFields.schoolId = schoolId;
    if (classId !== undefined) updateFields.classId = classId;
    if (role) updateFields.role = role;

    // Hash credentials if modified
    if (password) {
      updateFields.password = await hashPassword(password);
    }
    if (pin) {
      updateFields.pin = await hashPin(pin);
    }

    updateFields.updatedAt = new Date();

    const usersColl = db.collection('users');
    let targetId = userId;

    // Try normal update
    let result = await usersColl.updateOne({ _id: targetId }, { $set: updateFields });

    if (result.matchedCount === 0) {
      try {
        const { ObjectId } = await import('mongodb');
        targetId = new ObjectId(userId);
        result = await usersColl.updateOne({ _id: targetId }, { $set: updateFields });
      } catch (e) {
        // failed fallback
      }
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Also update sub-collections (e.g. students or teachers)
    if (role === 'student' || (!role && classId)) {
      await db.collection('students').updateOne(
        { userId: userId },
        { $set: { name, classId, grade: updateFields.grade || 'Grade 5' } }
      );
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: 'admin',
      actorRole: 'admin',
      action: 'user update',
      targetType: 'user',
      targetId: userId,
      metadata: { updateFields }
    });

    return NextResponse.json({
      success: true,
      message: "User profile updated successfully"
    });
  } catch (error) {
    console.error("Users update API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
