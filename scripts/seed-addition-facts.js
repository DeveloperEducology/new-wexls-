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
  { id: 'g1-e-1', code: 'E.1', templateId: 'addition-facts-10', title: 'Addition facts - sums up to 10' },
  { id: 'g1-e-2', code: 'E.2', templateId: 'ways-make-number-addition', title: 'Ways to make a number - addition sentences' },
  { id: 'g1-e-3', code: 'E.3', templateId: 'make-number-addition-10', title: 'Make a number using addition - sums up to 10' },
  { id: 'g1-e-4', code: 'E.4', templateId: 'complete-addition-sentence-10', title: 'Complete the addition sentence - sums up to 10' },
  { id: 'g1-e-5', code: 'E.5', templateId: 'addition-word-problems-10', title: 'Addition word problems - sums up to 10' },
  { id: 'g1-e-6', code: 'E.6', templateId: 'addition-sentences-word-problems-10', title: 'Addition sentences for word problems - sums up to 10' },
  { id: 'g1-e-7', code: 'E.7', templateId: 'addition-facts-18', title: 'Addition facts - sums up to 18' },
  { id: 'g1-e-8', code: 'E.8', templateId: 'addition-sentences-numlines-18', title: 'Addition sentences using number lines - sums up to 18' },
  { id: 'g1-e-9', code: 'E.9', templateId: 'addition-word-problems-18', title: 'Addition word problems - sums up to 18' },
  { id: 'g1-e-10', code: 'E.10', templateId: 'addition-sentences-word-problems-18', title: 'Addition sentences for word problems - sums up to 18' },
  { id: 'g1-e-11', code: 'E.11', templateId: 'addition-facts-20', title: 'Addition facts - sums up to 20' },
  { id: 'g1-e-12', code: 'E.12', templateId: 'make-number-addition-20', title: 'Make a number using addition - sums up to 20' },
  { id: 'g1-e-13', code: 'E.13', templateId: 'addition-sentences-word-problems-20', title: 'Addition sentences for word problems - sums up to 20' },
  { id: 'g1-e-14', code: 'E.14', templateId: 'related-addition-facts', title: 'Related addition facts' },
  { id: 'g1-e-15', code: 'E.15', templateId: 'addition-sentences-true-false', title: 'Addition sentences: true or false?' },
  { id: 'g1-e-16', code: 'E.16', templateId: 'add-1digit-2digit-noregroup', title: 'Add a one-digit number to a two-digit number - without regrouping' },
  { id: 'g1-e-17', code: 'E.17', templateId: 'add-1digit-2digit-regroup', title: 'Add a one-digit number to a two-digit number - with regrouping' }
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in environment.');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'new-wexls';
  console.log(`🔌 Seeding Addition Facts to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    for (const item of skillsList) {
      const templateId = item.templateId;
      const isMCQ = ['make-number-addition-10', 'make-number-addition-20', 'addition-word-problems-10', 'addition-word-problems-18', 'addition-sentences-word-problems-10', 'addition-sentences-word-problems-18', 'addition-sentences-word-problems-20', 'addition-sentences-true-false'].includes(templateId);
      
      const templateDoc = {
        id: templateId,
        templateId: templateId,
        skill: 'addition',
        subSkill: templateId.replace(/-/g, '_'),
        title: item.title,
        instruction: {
          text: isMCQ ? 'Choose the correct answer.' : 'Add the numbers.',
          audio: true
        },
        interaction: {
          engine: isMCQ ? 'mcq' : 'fill_blank',
          inputMode: isMCQ ? 'choice' : 'text'
        },
        optionsType: isMCQ ? 'single_select' : 'fillInTheBlank',
        questionText: item.title,
        validationRules: isMCQ ? [] : [
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
        difficulty: 0.4,
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
        chapterId: 'grade1-addition-facts',
        code: item.code,
        engine: 'universal-template',
        gradeId: 'grade-1',
        order: parseInt(item.code.replace('E.', ''), 10),
        status: 'active',
        templateId: templateId,
        title: item.title,
        unitId: 'addition-facts',
        updatedAt: new Date()
      };
      await db.collection('skills_v2').updateOne(
        { id: item.id },
        { $set: skillUpdate },
        { upsert: true }
      );

      console.log(`✅ Seeded and mapped ${item.id} -> ${templateId}`);
    }

    console.log(`🎉 All Addition Facts E.1 to E.17 successfully seeded and updated!`);

  } catch (error) {
    console.error('❌ Error seeding addition facts:', error);
  } finally {
    await client.close();
  }
}

run();
