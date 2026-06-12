import { NextResponse } from 'next/server';
import { 
  verifyRefreshToken, 
  validateSession, 
  generateAccessToken, 
  cookieOptions 
} from '@/lib/authService';

export async function POST(request) {
  try {
    const refreshCookie = request.cookies.get(cookieOptions.refresh.name);
    if (!refreshCookie) {
      return NextResponse.json({ success: false, error: "Refresh token is missing" }, { status: 400 });
    }

    const payload = verifyRefreshToken(refreshCookie.value);
    if (!payload) {
      return NextResponse.json({ success: false, error: "Invalid refresh token signature" }, { status: 401 });
    }

    const isValid = await validateSession(payload.userId, refreshCookie.value);
    if (!isValid) {
      return NextResponse.json({ success: false, error: "Session revoked or expired in database" }, { status: 401 });
    }

    const newSessionPayload = {
      userId: payload.userId,
      role: payload.role,
      name: payload.name,
      grade: payload.grade,
      schoolId: payload.schoolId
    };

    const newAccessToken = generateAccessToken(newSessionPayload);
    const response = NextResponse.json({
      success: true,
      message: "Tokens rotated successfully",
      session: newSessionPayload
    });

    response.cookies.set(cookieOptions.access.name, newAccessToken, cookieOptions.access.options);
    return response;
  } catch (error) {
    console.error("Token rotation error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
