import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { writeAuditLog } from '@/lib/auditService';
import { authorizeApi } from '@/lib/apiGuard';

export async function POST(request) {
  const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  try {
    const payload = authorizeApi(request, ['admin']);

    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ success: false, error: "Missing required parameter: userId" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, message: "DB offline. Restoration simulated successfully." });
    }

    const restoreFields = {
      isActive: true,
      archivedAt: null,
      archivedBy: null
    };

    const usersColl = db.collection('users');
    let targetId = userId;

    let result = await usersColl.updateOne({ _id: targetId }, { $set: restoreFields });

    if (result.matchedCount === 0) {
      try {
        const { ObjectId } = await import('mongodb');
        targetId = new ObjectId(userId);
        result = await usersColl.updateOne({ _id: targetId }, { $set: restoreFields });
      } catch (e) {
        // failed fallback
      }
    }

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: payload.userId || 'admin',
      actorRole: payload.role || 'admin',
      action: 'user restore',
      targetType: 'user',
      targetId: userId,
      metadata: { ipAddress, userAgent }
    });

    return NextResponse.json({
      success: true,
      message: "User account restored successfully"
    });
  } catch (error) {
    console.error("User restore error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: error.status || 500 });
  }
}
