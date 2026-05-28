import { NextResponse } from 'next/server';
import { listR2Images, isR2Configured } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';

export async function GET(request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 is not configured on this server' },
      { status: 501 }
    );
  }

  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';

    const images = await listR2Images(prefix);

    // Retrieve database metadata records from MongoDB
    let mergedImages = images;
    try {
      const db = await getMongoDb();
      if (db && images.length > 0) {
        const keys = images.map(img => img.key);
        const docs = await db.collection('image_assets').find({ key: { $in: keys } }).toArray();
        
        // Map document by key for O(1) lookup
        const metaMap = new Map();
        for (const doc of docs) {
          metaMap.set(doc.key, doc);
        }

        mergedImages = images.map(img => {
          const meta = metaMap.get(img.key);
          return {
            ...img,
            dimensions: meta?.dimensions || { width: 512, height: 512, aspectRatio: 1.0 },
            linguistics: meta?.linguistics || { singular: 'item', plural: 'items', article: 'an' },
            classification: meta?.classification || { category: 'general', tags: [] }
          };
        });
      } else {
        // Fallback dimensions and tags if DB is empty or unavailable
        mergedImages = images.map(img => ({
          ...img,
          dimensions: { width: 512, height: 512, aspectRatio: 1.0 },
          linguistics: { singular: 'item', plural: 'items', article: 'an' },
          classification: { category: 'general', tags: [] }
        }));
      }
    } catch (dbErr) {
      console.error('[list-images] Failed to load MongoDB metadata:', dbErr);
    }

    // Sort by last modified descending so new images appear first!
    mergedImages.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

    return NextResponse.json({ images: mergedImages });
  } catch (error) {
    console.error('API Error in list-images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to list R2 images' },
      { status: 500 }
    );
  }
}
