import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { writeAuditLog } from '@/lib/auditService';

export async function POST(request) {
  try {
    const body = await request.json();
    const { parentId, studentId, relation } = body;

    if (!parentId || !studentId) {
      return NextResponse.json({ success: false, error: "Missing required parameters: parentId and studentId" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, message: "DB offline. Parent-Student linking simulated successfully." });
    }

    const linkColl = db.collection('parent_student_links');
    
    // Check if link already exists
    const existing = await linkColl.findOne({ parentId, studentId });
    if (existing) {
      return NextResponse.json({ success: false, error: "Link already exists between this parent and student" }, { status: 400 });
    }

    await linkColl.insertOne({
      parentId,
      studentId,
      relation: relation || 'Guardian',
      createdAt: new Date()
    });

    // Write audit log
    await writeAuditLog({
      actorUserId: 'admin',
      actorRole: 'admin',
      action: 'parent-student link create',
      targetType: 'links',
      targetId: `${parentId}_${studentId}`,
      metadata: { relation }
    });

    return NextResponse.json({
      success: true,
      message: "Parent and Student linked successfully"
    });
  } catch (error) {
    console.error("Parent-student linking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const parentId = searchParams.get('parentId');
    const studentId = searchParams.get('studentId');

    if (!parentId || !studentId) {
      return NextResponse.json({ success: false, error: "Missing required parameters: parentId and studentId" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, message: "DB offline. Unlinking simulated successfully." });
    }

    const result = await db.collection('parent_student_links').deleteOne({ parentId, studentId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: "Link not found" }, { status: 404 });
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: 'admin',
      actorRole: 'admin',
      action: 'parent-student link delete',
      targetType: 'links',
      targetId: `${parentId}_${studentId}`
    });

    return NextResponse.json({
      success: true,
      message: "Parent and Student unlinked successfully"
    });
  } catch (error) {
    console.error("Parent-student unlinking error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
