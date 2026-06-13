import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { clearVocabularyPoolCache } from '@/lib/practice/questionBank/questionRepository';

const OPTIONAL_POOL_FIELDS = [
  'subject',
  'topic',
  'chapterId',
  'description',
  'status',
  'version',
  'mode',
  'allowedModes',
  'contextOnly',
  'quarantine',
  'validationRules',
  'validationReport',
  'sourcePoolId'
];

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const poolId = searchParams.get('poolId');

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collection = db.collection('vocabulary_pools');

    if (poolId) {
      const pool = await collection.findOne({ poolId });
      if (!pool) {
        return NextResponse.json({ success: false, error: 'Vocabulary pool not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, pool });
    }

    const poolDocuments = await collection.find(
      {},
      { projection: { poolId: 1, status: 1, version: 1, mode: 1, pools: 1 } }
    ).toArray();
    const pools = poolDocuments.map(pool => {
      const categoryCounts = {};
      const posKeys = {}; // which POS keys are annotated per category
      const KNOWN_POS = ['verbs', 'adjectives', 'adverbs', 'prepositions', 'pronouns', 'conjunctions', 'articles', 'vowels', 'consonants'];
      for (const [category, items] of Object.entries(pool.pools || {})) {
        categoryCounts[category] = Array.isArray(items) ? items.length : 0;
        if (Array.isArray(items) && items.length > 0) {
          const available = KNOWN_POS.filter(key =>
            items.some(item => Array.isArray(item[key]) && item[key].length > 0)
          );
          posKeys[category] = available;
        } else {
          posKeys[category] = [];
        }
      }
      return {
        poolId: pool.poolId,
        status: pool.status,
        version: pool.version,
        mode: pool.mode,
        categoryCounts,
        posKeys,
      };
    });
    return NextResponse.json({ success: true, pools });
  } catch (error) {
    console.error('Fetch vocabulary pools error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

function scrubBrowserTts(obj) {
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map(scrubBrowserTts);
  }

  const result = {};
  for (const [key, value] of Object.entries(obj)) {
    if (key === 'audioUrl' && typeof value === 'string' && value.startsWith('/api/tts')) {
      continue;
    }
    if (value && typeof value === 'object') {
      result[key] = scrubBrowserTts(value);
    } else {
      result[key] = value;
    }
  }
  return result;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { poolId } = body;
    const pools = body.pools || body.categories;

    if (!poolId || !pools || typeof pools !== 'object' || Array.isArray(pools)) {
      return NextResponse.json({ success: false, error: 'Missing poolId or pools/categories' }, { status: 400 });
    }
    const invalidCategory = Object.entries(pools).find(([, items]) => !Array.isArray(items));
    if (invalidCategory) {
      return NextResponse.json({ success: false, error: `Pool category "${invalidCategory[0]}" must be an array.` }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collection = db.collection('vocabulary_pools');

    const optionalFields = Object.fromEntries(
      OPTIONAL_POOL_FIELDS
        .filter(field => body[field] !== undefined)
        .map(field => [field, body[field]])
    );
    const cleanedPools = scrubBrowserTts(pools);
    const result = await collection.updateOne(
      { poolId },
      {
        $set: {
          pools: cleanedPools,
          ...optionalFields,
          updatedAt: new Date()
        },
        $setOnInsert: {
          createdAt: new Date()
        }
      },
      { upsert: true }
    );
    clearVocabularyPoolCache(poolId);

    return NextResponse.json({
      success: true,
      result: {
        poolId,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId ? String(result.upsertedId) : null
      }
    });
  } catch (error) {
    console.error('Save vocabulary pool error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
