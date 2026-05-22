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

    console.log(`Found ${results.length} questions for skill patterns-g1-repeating.`);

    for (const q of results) {
      console.log(`Updating question: ${q.id}`);
      
      const updateDoc = {
        $set: {
          cardStyle: "transparent_png",
          hideItemLabels: true,
          "metadata.cardStyle": "transparent_png",
          "metadata.hideItemLabels": true
        }
      };

      if (q.behavior) {
        updateDoc.$set["behavior.cardStyle"] = "transparent_png";
        updateDoc.$set["behavior.hideItemLabels"] = true;
      }

      const updateResult = await questionsCol.updateOne(
        { _id: q._id },
        updateDoc
      );
      console.log(`Updated question: ${q.id}. ModifiedCount: ${updateResult.modifiedCount}`);
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
