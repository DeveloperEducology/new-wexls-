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

const DEMO_SKILL_ID = 'iit-p6-electricity-branching-demo';

const DEMO_QUESTIONS = [
  {
    _id: `${DEMO_SKILL_ID}-q1`,
    id: `${DEMO_SKILL_ID}-q1`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: 'Is electric current a scalar or a vector quantity?',
    options: [
      { label: 'Scalar quantity', isCorrect: true },
      { label: 'Vector quantity', isCorrect: false }
    ],
    explanationText: 'Electric current is a scalar quantity. Although it has both magnitude and direction, it does not obey vector addition laws.',
    difficulty: 0.4,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q2`,
        incorrect: `${DEMO_SKILL_ID}-q1-hint`
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q1-hint`,
    id: `${DEMO_SKILL_ID}-q1-hint`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: '[Scaffold Hint] If two wires carrying currents of 3 A and 4 A meet at a junction, the combined output wire carries 7 A regardless of the angle between them. Does this addition depend on direction angles?',
    options: [
      { label: 'No, it is simple algebraic addition.', isCorrect: true },
      { label: 'Yes, it depends on the angle.', isCorrect: false }
    ],
    explanationText: 'Since current addition does not depend on the angle between the wires, it does not use vector addition. It is simple algebraic addition.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q2`,
        incorrect: `${DEMO_SKILL_ID}-q1-easy`
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q1-easy`,
    id: `${DEMO_SKILL_ID}-q1-easy`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: '[Concept Check] True or False: Physical quantities that have direction but do NOT obey vector addition laws are classified as scalars.',
    options: [
      { label: 'True', isCorrect: true },
      { label: 'False', isCorrect: false }
    ],
    explanationText: 'To be a vector, a quantity must have magnitude, direction, AND obey the laws of vector addition (like the parallelogram law). If it fails to obey vector addition, it remains a scalar.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q2`,
        incorrect: `${DEMO_SKILL_ID}-q3`
      }
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
    questionText: 'Why does electric current NOT obey vector addition laws?',
    options: [
      { label: 'It obeys ordinary algebraic addition ($3\\text{ A} + 4\\text{ A} = 7\\text{ A}$), not vector addition.', isCorrect: true },
      { label: 'Current has no direction.', isCorrect: false },
      { label: 'Current is not a physical quantity.', isCorrect: false }
    ],
    explanationText: 'Electric current in wires is added using simple algebra: the total incoming current matches total outgoing current, irrespective of the angle of wires. Hence it is scalar.',
    difficulty: 0.5,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q4`,
        incorrect: `${DEMO_SKILL_ID}-q3`
      }
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
    questionText: '[Remediation] If 10 A of current enters a junction, and 6 A flows out of one branch, how much current flows out of the other branch?',
    options: [
      { label: '4 A', isCorrect: true },
      { label: '16 A', isCorrect: false },
      { label: '60 A', isCorrect: false }
    ],
    explanationText: 'Total current entering a junction must equal the total current leaving. Thus, $10\\text{ A} = 6\\text{ A} + I_2$, which means $I_2 = 4\\text{ A}$.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q4`,
        incorrect: `${DEMO_SKILL_ID}-q3-easy`
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q3-easy`,
    id: `${DEMO_SKILL_ID}-q3-easy`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: '[Remediation Easy] Which physical conservation law dictates that the total current entering a junction equals the total current leaving?',
    options: [
      { label: 'Law of conservation of charge (Kirchhoff\'s Current Law)', isCorrect: true },
      { label: 'Law of conservation of energy', isCorrect: false },
      { label: 'Ohm\'s Law', isCorrect: false }
    ],
    explanationText: 'Electric current is the flow of charge. Since charge cannot be created or destroyed, the total charge (and current) entering a junction must equal that leaving it.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q4`,
        incorrect: `${DEMO_SKILL_ID}-q5`
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q4`,
    id: `${DEMO_SKILL_ID}-q4`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: 'How is electric current mathematically defined in terms of charge ($q$) and time ($t$)?',
    options: [
      { label: '$I = \\frac{q}{t}$', isCorrect: true },
      { label: '$I = q \\times t$', isCorrect: false },
      { label: '$I = \\frac{t}{q}$', isCorrect: false }
    ],
    explanationText: 'Electric current ($I$) is defined as the rate of flow of electric charge, which is charge ($q$) divided by time ($t$).',
    difficulty: 0.4,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q6`,
        incorrect: `${DEMO_SKILL_ID}-q4-hint`
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q4-hint`,
    id: `${DEMO_SKILL_ID}-q4-hint`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: '[Scaffold Hint] If 1 Coulomb of charge flows past a point every 1 second, the current is 1 Ampere. What is the relation between Coulomb, Ampere, and Second?',
    options: [
      { label: '$1\\text{ Ampere} = 1\\text{ Coulomb} / \\text{second}$', isCorrect: true },
      { label: '$1\\text{ Ampere} = 1\\text{ Coulomb} \\times \\text{second}$', isCorrect: false }
    ],
    explanationText: 'Current is charge per unit time, so the unit Ampere is equal to Coulombs divided by seconds.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q6`,
        incorrect: `${DEMO_SKILL_ID}-q4-easy`
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q4-easy`,
    id: `${DEMO_SKILL_ID}-q4-easy`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: '[Concept Check] True or False: Electric current is defined as the rate of flow of electric charges.',
    options: [
      { label: 'True', isCorrect: true },
      { label: 'False', isCorrect: false }
    ],
    explanationText: 'Yes, electric current is fundamentally the rate at which electric charge flows past a cross-section of a conductor.',
    difficulty: 0.3,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q6`,
        incorrect: `${DEMO_SKILL_ID}-q5`
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q5`,
    id: `${DEMO_SKILL_ID}-q5`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: 'Charge Calculation: If a current of 2 A flows for 10 seconds, what is the total charge that passes through the conductor?',
    options: [
      { label: '20 Coulombs', isCorrect: true },
      { label: '0.2 Coulombs', isCorrect: false },
      { label: '5 Coulombs', isCorrect: false }
    ],
    explanationText: 'Using $q = I \\times t$, we have $q = 2\\text{ A} \\times 10\\text{ s} = 20\\text{ Coulombs}$.',
    difficulty: 0.4,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: `${DEMO_SKILL_ID}-q6`,
        incorrect: 'end'
      }
    },
    createdAt: new Date(),
    updatedAt: new Date()
  },
  {
    _id: `${DEMO_SKILL_ID}-q6`,
    id: `${DEMO_SKILL_ID}-q6`,
    subject: 'physics',
    topic: 'mechanics',
    skillId: DEMO_SKILL_ID,
    type: 'mcq',
    questionText: 'Calculation Challenge: A total of 120 Coulombs of charge flows past a point in a circuit in 2 minutes. What is the electric current in the circuit?',
    options: [
      { label: '1 A', isCorrect: true },
      { label: '60 A', isCorrect: false },
      { label: '240 A', isCorrect: false }
    ],
    explanationText: 'First convert minutes to seconds: $2\\text{ minutes} = 120\\text{ seconds}$. Then calculate current: $I = q / t = 120\\text{ C} / 120\\text{ s} = 1\\text{ A}$.',
    difficulty: 0.5,
    status: 'active',
    metadata: {
      subject: 'physics',
      topic: 'mechanics',
      skillId: DEMO_SKILL_ID,
      isStatic: true,
      grade: '6',
      branching: {
        correct: 'end',
        incorrect: 'end'
      }
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
      title: 'Branching Question Paths (Demo)',
      chapterId: 'iit-electricity-6',
      code: 'P.6.5.12',
      templateId: 'iit-p6-electricity-branching-demo',
      engine: 'questionBank',
      isStatic: true,
      order: 12,
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
    console.log(`🎉 Seeded ${result.insertedCount} branching questions successfully!`);

  } catch (error) {
    console.error('❌ Error seeding branching demo:', error);
  } finally {
    await client.close();
  }
}

run();
