import { NextResponse } from 'next/server';
import { deleteR2Images, isR2Configured } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';

export async function POST(request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 is not configured on this server' },
      { status: 501 }
    );
  }

  try {
    const body = await request.json();
    const { keys } = body;

    if (!Array.isArray(keys) || !keys.length) {
      return NextResponse.json(
        { error: 'Invalid or empty keys array provided' },
        { status: 400 }
      );
    }

    const result = await deleteR2Images(keys);

    // Sync deletion with MongoDB
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('image_assets').deleteMany({ key: { $in: keys } });
      }
    } catch (dbErr) {
      console.error('[delete-images] Failed to delete MongoDB metadata:', dbErr);
    }

    return NextResponse.json({ success: true, result });
  } catch (error) {
    console.error('API Error in delete-images:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete images' },
      { status: 500 }
    );
  }
}
