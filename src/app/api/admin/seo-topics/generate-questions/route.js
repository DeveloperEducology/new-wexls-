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

export async function POST(request) {
  try {
    const { displayName, subject, count = 3 } = await request.json();
    if (!displayName) {
      return NextResponse.json({ error: 'displayName is required' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini client is not configured on this server.' }, { status: 501 });
    }

    const prompt = `
      You are an expert curriculum developer for Jawahar Navodaya Vidyalaya Selection Test (JNVST) Class 6 entrance exams.
      Create exactly ${count} realistic multiple-choice practice questions (MCQ) for the math/arithmetic topic: "${displayName}".
      The questions must be suitable for Class 6 students preparing for a competitive entrance exam.
      
      For each question, return a JSON object with:
      - questionText: clear, friendly question statement. Use LaTeX math markers (e.g. $2+3=5$ or $\\frac{1}{2}$) for formulas.
      - options: an object with keys "A", "B", "C", "D" containing the choices.
      - correctOption: a single character string, either "A", "B", "C", or "D".
      - explanationText: detailed step-by-step solution explaining why the correct choice is right and why other distractors are wrong.
      
      Return ONLY a valid JSON array of these question objects (do not include markdown block syntax or additional text):
      [
        {
          "questionText": "What is the place value of 7 in the number $3,745$?",
          "options": {
            "A": "7",
            "B": "70",
            "C": "700",
            "D": "7000"
          },
          "correctOption": "C",
          "explanationText": "In the number $3,745$, the digit 7 is in the hundreds place. Therefore, its place value is $7 \\\\times 100 = 700$."
        }
      ]
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const textResult = response.text || '';
    const questions = JSON.parse(textResult.trim());

    return NextResponse.json({ questions });
  } catch (err) {
    console.error('[generate-questions] Error:', err);
    return NextResponse.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
