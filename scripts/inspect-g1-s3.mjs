import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
} catch (e) {}

async function run() {
  const client = await MongoClient.connect(process.env.MONGODB_URI);
  const db = client.db(process.env.MONGODB_DB || 'wexls');

  const questions = await db.collection('questions').find({ skillId: 'g1-s-4' }).limit(5).toArray();
  console.log('=== QUESTIONS FOR g1-s-4 ===');
  console.log(JSON.stringify(questions, null, 2));

  const skill = await db.collection('skills_v2').findOne({ id: 'g1-s-4' });
  console.log('=== SKILL DOC FOR g1-s-4 ===');
  console.log(JSON.stringify(skill, null, 2));

  await client.close();
}

run().catch(console.error);
