import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/db/mongo';
import { listR2Audio, isR2Configured } from '@/lib/r2Service';
import { getOrGenerateR2Audio } from '../questions/route';

function slugifyAudioText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function audioFileStem(key) {
  return String(key || '')
    .split('/')
    .pop()
    .replace(/\.(mp3|wav|ogg|m4a|aac)$/i, '')
    .toLowerCase();
}

function scoreAudioMatch(file, textSlug) {
  const stem = audioFileStem(file.key);
  const normalizedStem = slugifyAudioText(stem);
  if (!textSlug || !normalizedStem) return 0;
  if (normalizedStem === textSlug) return 100;
  if (normalizedStem.endsWith(`-${textSlug}`)) return 92;
  if (normalizedStem.startsWith(`${textSlug}-`)) return 88;
  if (normalizedStem.includes(`-${textSlug}-`)) return 78;
  return 0;
}

async function findCachedAudio(text, voice) {
  try {
    const db = await getMongoDb();
    if (!db) return null;
    const hash = crypto.createHash('sha256').update(`${text}_${voice}`).digest('hex');
    const cached = await db.collection('tts_cache').findOne({ _id: hash });
    if (cached?.r2Url) {
      return {
        audioUrl: cached.r2Url,
        source: 'tts_cache',
      };
    }
  } catch (error) {
    console.warn('resolve-audio cache lookup warning:', error.message);
  }
  return null;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const text = String(body.text || '').trim();
    const voice = body.voice || 'Puck';
    const shouldGenerate = Boolean(body.generate);
    const prefix = body.prefix || 'audio/';

    if (!text) {
      return NextResponse.json({ success: false, error: 'Missing text parameter' }, { status: 400 });
    }

    const textSlug = slugifyAudioText(text);

    if (isR2Configured()) {
      const audioFiles = await listR2Audio(prefix);
      const matches = audioFiles
        .map(file => ({ ...file, score: scoreAudioMatch(file, textSlug) }))
        .filter(file => file.score > 0)
        .sort((left, right) => right.score - left.score || String(left.key).localeCompare(String(right.key)));

      if (matches[0]) {
        return NextResponse.json({
          success: true,
          audioUrl: matches[0].url,
          source: 'r2_existing',
          matchedKey: matches[0].key,
          candidates: matches.slice(0, 5).map(file => ({
            key: file.key,
            url: file.url,
            score: file.score,
            folder: file.folder,
          })),
        });
      }
    }

    const cached = await findCachedAudio(text, voice);
    if (cached) {
      return NextResponse.json({ success: true, ...cached });
    }

    if (!shouldGenerate) {
      return NextResponse.json({
        success: false,
        missing: true,
        source: 'missing',
        error: `No existing R2 audio found for "${text}".`,
      }, { status: 404 });
    }

    const audioUrl = await getOrGenerateR2Audio(text, voice);
    if (!audioUrl) {
      return NextResponse.json({
        success: false,
        error: 'Audio generation failed. Check TTS provider, Gemini API key, billing/quota, and R2 configuration.',
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      audioUrl,
      source: 'generated',
    });
  } catch (error) {
    console.error('resolve-audio error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
