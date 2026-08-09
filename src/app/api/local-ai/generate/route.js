import { NextResponse } from 'next/server';
import { generateLocalAIContent, generateLocalAIJSON, isOllamaAvailable } from '@/lib/ollama';
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

export async function POST(req) {
  try {
    const { prompt, format = 'json', model = 'qwen2.5-coder:7b', engine = 'ollama' } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // --- ENGINE 1: GEMINI CLOUD AI ---
    if (engine === 'gemini') {
      const ai = getGeminiClient();
      if (!ai) {
        return NextResponse.json({ error: 'Gemini Cloud AI is not configured in .env.local' }, { status: 500 });
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: format === 'json' ? { responseMimeType: 'application/json' } : undefined
      });

      const text = response.text || '';
      if (format === 'json') {
        let cleanJSON = text.trim();
        if (cleanJSON.startsWith('```json')) {
          cleanJSON = cleanJSON.replace(/^```json\s*/, '').replace(/\s*```$/, '');
        } else if (cleanJSON.startsWith('```')) {
          cleanJSON = cleanJSON.replace(/^```\s*/, '').replace(/\s*```$/, '');
        }
        const data = JSON.parse(cleanJSON);
        return NextResponse.json({ success: true, result: data, format: 'json', engine: 'gemini' });
      } else {
        return NextResponse.json({ success: true, result: text, format: 'text', engine: 'gemini' });
      }
    }

    // --- ENGINE 2: LOCAL OLLAMA AI ---
    const available = await isOllamaAvailable();
    if (!available) {
      return NextResponse.json(
        { error: 'Ollama is not running locally. Please start Ollama.app or run `ollama serve`.' },
        { status: 503 }
      );
    }

    if (format === 'json') {
      const data = await generateLocalAIJSON(prompt, model);
      return NextResponse.json({ success: true, result: data, format: 'json', engine: 'ollama' });
    } else {
      const text = await generateLocalAIContent(prompt, model);
      return NextResponse.json({ success: true, result: text, format: 'text', engine: 'ollama' });
    }

  } catch (err) {
    console.error('[API local-ai/generate] Error:', err);
    return NextResponse.json(
      { error: err.message || 'Failed to generate content' },
      { status: 500 }
    );
  }
}
