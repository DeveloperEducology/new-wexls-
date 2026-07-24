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
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("❌ Usage: node scripts/import-template.mjs <path-to-json-file>");
    process.exit(1);
  }

  const filePath = path.resolve(args[0]);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ File not found: ${filePath}`);
    process.exit(1);
  }

  let templateDoc;
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    templateDoc = JSON.parse(content);
  } catch (err) {
    console.error("❌ Failed to parse template JSON file:", err.message);
    process.exit(1);
  }

  const id = templateDoc.id || templateDoc._id;
  if (!id) {
    console.error("❌ Template is missing 'id' or '_id' field.");
    process.exit(1);
  }

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

    // Determine target collection
    // spreadsheet-grid templates go to dynamic_templates
    const isDynamic = templateDoc.generatorType === 'spreadsheet-grid' || templateDoc.type === 'universal';
    const collectionName = isDynamic ? 'dynamic_templates' : 'templates';
    
    // Ensure ID is string
    templateDoc.id = String(id);
    if (!templateDoc._id) {
      templateDoc._id = String(id);
    }

    const result = await db.collection(collectionName).updateOne(
      { id: templateDoc.id },
      { $set: templateDoc },
      { upsert: true }
    );

    console.log(`\n========================================`);
    console.log(`✅ Success: Upserted template into "${collectionName}"`);
    console.log(`- Template ID: ${templateDoc.id}`);
    console.log(`- Title: ${templateDoc.title || 'Untitled'}`);
    console.log(`- Match count: ${result.matchedCount}, Upserted count: ${result.upsertedCount}`);
    
    // Output local practice links
    const subject = templateDoc.subject || 'english';
    const skillId = templateDoc.skillId || templateDoc.skill || '';
    const topic = templateDoc.topic || '';
    
    console.log(`\n🔗 Practice Page Links:`);
    console.log(`👉 http://localhost:3000/practice?subject=${subject}&topic=${topic}&skill=${skillId}`);
    
    if (isDynamic) {
      console.log(`👉 http://localhost:3000/template-generator-grid?id=${templateDoc.id}`);
    } else {
      console.log(`👉 http://localhost:3000/template-generator-v2?id=${templateDoc.id}`);
    }
    console.log(`========================================\n`);

  } catch (err) {
    console.error("❌ Database operation failed:", err.message);
  } finally {
    await client.close();
  }
}

run();
