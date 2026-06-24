import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

function getGeminiClient() {
  if (process.env.GEMINI_API_KEY) {
    return new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  const project = process.env.GOOGLE_CLOUD_PROJECT || process.env.GCLOUD_PROJECT;
  const location = process.env.GOOGLE_CLOUD_LOCATION || process.env.GOOGLE_CLOUD_REGION || 'us-central1';
  if (!project) return null;
  return new GoogleGenAI({ enterprise: true, project, location });
}

function cleanAndParseJSON(text) {
  let cleaned = text.trim();
  // Strip markdown code fences if present
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();
  }
  return JSON.parse(cleaned);
}

export async function POST(request) {
  const ai = getGeminiClient();
  if (!ai) {
    return NextResponse.json(
      { success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.' },
      { status: 500 }
    );
  }

  try {
    const { systemPrompt = '', inputJson = '' } = await request.json();

    if (!systemPrompt.trim()) {
      return NextResponse.json({ success: false, error: 'systemPrompt is required.' }, { status: 400 });
    }

    // Build user message: if inputJson is provided, append it
    let userMessage = systemPrompt.trim();
    if (inputJson.trim()) {
      // Try to parse to validate, but send as-is for Gemini
      try {
        JSON.parse(inputJson);
      } catch {
        return NextResponse.json({ success: false, error: 'inputJson must be valid JSON.' }, { status: 400 });
      }
      userMessage = `${systemPrompt.trim()}\n\nInput JSON:\n${inputJson.trim()}`;
    }

    const model = 'gemini-2.5-flash';
    const response = await ai.models.generateContent({
      model,
      contents: [{ role: 'user', parts: [{ text: userMessage }] }],
      config: { temperature: 0.7 },
    });

    const rawText = response.candidates?.[0]?.content?.parts?.[0]?.text || '';
    if (!rawText) {
      return NextResponse.json({ success: false, error: 'No content returned from Gemini.' }, { status: 500 });
    }

    // Try to parse as JSON; fall back to returning raw text
    let parsedData = null;
    let isJson = false;
    try {
      parsedData = cleanAndParseJSON(rawText);
      isJson = true;
    } catch {
      // Not JSON — return raw text so the UI can display it
      parsedData = rawText;
    }

    return NextResponse.json({
      success: true,
      isJson,
      result: parsedData,
      usage: {
        promptTokens: response.usageMetadata?.promptTokenCount || 0,
        candidatesTokens: response.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata?.totalTokenCount || 0,
      },
    });
  } catch (err) {
    console.error('[generate-custom] error:', err);
    return NextResponse.json({ success: false, error: err.message || 'Internal server error.' }, { status: 500 });
  }
}
