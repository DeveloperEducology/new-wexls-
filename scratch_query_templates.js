import fs from 'fs';
import path from 'path';
import { getMongoDb, hasMongoConfig } from './src/lib/db/mongo.js';

// Load .env.local manually
try {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    envContent.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        const key = parts[0].trim();
        const value = parts.slice(1).join('=').trim();
        process.env[key] = value;
      }
    });
  }
} catch (e) {
  console.error("Failed to load .env.local", e);
}

async function test() {
  const db = await getMongoDb();
  const collection = db.collection('templates');
  
  // Find templates where 'id' field exists and is a string
  const docs = await collection.find({ id: { $exists: true, $type: "string" } }).toArray();
  console.log("Total templates with string ID:", docs.length);
  for (const doc of docs.slice(0, 30)) {
    console.log(`- ID: ${doc.id}, Title: "${doc.title}", Subject: "${doc.subject || doc.section}", Topic: "${doc.topic}"`);
  }
  process.exit(0);
}

test();
