import { NextResponse } from 'next/server';
import { 
  verifyAccessToken, 
  verifyRefreshToken, 
  validateSession, 
  generateAccessToken, 
  cookieOptions 
} from '@/lib/authService';

export async function GET(request) {
  try {
    const accessCookie = request.cookies.get(cookieOptions.access.name);
    const refreshCookie = request.cookies.get(cookieOptions.refresh.name);

    // 1. Verify Access Token
    if (accessCookie) {
      const payload = verifyAccessToken(accessCookie.value);
      if (payload) {
        return NextResponse.json({
          success: true,
          authenticated: true,
          session: payload
        });
      }
    }

    // 2. Fallback to Token Rotation via Refresh Token
    if (refreshCookie) {
      const payload = verifyRefreshToken(refreshCookie.value);
      if (payload) {
        // Validate active session session hash in DB
        const isValid = await validateSession(payload.userId, refreshCookie.value);
        if (isValid) {
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
            authenticated: true,
            session: newSessionPayload
          });

          // Set rotated access cookie
          response.cookies.set(cookieOptions.access.name, newAccessToken, cookieOptions.access.options);
          return response;
        }
      }
    }

    // If unauthenticated, return default showcase fallback if in non-production, otherwise empty
    const isProduction = process.env.NODE_ENV === 'production';
    if (!isProduction) {
      const showcaseSession = {
        role: 'student',
        userId: 'ryan_p',
        name: 'Aryan Sharma',
        grade: 'Grade 5',
        schoolId: 'school_1'
      };
      return NextResponse.json({
        success: true,
        authenticated: false,
        session: showcaseSession
      });
    }

    return NextResponse.json({
      success: true,
      authenticated: false,
      session: null
    });
  } catch (error) {
    console.error("Session verification route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
