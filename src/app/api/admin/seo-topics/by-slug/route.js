import { NextResponse } from 'next/server';
import { getSeoTopicBySlug } from '@/lib/seo/seoTopicsStore';

/** GET /api/admin/seo-topics/by-slug?slug=template-xxx&exam=jnvst */
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const slug     = searchParams.get('slug');
    const examName = searchParams.get('exam') || 'jnvst';
    if (!slug) return NextResponse.json({ error: 'slug param required' }, { status: 400 });
    const topic = await getSeoTopicBySlug(slug, examName);
    return NextResponse.json({ topic: topic || null });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
