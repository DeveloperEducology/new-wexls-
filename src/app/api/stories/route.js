import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { KIDS_STORIES } from '@/lib/stories/storiesData';

function slugify(text) {
  return String(text || '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * GET /api/stories
 * Fetches all stories or single story by slug from MongoDB (with fallback to default KIDS_STORIES)
 */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const slug = searchParams.get('slug');

    const db = await getMongoDb();
    if (!db) {
      // Fallback to static dataset if DB is unreachable
      if (slug) {
        const found = KIDS_STORIES.find(s => s.slug === slug);
        return NextResponse.json({ success: true, story: found || KIDS_STORIES[0] });
      }
      return NextResponse.json({ success: true, stories: KIDS_STORIES });
    }

    const collection = db.collection('stories');

    if (slug) {
      let story = await collection.findOne({ slug });
      if (!story) {
        story = KIDS_STORIES.find(s => s.slug === slug);
      }
      return NextResponse.json({ success: true, story: story || KIDS_STORIES[0] });
    }

    let dbStories = await collection.find({}).sort({ createdAt: -1 }).toArray();

    // Merge default dataset if DB is empty
    if (dbStories.length === 0) {
      dbStories = KIDS_STORIES;
    }

    return NextResponse.json({ success: true, stories: dbStories });
  } catch (error) {
    console.error('Fetch stories error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/stories
 * Saves a new story into MongoDB
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { title, category, grade, readTime, coverImage, summary, pages, quiz } = body;

    if (!title || !pages || !Array.isArray(pages) || pages.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Title and at least 1 story page are required.'
      }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collection = db.collection('stories');

    const slug = body.slug ? slugify(body.slug) : slugify(title);
    const now = new Date().toISOString();

    const storyDoc = {
      title,
      slug,
      category: category || 'Moral Stories',
      grade: grade || 'LKG / UKG',
      readTime: readTime || '3 min',
      coverImage: coverImage || 'https://pub-6d655d3564544704a2d99beb0760355e.r2.dev/images/english/short_a/1784696853183-fried-inside.webp',
      summary: summary || '',
      colorTheme: body.colorTheme || 'linear-gradient(135deg, #0ea5e9, #6366f1)',
      pages: pages.map((p, idx) => ({
        pageNumber: idx + 1,
        text: p.text || '',
        image: p.image || '',
        audioUrl: p.audioUrl || '',
        sound: p.sound || '',
        vocab: Array.isArray(p.vocab) ? p.vocab : []
      })),
      quiz: Array.isArray(quiz) ? quiz : [],
      createdAt: now,
      updatedAt: now
    };

    await collection.updateOne(
      { slug },
      { $set: storyDoc },
      { upsert: true }
    );

    return NextResponse.json({ success: true, story: storyDoc });
  } catch (error) {
    console.error('Save story error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
