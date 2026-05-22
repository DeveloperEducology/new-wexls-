const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

async function main() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found in .env.local');
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('new-wexls');
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    const nodes = await db.collection('curriculum_nodes').find({}).toArray();
    console.log('Total curriculum nodes:', nodes.length);
    if (nodes.length > 0) {
      console.log('First 10 nodes:', JSON.stringify(nodes.slice(0, 10), null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
