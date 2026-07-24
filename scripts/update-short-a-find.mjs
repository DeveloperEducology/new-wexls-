import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env.local
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
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

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in env variables.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'new-wexls';
  console.log(`🔌 Connecting to database: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // 1. Delete the custom duplicated ukg-short-a-find pool document from vocabulary_pools
    console.log("Cleaning up custom pool document from 'vocabulary_pools'...");
    await db.collection('vocabulary_pools').deleteOne({ poolId: 'ukg-short-a-find' });

    // 2. Insert/Upsert the dynamic question template in the 'questions' collection
    console.log("Inserting option-pooling question document into 'questions' collection...");
    
    const questionDoc = {
      id: 'english_ukg-english-reading-foundations_ukg-eng-short-a-find_dynamic',
      skillId: 'ukg-eng-short-a-find',
      subject: 'english',
      topic: 'ukg-english-reading-foundations',
      grade: 'ukg',
      type: 'dynamic_pool',
      interaction: 'image_pick',
      questionText: 'Listen to each word. Which word has the short a sound?',
      voice: 'Puck',
      poolId: 'english-class1-short-i-words', // Referenced option pool ID!
      targetCategory: 'short_a_words',
      distractorCategories: ['short_i_words', 'short_e_words', 'short_o_words', 'short_u_words'],
      distractorCount: 1,
      totalOptions: 2,
      hideOptionLabel: true,
      difficultyRules: {
        easy: {
          optionCount: 2,
          correctCount: 1,
          distractorCount: 1,
          showLabels: false
        },
        medium: {
          optionCount: 3,
          correctCount: 1,
          distractorCount: 2,
          showLabels: false
        },
        hard: {
          optionCount: 4,
          correctCount: 1,
          distractorCount: 3,
          showLabels: false
        }
      },
      metadata: {
        interaction: 'image_pick',
        grade: 'ukg',
        subject: 'english'
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    const result = await db.collection('questions').replaceOne(
      { id: questionDoc.id },
      questionDoc,
      { upsert: true }
    );

    console.log(`\n========================================`);
    console.log(`✅ Success: Configured Option Pooling question template.`);
    console.log(`- Stored Question ID: ${questionDoc.id}`);
    console.log(`- Referenced Option Pool: ${questionDoc.poolId}`);
    console.log(`- Target Category: ${questionDoc.targetCategory}`);
    console.log(`- Match count: ${result.matchedCount}, Upserted count: ${result.upsertedCount}`);
    console.log(`\n🔗 Test practice link:`);
    console.log(`👉 http://localhost:3000/practice?subject=english&topic=ukg-english-reading-foundations&skill=ukg-eng-short-a-find`);
    console.log(`========================================\n`);

  } catch (err) {
    console.error("❌ Seeding operation failed:", err.message);
  } finally {
    await client.close();
  }
}

run();
