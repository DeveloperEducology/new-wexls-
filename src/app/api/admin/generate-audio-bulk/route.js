import { NextResponse } from 'next/server';
import { getMongoDb } from '@/lib/db/mongo';
import { getOrGenerateR2Audio } from '../questions/route';

export async function POST() {
  try {
    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const collection = db.collection(collectionName);

    // Query for questions that have no audioUrl, are null, or are empty strings
    const missingAudioQuery = {
      $or: [
        { audioUrl: { $exists: false } },
        { audioUrl: null },
        { audioUrl: '' }
      ]
    };

    // Count how many questions are currently missing audio
    const totalMissingBefore = await collection.countDocuments(missingAudioQuery);

    if (totalMissingBefore === 0) {
      return NextResponse.json({
        success: true,
        processedCount: 0,
        remainingCount: 0,
        message: 'All questions already have audio generated!'
      });
    }

    // Retrieve a batch of 15 questions to process
    const batchSize = 15;
    const questionsToProcess = await collection.find(missingAudioQuery).limit(batchSize).toArray();

    let processedCount = 0;

    for (const q of questionsToProcess) {
      const voice = q.voice || 'Puck';
      let updated = false;

      // 1. Generate audio for question text
      if (q.questionText) {
        const audioUrl = await getOrGenerateR2Audio(q.questionText, voice);
        if (audioUrl) {
          q.audioUrl = audioUrl;
          updated = true;
        }
      }

      // 2. Generate audio for MCQ options
      const isMcq = q.type === 'mcq' || q.type === 'multiplechoice' || q.type === 'multipleChoice';
      if (isMcq && Array.isArray(q.options)) {
        const updatedOptions = [];
        for (let i = 0; i < q.options.length; i++) {
          const option = q.options[i];
          let optionText = '';
          let optionObj = {};

          if (typeof option === 'string' || typeof option === 'number') {
            optionText = String(option);
            optionObj = { label: optionText };
          } else if (option && typeof option === 'object') {
            optionText = option.label || option.text || option.value || option.content || '';
            optionObj = { ...option };
          }

          if (optionText) {
            const optionAudioUrl = await getOrGenerateR2Audio(optionText, voice);
            if (optionAudioUrl) {
              optionObj.audioUrl = optionAudioUrl;
              updated = true;
            }
          }
          updatedOptions.push(optionObj);
        }
        q.options = updatedOptions;
      }

      // 3. Save back to MongoDB if we generated audio
      if (updated) {
        q.updatedAt = new Date();
        await collection.updateOne(
          { id: q.id },
          { 
            $set: { 
              audioUrl: q.audioUrl || null,
              options: q.options || [],
              updatedAt: q.updatedAt
            } 
          }
        );
        processedCount++;
      }
    }

    // Check count after batch run
    const remainingCount = await collection.countDocuments(missingAudioQuery);

    return NextResponse.json({
      success: true,
      processedCount,
      remainingCount,
      message: `Successfully generated audio for ${processedCount} questions.`
    });

  } catch (error) {
    console.error('Bulk generate audio error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
