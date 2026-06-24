import { NextResponse } from 'next/server';
import { listLessons } from '@/lib/lessons/store';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const subject = searchParams.get('subject') || '';
    const grade = searchParams.get('grade') || '';
    const search = searchParams.get('search') || '';
    const limit = searchParams.get('limit') || 20;
    const skip = searchParams.get('skip') || 0;

    const lessons = await listLessons({ subject, grade, search, limit, skip });

    return NextResponse.json({
      success: true,
      lessons: lessons.map((l) => ({
        slug: l.slug,
        title: l.title,
        topic: l.topic,
        tone: l.tone,
        metadata: l.metadata,
        createdAt: l.createdAt,
        updatedAt: l.updatedAt,
        lessonUrl: `/lessons/${l.slug}`,
      })),
    });
  } catch (err) {
    console.error('[List Lessons API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to list lessons.' },
      { status: 500 }
    );
  }
}
