import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';

// Load env variables
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach(line => {
      const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
      if (match) {
        const key = match[1];
        let val = match[2] || '';
        if (val.length > 0 && val.charAt(0) === '"' && val.charAt(val.length - 1) === '"') {
          val = val.substring(1, val.length - 1);
        }
        if (val.length > 0 && val.charAt(0) === "'" && val.charAt(val.length - 1) === "'") {
          val = val.substring(1, val.length - 1);
        }
        process.env[key] = val.trim();
      }
    });
  }
} catch (e) {
  console.error("Could not load .env.local:", e.message);
}

const templates = [
  // ─── 1. Parameterized: Simple Interest ─────────────────────────────────
  {
    name: 'Simple Interest Calculator',
    type: 'parameterized',
    examId: 'jnvst',
    section: 'arithmetic',
    topic: 'simple-interest',
    difficulty: 0.5,
    config: {
      examId: 'jnvst',
      section: 'arithmetic',
      topic: 'simple-interest',
      difficulty: 0.5,
      tags: ['simple-interest', 'arithmetic'],
      questionTemplate: 'Find the simple interest on a principal amount of Rs. {{principal}} at an annual interest rate of {{rate}}% for a time period of {{time}} years.',
      explanationTemplate: 'Simple Interest is calculated using the formula: \\(SI = \\frac{P \\times R \\times T}{100}\\), where P = Principal (Rs. {{principal}}), R = Rate ({{rate}}%), and T = Time ({{time}} years). Substituting these values: \\(SI = \\frac{{{principal} \\times {rate} \\times {time}}}{100} = Rs. {{correct_answer}}\\).',
      variables: {
        principal: { pool: [1000, 2000, 3000, 5000, 8000] },
        rate: { pool: [5, 6, 8, 10, 12] },
        time: { pool: [2, 3, 5] }
      },
      derivations: {
        correct_answer: 'principal * rate * time / 100',
        distractor_1: 'principal * rate / 100', // forgot time
        distractor_2: 'principal * rate * time / 10', // off-by-ten
        distractor_3: 'principal * (rate + time) / 100' // wrong formula addition
      }
    }
  },
  // ─── 2. Parameterized: Percentage of Value ──────────────────────────────
  {
    name: 'Percentage of Value',
    type: 'parameterized',
    examId: 'jnvst',
    section: 'arithmetic',
    topic: 'percentages',
    difficulty: 0.3,
    config: {
      examId: 'jnvst',
      section: 'arithmetic',
      topic: 'percentages',
      difficulty: 0.3,
      tags: ['percentages', 'arithmetic'],
      questionTemplate: 'What is {{percent}}% of {{value}}?',
      explanationTemplate: 'To find a percentage of a number, divide the percentage by 100 and multiply by the number: \\(\\frac{{{percent}}}{100} \\times {value} = {{correct_answer}}\\).',
      variables: {
        percent: { pool: [10, 15, 20, 25, 30, 40, 50, 60] },
        value: { pool: [200, 300, 400, 500, 600, 800, 1000] }
      },
      derivations: {
        correct_answer: 'percent * value / 100',
        distractor_1: '(percent + 5) * value / 100',
        distractor_2: '(percent - 5) * value / 100',
        distractor_3: 'percent * value / 10' // off-by-ten
      }
    }
  },
  // ─── 3. Parameterized: Selling Price with Loss ─────────────────────────
  {
    name: 'Selling Price with Loss',
    type: 'parameterized',
    examId: 'jnvst',
    section: 'arithmetic',
    topic: 'profit-loss',
    difficulty: 0.6,
    config: {
      examId: 'jnvst',
      section: 'arithmetic',
      topic: 'profit-loss',
      difficulty: 0.6,
      tags: ['profit-loss', 'arithmetic'],
      questionTemplate: 'A merchant buys a goods cycle for Rs. {{cp}} and sells it at a loss of {{loss_percent}}%. What is the selling price of the cycle?',
      explanationTemplate: 'Selling Price when there is a loss is calculated as: \\(SP = CP \\times \\frac{100 - \\text{Loss}\\%}{100}\\). Given CP = Rs. {{cp}} and Loss = {{loss_percent}}%. Substituting the values: \\(SP = {cp} \\times \\frac{100 - {loss_percent}}{100} = {cp} \\times \\frac{{{deriv_1}}}{100} = Rs. {{correct_answer}}\\).',
      variables: {
        cp: { pool: [120, 240, 360, 480, 600, 800] },
        loss_percent: { pool: [5, 10, 15, 20, 25] }
      },
      derivations: {
        deriv_1: '100 - loss_percent',
        correct_answer: 'cp * (100 - loss_percent) / 100',
        distractor_1: 'cp * (100 + loss_percent) / 100', // added profit instead of loss
        distractor_2: 'cp - loss_percent', // directly subtracted the percentage value
        distractor_3: 'cp * (100 - loss_percent - 5) / 100' // wrong percentage calculation
      }
    }
  },
  // ─── 4. AI-Expanded: MAT Series ────────────────────────────────────────
  {
    name: 'MAT Series Completion',
    type: 'ai-expanded',
    examId: 'jnvst',
    section: 'mat',
    topic: 'series',
    difficulty: 0.45,
    config: {
      tags: ['series', 'mat'],
      qualityRules: [
        'The question must describe a sequence of geometric figure designs clearly in text format.',
        'The pattern must increase/rotate in a logical progression (e.g., rotation of 45/90 degrees, adding one element, etc.)',
        'Provide clear distractor options (A, B, C, D) representing typical visual mistakes.'
      ],
      promptTemplate: 'Write a JNVST Mental Ability Test pattern sequence question of difficulty level {{difficulty_label}}. The question must contain a description of 3 steps in a sequence and ask what the 4th step is. Avoid repeating these previous examples: {{already_used}}.'
    }
  },
  // ─── 5. AI-Expanded: Reading Comprehension ─────────────────────────────
  {
    name: 'Comprehension Passage & Question',
    type: 'ai-expanded',
    examId: 'jnvst',
    section: 'language',
    topic: 'comprehension',
    difficulty: 0.5,
    config: {
      tags: ['comprehension', 'language'],
      qualityRules: [
        'Write a short, engaging passage (4-6 sentences) suitable for a Class 5 student.',
        'The passage must cover a topic like nature, animals, history, or science.',
        'The question must test factual recall or direct inference from the passage.',
        'Provide four clear option choices (A, B, C, D) and a detailed explanation referencing the passage text.'
      ],
      promptTemplate: 'Write a reading comprehension passage and a multiple-choice question of difficulty {{difficulty_label}} for JNVST Language Test. Avoid these topics: {{already_used}}.'
    }
  },
  // ─── 6. AI-Expanded: Grammar Sentence Correction ───────────────────────
  {
    name: 'Grammar Sentence Correction',
    type: 'ai-expanded',
    examId: 'jnvst',
    section: 'language',
    topic: 'grammar',
    difficulty: 0.65,
    config: {
      tags: ['grammar', 'language'],
      qualityRules: [
        'The question must ask to identify the grammatically correct sentence among four options.',
        'The errors in the incorrect options should target common mistakes for 10-12 year olds: subject-verb agreement, pronoun case, prepositions, or homophones.',
        'Write a clear, educational explanation explaining why the correct option is right and why others are wrong.'
      ],
      promptTemplate: 'Generate a JNVST grammar multiple-choice question of difficulty {{difficulty_label}} targeting subject-verb agreement or preposition choice.'
    }
  }
];

async function runSeed() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("❌ MONGODB_URI missing in environment.");
    process.exit(1);
  }

  const dbName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  console.log(`🔌 Seeding Templates to: "${dbName}"...`);
  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);

    // Upsert default templates instead of deleteMany + insertMany to protect custom templates
    let upsertCount = 0;
    for (const t of templates) {
      await db.collection('templates').updateOne(
        { name: t.name, examId: t.examId },
        {
          $set: {
            ...t,
            updatedAt: new Date()
          },
          $setOnInsert: {
            generatedCount: 0,
            status: 'active',
            createdAt: new Date()
          }
        },
        { upsert: true }
      );
      upsertCount++;
    }
    console.log(`🎉 Seeded/updated ${upsertCount} default JNVST templates successfully!`);

  } catch (error) {
    console.error("❌ Error seeding templates:", error);
  } finally {
    await client.close();
  }
}

runSeed();
