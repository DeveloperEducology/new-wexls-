import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || '',
});

export async function POST(request) {
  try {
    const { prompt, subject, topic, skillId, difficulty, count } = await request.json();

    if (!prompt || !subject || !topic || !skillId || !difficulty || !count) {
      return NextResponse.json({ success: false, error: 'Missing required parameters.' }, { status: 400 });
    }

    if (!process.env.GEMINI_API_KEY) {
      return NextResponse.json({ success: false, error: 'Gemini API Key is not configured.' }, { status: 500 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const collection = db.collection(collectionName);

    const generationPrompt = `
You are a curriculum content generator.
Generate exactly ${count} multiple choice questions (MCQ) or fill-in-the-blank (FIB) questions based on this instruction/template:
"${prompt}"

Details to use:
- Subject: ${subject}
- Topic: ${topic}
- Skill ID / Logic Type: ${skillId}
- Difficulty: ${difficulty}

For each question, return a JSON object matching this schema. Since this will be saved in MongoDB, ensure it fits this structure exactly:
{
  "id": "${subject}_${topic}_${skillId}_ai_<unique_random_number>",
  "type": "mcq", // or "fillInTheBlank"
  "questionText": "Question prompt here",
  "voice": "Puck",
  "generateAudio": "all",
  "explanation": "Optional detailed explanation for the student",
  "options": [
    { "id": "opt_0", "label": "Option A text", "isCorrect": false },
    { "id": "opt_1", "label": "Option B text", "isCorrect": true }
  ],
  "parts": [
    { "type": "text", "content": "Question prompt here" }
  ],
  "correctAnswerIndex": 1, // index of option with isCorrect: true
  "answer": 1
}

Notes:
1. "parts" must contain at least one text part matching "questionText". You can also add image parts if requested or applicable.
2. Return ONLY a valid JSON array of these generated objects. Do NOT include markdown code block syntax like \`\`\`json.

Return:
[
  ...
]
`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: generationPrompt,
      config: {
        responseMimeType: 'application/json',
      }
    });

    const text = response.text || '';
    const rawQuestions = JSON.parse(text.trim());

    if (!Array.isArray(rawQuestions)) {
      throw new Error('Gemini response is not a JSON array.');
    }

    const savedQuestions = [];
    const now = new Date();

    for (let i = 0; i < rawQuestions.length; i++) {
      const q = rawQuestions[i];
      const docId = q.id && !q.id.includes('<') ? q.id : `${subject}_${topic}_${skillId}_ai_${Date.now()}_${i}`;

      const { createdAt: _createdAt, ...questionDocWithoutCreatedAt } = {
        ...q,
        id: docId,
        subject,
        topic,
        skillId,
        microSkillId: skillId,
        difficulty,
        status: 'draft', // Saved as DRAFT (isActive: false / invisible to students)
        importedAt: now,
        createdAt: now,
        updatedAt: now,
        metadata: {
          subject,
          topic,
          skillId,
          difficulty,
          explanation: q.explanation || '',
          templateId: 'questionBank.imported',
          engine: 'questionBank',
        }
      };

      const questionDoc = { ...questionDocWithoutCreatedAt, createdAt: now };

      await collection.updateOne(
        { id: questionDoc.id },
        {
          $set: questionDocWithoutCreatedAt,
          $setOnInsert: { createdAt: now },
        },
        { upsert: true }
      );

      savedQuestions.push(questionDoc);
    }

    return NextResponse.json({
      success: true,
      questions: savedQuestions
    });
  } catch (error) {
    console.error('AI question generation endpoint error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
