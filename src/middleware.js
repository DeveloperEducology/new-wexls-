import { NextResponse } from 'next/server';

function decodeJwtPayload(token) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const rawData = atob(base64);
    
    // Convert base64 binary string to UTF-8
    const bytes = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; i++) {
      bytes[i] = rawData.charCodeAt(i);
    }
    const decoder = new TextDecoder('utf-8');
    const jsonStr = decoder.decode(bytes);
    
    return JSON.parse(jsonStr);
  } catch (err) {
    return null;
  }
}

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Paths requiring validation
  const protectedRoutes = [
    { prefix: '/student/dashboard', allowed: ['student'] },
    { prefix: '/parent/dashboard', allowed: ['parent'] },
    { prefix: '/teacher/dashboard', allowed: ['teacher'] },
    { prefix: '/school-admin/dashboard', allowed: ['school-admin'] },
    { prefix: '/admin/dashboard', allowed: ['admin'] },
    { prefix: '/admin/users', allowed: ['admin'] },
    { prefix: '/admin/classes', allowed: ['admin'] },
    { prefix: '/admin/reports', allowed: ['admin'] }
  ];

  const matchedRoute = protectedRoutes.find(r => pathname.startsWith(r.prefix));

  if (matchedRoute) {
    // Read JWT access cookie
    const accessCookie = request.cookies.get('klasschamp_access');
    const refreshCookie = request.cookies.get('klasschamp_refresh');

    // If both tokens are missing, redirect to login
    if (!accessCookie && !refreshCookie) {
      console.log(`[MIDDLEWARE REDIRECT] Path ${pathname} requested without token.`);
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Attempt to parse access token
    const token = accessCookie?.value || refreshCookie?.value;
    const payload = decodeJwtPayload(token);

    if (!payload) {
      console.log(`[MIDDLEWARE REDIRECT] Invalid JWT format detected.`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Verify token expiration (exp is in seconds)
    const currentUnixTime = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < currentUnixTime && !refreshCookie) {
      console.log(`[MIDDLEWARE REDIRECT] Token expired at ${payload.exp}, current ${currentUnixTime}`);
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Check Role-Based Access Controls
    const userRole = payload.role;
    if (!matchedRoute.allowed.includes(userRole)) {
      console.log(`[MIDDLEWARE BLOCK] Role "${userRole}" forbidden from path "${pathname}".`);
      // Redirect unauthorized user to their respective default home dashboard
      let redirectTarget = '/login';
      if (userRole === 'student') redirectTarget = '/student/dashboard';
      else if (userRole === 'parent') redirectTarget = '/parent/dashboard';
      else if (userRole === 'teacher') redirectTarget = '/teacher/dashboard';
      else if (userRole === 'school-admin') redirectTarget = '/school-admin/dashboard';
      else if (userRole === 'admin') redirectTarget = '/admin/dashboard';

      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/student/dashboard',
    '/student/dashboard/:path*',
    '/parent/dashboard',
    '/parent/dashboard/:path*',
    '/teacher/dashboard',
    '/teacher/dashboard/:path*',
    '/school-admin/dashboard',
    '/school-admin/dashboard/:path*',
    '/admin/dashboard',
    '/admin/dashboard/:path*',
    '/admin/users',
    '/admin/users/:path*',
    '/admin/classes',
    '/admin/classes/:path*',
    '/admin/reports',
    '/admin/reports/:path*'
  ]
};
