import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import fs from 'fs';
import path from 'path';

export const runtime = 'nodejs';

/**
 * POST /api/admin/auto-link-vocabulary
 * Body: { overwriteExisting: boolean }
 * Scans vocabulary.json and queries MongoDB for matching image URLs, saving changes to disk.
 */
export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { overwriteExisting = false } = body;

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ error: 'MongoDB database is not configured' }, { status: 503 });
    }

    const vocabPath = path.join(process.cwd(), 'src/lib/practice/generators/english/topics/lkg/vocabulary.json');
    if (!fs.existsSync(vocabPath)) {
      return NextResponse.json({ error: 'vocabulary.json not found on disk' }, { status: 404 });
    }

    const vocabulary = JSON.parse(fs.readFileSync(vocabPath, 'utf8'));
    vocabulary.wordImages = vocabulary.wordImages || {};

    // 1. Gather all unique vocabulary words used in LKG questions
    const allWords = new Set();

    if (Array.isArray(vocabulary.wordPool)) {
      vocabulary.wordPool.forEach(w => {
        const clean = String(w).trim().toLowerCase();
        if (clean) allWords.add(clean);
      });
    }

    if (Array.isArray(vocabulary.spottingWordPool)) {
      vocabulary.spottingWordPool.forEach(w => {
        const clean = String(w).trim().toLowerCase();
        if (clean) allWords.add(clean);
      });
    }

    if (vocabulary.endingFamilies) {
      Object.values(vocabulary.endingFamilies).flat().forEach(w => {
        const clean = String(w).trim().toLowerCase();
        if (clean) allWords.add(clean);
      });
    }

    if (Array.isArray(vocabulary.sentencesPool)) {
      vocabulary.sentencesPool.forEach(item => {
        if (item.target) {
          const clean = String(item.target).trim().toLowerCase();
          if (clean) allWords.add(clean);
        }
      });
    }

    const uniqueWords = Array.from(allWords);
    const linkedWords = [];
    const missingWords = [];
    let linkedCount = 0;

    // 2. Loop through each word and find matches
    for (const word of uniqueWords) {
      const hasImage = !!vocabulary.wordImages[word];

      // Skip if image exists and we are not overwriting
      if (hasImage && !overwriteExisting) {
        continue;
      }

      let matchedAsset = null;

      // Match 1: Exact singular name
      matchedAsset = await db.collection('image_assets').findOne({
        "linguistics.singular": word
      });

      // Match 2: Exact base name
      if (!matchedAsset) {
        matchedAsset = await db.collection('image_assets').findOne({
          name: word
        });
      }

      // Match 3: Exact plural name
      if (!matchedAsset) {
        matchedAsset = await db.collection('image_assets').findOne({
          "linguistics.plural": word
        });
      }

      // Match 4: Tag inclusion
      if (!matchedAsset) {
        matchedAsset = await db.collection('image_assets').findOne({
          "classification.tags": word
        });
      }

      if (matchedAsset && matchedAsset.url) {
        vocabulary.wordImages[word] = matchedAsset.url;
        linkedWords.push({ word, url: matchedAsset.url });
        linkedCount++;
      } else {
        if (!vocabulary.wordImages[word]) {
          missingWords.push(word);
        }
      }
    }

    // 3. Save updated vocabulary JSON back to disk if links were updated
    if (linkedCount > 0) {
      fs.writeFileSync(vocabPath, JSON.stringify(vocabulary, null, 2), 'utf8');
    }

    return NextResponse.json({
      success: true,
      linkedCount,
      linkedWords,
      missingWords,
      totalVocabularyWords: uniqueWords.length
    });

  } catch (err) {
    console.error('[auto-link-vocabulary] Error:', err);
    return NextResponse.json({ error: err.message || 'Auto-linking failed' }, { status: 500 });
  }
}
