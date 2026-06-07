import { MongoClient } from 'mongodb';
import fs from 'node:fs';
import { generateFromDynamicPool } from '../src/lib/practice/engine/DynamicPoolGenerator.js';

const POOL_ID = 'english-ukg-parts-of-speech-v2';

const envPath = new URL('../.env.local', import.meta.url);
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
    const match = line.match(/^\s*([^#=]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    process.env[match[1].trim()] = value;
  }
}

if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

try {
  const databaseName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  const pool = await client.db(databaseName).collection('vocabulary_pools').findOne({ poolId: POOL_ID });
  if (!pool) throw new Error(`${POOL_ID} was not found.`);
  if (!pool.validationReport?.valid) throw new Error(`${POOL_ID} did not pass validation.`);

  const common = {
    id: 'verify_ukg_pos',
    type: 'dynamic_pool',
    subject: 'english',
    topic: 'english-ukg',
    targetCategory: 'verbs',
    distractorCategories: ['nouns', 'adjectives'],
    questionText: 'Find the verb.',
    pools: pool.pools,
    difficultyRules: {
      easy: { optionCount: 3, distractorCount: 2, showLabels: true }
    }
  };

  const textQuestion = generateFromDynamicPool(
    { ...common, mode: 'identify_text' },
    701,
    'easy'
  );
  const visualQuestion = generateFromDynamicPool(
    { ...common, mode: 'identify_visual', hideOptionLabel: true },
    702,
    'easy'
  );

  if (visualQuestion.options.some(option => !option.imageUrl)) {
    throw new Error('Visual question contains an option without a usable image.');
  }

  console.log(JSON.stringify({
    poolId: POOL_ID,
    status: pool.status,
    counts: pool.validationReport.counts,
    textOptions: textQuestion.options.map(option => option.label),
    visualOptions: visualQuestion.options.map(option => ({
      id: option.id,
      hasImage: Boolean(option.imageUrl)
    }))
  }, null, 2));
} finally {
  await client.close();
}
