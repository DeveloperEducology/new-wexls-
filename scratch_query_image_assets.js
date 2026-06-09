import { MongoClient } from 'mongodb';

async function run() {
  const uri = process.env.MONGODB_URI || "mongodb://localhost:27017/wexls";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db();
    const assetsCol = db.collection('image_assets');
    
    const assets = await assetsCol.find({}).limit(10).toArray();
    console.log("Image Assets:", JSON.stringify(assets, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
