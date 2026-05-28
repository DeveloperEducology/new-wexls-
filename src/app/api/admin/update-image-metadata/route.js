import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';

export const runtime = 'nodejs';

/**
 * POST /api/admin/update-image-metadata
 * Body: { key: string, name?: string, linguistics?: { singular, plural, article }, classification?: { category, tags } }
 * Updates the image asset metadata in MongoDB.
 */
export async function POST(request) {
  try {
    const body = await request.json();
    const { key, name, linguistics, classification } = body;

    if (!key || typeof key !== 'string') {
      return NextResponse.json({ error: 'key is required' }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ error: 'MongoDB database is not configured' }, { status: 503 });
    }

    // Prepare update parameters
    const updateDoc = {
      $set: {
        key: key,
      }
    };

    if (name && typeof name === 'string') {
      updateDoc.$set.name = name;
    }

    if (linguistics) {
      updateDoc.$set.linguistics = {
        singular: (linguistics.singular || 'item').trim().toLowerCase(),
        plural: (linguistics.plural || 'items').trim().toLowerCase(),
        article: (linguistics.article || 'an').trim().toLowerCase(),
      };
    }

    if (classification) {
      updateDoc.$set.classification = {
        category: (classification.category || 'general').trim().toLowerCase(),
        tags: Array.isArray(classification.tags) 
          ? classification.tags.map(t => String(t).trim().toLowerCase()).filter(Boolean) 
          : [],
      };
    }

    updateDoc.$set['metadata.updatedAt'] = new Date();

    const result = await db.collection('image_assets').updateOne(
      { key: key },
      updateDoc,
      { upsert: true }
    );

    return NextResponse.json({ success: true, result });
  } catch (err) {
    console.error('[update-image-metadata] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to update metadata' }, { status: 500 });
  }
}
