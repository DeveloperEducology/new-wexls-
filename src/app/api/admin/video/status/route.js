import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { uploadVideoToR2, deleteR2Images } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export const runtime = 'nodejs';

function slugify(value) {
  return String(value || '')
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }

  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  if (!project) return null;

  return new GoogleGenAI({
    enterprise: true,
    project,
    location,
  });
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const operationId = searchParams.get('operationId');

    if (!operationId) {
      return NextResponse.json({ error: 'operationId query param is required.' }, { status: 400 });
    }

    // Connect to database to retrieve job info
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ error: 'MongoDB database not connected.' }, { status: 500 });
    }

    const job = await db.collection('video_generations').findOne({ _id: operationId });
    if (!job) {
      return NextResponse.json({ error: 'Video generation job not found.' }, { status: 404 });
    }

    if (job.status === 'completed') {
      return NextResponse.json({ status: 'completed', url: job.finalVideoR2Url });
    }

    if (job.status === 'failed') {
      return NextResponse.json({ status: 'failed', error: job.error || 'Video generation failed.' });
    }

    // Initialize Gemini client to check operation status
    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Google GenAI client not configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT in your environment.');
    }

    console.log(`[Video Status] Checking status on Google Cloud for job: ${operationId}`);
    let operation = await ai.operations.get({ name: operationId });

    if (!operation.done) {
      return NextResponse.json({ status: 'processing' });
    }

    // Check for API errors in the operation response
    if (operation.error) {
      const errMsg = operation.error.message || 'Error occurred in Vertex AI video rendering.';
      await db.collection('video_generations').updateOne(
        { _id: operationId },
        { $set: { status: 'failed', error: errMsg } }
      );
      return NextResponse.json({ status: 'failed', error: errMsg }, { status: 500 });
    }

    // Video generation succeeded!
    console.log(`[Video Status] Generation complete. Merging audio and video for job: ${operationId}`);
    const generatedVideo = operation.response?.generatedVideos?.[0];
    if (!generatedVideo || !generatedVideo.video?.uri) {
      throw new Error('GCP reported completion but did not return video URI.');
    }

    const videoUri = generatedVideo.video.uri;

    // 1. Download video bytes (silent mp4)
    const videoFetch = await fetch(videoUri);
    if (!videoFetch.ok) throw new Error(`Failed to download video file from Google storage: ${videoFetch.statusText}`);
    const videoBuffer = Buffer.from(await videoFetch.arrayBuffer());

    // 2. Download audio bytes (wav) from R2
    const audioFetch = await fetch(job.audioUrl);
    if (!audioFetch.ok) throw new Error(`Failed to download synthesized audio from R2: ${audioFetch.statusText}`);
    const audioBuffer = Buffer.from(await audioFetch.arrayBuffer());

    // 3. Write temp files to disk
    const timestamp = Date.now();
    const tmpDir = path.join('/tmp');
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }

    const tmpVideo = path.join(tmpDir, `video-${timestamp}.mp4`);
    const tmpAudio = path.join(tmpDir, `audio-${timestamp}.wav`);
    const tmpOut = path.join(tmpDir, `out-${timestamp}.mp4`);

    fs.writeFileSync(tmpVideo, videoBuffer);
    fs.writeFileSync(tmpAudio, audioBuffer);

    // 4. Determine FFmpeg binary location
    let ffmpegCmd = 'ffmpeg';
    if (fs.existsSync('/opt/homebrew/bin/ffmpeg')) {
      ffmpegCmd = '/opt/homebrew/bin/ffmpeg';
    } else if (fs.existsSync('/usr/bin/ffmpeg')) {
      ffmpegCmd = '/usr/bin/ffmpeg';
    }

    console.log(`[Video Status] Executing merge command using FFmpeg: ${ffmpegCmd}`);
    
    // Command copies visual stream directly (-c:v copy) and encodes audio stream to AAC (-c:a aac)
    const command = `${ffmpegCmd} -i "${tmpVideo}" -i "${tmpAudio}" -c:v copy -c:a aac -map 0:v:0 -map 1:a:0 "${tmpOut}" -y`;
    
    try {
      await execPromise(command);
    } catch (ffmpegErr) {
      console.error('[Video Status] FFmpeg execution failed:', ffmpegErr);
      throw new Error(`FFmpeg merge failed: ${ffmpegErr.message}`);
    }

    // 5. Read combined video output
    if (!fs.existsSync(tmpOut)) {
      throw new Error('FFmpeg completed but output file was not created.');
    }
    const finalVideoBuffer = fs.readFileSync(tmpOut);

    // 6. Upload combined video to R2
    const scriptSlug = slugify(job.script.slice(0, 30)) || 'concept-clip';
    const finalKey = `videos/concepts/${timestamp}-${scriptSlug}.mp4`;
    const finalR2Url = await uploadVideoToR2(finalVideoBuffer, finalKey, 'video/mp4');

    if (!finalR2Url) {
      throw new Error('Failed to upload final merged video to R2.');
    }

    // 7. Cleanup temp files on local disk
    try {
      fs.unlinkSync(tmpVideo);
      fs.unlinkSync(tmpAudio);
      if (fs.existsSync(tmpOut)) fs.unlinkSync(tmpOut);
    } catch (cleanupErr) {
      console.warn('[Video Status] Failed to clean up local temp files:', cleanupErr);
    }

    // 8. Delete draft audio file from R2 to save space
    try {
      if (job.audioKey) {
        await deleteR2Images([job.audioKey]);
      }
    } catch (r2CleanupErr) {
      console.warn('[Video Status] Failed to clean up R2 draft audio:', r2CleanupErr);
    }

    // 9. Update MongoDB document with status completed
    await db.collection('video_generations').updateOne(
      { _id: operationId },
      {
        $set: {
          status: 'completed',
          finalVideoR2Url: finalR2Url,
          finalVideoKey: finalKey,
          completedAt: new Date(),
        },
        $unset: {
          audioKey: '',
          audioUrl: ''
        }
      }
    );

    return NextResponse.json({
      status: 'completed',
      url: finalR2Url,
    });
  } catch (err) {
    console.error('[Video Status API Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to complete video processing.' }, { status: 500 });
  }
}
