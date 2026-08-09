import { NextResponse } from 'next/server';
import { listR2Images, isR2Configured } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';

export async function GET(request) {
  let images = [];
  const isR2 = isR2Configured();

  try {
    const { searchParams } = new URL(request.url);
    const prefix = searchParams.get('prefix') || '';

    if (isR2) {
      images = await listR2Images(prefix);
    } else {
      const fs = require('fs');
      const path = require('path');
      const publicDir = path.join(process.cwd(), 'public', 'uploads');
      if (fs.existsSync(publicDir)) {
        const files = fs.readdirSync(publicDir);
        images = files
          .filter(file => /\.(png|jpe?g|webp|gif|svg|avif)$/i.test(file))
          .map(file => {
            const stat = fs.statSync(path.join(publicDir, file));
            return {
              key: `images/${file}`,
              url: `/uploads/${file}`,
              size: stat.size,
              lastModified: stat.mtime
            };
          });
      }
    }

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
