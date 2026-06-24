import { getMongoDb } from '@/lib/db/mongo';

const COLLECTION = 'blogs';

function slugify(value) {
  const base = String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (base.length <= 80) return base;
  const truncated = base.substring(0, 80);
  const lastDash = truncated.lastIndexOf('-');
  return lastDash > 10 ? truncated.substring(0, lastDash) : truncated;
}

async function getCollection() {
  const db = await getMongoDb();
  if (!db) throw new Error('Database not configured. Set MONGODB_URI.');
  const col = db.collection(COLLECTION);
  // Ensure indexes (idempotent)
  await col.createIndex({ slug: 1 }, { unique: true });
  await col.createIndex({ createdAt: -1 });
  await col.createIndex({ 'seo.tags': 1 });
  await col.createIndex({ examName: 1 });
  return col;
}

/**
 * Save a generated blog post to the blogs collection.
 * Uses slug as the unique key — re-saves on regeneration.
 */
export async function saveGeneratedBlog({ blogJson, examName, subject, concept, grade, usage }) {
  const col = await getCollection();
  const slugSource = blogJson?.seo?.slug || blogJson?.hero?.headline || concept || 'untitled-blog';
  const slug = slugify(slugSource);
  const now = new Date();

  const doc = {
    slug,
    examName,
    subject,
    concept,
    grade,
    blogJson,
    seoTitle: blogJson?.seo?.title || '',
    seoDescription: blogJson?.seo?.metaDescription || '',
    headline: blogJson?.hero?.headline || '',
    tags: blogJson?.seo?.tags || [],
    usage: usage || null,
    updatedAt: now,
  };

  const result = await col.findOneAndUpdate(
    { slug },
    {
      $set: doc,
      $setOnInsert: { createdAt: now },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return { ...doc, _id: result?._id };
}

/**
 * Get a single generated blog post by slug.
 */
export async function getGeneratedBlogBySlug(slug) {
  try {
    const col = await getCollection();
    return col.findOne({ slug });
  } catch {
    return null;
  }
}

/**
 * List all generated blog posts, newest first.
 */
export async function listGeneratedBlogs({ limit = 50, skip = 0 } = {}) {
  try {
    const col = await getCollection();
    return col
      .find({})
      .sort({ createdAt: -1 })
      .skip(Number(skip))
      .limit(Math.min(Number(limit), 100))
      .toArray();
  } catch {
    return [];
  }
}
