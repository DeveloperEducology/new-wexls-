import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { generateTtsBuffer } from '@/lib/ttsService';
import { uploadAudioToR2 } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';

export const runtime = 'nodejs';

export async function GET(request) {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ error: 'MongoDB database not connected.' }, { status: 500 });
    }
    const videos = await db.collection('video_generations')
      .find({ status: 'completed' })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    return NextResponse.json({ success: true, videos });
  } catch (err) {
    console.error('[Video List API Error]:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}


export async function POST(request) {
  try {
    const { script, prompt, voice = 'gemini:Puck', aspectRatio = '16:9' } = await request.json();

    if (!script) {
      return NextResponse.json({ error: 'Script is required' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });

    // Step 1: Use Gemini 2.5 to convert script & user prompt into an optimized visual prompt for Veo
    const promptEngineeringPrompt = `
      You are an expert prompt engineer for Google's Veo video generation model.
      We want to create a 3D claymation concept explanation video for preschool kids (5 years old).
      Convert the script and optional prompt guidelines below into a highly detailed visual prompt describing characters, lighting, camera angle, colors, texture (soft claymation), and simple animations.
      
      Script: "${script}"
      ${prompt ? `Guidelines: "${prompt}"` : ''}
      
      Output ONLY the descriptive visual prompt. Do not write any introduction, headers, or markdown blocks.
    `;

    const promptResponse = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: promptEngineeringPrompt }],
    });
    const visualPrompt = promptResponse.text.trim();

    // Step 2: Generate the audio WAV buffer using the existing high-expressive TTS helper
    console.log(`[Video Generator] Synthesizing audio for script using voice: ${voice}`);
    const audioBuffer = await generateTtsBuffer(script, voice);

    // Step 3: Trigger Veo video generation (non-blocking call)
    console.log(`[Video Generator] Initiating video generation via Veo with prompt: ${visualPrompt}`);
    const operation = await ai.models.generateVideos({
      model: 'veo-3.1-generate-preview',
      prompt: visualPrompt,
      config: {
        aspectRatio: aspectRatio,
        resolution: '720p',
      },
    });

    const operationId = operation.name;

    // Step 4: Upload the temporary audio file to Cloudflare R2
    const audioKey = `videos/temp/${operationId}-audio.wav`;
    const audioUrl = await uploadAudioToR2(audioBuffer, audioKey);

    if (!audioUrl) {
      throw new Error('Failed to upload synthesized audio to R2 storage.');
    }

    // Step 5: Save the job tracking record to MongoDB
    const db = await getMongoDb();
    if (db) {
      await db.collection('video_generations').updateOne(
        { _id: operationId },
        {
          $set: {
            script,
            voice,
            aspectRatio,
            visualPrompt,
            audioUrl,
            audioKey,
            status: 'processing',
            createdAt: new Date(),
          }
        },
        { upsert: true }
      );
    } else {
      console.warn('[Video Generator] MongoDB is not configured. Job will be untracked on server.');
    }

    return NextResponse.json({
      success: true,
      operationId,
      visualPrompt,
      audioUrl,
    });
  } catch (err) {
    console.error('[Video Generate API Route Error]:', err);
    return NextResponse.json({ error: err.message || 'Video generation failed to start.' }, { status: 500 });
  }
}
