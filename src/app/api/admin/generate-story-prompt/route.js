import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

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

function normalizeVertexModelName(modelName) {
  const model = String(modelName || '').trim();
  if (model === 'gemini-2.0-flash' || model === 'gemini-2.0-flash-001') return 'gemini-2.5-flash';
  return model || 'gemini-2.5-flash';
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { storyText } = body;

    if (!storyText || typeof storyText !== 'string' || !storyText.trim()) {
      return NextResponse.json({ success: false, error: 'Missing storyText parameter' }, { status: 400 });
    }

    const ai = getGeminiClient();
    let imagePrompt = "";

    if (ai) {
      const prompt = `
You are an expert children's storybook illustrator and art director.
Generate a vivid, detailed AI image prompt (suited for Midjourney v6, Flux, or DALL-E 3) for a children's storybook page based on this text:
"${storyText.trim()}"

Rules:
1. Describe the scene in a cute, vibrant, 3D Pixar-style or Disney-storybook art style.
2. Specify character expressions, bright harmonious pastel colors, soft lighting, and background details.
3. Keep the prompt under 60 words.
4. Output ONLY the raw image prompt text. Do NOT include markdown tags or introductory words.
`;

      const response = await ai.models.generateContent({
        model: normalizeVertexModelName('gemini-2.5-flash'),
        contents: prompt,
      });

      imagePrompt = response?.text ? response.text.trim() : "";
    }

    if (!imagePrompt) {
      imagePrompt = `Vibrant 3D Pixar style children's storybook illustration of: ${storyText.trim()}. Bright colors, cute friendly character expressions, soft studio lighting, ultra detailed, 8k.`;
    }

    return NextResponse.json({
      success: true,
      imagePrompt
    });
  } catch (error) {
    console.error('Generate story prompt error:', error);
    return NextResponse.json({
      success: true,
      imagePrompt: `Vibrant 3D Pixar style children's storybook illustration of the scene. Bright colors, cute friendly character expressions, soft studio lighting, 8k.`
    });
  }
}
