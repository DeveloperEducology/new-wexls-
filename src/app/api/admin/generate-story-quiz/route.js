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
    const body = await request.json();
    const { storyText, title } = body;

    if (!storyText || typeof storyText !== 'string' || !storyText.trim()) {
      return NextResponse.json({ success: false, error: 'Missing storyText parameter' }, { status: 400 });
    }

    const ai = getGeminiClient();
    let quiz = [];

    if (ai) {
      const prompt = `
Generate 2 child-friendly multiple choice comprehension questions for the story "${title || 'Story'}".
Story Text:
"${storyText.trim()}"

Rules:
1. Return ONLY a valid JSON array of 2 question objects.
2. Each object must have:
   - "question": string question text
   - "options": array of exactly 3 string options
   - "correctIndex": number (0, 1, or 2 indicating correct option)
3. Do NOT include markdown code fences or explanations. Return ONLY the raw JSON array.

Example output:
[
  {
    "question": "What was Kabir doing near the kitchen table?",
    "options": ["Watching mother prepare hot chai", "Playing with toys", "Sleeping on a chair"],
    "correctIndex": 0
  },
  {
    "question": "What did Kabir notice curling up from the saucepan?",
    "options": ["Cold water", "White steam", "Green smoke"],
    "correctIndex": 1
  }
]
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response?.text ? response.text.trim() : "";
      const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
      quiz = JSON.parse(cleaned);
    }

    if (!Array.isArray(quiz) || quiz.length === 0) {
      quiz = [
        {
          question: `What was the main topic of ${title || 'the story'}?`,
          options: ["Learning with curiosity", "Playing in the mud", "Eating ice cream"],
          correctIndex: 0
        }
      ];
    }

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error('Generate story quiz error:', error);
    return NextResponse.json({
      success: true,
      quiz: [
        {
          question: "What did you learn from this story?",
          options: ["Science helps explain nature", "Rainy days are boring", "Chai is cold"],
          correctIndex: 0
        }
      ]
    });
  }
}
