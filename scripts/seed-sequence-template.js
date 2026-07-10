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
  id: 'g1-sequences-100',
  templateId: 'g1-sequences-100',
  skill: 'sequences',
  subSkill: 'count_up_down_by_100',
  title: 'Type the missing number in this sequence:',
  instruction: {
    text: 'Type the missing number in this sequence:',
    audio: true
  },
  interaction: {
    engine: 'fill_blank',
    inputMode: 'text'
  },
  optionsType: 'fillInTheBlank',
  questionText: 'Type the missing number in this sequence: []',
  validationRules: [
    {
      type: 'exact_match',
      target: 'blank1',
      value: '{{correctAnswer}}'
    }
  ]
};

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in environment.');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'new-wexls';
  console.log(`🔌 Seeding Sequence Template to: "${dbName}"...`);
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

    // 3. Update skills_v2 for g1-a-19
    const skillUpdate = {
      id: 'g1-a-19',
      chapterId: 'grade1-counting',
      code: 'A.19',
      engine: 'universal-template',
      gradeId: 'grade-1',
      order: 19,
      status: 'active',
      templateId: templateDoc.id,
      title: 'Sequences - count up and down by 100',
      unitId: 'counting',
      updatedAt: new Date()
    };
    await db.collection('skills_v2').updateOne(
      { id: 'g1-a-19' },
      { $set: skillUpdate },
      { upsert: true }
    );
    console.log(`✅ Successfully updated skills_v2 collection for g1-a-19`);

  } catch (error) {
    console.error('❌ Error seeding template:', error);
  } finally {
    await client.close();
  }
}

run();
