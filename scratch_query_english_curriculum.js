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
  console.log("--- Querying curriculum_nodes for letter-identification ---");
  const nodes = await db.collection('curriculum_nodes').find({
    $or: [
      { topicId: 'letter-identification' },
      { id: /letter-identification/i }
    ]
  }).toArray();
  
  console.log(`Found ${nodes.length} nodes:`);
  for (const node of nodes) {
    console.log(JSON.stringify(node, null, 2));
  }

  console.log("\n--- Querying questions/templates starting with letter-identification ---");
  const questions = await db.collection('questions').find({
    id: /letter-identification/i
  }).toArray();
  
  console.log(`Found ${questions.length} questions:`);
  for (const q of questions) {
    console.log(`ID: ${q.id}`);
    console.log(`Type: ${q.type}`);
    console.log(`Status: ${q.status}`);
    console.log(`SkillId: ${q.skillId || q.skill}`);
    console.log(`Subject: ${q.subject}`);
    console.log(`Topic: ${q.topic}`);
    console.log(`poolId: ${q.poolId}`);
    console.log(`targetCategory: ${q.targetCategory}`);
    console.log("--------------");
  }

  process.exit(0);
}

run().catch(console.error);
