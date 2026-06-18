import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

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
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Google GenAI client not configured. Set GEMINI_API_KEY or GOOGLE_CLOUD_PROJECT in your environment.');
    }

    const systemPrompt = `
      You are an elite educational content creator for preschool kids (5 years old).
      Write a short, engaging 10-second explanation script about the math topic: "${topic}".
      The script MUST be concrete, visual, and use a friendly narrative style (e.g. counting fingers, sharing cookies, parking toy cars).
      Keep it very short (around 2-3 simple sentences) so it takes exactly 10 seconds to speak slowly.
      
      Output ONLY the script text. Do not include quotes, titles, introduction, or formatting.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [{ text: systemPrompt }],
    });

    return NextResponse.json({
      success: true,
      script: response.text.trim(),
    });
  } catch (err) {
    console.error('[AI Script Helper Error]:', err);
    return NextResponse.json({ error: err.message || 'Failed to generate script.' }, { status: 500 });
  }
}
