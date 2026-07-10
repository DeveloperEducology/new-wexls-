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

const skillsList = [
  { id: 'g1-d-1', code: 'D.1', num: 1, title: 'Adding 1' },
  { id: 'g1-d-2', code: 'D.2', num: 2, title: 'Adding 2' },
  { id: 'g1-d-3', code: 'D.3', num: 3, title: 'Adding 3' },
  { id: 'g1-d-4', code: 'D.4', num: 4, title: 'Adding 4' },
  { id: 'g1-d-5', code: 'D.5', num: 5, title: 'Adding 5' },
  { id: 'g1-d-6', code: 'D.6', num: 6, title: 'Adding 6' },
  { id: 'g1-d-7', code: 'D.7', num: 7, title: 'Adding 7' },
  { id: 'g1-d-8', code: 'D.8', num: 8, title: 'Adding 8' },
  { id: 'g1-d-9', code: 'D.9', num: 9, title: 'Adding 9' },
  { id: 'g1-d-10', code: 'D.10', num: 0, title: 'Adding 0' }
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in environment.');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'new-wexls';
  console.log(`🔌 Seeding Addition Builders to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    for (const item of skillsList) {
      const templateId = `adding-${item.num}`;
      
      const templateDoc = {
        id: templateId,
        templateId: templateId,
        skill: 'addition',
        subSkill: `adding_${item.num}`,
        title: item.title,
        instruction: {
          text: `Add the numbers.`,
          audio: true
        },
        interaction: {
          engine: 'fill_blank',
          inputMode: 'text'
        },
        optionsType: 'fillInTheBlank',
        questionText: `Add:\n\n${item.num} + [] = []`,
        validationRules: [
          {
            type: 'exact_match',
            target: 'blank1',
            value: '{{correctAnswer}}'
          }
        ]
      };

      // 1. Seed dynamic_templates
      await db.collection('dynamic_templates').updateOne(
        { id: templateId },
        { $set: templateDoc },
        { upsert: true }
      );

      // 2. Seed templates
      const examTemplateDoc = {
        _id: templateId,
        name: templateDoc.title,
        type: 'universal',
        examId: 'jnvst',
        section: 'arithmetic',
        topic: 'addition',
        difficulty: 0.3,
        config: templateDoc,
        generatedCount: 0,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      await db.collection('templates').updateOne(
        { _id: templateId },
        { $set: examTemplateDoc },
        { upsert: true }
      );

      // 3. Update skills_v2
      const skillUpdate = {
        id: item.id,
        chapterId: 'grade1-addition-builders',
        code: item.code,
        engine: 'universal-template',
        gradeId: 'grade-1',
        order: item.num === 0 ? 10 : item.num,
        status: 'active',
        templateId: templateId,
        title: item.title,
        unitId: 'addition-builders',
        updatedAt: new Date()
      };
      await db.collection('skills_v2').updateOne(
        { id: item.id },
        { $set: skillUpdate },
        { upsert: true }
      );

      console.log(`✅ Seeded and mapped ${item.id} -> ${templateId}`);
    }

    console.log(`🎉 All Addition Builders successfully seeded and updated!`);

  } catch (error) {
    console.error('❌ Error seeding addition builders:', error);
  } finally {
    await client.close();
  }
}

run();
