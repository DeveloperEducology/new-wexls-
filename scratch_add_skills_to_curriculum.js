import { getMongoDb } from './src/lib/db/mongo.js';
import fs from 'fs';

// Load .env.local manually
try {
  const envPath = './.env.local';
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const val = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
        process.env[key] = val;
      }
    });
  }
} catch (e) {
  console.error("Failed to load env:", e);
}

async function run() {
  const db = await getMongoDb();
  if (!db) {
    console.error("Failed to connect to database");
    process.exit(1);
  }

  const beginningSkillId = "letter-identification-find-phonic-sound-beginning";
  const endingSkillId = "letter-identification-find-phonic-sound-ending";

  // 1. Create curriculum nodes
  const now = new Date();
  const beginningNode = {
    id: beginningSkillId,
    skillId: beginningSkillId,
    parentId: "letter-identification",
    subjectId: "english",
    topicId: "letter-identification",
    type: "skill",
    status: "active",
    title: "find phonic sound (beginning blends)",
    order: 10,
    source: "db",
    createdAt: now,
    updatedAt: now,
    metadata: {},
    prerequisites: [],
    remediation: [],
    tags: []
  };

  const endingNode = {
    id: endingSkillId,
    skillId: endingSkillId,
    parentId: "letter-identification",
    subjectId: "english",
    topicId: "letter-identification",
    type: "skill",
    status: "active",
    title: "find phonic sound (ending sounds)",
    order: 11,
    source: "db",
    createdAt: now,
    updatedAt: now,
    metadata: {},
    prerequisites: [],
    remediation: [],
    tags: []
  };

  console.log("=== Registering Curriculum Nodes ===");
  const begNodeRes = await db.collection('curriculum_nodes').updateOne(
    { id: beginningSkillId },
    { $set: beginningNode },
    { upsert: true }
  );
  console.log(`Beginning node: matched=${begNodeRes.matchedCount}, upserted=${begNodeRes.upsertedCount}`);

  const endNodeRes = await db.collection('curriculum_nodes').updateOne(
    { id: endingSkillId },
    { $set: endingNode },
    { upsert: true }
  );
  console.log(`Ending node: matched=${endNodeRes.matchedCount}, upserted=${endNodeRes.upsertedCount}`);


  // 2. Update question templates in questions collection
  console.log("\n=== Updating Question Templates ===");
  
  const beginningQId = "english_letter-identification_letter-identification-find-phonic-sound-beginning";
  const endingQId = "english_letter-identification_letter-identification-find-phonic-sound-ending";

  const updateBegRes = await db.collection('questions').updateOne(
    { skillId: beginningSkillId },
    { 
      $set: { 
        id: beginningQId,
        status: "active"
      } 
    }
  );
  console.log(`Beginning template: matched=${updateBegRes.matchedCount}, modified=${updateBegRes.modifiedCount}`);

  const updateEndRes = await db.collection('questions').updateOne(
    { skillId: endingSkillId },
    { 
      $set: { 
        id: endingQId,
        status: "active"
      } 
    }
  );
  console.log(`Ending template: matched=${updateEndRes.matchedCount}, modified=${updateEndRes.modifiedCount}`);


  // 3. Verification
  console.log("\n=== Verifying Database State ===");
  const dbBegNode = await db.collection('curriculum_nodes').findOne({ id: beginningSkillId });
  console.log("Beginning curriculum node in DB:", dbBegNode ? "FOUND" : "NOT FOUND");
  
  const dbEndNode = await db.collection('curriculum_nodes').findOne({ id: endingSkillId });
  console.log("Ending curriculum node in DB:", dbEndNode ? "FOUND" : "NOT FOUND");

  const dbBegQ = await db.collection('questions').findOne({ skillId: beginningSkillId });
  console.log("Beginning question template in DB:", dbBegQ ? `FOUND (id: ${dbBegQ.id}, status: ${dbBegQ.status})` : "NOT FOUND");

  const dbEndQ = await db.collection('questions').findOne({ skillId: endingSkillId });
  console.log("Ending question template in DB:", dbEndQ ? `FOUND (id: ${dbEndQ.id}, status: ${dbEndQ.status})` : "NOT FOUND");

  process.exit(0);
}

run().catch(console.error);
