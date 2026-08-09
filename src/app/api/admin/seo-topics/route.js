import { NextResponse } from 'next/server';
import { listSeoTopics, createSeoTopic } from '@/lib/seo/seoTopicsStore';

/** GET /api/admin/seo-topics — list all topics */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const topics = await listSeoTopics({
      examName:  searchParams.get('examName')  || undefined,
      subject:   searchParams.get('subject')   || undefined,
      published: searchParams.has('published') ? searchParams.get('published') === 'true' : undefined,
    });
    return NextResponse.json({ topics, total: topics.length });
  } catch (err) {
    console.error('[GET /api/admin/seo-topics]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** POST /api/admin/seo-topics — create a new topic */
export async function POST(req) {
  try {
    const body = await req.json();
    if (!body.slug)      return NextResponse.json({ error: 'slug is required' }, { status: 400 });
    if (!body.examName)  return NextResponse.json({ error: 'examName is required' }, { status: 400 });
    const topic = await createSeoTopic(body);
    return NextResponse.json({ topic }, { status: 201 });
  } catch (err) {
    if (err.code === 11000) {
      return NextResponse.json({ error: 'A topic with this slug + examName already exists.' }, { status: 409 });
    }
    console.error('[POST /api/admin/seo-topics]', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
