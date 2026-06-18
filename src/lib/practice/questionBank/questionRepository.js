import { getMongoDb, hasMongoConfig } from '../../db/mongo.js';

const DEFAULT_COLLECTION = 'questions';

function getCollectionName() {
  return process.env.MONGODB_QUESTIONS_COLLECTION || DEFAULT_COLLECTION;
}

function activeStatusFilter() {
  return {
    $or: [
      { status: { $exists: false } },
      { status: 'active' },
      { status: 'published' },
    ],
  };
}

function buildSkillFilter({ subject, topic, skill }) {
  const skillList = Array.isArray(skill) ? skill : [skill];
  const skillOrConditions = [];

  skillList.forEach(s => {
    skillOrConditions.push(
      { skillId: s },
      { microSkillId: s },
      { logic_type: s },
      { 'metadata.skillId': s },
      { 'metadata.microSkillId': s },
      { 'metadata.logicType': s },
      { 'resolvedConfig.logic_type': s },
      { 'question.skillId': s },
      { 'question.microSkillId': s },
      { 'question.logic_type': s },
      { 'question.metadata.skillId': s },
      { 'question.metadata.microSkillId': s },
      { 'question.metadata.logicType': s },
      { 'question.resolvedConfig.logic_type': s }
    );
  });

  return {
    $and: [
      {
        $or: [
          { subject },
          { 'metadata.subject': subject },
          { 'question.metadata.subject': subject },
        ],
      },
      {
        $or: [
          { topic },
          { 'metadata.topic': topic },
          { 'question.metadata.topic': topic },
        ],
      },
      {
        $or: skillOrConditions,
      },
    ],
  };
}

function buildDifficultyFilter(difficulty) {
  if (!difficulty || difficulty === 'adaptive') return {};
  
  const val = String(difficulty).toLowerCase();
  const equivalents = [val];

  if (val === 'easy' || val === 'beginner') {
    equivalents.push('easy', 'beginner');
  } else if (val === 'medium' || val === 'intermediate') {
    equivalents.push('medium', 'intermediate');
  } else if (val === 'hard' || val === 'advanced') {
    equivalents.push('hard', 'advanced');
  }

  const uniqueEquivalents = Array.from(new Set(equivalents));

  return {
    $or: [
      { difficulty: { $in: uniqueEquivalents } },
      { 'metadata.difficulty': { $in: uniqueEquivalents } },
      { 'resolvedConfig.config.difficulty': { $in: uniqueEquivalents } },
      { difficulty: { $exists: false } },
    ],
  };
}

function sortForQuestionPool() {
  return { priority: -1, order: 1, importedAt: 1, createdAt: 1, updatedAt: 1, _id: 1 };
}

function seedToIndex(seed, length) {
  if (!length) return 0;

  const text = String(seed || Date.now());
  let hash = 0;

  for (let index = 0; index < text.length; index += 1) {
    hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  }

  return hash % length;
}

function stripMongoFields(document) {
  if (!document) return null;
  if (document.question) {
    return stripMongoFields({
      ...document.question,
      _id: document._id,
      status: document.status,
      priority: document.priority,
      createdAt: document.createdAt,
      updatedAt: document.updatedAt,
    });
  }

  const { _id, status, priority, createdAt, updatedAt, ...question } = document;
  return {
    id: question.id || String(_id),
    ...question,
  };
}

function scrubBrowserTts(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(scrubBrowserTts);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'audioUrl' && typeof value === 'string' && value.startsWith('/api/tts')) {
      continue;
    }
    if (value && typeof value === 'object') {
      result[key] = scrubBrowserTts(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

function normalizeQuestionInput(input) {
  if (!input || typeof input !== 'object') {
    throw new Error('Question JSON must be an object.');
  }

  const rawSource = input.question && typeof input.question === 'object' ? input.question : input;
  if (!rawSource || typeof rawSource !== 'object') {
    throw new Error('Question payload must contain a question object.');
  }

  const source = scrubBrowserTts(rawSource);

  const metadata = source.metadata || {};
  const subject = metadata.subject || source.subject || input.subject;
  const topic = metadata.topic || source.topic || input.topic;
  const skillId = metadata.skillId || metadata.microSkillId || source.skillId || source.microSkillId || input.skillId;

  if (!subject) throw new Error('Missing subject. Add metadata.subject or subject.');
  if (!topic) throw new Error('Missing topic. Add metadata.topic or topic.');
  if (!skillId) throw new Error('Missing skillId. Add metadata.skillId or skillId.');
  if (!source.type) throw new Error('Missing question type.');

  const id = source.id || `${subject}_${topic}_${skillId}_${Date.now()}`;
  const now = new Date();

  return {
    ...source,
    id,
    subject,
    topic,
    skillId,
    microSkillId: source.microSkillId || metadata.microSkillId || skillId,
    status: source.status || input.status || 'active',
    metadata: {
      ...metadata,
      subject,
      topic,
      skillId,
      microSkillId: metadata.microSkillId || source.microSkillId || skillId,
      templateId: metadata.templateId || source.templateId || source.resolvedConfig?.templateId || 'questionBank.imported',
      engine: metadata.engine || source.engine || source.resolvedConfig?.engine || 'questionBank',
    },
    importedAt: source.importedAt || now,
    updatedAt: now,
  };
}

export function normalizeStoredQuestion(document, { subject, topic, skill }) {
  const question = stripMongoFields(document);
  if (!question) return null;

  const resolvedSkill = Array.isArray(skill) ? skill[0] : skill;

  const metadata = {
    ...(question.metadata || {}),
    subject: question.metadata?.subject || question.subject || subject,
    topic: question.metadata?.topic || question.topic || topic,
    skillId: question.metadata?.skillId || question.skillId || resolvedSkill,
    microSkillId: question.metadata?.microSkillId || question.microSkillId || resolvedSkill,
    templateId: question.metadata?.templateId || question.templateId || question.resolvedConfig?.templateId || resolvedSkill,
    engine: question.metadata?.engine || question.engine || question.resolvedConfig?.engine || 'questionBank',
  };

  return {
    ...question,
    metadata,
  };
}

export async function findStoredPracticeQuestion({ subject, topic, skill, difficulty, seed }) {
  if (!hasMongoConfig()) return null;

  try {
    const db = await getMongoDb();
    if (!db) return null;

    const collection = db.collection(getCollectionName());
    const difficultyFilter = buildDifficultyFilter(difficulty);
    const query = {
      $and: [
        buildSkillFilter({ subject, topic, skill }),
        activeStatusFilter(),
      ],
    };

    if (Object.keys(difficultyFilter).length > 0) {
      query.$and.push({
        $or: [
          { type: 'dynamic_pool' },
          { type: 'pool' },
          difficultyFilter,
        ],
      });
    }

    const candidates = await collection
      .find(query)
      .sort(sortForQuestionPool())
      .limit(50)
      .toArray();
    const document = candidates[seedToIndex(seed, candidates.length)];

    return normalizeStoredQuestion(document, { subject, topic, skill });
  } catch (error) {
    console.warn('Mongo question lookup skipped:', error.message);
    return null;
  }
}

export async function findStoredQuestionById(questionId) {
  if (!hasMongoConfig()) return null;
  try {
    const db = await getMongoDb();
    if (!db) return null;
    const collection = db.collection(getCollectionName());
    const doc = await collection.findOne({ id: questionId });
    if (!doc) return null;
    return stripMongoFields(doc);
  } catch (error) {
    console.warn('Mongo question lookup by ID failed:', error.message);
    return null;
  }
}


export async function saveStoredPracticeQuestion(input, { mode = 'upsert' } = {}) {
  if (!hasMongoConfig()) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI in .env.local.');
  }

  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB connection is unavailable.');
  }

  const question = normalizeQuestionInput(input);
  const collection = db.collection(getCollectionName());

  if (mode === 'insert') {
    const insertResult = await collection.insertOne({
      ...question,
      createdAt: question.createdAt || new Date(),
    });
    return {
      mode: 'insert',
      id: question.id,
      mongoId: String(insertResult.insertedId),
      question,
    };
  }

  const { createdAt, ...questionWithoutCreatedAt } = question;

  const updateObj = {
    $set: questionWithoutCreatedAt,
    $setOnInsert: {
      createdAt: createdAt || new Date(),
    },
  };

  if (question.poolId) {
    updateObj.$unset = { pools: "" };
    delete questionWithoutCreatedAt.pools;
  }

  const result = await collection.updateOne(
    { id: question.id },
    updateObj,
    { upsert: true }
  );

  return {
    mode: result.upsertedCount ? 'insert' : 'update',
    id: question.id,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedId: result.upsertedId ? String(result.upsertedId) : null,
    question,
  };
}

// In-memory cache for loaded vocabulary pools (hot-reloads will clear this)
const poolCache = new Map();

export function clearVocabularyPoolCache(poolId) {
  if (poolId) {
    poolCache.delete(poolId);
    return;
  }
  poolCache.clear();
}

export async function findVocabularyPool(poolId) {
  if (!poolId) return null;
  if (poolCache.has(poolId)) {
    return poolCache.get(poolId);
  }
  if (!hasMongoConfig()) return null;
  try {
    const db = await getMongoDb();
    if (!db) return null;
    const collection = db.collection('vocabulary_pools');
    const doc = await collection.findOne({ poolId });
    if (!doc) return null;

    // Cache the pool
    poolCache.set(poolId, doc);
    return doc;
  } catch (error) {
    console.warn(`Mongo vocabulary pool lookup for ${poolId} failed:`, error.message);
    return null;
  }
}
