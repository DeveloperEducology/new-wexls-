import { MongoClient } from 'mongodb';
import fs from 'node:fs';

const SOURCE_POOL_ID = 'english-ukg-parts-of-speech-v1';
const TARGET_POOL_ID = 'english-ukg-parts-of-speech-v2';

const CLASSIFICATION = {
  nouns: new Set([
    'cat', 'bat', 'hat', 'dog', 'log', 'frog', 'sun', 'bus', 'cup', 'penguin',
    'hen', 'bed', 'fish', 'duck', 'ball', 'book', 'tree', 'moon', 'star', 'car',
    'apple', 'banana', 'lime', 'goat', 'cow', 'pig', 'box', 'jam', 'leaf', 'mat',
    'rat', 'cap', 'cot', 'fog', 'hog', 'dot', 'bun', 'bug', 'bag', 'pup', 'cub',
    'den', 'ten', 'men', 'pan', 'pin', 'dish', 'fin', 'truck', 'dock', 'doll',
    'wall', 'bell', 'bowl', 'hook', 'boom', 'tea', 'spoon', 'noon', 'man', 'jar',
    'bar', 'cart', 'ant', 'alligator', 'apron', 'arrow', 'bamboo', 'band', 'dime',
    'line', 'rope', 'pipe', 'boat', 'coat', 'gate', 'fox', 'ox', 'boy', 'ham',
    'ram', 'yam', 'beef', 'loaf', 'lamp', 'wig'
  ]),
  verbs: new Set([
    'cut', 'jog', 'dig', 'run', 'sit', 'hit', 'see', 'wipe'
  ]),
  adjectives: new Set([
    'sad', 'red', 'bad', 'big', 'ripe', 'hot', 'free'
  ])
};

const AMBIGUOUS = new Set([
  'bit', 'bet', 'fit', 'luck', 'call', 'cook', 'look', 'ride', 'float', 'bow',
  'can', 'like', 'wish', 'led', 'fed', 'bid', 'time', 'fun'
]);

const AMBIGUOUS_POS = {
  call: ['noun', 'verb'],
  cook: ['noun', 'verb'],
  look: ['noun', 'verb'],
  ride: ['noun', 'verb'],
  float: ['noun', 'verb'],
  bow: ['noun', 'verb'],
  can: ['noun', 'verb'],
  like: ['verb', 'preposition'],
  wish: ['noun', 'verb'],
  fit: ['verb', 'adjective'],
  time: ['noun', 'verb'],
  fun: ['noun', 'adjective'],
  led: ['verb'],
  fed: ['verb'],
  bid: ['noun', 'verb'],
  bit: ['noun', 'verb'],
  bet: ['noun', 'verb'],
  luck: ['noun']
};

const IMAGE_MISMATCHES = {
  log: 'Image appears to show an elephant.',
  car: 'Image appears to show a horse.',
  rat: 'Image appears to show a girl.',
  ant: 'Image appears to show an elephant.',
  bell: 'Image appears to show a goat.',
  cap: 'Image appears to show a landscape.',
  boat: 'Image appears to show a ball.',
  man: 'Image appears to show a woman.',
  line: 'Image appears unrelated to a line.',
  pin: 'Image appears to show a sad girl.',
  hit: 'Image appears to show a train.',
  hot: 'Image appears to show baking rather than clearly representing hot.'
};

const AUDIO_MISMATCHES = {
  ten: 'Audio URL appears to contain "tend".',
  men: 'Audio URL appears to contain "mend".',
  pan: 'Audio URL appears to contain "spank".',
  hot: 'Audio URL appears to contain "shot".',
  ox: 'Audio URL appears to contain "pox".',
  pin: 'Audio URL appears to contain "spin".',
  led: 'Audio URL appears to contain "sled".',
  fin: 'Audio URL appears to contain "finish".',
  luck: 'Audio URL appears to contain "pluck".',
  tea: 'Audio URL appears to contain "stead".'
};

function loadEnvironment() {
  const envPath = new URL('../.env.local', import.meta.url);
  if (!fs.existsSync(envPath)) return;
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

function normalizeLabel(value) {
  return String(value || '').trim().toLowerCase();
}

function makeId(partOfSpeech, label) {
  return `${partOfSpeech}_${label.replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '')}`;
}

function classify(label) {
  if (AMBIGUOUS.has(label)) return 'ambiguous';
  return Object.entries(CLASSIFICATION).find(([, words]) => words.has(label))?.[0] || 'unclassified';
}

function assetStatusFor(item, label) {
  const imageIssue = IMAGE_MISMATCHES[label];
  const audioIssue = AUDIO_MISMATCHES[label];
  return {
    imageStatus: !item.imageUrl ? 'missing' : imageIssue ? 'needs_review' : 'unverified',
    audioStatus: !item.audioUrl ? 'missing' : audioIssue ? 'needs_review' : 'unverified',
    issues: [
      ...(imageIssue ? [{ type: 'image_label_mismatch', message: imageIssue }] : []),
      ...(audioIssue ? [{ type: 'audio_label_mismatch', message: audioIssue }] : [])
    ]
  };
}

function normalizeItem(item, originalCategory) {
  const label = normalizeLabel(item.label || item.id);
  const category = classify(label);
  const assetStatus = assetStatusFor(item, label);
  const isAmbiguous = category === 'ambiguous';
  const partOfSpeech = isAmbiguous ? undefined : category.replace(/s$/, '');
  const allowedModes = ['identify_text'];

  if (item.imageUrl && assetStatus.imageStatus !== 'needs_review') allowedModes.push('identify_visual');
  if (item.audioUrl && assetStatus.audioStatus !== 'needs_review') allowedModes.push('audio');
  if (isAmbiguous) {
    allowedModes.splice(0, allowedModes.length, 'sentence_context');
  } else if (category === 'unclassified') {
    allowedModes.splice(0, allowedModes.length);
  } else {
    allowedModes.push('sentence_context');
  }

  return {
    id: makeId(partOfSpeech || 'word', label),
    legacyId: item.id,
    label,
    baseForm: label,
    partOfSpeech,
    partsOfSpeech: isAmbiguous ? AMBIGUOUS_POS[label] || [] : undefined,
    originalCategory,
    imageUrl: item.imageUrl,
    audioUrl: item.audioUrl,
    explanation: item.explanation,
    assetStatus: {
      image: assetStatus.imageStatus,
      audio: assetStatus.audioStatus
    },
    assetIssues: assetStatus.issues,
    allowedModes,
    excludeFromIsolatedIdentification: isAmbiguous || category === 'unclassified',
    active: category !== 'unclassified'
  };
}

function validatePool(pool) {
  const allItems = [
    ...pool.pools.nouns,
    ...pool.pools.verbs,
    ...pool.pools.adjectives,
    ...pool.contextOnly,
    ...pool.quarantine
  ];
  const counts = {};
  const errors = [];
  const warnings = [];

  for (const item of allItems) {
    counts[item.id] = (counts[item.id] || 0) + 1;
    if (!item.id.includes('_')) errors.push({ id: item.id, issue: 'non_namespaced_id' });
    if (!item.label) errors.push({ id: item.id, issue: 'missing_label' });
    if (item.assetIssues?.length) warnings.push({ id: item.id, issues: item.assetIssues });
    if (item.excludeFromIsolatedIdentification && item.allowedModes.includes('identify_text')) {
      errors.push({ id: item.id, issue: 'ambiguous_item_allowed_in_isolated_mode' });
    }
  }
  for (const [id, count] of Object.entries(counts)) {
    if (count > 1) errors.push({ id, issue: 'duplicate_id', count });
  }

  return {
    valid: errors.length === 0,
    counts: {
      nouns: pool.pools.nouns.length,
      verbs: pool.pools.verbs.length,
      adjectives: pool.pools.adjectives.length,
      contextOnly: pool.contextOnly.length,
      quarantine: pool.quarantine.length,
      imageReviewRequired: allItems.filter((item) => item.assetStatus?.image === 'needs_review').length,
      audioReviewRequired: allItems.filter((item) => item.assetStatus?.audio === 'needs_review').length
    },
    errors,
    warnings
  };
}

loadEnvironment();
if (!process.env.MONGODB_URI) throw new Error('MONGODB_URI is required.');

const client = new MongoClient(process.env.MONGODB_URI);
await client.connect();

try {
  const databaseName = process.env.MONGODB_DB || process.env.MONGODB_DATABASE || 'new-wexls';
  const db = client.db(databaseName);
  const poolCollection = db.collection('vocabulary_pools');
  const source = await poolCollection.findOne({ poolId: SOURCE_POOL_ID });
  if (!source) throw new Error(`Source pool ${SOURCE_POOL_ID} was not found.`);

  const allSourceItems = Object.entries(source.pools || {}).flatMap(([category, items]) =>
    (items || []).map((item) => normalizeItem(item, category))
  );

  const target = {
    poolId: TARGET_POOL_ID,
    sourcePoolId: SOURCE_POOL_ID,
    subject: 'english',
    topic: 'english-ukg',
    chapterId: 'english-ukg-verbs',
    version: 2,
    status: 'review',
    pools: {
      nouns: allSourceItems.filter((item) => item.partOfSpeech === 'noun'),
      verbs: allSourceItems.filter((item) => item.partOfSpeech === 'verb'),
      adjectives: allSourceItems.filter((item) => item.partOfSpeech === 'adjective')
    },
    contextOnly: allSourceItems.filter((item) => item.partsOfSpeech?.length),
    quarantine: allSourceItems.filter((item) => !item.partOfSpeech && !item.partsOfSpeech?.length),
    validationRules: {
      isolatedIdentificationRequiresSinglePartOfSpeech: true,
      visualModeRequiresUsableImage: true,
      audioModeRequiresUsableAudio: true,
      requireNamespacedIds: true
    },
    updatedAt: new Date()
  };

  target.validationReport = validatePool(target);
  target.status = target.validationReport.valid ? 'review' : 'invalid';

  await poolCollection.updateOne(
    { poolId: TARGET_POOL_ID },
    { $set: target, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );

  console.log(JSON.stringify({
    poolId: TARGET_POOL_ID,
    status: target.status,
    ...target.validationReport.counts,
    errors: target.validationReport.errors.length,
    warnings: target.validationReport.warnings.length
  }, null, 2));
} finally {
  await client.close();
}
