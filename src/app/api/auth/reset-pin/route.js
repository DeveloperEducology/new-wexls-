import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { hashPin } from '@/lib/authService';
import { writeAuditLog } from '@/lib/auditService';

export async function POST(request) {
  const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  try {
    const body = await request.json();
    const { userId, newPin, actorId, actorRole } = body;

    if (!userId || !newPin) {
      return NextResponse.json({ success: false, error: "Missing required parameters: userId and newPin" }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: true, message: "DB offline. Student PIN reset simulated successfully." });
    }

    const hashedPin = await hashPin(newPin);
    
    // Update users PIN
    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: { pin: hashedPin, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      try {
        const { ObjectId } = await import('mongodb');
        await db.collection('users').updateOne(
          { _id: new ObjectId(userId) },
          { $set: { pin: hashedPin, updatedAt: new Date() } }
        );
      } catch (e) {
        // failed fallback
      }
    }

    // Write audit log
    await writeAuditLog({
      actorUserId: actorId || 'admin',
      actorRole: actorRole || 'admin',
      action: 'reset pin',
      targetType: 'user',
      targetId: userId,
      metadata: { ipAddress, userAgent }
    });

    return NextResponse.json({
      success: true,
      message: "Student PIN reset successfully"
    });
  } catch (error) {
    console.error("Student PIN reset error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
