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
  const collections = [
    'questions', 'subjects', 'curriculum', 'vocabulary_pools',
    'curriculum_nodes', 'topics', 'skills', 'dynamic_templates'
  ];

  console.log("=== Searching database collections for matches ===");
  
  for (const colName of collections) {
    const col = db.collection(colName);
    
    // Find documents matching the search terms in any key or values
    const query = {
      $or: [
        { id: /phonic/i },
        { skillId: /phonic/i },
        { title: /phonic/i },
        { poolId: /phonic/i },
        { id: /beginning/i },
        { skillId: /beginning/i },
        { title: /beginning/i },
        { id: /ending/i },
        { skillId: /ending/i },
        { title: /ending/i }
      ]
    };
    
    const docs = await col.find(query).toArray();
    if (docs.length > 0) {
      console.log(`\nCollection [${colName}] - Found ${docs.length} matches:`);
      for (const d of docs) {
        console.log(`  - ID/Key: ${d.id || d.skillId || d._id}`);
        console.log(`    Fields: type=${d.type}, title="${d.title}", status=${d.status}, poolId=${d.poolId}, subjectId=${d.subjectId || d.subject}, topicId=${d.topicId || d.topic}`);
      }
    }
  }

  process.exit(0);
}

run().catch(console.error);
