import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/db/mongo';
import { generateTtsBuffer } from '@/lib/ttsService';
import { uploadAudioToR2, isR2Configured } from '@/lib/r2Service';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const text = searchParams.get('text');
  const voice = searchParams.get('voice') || 'Puck';

  if (!text) {
    return NextResponse.json({ error: 'Missing text parameter' }, { status: 400 });
  }

  // 1. Generate hash for caching
  const cacheKey = crypto.createHash('sha256').update(`${text}_${voice}`).digest('hex');
  const r2Key = `audio/tts/${voice}/${cacheKey}.wav`;

  // 2. Check MongoDB cache
  try {
    const db = await getMongoDb();
    if (db) {
      const cached = await db.collection('tts_cache').findOne({ _id: cacheKey });
      if (cached) {
        // If we have an R2 URL already, redirect to it directly (CDN caches this)
        if (cached.r2Url) {
          return NextResponse.redirect(cached.r2Url);
        }
        
        // If we have base64 in cache, but no r2Url, upload to R2 and update cache
        if (cached.audioBase64) {
          if (isR2Configured()) {
            try {
              const buffer = Buffer.from(cached.audioBase64, 'base64');
              const r2Url = await uploadAudioToR2(buffer, r2Key);
              if (r2Url) {
                await db.collection('tts_cache').updateOne(
                  { _id: cacheKey },
                  { $set: { r2Url } }
                );
                return NextResponse.redirect(r2Url);
              }
            } catch (uploadErr) {
              console.warn('Lazy R2 upload failed in background:', uploadErr);
            }
          }
          
          // Fallback to database streaming if R2 isn't configured/available
          const audioBuffer = Buffer.from(cached.audioBase64, 'base64');
          return new Response(audioBuffer, {
            headers: {
              'Content-Type': 'audio/wav',
              'Content-Length': audioBuffer.length.toString(),
              'Cache-Control': 'public, max-age=31536000, immutable',
            },
          });
        }
      }
    }
  } catch (dbError) {
    console.warn('MongoDB cache lookup failed:', dbError);
  }

  // 3. Call Gemini via ttsService
  try {
    const wavBuffer = await generateTtsBuffer(text, voice);
    let r2Url = null;

    if (isR2Configured()) {
      try {
        r2Url = await uploadAudioToR2(wavBuffer, r2Key);
      } catch (uploadError) {
        console.error('R2 upload failed during TTS generation:', uploadError);
      }
    }

    // Save to MongoDB cache
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('tts_cache').updateOne(
          { _id: cacheKey },
          {
            $set: {
              text,
              voice,
              audioBase64: wavBuffer.toString('base64'),
              r2Url,
              createdAt: new Date(),
            }
          },
          { upsert: true }
        );
      }
    } catch (dbError) {
      console.warn('Failed to access MongoDB for cache save:', dbError);
    }

    if (r2Url) {
      return NextResponse.redirect(r2Url);
    }

    return new Response(wavBuffer, {
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': wavBuffer.length.toString(),
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    });
  } catch (error) {
    console.error('TTS API exception:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
