import { NextResponse } from 'next/server';
import { getSeoTopicById, updateSeoTopic, deleteSeoTopic } from '@/lib/seo/seoTopicsStore';

/** GET /api/admin/seo-topics/[id] */
export async function GET(req, { params }) {
  try {
    const { id } = await params;
    const topic = await getSeoTopicById(id);
    if (!topic) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ topic });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** PUT /api/admin/seo-topics/[id] */
export async function PUT(req, { params }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const topic = await updateSeoTopic(id, body);
    return NextResponse.json({ topic });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

/** DELETE /api/admin/seo-topics/[id] */
export async function DELETE(req, { params }) {
  try {
    const { id } = await params;
    await deleteSeoTopic(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
