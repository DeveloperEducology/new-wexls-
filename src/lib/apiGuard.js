import { verifyAccessToken } from './authService';

export function authorizeApi(request, allowedRoles) {
  // Read JWT access cookie
  const accessCookie = request.cookies.get('klasschamp_access');
  if (!accessCookie) {
    const err = new Error('Unauthorized: Missing access token');
    err.status = 401;
    throw err;
  }

  const payload = verifyAccessToken(accessCookie.value);
  if (!payload) {
    const err = new Error('Unauthorized: Invalid or expired access token');
    err.status = 401;
    throw err;
  }

  if (!allowedRoles.includes(payload.role)) {
    const err = new Error('Forbidden: Insufficient permissions');
    err.status = 403;
    throw err;
  }

  return payload;
}
