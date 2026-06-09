import { getMongoDb, hasMongoConfig } from './src/lib/db/mongo.js';

async function test() {
  if (!hasMongoConfig()) {
    console.log("No Mongo Config");
    process.exit(1);
  }
  const db = await getMongoDb();
  const collection = db.collection('dynamic_templates');
  const docs = await collection.find({}).toArray();
  console.log("Total templates in database:", docs.length);
  for (const doc of docs) {
    console.log(`- ID: ${doc.id}, Title: "${doc.title}", Subject: "${doc.subject}", Type: "${doc.optionsType || doc.questionType}"`);
  }
  process.exit(0);
}

test();
