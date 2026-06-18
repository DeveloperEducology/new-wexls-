import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const { topic } = await request.json();

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required.' }, { status: 400 });
    }

    const apiKey = process.env.GEMINI_API_KEY || '';
    const ai = new GoogleGenAI({ apiKey });

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
