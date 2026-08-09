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
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No PDF file provided.' }, { status: 400 });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return NextResponse.json({ error: 'Gemini AI client not configured.' }, { status: 500 });
    }

    // Convert PDF file buffer to base64
    const arrayBuffer = await file.arrayBuffer();
    const base64Pdf = Buffer.from(arrayBuffer).toString('base64');

    const prompt = `
      Analyze this uploaded educational PDF document or worksheet.
      Extract curriculum details, questions, grade appropriateness, and learning goals.
      Return a clean JSON object matching this exact schema (do not include markdown syntax):
      {
        "grade": "lkg" | "ukg" | "prek" | "grade-1" | "grade-2" | "grade-6",
        "subject": "math" | "english" | "physics" | "science",
        "topic": "a concise topic slug (e.g. addition-basics or phonics)",
        "skill": "a skill target identifier",
        "learningGoal": "Main learning objective derived from this PDF",
        "questionStyle": "Multiple Choice" | "Fill-in-the-blank" | "Short Answer" | "Word Problems" | "Tracing & Matching",
        "difficulty": "Easy" | "Medium" | "Hard",
        "theme": "Extracted or inferred theme",
        "teacherInstructions": "Extracted instructions or guidelines",
        "extraInstructions": "Detailed question instructions and context derived from the PDF to generate 5 high quality matching questions"
      }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: [
        {
          inlineData: {
            mimeType: 'application/pdf',
            data: base64Pdf
          }
        },
        prompt
      ],
      config: {
        responseMimeType: 'application/json',
      },
    });

    const extracted = JSON.parse(response.text.trim());
    return NextResponse.json({ success: true, extracted });

  } catch (err) {
    console.error('[upload-pdf] Error:', err);
    return NextResponse.json({ error: err.message || 'Failed to analyze uploaded PDF.' }, { status: 500 });
  }
}
