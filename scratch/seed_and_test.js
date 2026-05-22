const { MongoClient } = require('mongodb');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.join(__dirname, '..', '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const val = parts.slice(1).join('=').trim();
    env[key] = val;
  }
});

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

const DB_TOPIC_COLORS = ['#ff951f', '#2fbfd0', '#7a56d6', '#4db46b', '#3f8bd6', '#d64d3d', '#9b4fe8', '#0ea5e9', '#ea580c', '#059669'];

function normalizeTopicId(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function flattenTree(nodes = []) {
  return nodes.flatMap((node) => [node, ...flattenTree(node.children || [])]);
}

function collectSkillNodes(node) {
  if (!node) return [];
  return [
    ...(node.type === 'skill' ? [node] : []),
    ...(node.children || []).flatMap((child) => collectSkillNodes(child)),
  ];
}

function dbSkillTuple(skill, index) {
  return [
    skill.code || skill.metadata?.code || `S.${index + 1}`,
    skill.title || skill.name || skill.skillId || skill.id,
    skill.skillId || skill.id,
  ];
}

function gradeOrdinal(grade) {
  return `${grade}${grade === '1' ? 'st' : grade === '2' ? 'nd' : grade === '3' ? 'rd' : 'th'}-grade skills`;
}

function groupTitleForNode(node) {
  if (node.type === 'chapter') return node.title || 'Skills';

  const grade = node.grade ?? node.metadata?.grade;
  if (grade === 'remediation') return 'Remediation skills';
  if (grade) return gradeOrdinal(String(grade));

  return 'Skills';
}

function buildGroupsFromDbTopic(topicNode) {
  const children = topicNode.children || [];
  const chapterGroups = children
    .filter((child) => child.type === 'chapter')
    .map((chapter) => ({
      title: groupTitleForNode(chapter),
      skills: collectSkillNodes(chapter).map(dbSkillTuple),
    }))
    .filter((group) => group.skills.length);

  const directSkills = children.filter((child) => child.type === 'skill');
  if (directSkills.length) {
    chapterGroups.unshift({
      title: 'Skills',
      skills: directSkills.map(dbSkillTuple),
    });
  }

  if (chapterGroups.length) return chapterGroups;

  const allSkills = collectSkillNodes(topicNode);
  return allSkills.length ? [{ title: 'Skills', skills: allSkills.map(dbSkillTuple) }] : [];
}

function includesFromTopic(topicNode, groups) {
  const metadataIncludes = topicNode.metadata?.includes;
  if (Array.isArray(metadataIncludes) && metadataIncludes.length) return metadataIncludes;

  const tags = Array.isArray(topicNode.tags) ? topicNode.tags : [];
  if (tags.length) return tags.slice(0, 5);

  return groups.flatMap((group) => group.skills.map(([, name]) => name)).slice(0, 5);
}

function dbTopicFromNode(node, index) {
  const groups = buildGroupsFromDbTopic(node);
  const id = normalizeTopicId(node.topicId || node.id);

  return {
    id,
    title: node.title || node.name || id,
    color: node.metadata?.color || DB_TOPIC_COLORS[index % DB_TOPIC_COLORS.length],
    subject: node.subjectId || node.metadata?.subject || 'math',
    topic: node.topicId || id,
    includes: includesFromTopic(node, groups),
    groups,
    source: 'db',
  };
}

function topicsFromCurriculum(data) {
  return flattenTree(data?.tree || [])
    .filter((node) => node.type === 'topic')
    .map(dbTopicFromNode);
}

async function main() {
  const uri = env.MONGODB_URI;
  if (!uri) {
    console.error('No MONGODB_URI found');
    return;
  }
  const client = new MongoClient(uri);
  try {
    await client.connect();
    const db = client.db('new-wexls');
    const collection = db.collection('curriculum_nodes');

    // Clean up test nodes first
    await collection.deleteMany({ id: { $in: ['test-subject', 'test-topic', 'test-chapter', 'test-skill'] } });

    console.log('Seeding curriculum nodes...');
    const subject = normalizeNode({ type: 'subject', id: 'test-subject', title: 'Test Subject' });
    const topic = normalizeNode({ type: 'topic', id: 'test-topic', title: 'Test Topic', parentId: 'test-subject', subjectId: 'test-subject', topicId: 'test-topic' });
    const chapter = normalizeNode({ type: 'chapter', id: 'test-chapter', title: 'Test Chapter', parentId: 'test-topic', subjectId: 'test-subject', topicId: 'test-topic', chapterId: 'test-chapter' });
    const skill = normalizeNode({ type: 'skill', id: 'test-skill', title: 'Test Skill', parentId: 'test-chapter', subjectId: 'test-subject', topicId: 'test-topic', chapterId: 'test-chapter', skillId: 'test-skill', code: 'T.1' });

    await collection.insertOne(subject);
    await collection.insertOne(topic);
    await collection.insertOne(chapter);
    await collection.insertOne(skill);
    console.log('Seeded successfully!');

    // Test curriculum tree building
    const nodes = await collection.find({ status: 'active' }).toArray();
    const byId = new Map(nodes.map((node) => [node.id, { ...node, children: [] }]));
    const roots = [];

    byId.forEach((node) => {
      const parent = node.parentId ? byId.get(node.parentId) : null;
      if (parent) parent.children.push(node);
      else roots.push(node);
    });

    console.log('Roots in tree:', roots.map(r => r.id));
    const treeResult = { nodes, tree: roots };
    const parsedTopics = topicsFromCurriculum(treeResult);
    console.log('Parsed DB Topics:', JSON.stringify(parsedTopics, null, 2));

    // Clean up
    await collection.deleteMany({ id: { $in: ['test-subject', 'test-topic', 'test-chapter', 'test-skill'] } });
    console.log('Cleaned up seeded test nodes.');
  } catch (err) {
    console.error(err);
  } finally {
    await client.close();
  }
}

main();
