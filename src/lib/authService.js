import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { getMongoDb } from './db/mongo';
import { writeAuditLog } from './auditService';

// Ensure secret keys are defined
const JWT_SECRET = process.env.JWT_SECRET || 'klasschamp_dev_jwt_secret_982347293';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'klasschamp_dev_refresh_secret_23847293';

// 1. Password and PIN encryption helpers
export async function hashPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(plain, hashed) {
  if (!plain || !hashed) return false;
  return bcrypt.compare(plain, hashed);
}

export async function hashPin(pin) {
  // Hash student 4-digit PINs securely
  return hashPassword(String(pin));
}

export async function verifyPin(pin, hashed) {
  return verifyPassword(String(pin), hashed);
}

// 2. JWT Access / Refresh Token Handlers
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

export function generateRefreshToken(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' });
}

export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, REFRESH_SECRET);
  } catch (err) {
    return null;
  }
}

// 3. Cookie management options
export const cookieOptions = {
  access: {
    name: 'klasschamp_access',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 // 15 mins
    }
  },
  refresh: {
    name: 'klasschamp_refresh',
    options: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 // 7 days
    }
  }
};

// 4. Session Tracking in DB
export async function createSession(userId, refreshToken, ipAddress = '127.0.0.1', userAgent = 'Unknown') {
  try {
    const db = await getMongoDb();
    if (!db) return null;

    const sessionColl = db.collection('auth_sessions');
    const salt = await bcrypt.genSalt(6);
    const refreshTokenHash = await bcrypt.hash(refreshToken, salt);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiration

    const result = await sessionColl.insertOne({
      userId,
      refreshTokenHash,
      deviceInfo: userAgent,
      ipAddress,
      expiresAt,
      createdAt: new Date(),
      revokedAt: null
    });
    return result.insertedId;
  } catch (err) {
    console.error("Session registration error:", err);
    return null;
  }
}

export async function validateSession(userId, refreshToken) {
  try {
    const db = await getMongoDb();
    if (!db) return false;

    const sessionColl = db.collection('auth_sessions');
    
    // Find non-expired, active sessions for the user
    const activeSessions = await sessionColl.find({
      userId,
      revokedAt: null,
      expiresAt: { $gt: new Date() }
    }).toArray();

    // Verify hashed token
    for (const session of activeSessions) {
      const match = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (match) return true;
    }
    return false;
  } catch (err) {
    console.error("Session verification error:", err);
    return false;
  }
}

export async function revokeSession(userId, refreshToken) {
  try {
    const db = await getMongoDb();
    if (!db) return;

    const sessionColl = db.collection('auth_sessions');
    const activeSessions = await sessionColl.find({
      userId,
      revokedAt: null
    }).toArray();

    for (const session of activeSessions) {
      const match = await bcrypt.compare(refreshToken, session.refreshTokenHash);
      if (match) {
        await sessionColl.updateOne(
          { _id: session._id },
          { $set: { revokedAt: new Date() } }
        );
        break;
      }
    }
  } catch (err) {
    console.error("Failed to revoke session:", err);
  }
}
