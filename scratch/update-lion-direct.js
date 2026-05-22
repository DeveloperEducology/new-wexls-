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
      let updated = false;

      // Check top-level items
      if (q.items && Array.isArray(q.items)) {
        q.items = q.items.map(item => {
          if (item.content === "lion" || (item.imageUrl && item.imageUrl.includes("rawpixel"))) {
            console.log(`Updating top-level item lion for question: ${q.id}`);
            updated = true;
            return {
              ...item,
              imageUrl: "https://cdn-icons-png.flaticon.com/512/616/616412.png"
            };
          }
          return item;
        });
      }

      // Check parts items
      if (q.parts && Array.isArray(q.parts)) {
        q.parts = q.parts.map(part => {
          if (part.items && Array.isArray(part.items)) {
            part.items = part.items.map(item => {
              if (item.content === "lion" || (item.imageUrl && item.imageUrl.includes("rawpixel"))) {
                console.log(`Updating nested item lion for question: ${q.id}`);
                updated = true;
                return {
                  ...item,
                  imageUrl: "https://cdn-icons-png.flaticon.com/512/616/616412.png"
                };
              }
              return item;
            });
          }
          return part;
        });
      }

      if (updated) {
        const updateResult = await questionsCol.updateOne(
          { _id: q._id },
          { $set: { items: q.items, parts: q.parts } }
        );
        console.log(`Saved question: ${q.id}. ModifiedCount: ${updateResult.modifiedCount}`);
      } else {
        console.log(`Question ${q.id} did not need updates.`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
