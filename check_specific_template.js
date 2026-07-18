const { getMongoDb, hasMongoConfig } = require('./src/lib/db/mongo.js');

async function main() {
  if (!hasMongoConfig()) {
    console.log('No Mongo config!');
    return;
  }
  const db = await getMongoDb();
  
  // Search collections
  const collections = ['imo_skills', 'skills_v2', 'curriculum', 'curriculum_nodes'];
  for (const colName of collections) {
    const col = db.collection(colName);
    const doc = await col.findOne({ $or: [{ id: 'g1-b-1' }, { code: 'g1-b-1' }, { id: 'imo_place_value_identify' }] });
    if (doc) {
      console.log(`Found in ${colName}:`, JSON.stringify(doc, null, 2));
    } else {
      console.log(`Not found in ${colName}`);
    }
  }
}

main();
