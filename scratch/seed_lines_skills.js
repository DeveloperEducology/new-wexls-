const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
    env[key] = val;
  }
});

const uri = env.MONGODB_URI;
const dbName = "new-wexls";
const collectionName = "curriculum_nodes";

async function run() {
  console.log("Connecting to MongoDB...");
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection(collectionName);

    const now = new Date();

    const skills = [
      {
        id: "english-lkg-basics-lkg-english-letter-lines-standing",
        type: "skill",
        subjectId: "english",
        topicId: "lkg",
        chapterId: "english-lkg-basics",
        parentId: "english-lkg-basics",
        title: "Identify standing lines in letters",
        skillId: "lkg-english-letter-lines-standing",
        templateId: "lkg.english.letter_lines",
        engine: "lkg",
        questionType: "mcq",
        status: "active",
        order: 13,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "english-lkg-basics-lkg-english-letter-lines-sleeping",
        type: "skill",
        subjectId: "english",
        topicId: "lkg",
        chapterId: "english-lkg-basics",
        parentId: "english-lkg-basics",
        title: "Identify sleeping lines in letters",
        skillId: "lkg-english-letter-lines-sleeping",
        templateId: "lkg.english.letter_lines",
        engine: "lkg",
        questionType: "mcq",
        status: "active",
        order: 14,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "english-lkg-basics-lkg-english-letter-lines-slanting",
        type: "skill",
        subjectId: "english",
        topicId: "lkg",
        chapterId: "english-lkg-basics",
        parentId: "english-lkg-basics",
        title: "Identify slanting lines in letters",
        skillId: "lkg-english-letter-lines-slanting",
        templateId: "lkg.english.letter_lines",
        engine: "lkg",
        questionType: "mcq",
        status: "active",
        order: 15,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "english-lkg-basics-lkg-english-letter-lines-curved",
        type: "skill",
        subjectId: "english",
        topicId: "lkg",
        chapterId: "english-lkg-basics",
        parentId: "english-lkg-basics",
        title: "Identify curved lines in letters",
        skillId: "lkg-english-letter-lines-curved",
        templateId: "lkg.english.letter_lines",
        engine: "lkg",
        questionType: "mcq",
        status: "active",
        order: 16,
        createdAt: now,
        updatedAt: now
      }
    ];

    for (const node of skills) {
      const filter = { id: node.id };
      await collection.updateOne(filter, { $set: node }, { upsert: true });
      console.log(`Upserted curriculum node: ${node.id}`);
    }

    console.log("Seeding complete!");
  } finally {
    await client.close();
  }
}

run().catch(console.dir);
