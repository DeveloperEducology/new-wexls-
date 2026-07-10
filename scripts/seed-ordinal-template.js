import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
      const parts = line.split('=');
      if (parts.length >= 2) {
        process.env[parts[0].trim()] = parts.slice(1).join('=').trim().replace(/^['"]|['"]$/g, '');
      }
    });
  }
} catch (e) {
  console.error('Failed to load env:', e);
}

const templateDoc = {
  id: 'ordinal_picture_identification',
  templateId: 'ordinal_picture_identification',
  skill: 'ordinal_numbers',
  subSkill: 'identify_object_at_ordinal_position',
  title: 'Which picture is the {{ordinalWord}}?',
  instruction: {
    text: 'The {{ordinalWord}} picture is a {{answerLabel}}. Which picture is the {{ordinalWord}}?',
    audio: true
  },
  variables: {
    category: 'animals',
    sequenceLength: {
      min: 4,
      max: 8
    },
    ordinalPosition: 'random'
  },
  generator: {
    pickUniqueImages: true,
    shuffleSequence: true,
    generateDistractors: true,
    shuffleOptions: true
  },
  sequence: [
    { id: '{{item1.id}}', label: '{{item1.label}}', image: '{{item1.image}}' },
    { id: '{{item2.id}}', label: '{{item2.label}}', image: '{{item2.image}}' },
    { id: '{{item3.id}}', label: '{{item3.label}}', image: '{{item3.image}}' },
    { id: '{{item4.id}}', label: '{{item4.label}}', image: '{{item4.image}}' },
    { id: '{{item5.id}}', label: '{{item5.label}}', image: '{{item5.image}}' }
  ],
  question: {
    type: 'single_select',
    prompt: 'Which picture is the {{ordinalWord}}?'
  },
  options: [
    { id: '{{option1.id}}', label: '{{option1.label}}', image: '{{option1.image}}' },
    { id: '{{option2.id}}', label: '{{option2.label}}', image: '{{option2.image}}' },
    { id: '{{option3.id}}', label: '{{option3.label}}', image: '{{option3.image}}' },
    { id: '{{option4.id}}', label: '{{option4.label}}', image: '{{option4.image}}' }
  ],
  answer: {
    correctId: '{{answer.id}}'
  },
  explanation: {
    correct: 'Count from the left. The {{ordinalWord}} picture is the {{answerLabel}}.',
    incorrect: 'Start counting from the left again. The {{ordinalWord}} picture is the {{answerLabel}}.'
  }
};

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in environment.');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'new-wexls';
  console.log(`🔌 Seeding Ordinal Numbers Template to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // 1. Upsert into dynamic_templates
    await db.collection('dynamic_templates').updateOne(
      { id: templateDoc.id },
      { $set: templateDoc },
      { upsert: true }
    );
    console.log(`✅ Successfully saved template to dynamic_templates: ${templateDoc.id}`);

    // 2. Upsert into templates (fallback/indexing support)
    const examTemplateDoc = {
      _id: templateDoc.id,
      name: templateDoc.title,
      type: 'universal',
      examId: 'jnvst',
      section: 'arithmetic',
      topic: 'counting',
      difficulty: 0.5,
      config: templateDoc,
      generatedCount: 0,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };
    await db.collection('templates').updateOne(
      { _id: templateDoc.id },
      { $set: examTemplateDoc },
      { upsert: true }
    );
    console.log(`✅ Successfully saved template to templates: ${templateDoc.id}`);

    // 3. Update skills_v2 for g1-a-20 (Ordinal numbers)
    const skillUpdate = {
      id: 'g1-a-20',
      chapterId: 'grade1-counting',
      code: 'A.20',
      engine: 'universal-template',
      gradeId: 'grade-1',
      order: 20,
      status: 'active',
      templateId: templateDoc.id,
      title: 'Ordinal numbers',
      unitId: 'counting',
      updatedAt: new Date()
    };
    await db.collection('skills_v2').updateOne(
      { id: 'g1-a-20' },
      { $set: skillUpdate },
      { upsert: true }
    );
    console.log(`✅ Successfully updated skills_v2 collection for g1-a-20`);

  } catch (error) {
    console.error('❌ Error seeding template:', error);
  } finally {
    await client.close();
  }
}

run();
