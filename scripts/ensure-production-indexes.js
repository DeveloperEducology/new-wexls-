import { getMongoDb } from '../src/lib/db/mongo.js';

export async function ensureProductionIndexes() {
  console.log('⚡ Starting Production MongoDB Index Setup...');
  const db = await getMongoDb();
  if (!db) {
    console.error('❌ Failed to connect to MongoDB');
    return false;
  }

  try {
    // 1. templates Collection Indexes
    console.log('🔹 Indexing "templates"...');
    await db.collection('templates').createIndex({ examId: 1, section: 1, topic: 1, status: 1 });
    await db.collection('templates').createIndex({ id: 1 });

    // 2. dynamic_templates Collection Indexes
    console.log('🔹 Indexing "dynamic_templates"...');
    await db.collection('dynamic_templates').createIndex({ id: 1 });
    await db.collection('dynamic_templates').createIndex({ examId: 1, section: 1, topic: 1, status: 1 });

    // 3. questions Collection Indexes
    console.log('🔹 Indexing "questions"...');
    await db.collection('questions').createIndex({ templateId: 1, status: 1 });
    await db.collection('questions').createIndex({ examId: 1, section: 1, topic: 1, status: 1, difficulty: 1 });

    // 4. sessions Collection Indexes
    console.log('🔹 Indexing "sessions"...');
    await db.collection('sessions').createIndex({ userId: 1, examId: 1, createdAt: -1 });
    await db.collection('sessions').createIndex({ status: 1, updatedAt: -1 });

    // 5. student_profiles Collection Indexes
    console.log('🔹 Indexing "student_profiles"...');
    await db.collection('student_profiles').createIndex({ userId: 1, examId: 1 });

    console.log('✅ All MongoDB Production Indexes Successfully Created & Verified!');
    return true;
  } catch (err) {
    console.error('❌ Error creating production indexes:', err);
    return false;
  }
}

// Run directly if invoked via CLI
if (import.meta.url === `file://${process.argv[1]}`) {
  ensureProductionIndexes().then(() => process.exit(0));
}
