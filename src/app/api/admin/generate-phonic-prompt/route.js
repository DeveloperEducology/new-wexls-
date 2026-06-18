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
    const { word } = body;

    if (!word || typeof word !== 'string' || !word.trim()) {
      return NextResponse.json({ success: false, error: 'Missing or invalid word parameter' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ success: false, error: 'Gemini is not configured. Set GOOGLE_CLOUD_PROJECT or GEMINI_API_KEY.' }, { status: 501 });
    }

    const prompt = `
Generate the phonetic spelling/phoneme breakdown text for the English word "${word.trim()}" to be used in children's phonics pronunciation.

Follow these strict rules:
1. Break the word down into its phonics component sounds separated by three dots "...".
2. Add three dots "..." at the very end of the string.
3. Do NOT include the full word itself at the end (e.g. for "bat", do NOT return "buh... at... bat", return ONLY "buh... at...").
4. Return ONLY the plain text string (e.g. "buh... at..." or "fruh... og...").
5. Do NOT add any introductory words, explanations, code blocks, quote marks, HTML, or periods other than the "..." separations.

Examples:
- bat -> buh... at...
- cat -> cuh... at...
- dog -> duh... og...
- frog -> fruh... og...
- nest -> neh... st...
- drum -> druh... um...
- ship -> shih... p...
- crab -> cruh... ab...
- blue -> bluh... oo...

Word to break down: "${word.trim()}"
`;

    const modelName = normalizeVertexModelName(process.env.GEMINI_TEXT_MODEL || 'gemini-2.5-flash');
    let response;
    try {
      response = await ai.models.generateContent({
        model: modelName,
        contents: prompt
      });
    } catch (e) {
      console.warn('[generate-phonic-prompt] primary model failed, falling back to gemini-2.5-flash-lite:', e);
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-lite',
        contents: prompt
      });
    }

    const phonicPrompt = (response.text || '').trim().replace(/['"`]/g, '');

    return NextResponse.json({
      success: true,
      phonicPrompt
    });
  } catch (error) {
    console.error('Phonic prompt generation error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
