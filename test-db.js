import { getMongoDb } from './src/lib/db/mongo.js';

async function test() {
  try {
    const db = await getMongoDb();
    if (!db) {
      console.error('No DB connection');
      return;
    }
    const templates = await db.collection('templates').find({}).toArray();
    console.log('Seeded templates:', JSON.stringify(templates, null, 2));
    
    const exam = await db.collection('exams').findOne({ _id: 'jnvst' });
    console.log('JNVST Exam doc:', JSON.stringify(exam, null, 2));
  } catch (err) {
    console.error(err);
  }
  process.exit(0);
}

test();
