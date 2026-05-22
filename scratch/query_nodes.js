import { MongoClient } from 'mongodb';

async function run() {
  const uri = "mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('new-wexls');
    const collection = db.collection('curriculum_nodes');
    const nodes = await collection.find({}).toArray();
    console.log(JSON.stringify(nodes, null, 2));
  } finally {
    await client.close();
  }
}

run().catch(console.error);
