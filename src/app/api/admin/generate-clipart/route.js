import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { uploadImageToR2, isR2Configured } from '@/lib/r2Service';
import { getMongoDb } from '@/lib/db/mongo';
import fs from 'fs';
import path from 'path';

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

export async function POST(request) {
  try {
    const body = await request.json();
    const { action, prompt, base64Image, name, category, quality } = body;

    if (action === 'generate') {
      if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
        return NextResponse.json({ success: false, error: 'Missing prompt parameter' }, { status: 400 });
      }

      const ai = getGeminiClient();
      if (!ai) {
        return NextResponse.json({ success: false, error: 'Vertex AI/Gemini is not configured.' }, { status: 501 });
      }

      console.log(`[generate-clipart] Generating image (Quality: ${quality || 'standard'}) for prompt: "${prompt}"`);
      
      // Determine model priorities based on chosen quality
      let modelsToTry = [];
      if (quality === 'low') {
        modelsToTry = [
          'imagen-3.0-fast-generate-001',
          'imagen-4.0-generate-001',
          'imagegeneration@005'
        ];
      } else if (quality === 'ultra') {
        modelsToTry = [
          'imagen-4.0-generate-001',
          'imagen-3.0-generate-002',
          'imagegeneration@006'
        ];
      } else {
        // Standard quality (Default)
        modelsToTry = [
          'imagen-4.0-generate-001',
          'imagen-3.0-generate-002',
          'imagen-3.0-generate-001',
          'imagen-3.0-fast-generate-001',
          'imagegeneration@006'
        ];
      }

      let response = null;
      let lastError = null;

      for (const modelName of modelsToTry) {
        try {
          console.log(`[generate-clipart] Attempting generation using model: "${modelName}"`);
          response = await ai.models.generateImages({
            model: modelName,
            prompt: prompt,
            config: {
              numberOfImages: 1,
              outputMimeType: 'image/png',
              aspectRatio: '1:1',
              personGeneration: 'ALLOW_ADULT',
            },
          });
          if (response?.generatedImages?.[0]?.image?.imageBytes) {
            console.log(`[generate-clipart] Image generation SUCCESS with model: "${modelName}"`);
            break;
          }
        } catch (err) {
          console.warn(`[generate-clipart] Model "${modelName}" failed:`, err.message || err);
          lastError = err;
        }
      }

      if (!response?.generatedImages?.[0]?.image?.imageBytes) {
        const errMsg = lastError?.message || 'No image bytes returned from any model.';
        return NextResponse.json({ success: false, error: `All image models failed. Last error: ${errMsg}` }, { status: 500 });
      }

      const base64Data = response.generatedImages[0].image.imageBytes;
      return NextResponse.json({ success: true, base64Image: base64Data });
    }

    if (action === 'save') {
      if (!base64Image) {
        return NextResponse.json({ success: false, error: 'Missing base64Image parameter' }, { status: 400 });
      }

      const buffer = Buffer.from(base64Image, 'base64');
      const safeName = (name || 'clipart').trim().toLowerCase().replace(/[^a-z0-9_-]/g, '_');
      const filename = `${Date.now()}-${safeName}.png`;
      const folder = 'clipart';
      const key = `${folder}/${filename}`;

      let url = '';
      if (isR2Configured()) {
        url = await uploadImageToR2(buffer, key, 'image/png');
      } else {
        const publicDir = path.join(process.cwd(), 'public', 'uploads', folder);
        if (!fs.existsSync(publicDir)) {
          fs.mkdirSync(publicDir, { recursive: true });
        }
        const filePath = path.join(publicDir, filename);
        fs.writeFileSync(filePath, buffer);
        url = `/uploads/${folder}/${filename}`;
      }

      if (!url) {
        return NextResponse.json({ success: false, error: 'Failed to upload/save image' }, { status: 500 });
      }

      // Sync image metadata with MongoDB database
      let dbRecord = null;
      try {
        const db = await getMongoDb();
        if (db) {
          dbRecord = {
            name: name || 'Generated Clipart',
            url: url,
            folder: folder,
            key: key,
            dimensions: {
              width: 512,
              height: 512,
              aspectRatio: 1.0
            },
            linguistics: {
              singular: safeName.replace(/_/g, ' '),
              plural: `${safeName.replace(/_/g, ' ')}s`,
              article: 'a'
            },
            classification: {
              category: category || 'general',
              tags: ['clipart', 'imagen-generated', 'vector']
            },
            metadata: {
              createdAt: new Date(),
              sourceUrl: 'imagen-prompt-builder',
              prompt: prompt
            }
          };

          await db.collection('image_assets').updateOne(
            { key: key },
            { $set: dbRecord },
            { upsert: true }
          );
        }
      } catch (dbErr) {
        console.error('[generate-clipart] MongoDB update failed:', dbErr);
      }

      return NextResponse.json({ success: true, url, asset: dbRecord });
    }

    return NextResponse.json({ success: false, error: 'Invalid action parameter' }, { status: 400 });

  } catch (err) {
    console.error('[generate-clipart] Error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Image generation failed.' }, { status: 500 });
  }
}
