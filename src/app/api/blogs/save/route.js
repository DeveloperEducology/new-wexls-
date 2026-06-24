import { NextResponse } from 'next/server';
import { saveGeneratedBlog } from '@/lib/lessons/blog-store';

export async function POST(request) {
  try {
    const { blogJson, examName, subject, concept, grade, usage } = await request.json();

    if (!blogJson) {
      return NextResponse.json({ success: false, error: 'blogJson is required.' }, { status: 400 });
    }

    const saved = await saveGeneratedBlog({ blogJson, examName, subject, concept, grade, usage });

    return NextResponse.json({
      success: true,
      slug: saved.slug,
      blogUrl: `/blog/${saved.slug}`,
    });
  } catch (err) {
    console.error('[api/blogs/save] error:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
