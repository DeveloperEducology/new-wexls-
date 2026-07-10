import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env variables manually from .env.local
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
} catch (e) {}

const DEMO_SKILL_ID = 'iit-p6-electricity-static-demo';

const DEMO_QUESTIONS = [
  {
    _id: `${DEMO_SKILL_ID}-q1`,
    id: `${DEMO_SKILL_ID}-q1`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: 'What flows inside a metallic conductor to constitute an electric current?',
    options: [
      { label: 'Protons', isCorrect: false },
      { label: 'Free electrons', isCorrect: true },
      { label: 'Neutrons', isCorrect: false },
      { label: 'Positrons', isCorrect: false }
    ],
    explanationText: 'Electric current in a metallic conductor is constituted by the flow of free electrons. Protons and neutrons are bound inside the nucleus and cannot flow.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q2`,
    id: `${DEMO_SKILL_ID}-q2`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: 'Which of the following materials is an insulator that does not allow electric current to pass?',
    options: [
      { label: 'Copper', isCorrect: false },
      { label: 'Aluminum', isCorrect: false },
      { label: 'Plastic', isCorrect: true },
      { label: 'Iron', isCorrect: false }
    ],
    explanationText: 'Plastic is an insulator because it lacks free electrons, preventing charges from flowing through it.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q3`,
    id: `${DEMO_SKILL_ID}-q3`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: 'What is the function of a switch in an electrical circuit?',
    options: [
      { label: 'To measure current', isCorrect: false },
      { label: 'To either break or complete the circuit', isCorrect: true },
      { label: 'To store electrical charge', isCorrect: false },
      { label: 'To generate electrical energy', isCorrect: false }
    ],
    explanationText: 'A switch is a control device used to either break (open) or complete (close) the path of current in an electric circuit.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  }
];

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI is missing.');
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || 'new-wexls';
  console.log(`🔌 Connecting to MongoDB: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // 1. Register skill node in iit_skills
    const demoSkillNode = {
      id: DEMO_SKILL_ID,
      _id: DEMO_SKILL_ID,
      title: 'Static Sequential Questions (Demo)',
      chapterId: 'iit-electricity-6',
      code: 'P.6.5.11',
      templateId: 'iit-p6-electricity-static-demo',
      engine: 'questionBank',
      isStatic: true,
      order: 11,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    await db.collection('iit_skills').updateOne(
      { id: DEMO_SKILL_ID },
      { $set: demoSkillNode },
      { upsert: true }
    );
    console.log(`🎉 Seeded demo skill node: ${DEMO_SKILL_ID}`);

    // 2. Clear old demo questions and insert new ones
    await db.collection('questions').deleteMany({ skillId: DEMO_SKILL_ID });
    console.log(`🧹 Cleared old questions for skill: ${DEMO_SKILL_ID}`);

    const result = await db.collection('questions').insertMany(DEMO_QUESTIONS);
    console.log(`🎉 Seeded ${result.insertedCount} static questions successfully!`);

  } catch (error) {
    console.error('❌ Error seeding static demo:', error);
  } finally {
    await client.close();
  }
}

run();
