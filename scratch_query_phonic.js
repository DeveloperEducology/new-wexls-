import { getMongoDb } from './src/lib/db/mongo.js';
import fs from 'fs';

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
  console.log("--- Searching 'questions' collection ---");
  const qDocs = await db.collection('questions').find({
    id: { $regex: /phonic/i }
  }).toArray();
  for (const q of qDocs) {
    console.log(`- questions ID: ${q.id}, skillId: ${q.skillId}, type: ${q.type}, status: ${q.status}`);
  }

  console.log("\n--- Searching 'dynamic_templates' collection ---");
  const tDocs = await db.collection('dynamic_templates').find({
    id: { $regex: /phonic/i }
  }).toArray();
  for (const t of tDocs) {
    console.log(`- dynamic_templates ID: ${t.id}, topic: ${t.topic}, subject: ${t.subject}`);
  }

  console.log("\n--- Searching 'curriculum_nodes' collection ---");
  const cDocs = await db.collection('curriculum_nodes').find({
    id: { $regex: /phonic/i }
  }).toArray();
  for (const c of cDocs) {
    console.log(`- curriculum_nodes ID: ${c.id}, title: ${c.title}, type: ${c.type}`);
  }

  process.exit(0);
}

run().catch(console.error);
