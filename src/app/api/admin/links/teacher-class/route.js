import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { writeAuditLog } from '@/lib/auditService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { teacherId, classId } = body;

    if (!teacherId || !classId) {
      return NextResponse.json({ success: false, error: "Missing required parameters: teacherId and classId" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, message: "DB offline. Teacher-Class linking simulated successfully." });
    }

    const linkColl = db.collection('teacher_class_links');
    
    // Check if link already exists
    const existing = await linkColl.findOne({ teacherId, classId });
    if (existing) {
      return NextResponse.json({ success: false, error: "Link already exists between this teacher and class" }, { status: 400 });
    }

    await linkColl.insertOne({
      teacherId,
      classId,
      createdAt: new Date()
    });

    // Write audit log
    await writeAuditLog({
      actorUserId: 'admin',
      actorRole: 'admin',
      action: 'teacher-class link create',
      targetType: 'links',
      targetId: `${teacherId}_${classId}`
    });

    return NextResponse.json({
      success: true,
      message: "Teacher and Class linked successfully"
    });
  } catch (error) {
    console.error("Teacher-class linking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const teacherId = searchParams.get('teacherId');
    const classId = searchParams.get('classId');

    if (!teacherId || !classId) {
      return NextResponse.json({ success: false, error: "Missing required parameters: teacherId and classId" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, message: "DB offline. Unlinking simulated successfully." });
    }

    const result = await db.collection('teacher_class_links').deleteOne({ teacherId, classId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: 'admin',
      actorRole: 'admin',
      action: 'teacher-class link delete',
      targetType: 'links',
      targetId: `${teacherId}_${classId}`
    });

    return NextResponse.json({
      success: true,
      message: "Teacher and Class unlinked successfully"
    });
  } catch (error) {
    console.error("Teacher-class unlinking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
