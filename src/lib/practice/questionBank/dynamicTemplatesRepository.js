import { getMongoDb, hasMongoConfig } from '../../db/mongo.js';

const DEFAULT_COLLECTION = 'dynamic_templates';
const templateCache = new Map();

export function clearTemplateCache(templateId) {
  if (templateId) {
    templateCache.delete(templateId);
  } else {
    templateCache.clear();
  }
}

export async function findDynamicTemplateById(templateId) {
  if (!templateId) return null;
  
  if (process.env.NODE_ENV !== 'development' && templateCache.has(templateId)) {
    return templateCache.get(templateId);
  }

  if (!hasMongoConfig()) return null;

  try {
    const db = await getMongoDb();
    if (!db) return null;

    const collection = db.collection(DEFAULT_COLLECTION);
    const idsToTry = [templateId];
    if (typeof templateId === 'string') {
      if (templateId.startsWith('ukg-english-')) {
        idsToTry.push(templateId.replace(/^ukg-english-/, ''));
      } else {
        idsToTry.push(`ukg-english-${templateId}`);
      }
    }
    const doc = await collection.findOne({ id: { $in: idsToTry } });
    if (!doc) return null;

    // Remove mongo fields
    const { _id, ...template } = doc;
    const cleaned = { id: template.id || String(_id), ...template };

    // Cache the template
    templateCache.set(templateId, cleaned);
    return cleaned;
  } catch (error) {
    console.warn(`Mongo dynamic template lookup for ${templateId} failed:`, error.message);
    return null;
  }
}

export async function saveDynamicTemplate(template) {
  if (!hasMongoConfig()) {
    throw new Error('MongoDB is not configured. Set MONGODB_URI in .env.local.');
  }

  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB connection is unavailable.');
  }

  if (!template.id) {
    throw new Error('Template must have a unique id field.');
  }

  const collection = db.collection(DEFAULT_COLLECTION);
  const now = new Date();
  
  const { _id, createdAt, updatedAt, ...rest } = template;
  const existing = await collection.findOne({ id: template.id });
  const cleaned = {
    ...rest,
    createdAt: existing ? existing.createdAt : now,
    updatedAt: now
  };

  const result = await collection.replaceOne(
    { id: template.id },
    cleaned,
    { upsert: true }
  );

  // Invalidate cache
  templateCache.delete(template.id);

  return {
    mode: result.upsertedCount ? 'insert' : 'update',
    id: template.id,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
    upsertedId: result.upsertedId ? String(result.upsertedId) : null,
    template: cleaned
  };
}

export async function listAllDynamicTemplates() {
  if (!hasMongoConfig()) return [];

  try {
    const db = await getMongoDb();
    if (!db) return [];

    const collection = db.collection(DEFAULT_COLLECTION);
    const docs = await collection.find({}).sort({ updatedAt: -1 }).toArray();

    return docs.map(doc => {
      const { _id, ...template } = doc;
      return { id: template.id || String(_id), ...template };
    });
  } catch (error) {
    console.warn('Mongo listAllDynamicTemplates failed:', error.message);
    return [];
  }
}

export async function deleteDynamicTemplate(templateId) {
  if (!hasMongoConfig()) {
    throw new Error('MongoDB is not configured.');
  }

  const db = await getMongoDb();
  if (!db) {
    throw new Error('MongoDB connection is unavailable.');
  }

  const collection = db.collection(DEFAULT_COLLECTION);
  const result = await collection.deleteOne({ id: templateId });

  // Invalidate cache
  templateCache.delete(templateId);

  return {
    deletedCount: result.deletedCount,
    id: templateId
  };
}
// Cache hot-reload trigger 9
