import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';

// GET: Paginated list of TTS cache items with optional search
export async function GET(request) {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const cacheCollection = db.collection('tts_cache');

    const filter = {};
    if (search) {
      filter.$or = [
        { _id: { $regex: search, $options: 'i' } },
        { text: { $regex: search, $options: 'i' } },
        { voice: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await cacheCollection.countDocuments(filter);
    const items = await cacheCollection
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      items,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Cache list GET error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE: Delete a single item by id (hash) or clear everything if purgeAll=true
export async function DELETE(request) {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const { searchParams } = new URL(request.url);
    const purgeAll = searchParams.get('purgeAll') === 'true';
    const id = searchParams.get('id');

    const cacheCollection = db.collection('tts_cache');

    if (purgeAll) {
      const deleteResult = await cacheCollection.deleteMany({});
      return NextResponse.json({
        success: true,
        message: 'All cached audio records have been purged.',
        deletedCount: deleteResult.deletedCount
      });
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing cache ID' }, { status: 400 });
    }

    const result = await cacheCollection.deleteOne({ _id: id });
    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Cache item not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Cached item deleted successfully'
    });
  } catch (error) {
    console.error('Cache delete error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
