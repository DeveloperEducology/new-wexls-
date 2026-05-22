const { MongoClient } = require('mongodb');

async function run() {
  const uri = "mongodb+srv://vjymrk:Admin_84529@cluster0.ivjiolu.mongodb.net/new-wexls?retryWrites=true&w=majority";
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('new-wexls');
    const questionsCol = db.collection('questions');

    const targetUrlSegment = "rawpixel_office_15_simple_line_art_of_a_lion_face";

    // Find all questions that contain the target image URL segment anywhere
    const questions = await questionsCol.find({
      $or: [
        { "items.imageUrl": { $regex: targetUrlSegment } },
        { "parts.items.imageUrl": { $regex: targetUrlSegment } }
      ]
    }).toArray();

    console.log(`Found ${questions.length} questions to update.`);

    for (const q of questions) {
      console.log(`Updating question ID: ${q.id}`);
      
      let updated = false;

      // Update top-level items if present
      if (q.items && Array.isArray(q.items)) {
        q.items = q.items.map(item => {
          if (item.imageUrl && item.imageUrl.includes(targetUrlSegment)) {
            updated = true;
            return {
              ...item,
              imageUrl: "https://cdn-icons-png.flaticon.com/512/616/616412.png"
            };
          }
          return item;
        });
      }

      // Update items inside parts if present
      if (q.parts && Array.isArray(q.parts)) {
        q.parts = q.parts.map(part => {
          if (part.items && Array.isArray(part.items)) {
            part.items = part.items.map(item => {
              if (item.imageUrl && item.imageUrl.includes(targetUrlSegment)) {
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
        const result = await questionsCol.updateOne(
          { _id: q._id },
          { $set: { items: q.items, parts: q.parts } }
        );
        console.log(`Updated question: ${q.id}. ModifiedCount: ${result.modifiedCount}`);
      }
    }

  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

run();
