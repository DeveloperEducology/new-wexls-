import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { saveLesson } from '@/lib/lessons/store';
import { compileToMarkdown } from '@/lib/lessons/compiler';

export async function POST(request) {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json(
        { success: false, error: 'Database not configured. Set MONGODB_URI in your .env.local.' },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { topic, tone, worksheetJson, metadata, title } = body;

    if (!topic || !worksheetJson) {
      return NextResponse.json(
        { success: false, error: 'topic and worksheetJson are required.' },
        { status: 400 }
      );
    }

    if (title) {
      worksheetJson.title = title;
    }

    // Compile markdown for both modes
    const markdownContent = {
      student: compileToMarkdown(worksheetJson, 'worksheet'),
      teacher: compileToMarkdown(worksheetJson, 'lesson'),
    };

    const saved = await saveLesson({
      topic,
      tone: tone || 'teacher',
      worksheetJson,
      markdownContent,
      metadata: metadata || {},
      title,
    });

    return NextResponse.json({
      success: true,
      slug: saved.slug,
      lessonUrl: `/lessons/${saved.slug}`,
    });
  } catch (err) {
    console.error('[Save Lesson API] Error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Failed to save lesson.' },
      { status: 500 }
    );
  }
}
