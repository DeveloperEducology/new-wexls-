const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('new-wexls');
    const questionsCol = db.collection('questions');
    
        const results = await questionsCol.find({ 
      $or: [
        { microSkillId: "patterns-g1-repeating" },
        { skillId: "patterns-g1-repeating" },
        { "metadata.skillId": "patterns-g1-repeating" }
      ]
    }).toArray();
    console.log("Found questions count:", results.length);
    results.forEach(q => {
      console.log(`--- ID: ${q.id} ---`);
      console.log(JSON.stringify(q, null, 2));
    });
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
