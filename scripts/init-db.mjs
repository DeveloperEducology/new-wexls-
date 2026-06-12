import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Manually load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        // Remove surrounding quotes if present
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        }
        if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    });
  }
} catch (e) {
  console.error("Could not load .env.local:", e.message);
}

async function initDb() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI environment variable is missing. Database initialization aborted.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Connecting to MongoDB cluster for database: "${dbName}"...`);
  
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    console.log("✅ Connection established successfully.");

    const collections = [
      'users', 'auth_sessions', 'otp_verifications', 'schools', 'classes', 'students',
      'parents', 'teachers', 'parent_student_links', 'teacher_class_links', 'subjects',
      'topics', 'competencies', 'skills', 'question_attempts', 'practice_sessions',
      'assignments', 'assignment_progress', 'student_mastery', 'student_skill_history',
      'student_analytics', 'class_analytics', 'school_analytics', 'content_analytics',
      'teacher_notes', 'alerts', 'ai_insights', 'reports', 'audit_logs', 'feature_flags'
    ];

    // 1. Create Collections
    console.log("🛠️ Asserting collections exist...");
    const existingColls = (await db.listCollections().toArray()).map(c => c.name);
    
    for (const coll of collections) {
      if (!existingColls.includes(coll)) {
        await db.createCollection(coll);
        console.log(`   - Created collection: "${coll}"`);
      } else {
        console.log(`   - Verified collection: "${coll}"`);
      }
    }

    // 2. Define Index Maps
    console.log("⚡ Creating indexes and unique constraints...");

    // users indexes
    const usersColl = db.collection('users');
    await usersColl.createIndex({ email: 1 }, { unique: true, sparse: true });
    await usersColl.createIndex({ username: 1 }, { unique: true, sparse: true });
    await usersColl.createIndex({ mobile: 1 }, { unique: true, sparse: true });
    await usersColl.createIndex({ role: 1 });
    await usersColl.createIndex({ schoolId: 1 });
    console.log("   - Users indexes configured.");

    // classes indexes
    const classesColl = db.collection('classes');
    await classesColl.createIndex({ schoolId: 1, grade: 1, section: 1 });
    console.log("   - Classes indexes configured.");

    // students indexes
    const studentsColl = db.collection('students');
    await studentsColl.createIndex({ classId: 1 });
    console.log("   - Students indexes configured.");

    // parent_student_links indexes
    const parentLinksColl = db.collection('parent_student_links');
    await parentLinksColl.createIndex({ parentId: 1, studentId: 1 }, { unique: true });
    console.log("   - Parent-Student relationship indexes configured.");

    // teacher_class_links indexes
    const teacherLinksColl = db.collection('teacher_class_links');
    await teacherLinksColl.createIndex({ teacherId: 1, classId: 1 }, { unique: true });
    console.log("   - Teacher-Class relationship indexes configured.");

    // question_attempts indexes
    const attemptsColl = db.collection('question_attempts');
    await attemptsColl.createIndex({ userId: 1, skillId: 1, loggedAt: 1 });
    console.log("   - Question attempts search indexes configured.");

    // practice_sessions indexes
    const sessionsColl = db.collection('practice_sessions');
    await sessionsColl.createIndex({ userId: 1, startedAt: 1 });
    console.log("   - Practice sessions indexes configured.");

    // student_mastery indexes
    const masteryColl = db.collection('student_mastery');
    await masteryColl.createIndex({ userId: 1, skillId: 1 }, { unique: true });
    console.log("   - Student mastery state indexes configured.");

    // otp_verifications indexes
    const otpColl = db.collection('otp_verifications');
    await otpColl.createIndex({ mobile: 1 });
    await otpColl.createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }); // Auto-TTL index
    console.log("   - OTP verification search & TTL indexes configured.");

    // audit_logs TTL index (3 years = 94608000 seconds)
    const logsColl = db.collection('audit_logs');
    await logsColl.createIndex({ createdAt: 1 }, { expireAfterSeconds: 94608000 });
    console.log("   - Audit logs TTL index set (3-year retention).");

    console.log("🎉 Database foundation setup completed successfully!");
  } catch (error) {
    console.error("❌ Error initializing database schemas:", error);
  } finally {
    await client.close();
  }
}

initDb();
