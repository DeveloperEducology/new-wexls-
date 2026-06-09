import { getMongoDb, hasMongoConfig } from './src/lib/db/mongo.js';

async function test() {
  if (!hasMongoConfig()) {
    console.log("No Mongo Config");
    process.exit(1);
  }
  const db = await getMongoDb();
  const collection = db.collection('curriculum_nodes');
  
  // Find all nodes for UKG Numbers & Counting
  const docs = await collection.find({ topicId: 'ukg-numbers-counting' }).toArray();
  console.log("Total nodes under ukg-numbers-counting:", docs.length);
  for (const doc of docs) {
    if (doc.type === 'skill') {
      console.log(`- Skill Node ID: ${doc.id}, Title: "${doc.title}", SkillId: "${doc.skillId}"`);
    } else {
      console.log(`- Node ID: ${doc.id}, Title: "${doc.title}", Type: "${doc.type}"`);
    }
  }
  
  // Also try searching for the specific ID from the URL
  const specificDoc = await collection.findOne({ id: 'ukg-numbers-counting-represent-numbers-up-to-3' });
  console.log("\nSpecific Node by ID 'ukg-numbers-counting-represent-numbers-up-to-3':");
  console.log(JSON.stringify(specificDoc, null, 2));

  process.exit(0);
}

test();
