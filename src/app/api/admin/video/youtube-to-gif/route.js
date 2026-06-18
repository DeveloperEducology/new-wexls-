import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import fs from 'fs';
import path from 'path';
import { uploadImageToR2, isR2Configured } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';
import { getImageDimensions } from '@/lib/gemini';

const execPromise = util.promisify(exec);

export const runtime = 'nodejs';

function timeToSeconds(timeStr) {
  if (!timeStr) return 0;
  if (/^\d+(\.\d+)?$/.test(timeStr)) {
    return parseFloat(timeStr);
  }
  const parts = timeStr.split(':').map(Number);
  if (parts.some(isNaN)) return 0;
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  } else if (parts.length === 2) {
    return parts[0] * 60 + parts[1];
  }
  return 0;
}

function secondsToTime(secs) {
  const h = Math.floor(secs / 3600).toString().padStart(2, '0');
  const m = Math.floor((secs % 3600) / 60).toString().padStart(2, '0');
  const s = Math.floor(secs % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export async function POST(request) {
  if (!isR2Configured()) {
    return NextResponse.json(
      { error: 'R2 storage is not configured on this server.' },
      { status: 503 }
    );
  }

  const tmpFiles = [];

  try {
    const { youtubeUrl, startTime, duration = 3, name } = await request.json();

    if (!youtubeUrl) {
      return NextResponse.json({ error: 'YouTube URL is required.' }, { status: 400 });
    }

    const startSec = timeToSeconds(startTime);
    const dur = Math.min(10, Math.max(1, parseFloat(duration) || 3));
    const endSec = startSec + dur;

    const formattedStart = secondsToTime(startSec);
    const formattedEnd = secondsToTime(endSec);

    const pythonPath = fs.existsSync('/opt/homebrew/bin/python3') ? '/opt/homebrew/bin/python3' : 'python3';
    const ffmpegPath = fs.existsSync('/opt/homebrew/bin/ffmpeg') ? '/opt/homebrew/bin/ffmpeg' : 'ffmpeg';

    // Step 1: Extract Video Title using yt-dlp
    console.log(`[YouTube GIF] Fetching video title for: ${youtubeUrl}`);
    let videoTitle = 'youtube-sticker';
    try {
      const titleCmd = `"${pythonPath}" -m yt_dlp --remote-components ejs:github --js-runtimes node --get-title "${youtubeUrl}"`;
      const { stdout } = await execPromise(titleCmd);
      if (stdout.trim()) {
        videoTitle = stdout.trim();
      }
    } catch (err) {
      console.warn('[YouTube GIF] Failed to retrieve video title:', err.message);
    }

    // Sanitize title for filename
    const safeName = (name || videoTitle)
      .replace(/[^a-zA-Z0-9_-]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 80)
      .toLowerCase() || 'sticker';

    const timestamp = Date.now();
    const tmpVideo = path.join('/tmp', `yt-extract-${timestamp}.mp4`);
    const tmpGif = path.join('/tmp', `yt-extract-${timestamp}.gif`);
    
    tmpFiles.push(tmpVideo, tmpGif);

    // Step 2: Download the specific section using yt-dlp
    console.log(`[YouTube GIF] Downloading clip from ${formattedStart} to ${formattedEnd}...`);
    const ytdlpCmd = `"${pythonPath}" -m yt_dlp --remote-components ejs:github --js-runtimes node -f "mp4" --download-sections "*${formattedStart}-${formattedEnd}" "${youtubeUrl}" -o "${tmpVideo}"`;
    await execPromise(ytdlpCmd);

    if (!fs.existsSync(tmpVideo) || fs.statSync(tmpVideo).size === 0) {
      throw new Error('Video segment download failed or output file is empty.');
    }

    // Step 3: Convert the segment to a looping GIF via ffmpeg palette generation
    console.log(`[YouTube GIF] Converting to high-quality GIF...`);
    const ffmpegCmd = `"${ffmpegPath}" -i "${tmpVideo}" -vf "fps=15,scale=300:-1:flags=lanczos,split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse" -loop 0 "${tmpGif}" -y`;
    await execPromise(ffmpegCmd);

    if (!fs.existsSync(tmpGif) || fs.statSync(tmpGif).size === 0) {
      throw new Error('GIF generation failed or output file is empty.');
    }

    const gifBuffer = fs.readFileSync(tmpGif);

    // Step 4: Get dimensions from native parser
    const dimensions = getImageDimensions(gifBuffer);

    // Step 5: Upload the GIF to Cloudflare R2
    const folder = 'images/stickers';
    const r2Key = `${folder}/${timestamp}-${safeName}.gif`;
    
    console.log(`[YouTube GIF] Uploading to R2: ${r2Key}`);
    const url = await uploadImageToR2(gifBuffer, r2Key, 'image/gif');

    if (!url) {
      throw new Error('Failed to upload GIF to Cloudflare R2.');
    }

    // Step 6: Index sticker in MongoDB image_assets collection
    let assetId = null;
    try {
      const db = await getMongoDb();
      if (db) {
        const doc = {
          name: safeName,
          url: url,
          key: r2Key,
          folder: folder,
          dimensions: {
            width: dimensions.width,
            height: dimensions.height,
            aspectRatio: parseFloat((dimensions.width / dimensions.height).toFixed(3))
          },
          linguistics: {
            singular: 'sticker',
            plural: 'stickers',
            article: 'a'
          },
          classification: {
            category: 'stickers',
            tags: ['youtube-extracted', 'animated-sticker']
          },
          metadata: {
            createdAt: new Date(),
            sourceUrl: youtubeUrl,
            startTime: formattedStart,
            duration: dur
          }
        };

        const result = await db.collection('image_assets').updateOne(
          { key: r2Key },
          { $set: doc },
          { upsert: true }
        );
        assetId = result.upsertedId || null;
      }
    } catch (dbErr) {
      console.error('[YouTube GIF] MongoDB update failed:', dbErr);
    }

    // Clean up temp files
    for (const f of tmpFiles) {
      if (fs.existsSync(f)) {
        fs.unlinkSync(f);
      }
    }

    return NextResponse.json({
      success: true,
      url,
      key: r2Key,
      name: safeName,
      dimensions,
      sizeBytes: gifBuffer.length,
      assetId
    });

  } catch (err) {
    console.error('[YouTube GIF Route Error]:', err);

    // Clean up temp files on failure
    for (const f of tmpFiles) {
      if (fs.existsSync(f)) {
        try {
          fs.unlinkSync(f);
        } catch (_) {}
      }
    }

    return NextResponse.json(
      { error: err.message || 'YouTube segment extraction and GIF conversion failed.' },
      { status: 500 }
    );
  }
}
