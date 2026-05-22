import { getMongoDb } from '@/lib/db/mongo';

const COLLECTION_NAME = process.env.MONGODB_CURRICULUM_COLLECTION || 'curriculum_nodes';
const NODE_TYPES = new Set(['subject', 'topic', 'chapter', 'skill']);

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function compactObject(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== '')
  );
}

function normalizeList(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.filter(Boolean) : [value].filter(Boolean);
}

function buildNodeId(input) {
  if (input.id) return slugify(input.id);
  const type = slugify(input.type);
  const subject = slugify(input.subjectId || input.subject || '');
  const topic = slugify(input.topicId || input.topic || '');
  const chapter = slugify(input.chapterId || input.chapter || '');
  const skill = slugify(input.skillId || '');
  const title = slugify(input.title || input.name || '');
  return [subject, topic, chapter, skill || title || type].filter(Boolean).join('-');
}

function inferParentId(input) {
  if (input.parentId) return input.parentId;
  if (input.type === 'topic') return input.subjectId || input.subject || null;
  if (input.type === 'chapter') return input.topicId || input.topic || null;
  if (input.type === 'skill') return input.chapterId || input.chapter || input.topicId || input.topic || null;
  return null;
}

function normalizeNode(input = {}, existing = {}) {
  const type = input.type || existing.type;
  if (!NODE_TYPES.has(type)) {
    throw new Error('Curriculum node type must be subject, topic, chapter, or skill.');
  }

  const subjectId = input.subjectId || input.subject || existing.subjectId || (type === 'subject' ? input.id : undefined);
  const topicId = input.topicId || input.topic || existing.topicId || (type === 'topic' ? input.id : undefined);
  const chapterId = input.chapterId || input.chapter || existing.chapterId || (type === 'chapter' ? input.id : undefined);
  const id = buildNodeId({ ...existing, ...input, type, subjectId, topicId, chapterId });
  const now = new Date();

  return compactObject({
    ...existing,
    id,
    type,
    subjectId: subjectId ? slugify(subjectId) : undefined,
    topicId: topicId ? slugify(topicId) : undefined,
    chapterId: chapterId ? slugify(chapterId) : undefined,
    parentId: inferParentId({ ...existing, ...input, type, subjectId, topicId, chapterId }),
    title: input.title || input.name || existing.title,
    code: input.code ?? existing.code,
    grade: input.grade ?? existing.grade,
    order: Number.isFinite(Number(input.order ?? existing.order)) ? Number(input.order ?? existing.order) : 0,
    skillId: input.skillId || existing.skillId,
    competencyId: input.competencyId || existing.competencyId,
    templateId: input.templateId || existing.templateId,
    engine: input.engine || existing.engine,
    questionType: input.questionType || input.typeOfQuestion || existing.questionType,
    source: input.source || existing.source || (type === 'skill' ? 'db' : 'curriculum'),
    status: input.status || existing.status || 'active',
    description: input.description ?? existing.description,
    prerequisites: normalizeList(input.prerequisites ?? existing.prerequisites),
    remediation: normalizeList(input.remediation ?? existing.remediation),
    tags: normalizeList(input.tags ?? existing.tags),
    metadata: { ...(existing.metadata || {}), ...(input.metadata || {}) },
    createdAt: existing.createdAt || now,
    updatedAt: now,
  });
}

async function getCollection() {
  const db = await getMongoDb();
  if (!db) throw new Error('Database connection failed. Set MONGODB_URI first.');
  const collection = db.collection(COLLECTION_NAME);
  await collection.createIndex({ id: 1 }, { unique: true });
  await collection.createIndex({ subjectId: 1, topicId: 1, chapterId: 1, type: 1 });
  await collection.createIndex({ parentId: 1, order: 1 });
  return collection;
}

export async function listCurriculumNodes(filters = {}) {
  const collection = await getCollection();
  const query = {};

  ['type', 'subjectId', 'topicId', 'chapterId', 'parentId', 'status', 'skillId'].forEach((key) => {
    if (filters[key]) query[key] = key.endsWith('Id') || key === 'parentId' ? slugify(filters[key]) : filters[key];
  });

  if (filters.search) {
    query.$or = [
      { id: { $regex: filters.search, $options: 'i' } },
      { title: { $regex: filters.search, $options: 'i' } },
      { skillId: { $regex: filters.search, $options: 'i' } },
    ];
  }

  const limit = Math.min(Number(filters.limit) || 200, 1000);
  return collection.find(query).sort({ type: 1, order: 1, title: 1 }).limit(limit).toArray();
}

export async function getCurriculumNode(id) {
  const collection = await getCollection();
  return collection.findOne({ id: slugify(id) });
}

export async function createCurriculumNode(input) {
  const collection = await getCollection();
  const node = normalizeNode(input);
  await collection.updateOne({ id: node.id }, { $set: node }, { upsert: true });
  return collection.findOne({ id: node.id });
}

export async function updateCurriculumNode(id, input) {
  const collection = await getCollection();
  const existing = await collection.findOne({ id: slugify(id) });
  if (!existing) return null;
  const node = normalizeNode({ ...input, id: existing.id }, existing);
  await collection.updateOne({ id: existing.id }, { $set: node });
  return collection.findOne({ id: existing.id });
}

export async function deleteCurriculumNode(id) {
  const collection = await getCollection();
  const result = await collection.deleteOne({ id: slugify(id) });
  return { deletedCount: result.deletedCount };
}

function getGradeOrdinalTitle(num) {
  const ordinal = num === '1' ? 'First' : num === '2' ? 'Second' : num === '3' ? 'Third' : num === '4' ? 'Fourth' : num === '5' ? 'Fifth' : num === '6' ? 'Sixth' : num === '7' ? 'Seventh' : num === '8' ? 'Eighth' : num;
  return `${ordinal}-grade skills`;
}

function inferChapterTitle(parentId, nodeGrade) {
  const match = parentId.match(/grade-(\d+)/i) || parentId.match(/-g(\d+)/i) || parentId.match(/(\d+)(?:st|nd|rd|th)?-grade/i);
  const grade = match ? match[1] : (nodeGrade ? String(nodeGrade) : null);
  if (grade) {
    return getGradeOrdinalTitle(grade);
  }
  return parentId
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export async function getCurriculumTree(filters = {}) {
  const nodes = await listCurriculumNodes({ ...filters, limit: filters.limit || 1000 });
  const byId = new Map(nodes.map((node) => [node.id, { ...node, children: [] }]));
  
  let iterations = 0;
  let synthesizedAny = true;
  const synthesizedNodes = [];

  while (synthesizedAny && iterations < 3) {
    synthesizedAny = false;
    iterations++;

    const currentNodes = Array.from(byId.values());

    for (const node of currentNodes) {
      if (!node.parentId) continue;

      const parentSlug = slugify(node.parentId);
      if (!byId.has(parentSlug)) {
        synthesizedAny = true;

        let synthesizedParent = null;

        if (node.type === 'skill') {
          const topicId = node.topicId || 'patterns';
          const subjectId = node.subjectId || 'math';
          const title = inferChapterTitle(parentSlug, node.grade);
          
          synthesizedParent = {
            id: parentSlug,
            type: 'chapter',
            title,
            parentId: topicId,
            topicId,
            subjectId,
            children: [],
            status: 'active',
            source: 'synthesized',
            order: parentSlug.includes('grade-') ? Number(parentSlug.split('grade-').pop()) || 0 : 0,
          };
        } else if (node.type === 'chapter') {
          const subjectId = node.subjectId || 'math';
          const title = parentSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          synthesizedParent = {
            id: parentSlug,
            type: 'topic',
            title,
            parentId: subjectId,
            topicId: parentSlug,
            subjectId,
            children: [],
            status: 'active',
            source: 'synthesized',
            order: 0,
          };
        } else if (node.type === 'topic') {
          const title = parentSlug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

          synthesizedParent = {
            id: parentSlug,
            type: 'subject',
            title,
            children: [],
            status: 'active',
            source: 'synthesized',
            order: 0,
          };
        }

        if (synthesizedParent) {
          byId.set(parentSlug, synthesizedParent);
          synthesizedNodes.push(synthesizedParent);
        }
      }
    }
  }

  const roots = [];

  byId.forEach((node) => {
    const parent = node.parentId ? byId.get(slugify(node.parentId)) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const sortTree = (items) => {
    items.sort((a, b) => (a.order || 0) - (b.order || 0) || String(a.title).localeCompare(String(b.title)));
    items.forEach((item) => sortTree(item.children));
  };

  sortTree(roots);
  return { nodes: [...nodes, ...synthesizedNodes], tree: roots };
}
