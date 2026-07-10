import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { generateIxlMetadata } from '@/lib/gemini';

export const runtime = 'nodejs';

/**
 * POST /api/admin/auto-label-image
 * Body: { key: string, url: string, saveToDb?: boolean }
 * Fetches an existing image, runs Gemini analysis to extract educational/linguistic metadata,
 * and optionally updates the image_assets collection in MongoDB.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { key, url, saveToDb = false } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'url is required' }, { status: 400 });
    }

    // 1. Fetch image bytes from public URL
    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      return NextResponse.json({ error: `Failed to fetch image: status ${imageRes.status}` }, { status: 400 });
    }

    const arrayBuffer = await imageRes.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const mimeType = imageRes.headers.get('content-type') || 'image/png';

    // 2. Call Gemini Vision Analyzer
    const metadata = await generateIxlMetadata(buffer, mimeType);

    // 3. Optionally persist directly to DB
    if (saveToDb && key) {
      const db = await getMongoDb();
      if (db) {
        await db.collection('image_assets').updateOne(
          { key: key },
          {
            $set: {
              key: key,
              linguistics: {
                singular: (metadata.singular || 'item').trim().toLowerCase(),
                plural: (metadata.plural || 'items').trim().toLowerCase(),
                article: (metadata.article || 'an').trim().toLowerCase(),
              },
              classification: {
                category: (metadata.category || 'general').trim().toLowerCase(),
                tags: Array.isArray(metadata.tags)
                  ? metadata.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean)
                  : [],
              },
              'metadata.updatedAt': new Date(),
            }
          },
          { upsert: true }
        );
      }
    }

    return NextResponse.json({ success: true, metadata });
  } catch (err) {
    console.error('[auto-label-image] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to auto-label image' }, { status: 500 });
  }
}
