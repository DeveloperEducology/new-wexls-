import { verifyAccessToken, cookieOptions } from '../authService.js';

export function resolveUserId(req, fallbackUserId = 'guest_child') {
  try {
    if (req && req.cookies && typeof req.cookies.get === 'function') {
      const accessCookie = req.cookies.get(cookieOptions.access.name);
      if (accessCookie && accessCookie.value) {
        const payload = verifyAccessToken(accessCookie.value);
        if (payload && (payload.userId || payload.id)) {
          return payload.userId || payload.id;
        }
      }
    }
  } catch (err) {
    // Return fallback on invalid/missing auth cookie
  }

  return fallbackUserId || 'guest_child';
}
