import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { generateQuestionsFromImage } from '@/lib/gemini';

export const runtime = 'nodejs';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ success: false, error: 'No file provided or invalid file format.' }, { status: 400 });
    }

    // Extract parameters from form fields or default them
    const subject = formData.get('subject') || 'general';
    const topic = formData.get('topic') || 'general';
    const skillId = formData.get('skillId') || 'general';
    const difficulty = formData.get('difficulty') || 'easy';
    const countStr = formData.get('count') || '3';
    const count = parseInt(countStr, 10) || 3;
    const customPrompt = formData.get('customPrompt') || '';
    const generationMode = formData.get('generationMode') || 'static';

    const mimeType = file.type || 'image/jpeg';
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Call Gemini utility
    const { questions: rawQuestions, usage } = await generateQuestionsFromImage(buffer, mimeType, {
      subject,
      topic,
      skillId,
      difficulty,
      count,
      customPrompt,
      generationMode
    });

    if (generationMode !== 'static') {
      return NextResponse.json({
        success: true,
        generationMode,
        questions: Array.isArray(rawQuestions) ? rawQuestions : [rawQuestions],
        usage
      });
    }

    if (!Array.isArray(rawQuestions)) {
      throw new Error('Gemini response is not a JSON array.');
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const collection = db.collection(collectionName);

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
        status: 'draft', // Saved as DRAFT
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
      questions: savedQuestions,
      usage
    });
  } catch (error) {
    console.error('Image-to-question endpoint error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
