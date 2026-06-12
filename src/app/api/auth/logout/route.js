import { NextResponse } from 'next/server';
import { verifyRefreshToken, revokeSession, cookieOptions } from '@/lib/authService';
import { writeAuditLog } from '@/lib/auditService';

export async function POST(request) {
  const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  try {
    const refreshCookie = request.cookies.get(cookieOptions.refresh.name);
    
    if (refreshCookie) {
      const payload = verifyRefreshToken(refreshCookie.value);
      if (payload) {
        // Revoke active session in DB
        await revokeSession(payload.userId, refreshCookie.value);
        
        // Log logout audit
        await writeAuditLog({
          actorUserId: payload.userId,
          actorRole: payload.role,
          action: 'logout',
          metadata: { ipAddress, userAgent }
        });
      }
    }

    const response = NextResponse.json({
      success: true,
      message: "Logged out successfully"
    });

    // Clear access and refresh cookies
    response.cookies.delete(cookieOptions.access.name);
    response.cookies.delete(cookieOptions.refresh.name);

    return response;
  } catch (error) {
    console.error("Logout API error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
