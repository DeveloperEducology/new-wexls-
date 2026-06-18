import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { 
  verifyPassword, 
  verifyPin, 
  generateAccessToken, 
  generateRefreshToken, 
  createSession, 
  cookieOptions 
} from '@/lib/authService';
import { writeAuditLog } from '@/lib/auditService';

export async function POST(request) {
  const ipAddress = request.headers.get('x-forwarded-for') || '127.0.0.1';
  const userAgent = request.headers.get('user-agent') || 'Unknown';
  
  try {
    const body = await request.json();
    const { role, username, pin, schoolCode, classCode, mobile, otp, email, password } = body;

    const db = await getMongoDb();
    
    // Developer fallback mode if MongoDB is not connected
    if (!db) {
      console.log(`[AUTH Dev Fallback] Authorizing demo login for role: ${role}`);
      const devSession = {
        userId: email || username || 'ryan_p',
        role: role || 'student',
        name: username || 'Aryan Sharma',
        grade: 'Grade 5',
        schoolId: 'school_1'
      };

      const access = generateAccessToken(devSession);
      const refresh = generateRefreshToken(devSession);

      const response = NextResponse.json({ success: true, message: "Login successful (Demo Mode)", session: devSession });
      response.cookies.set(cookieOptions.access.name, access, cookieOptions.access.options);
      response.cookies.set(cookieOptions.refresh.name, refresh, cookieOptions.refresh.options);
      return response;
    }

    // --- DEVELOPER DEMO BYPASS PRESETS (Non-Production Only) ---
    if (process.env.NODE_ENV !== 'production' && (username || email)) {
      const presetKey = username || email;
      const matchingPreset = [
        'ryan_p', 'parent_sharma', 'teach_sharma', 'school_1', 'platform_root',
        'teacher_patel@klasschamp.com', 'admin_sharda@klasschamp.com', 'platform_admin@klasschamp.com'
      ].includes(presetKey);

      if (matchingPreset) {
        console.log(`[AUTH Developer Bypass] Preset credentials match: ${presetKey}`);
        const presetSessions = {
          student: { userId: 'ryan_p', role: 'student', name: 'Aryan Sharma', grade: 'Grade 5', schoolId: 'school_1' },
          parent: { userId: 'parent_sharma', role: 'parent', name: 'Mrs. Sharma', grade: 'Grade 5', schoolId: 'school_1' },
          teacher: { userId: 'teach_sharma', role: 'teacher', name: 'Mrs. Sharma', grade: 'Grade 5', schoolId: 'school_1' },
          'school-admin': { userId: 'school_1', role: 'school-admin', name: 'Sharda School Admin', grade: 'Grade 5', schoolId: 'school_1' },
          admin: { userId: 'platform_root', role: 'admin', name: 'Global Operational Admin', grade: 'Grade 5', schoolId: 'school_1' }
        };

        const sessionData = presetSessions[role];
        if (sessionData) {
          const accessToken = generateAccessToken(sessionData);
          const refreshToken = generateRefreshToken(sessionData);
          const response = NextResponse.json({
            success: true,
            message: "Login successful (Preset Bypass)",
            session: sessionData
          });
          response.cookies.set(cookieOptions.access.name, accessToken, cookieOptions.access.options);
          response.cookies.set(cookieOptions.refresh.name, refreshToken, cookieOptions.refresh.options);
          return response;
        }
      }
    }

    let userDoc = null;
    let authSuccess = false;

    // --- STUDENT LOGIN FLOW ---
    if (role === 'student') {
      if (schoolCode && classCode) {
        // School Code + Class Code + PIN
        const school = await db.collection('schools').findOne({ schoolCode: schoolCode.toUpperCase(), isActive: true });
        const clazz = await db.collection('classes').findOne({ schoolId: school?._id || school?.schoolCode, classCode: classCode.toUpperCase(), isActive: true });
        
        if (school && clazz) {
          // Find student matching username/name in that class
          const student = await db.collection('students').findOne({
            classId: clazz._id || clazz.classCode,
            $or: [
              { userId: username },
              { name: new RegExp(username || '', 'i') }
            ]
          });
          
          if (student) {
            // Find base user credentials
            userDoc = await db.collection('users').findOne({ _id: student.userId || student._id });
            if (userDoc && userDoc.pin) {
              authSuccess = await verifyPin(pin, userDoc.pin);
            }
          }
        }
      } else {
        // Username + PIN
        userDoc = await db.collection('users').findOne({ username, role: 'student' });
        if (userDoc && userDoc.pin) {
          authSuccess = await verifyPin(pin, userDoc.pin);
        }
      }
    }

    // --- PARENT LOGIN FLOW ---
    else if (role === 'parent') {
      if (mobile) {
        // Mobile OTP Login
        const verification = await db.collection('otp_verifications').findOne({
          mobile,
          purpose: 'login',
          consumedAt: null,
          expiresAt: { $gt: new Date() }
        });

        if (verification) {
          authSuccess = await verifyPassword(otp, verification.otpHash);
          if (authSuccess) {
            // Consume OTP
            await db.collection('otp_verifications').updateOne(
              { _id: verification._id },
              { $set: { consumedAt: new Date() } }
            );
            userDoc = await db.collection('users').findOne({ mobile, role: 'parent' });
          }
        }
      } else {
        // Email + Password
        userDoc = await db.collection('users').findOne({ email, role: 'parent' });
        if (userDoc && userDoc.password) {
          authSuccess = await verifyPassword(password, userDoc.password);
        }
      }
    }

    // --- TEACHER & ADMINS LOGIN FLOW ---
    else if (['teacher', 'school-admin', 'admin'].includes(role)) {
      userDoc = await db.collection('users').findOne({ email, role });
      if (userDoc && userDoc.password) {
        authSuccess = await verifyPassword(password, userDoc.password);
      }
    }

    // Check soft delete status
    if (userDoc && userDoc.isActive === false) {
      await writeAuditLog({
        actorUserId: userDoc.username || userDoc.email || 'archived',
        actorRole: role,
        action: 'failed login (archived)',
        metadata: { ipAddress, userAgent }
      });
      return NextResponse.json({ success: false, error: "This user profile has been archived and cannot log in" }, { status: 403 });
    }

    if (!authSuccess || !userDoc) {
      // Log failed login
      await writeAuditLog({
        actorUserId: username || email || mobile || 'unknown',
        actorRole: role,
        action: 'failed login (invalid credentials)',
        metadata: { ipAddress, userAgent }
      });
      return NextResponse.json({ success: false, error: "Invalid credentials entered" }, { status: 401 });
    }

    // --- AUTHENTICATION SUCCESS ---
    let studentGrade = userDoc.grade || 'Grade 5';
    if (userDoc.role === 'student') {
      const studentDoc = await db.collection('students').findOne({
        $or: [
          { userId: String(userDoc._id) },
          { userId: userDoc.username },
          { userId: userDoc._id }
        ]
      });
      if (studentDoc && studentDoc.grade) {
        studentGrade = studentDoc.grade;
      }
    }

    const sessionData = {
      userId: String(userDoc._id),
      role: userDoc.role,
      name: userDoc.name,
      grade: studentGrade,
      schoolId: userDoc.schoolId || null
    };


    const accessToken = generateAccessToken(sessionData);
    const refreshToken = generateRefreshToken(sessionData);

    // Save refresh token session in DB
    await createSession(String(userDoc._id), refreshToken, ipAddress, userAgent);

    // Log successful login
    await writeAuditLog({
      actorUserId: String(userDoc._id),
      actorRole: userDoc.role,
      action: 'login',
      metadata: { ipAddress, userAgent }
    });

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      session: sessionData
    });

    // Write Secure HttpOnly cookies
    response.cookies.set(cookieOptions.access.name, accessToken, cookieOptions.access.options);
    response.cookies.set(cookieOptions.refresh.name, refreshToken, cookieOptions.refresh.options);

    return response;
  } catch (error) {
    console.error("Login route error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
