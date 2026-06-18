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

  console.log("=== Querying all vocabulary_pools ===");
  const pools = await db.collection('vocabulary_pools').find({}).toArray();
  
  for (const pool of pools) {
    console.log(`\n--------------------------------------------`);
    console.log(`Pool ID: ${pool.poolId || pool._id}`);
    console.log(`Title: ${pool.title}`);
    console.log(`Subject: ${pool.subject}, Topic: ${pool.topic}`);
    
    // Check top level keys
    const keys = Object.keys(pool);
    console.log(`Top-level Keys: ${keys.join(', ')}`);
    
    // Check words count and keys
    if (pool.words && Array.isArray(pool.words) && pool.words.length > 0) {
      console.log(`Words Count: ${pool.words.length}`);
      console.log(`Sample Word Item Keys: ${Object.keys(pool.words[0]).join(', ')}`);
      console.log(`Sample Word Item:`, JSON.stringify(pool.words[0], null, 2));
    } else {
      console.log(`Words Array: Empty or missing`);
    }

    // Check pools categorization
    if (pool.pools) {
      console.log(`Pool Categories: ${Object.keys(pool.pools).join(', ')}`);
      for (const cat of Object.keys(pool.pools)) {
        const list = pool.pools[cat];
        if (Array.isArray(list) && list.length > 0) {
          console.log(`  - Category '${cat}' Items Count: ${list.length}`);
          console.log(`  - Sample Item under '${cat}':`, JSON.stringify(list[0], null, 2));
        }
      }
    } else {
      console.log(`Pool Categories: None`);
    }
  }

  process.exit(0);
}

run().catch(console.error);
