import { NextResponse } from 'next/server';
import { listGeneratedBlogs } from '@/lib/lessons/blog-store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number(searchParams.get('limit') || 50);
    const skip = Number(searchParams.get('skip') || 0);

    const blogs = await listGeneratedBlogs({ limit, skip });

    // Serialize MongoDB _id
    const serialized = blogs.map(b => ({
      ...b,
      _id: b._id?.toString(),
    }));

    return NextResponse.json({ success: true, blogs: serialized });
  } catch (err) {
    console.error('[api/blogs] error:', err);
    return NextResponse.json({ success: false, error: err.message, blogs: [] }, { status: 500 });
  }
}
