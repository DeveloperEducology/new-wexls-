import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { getMongoDb } from '@/lib/db/mongo';
import { generateTtsBuffer } from '@/lib/ttsService';
import { uploadAudioToR2, isR2Configured } from '@/lib/r2Service';
import { saveStoredPracticeQuestion } from '@/lib/practice/questionBank/questionRepository';

/**
 * Gets cached R2 URL or generates a new audio buffer via Gemini and uploads to Cloudflare R2.
 * Falls back gracefully to returning null if anything fails or R2 is not configured.
 */
export async function getOrGenerateR2Audio(text, voice) {
  if (!text) return null;
  const hash = crypto.createHash('sha256').update(`${text}_${voice}`).digest('hex');
  const cleanVoiceForPath = voice.replace(':', '_');
  const key = `audio/tts/${cleanVoiceForPath}/${hash}.wav`;

  try {
    const db = await getMongoDb();
    if (db) {
      // 1. Check if we already have it in the cache
      const cached = await db.collection('tts_cache').findOne({ _id: hash });
      if (cached) {
        if (cached.r2Url) {
          return cached.r2Url;
        }
        // If we have base64 in cache, but no r2Url, upload it to R2
        if (cached.audioBase64 && isR2Configured()) {
          const buffer = Buffer.from(cached.audioBase64, 'base64');
          const r2Url = await uploadAudioToR2(buffer, key);
          if (r2Url) {
            await db.collection('tts_cache').updateOne(
              { _id: hash },
              { $set: { r2Url } }
            );
            return r2Url;
          }
        }
        // Return local API streaming fallback if R2 is not active
        return `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
      }
    }
  } catch (error) {
    console.warn('Cache lookup/upload warning:', error.message);
  }

  // 2. Not in cache or not uploaded yet. Generate new audio
  try {
    const buffer = await generateTtsBuffer(text, voice);
    let r2Url = null;

    if (isR2Configured()) {
      r2Url = await uploadAudioToR2(buffer, key);
    }

    // Save to mongo cache
    try {
      const db = await getMongoDb();
      if (db) {
        await db.collection('tts_cache').updateOne(
          { _id: hash },
          {
            $set: {
              text,
              voice,
              audioBase64: buffer.toString('base64'),
              r2Url,
              createdAt: new Date(),
            }
          },
          { upsert: true }
        );
      }
    } catch (dbError) {
      console.warn('Failed to save generated audio to cache:', dbError);
    }

    if (r2Url) {
      return r2Url;
    }
    // Return local API streaming fallback if R2 is not active
    return `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
  } catch (err) {
    console.error(`Audio generation/upload error for text "${text}":`, err);
    return null;
  }
}

// GET: List, filter, and search questions
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';
    const subject = searchParams.get('subject') || '';
    const topic = searchParams.get('topic') || '';
    const skillId = searchParams.get('skillId') || '';
    const type = searchParams.get('type') || '';
    const difficulty = searchParams.get('difficulty') || '';
    
    // Competitive exam parameters
    const examId = searchParams.get('examId') || '';
    const section = searchParams.get('section') || '';
    const status = searchParams.get('status') || '';
    const isPYQ = searchParams.get('isPYQ');
    
    // Pagination parameters
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const skip = (page - 1) * limit;

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const collection = db.collection(collectionName);

    const audioStatus = searchParams.get('audioStatus') || '';
    
    // Build filter query
    const filter = {};

    if (subject) filter.subject = subject;
    if (topic) filter.topic = topic;
    if (skillId) filter.skillId = skillId;
    if (type) filter.type = type;
    
    // JNVST / competitive filters
    if (examId) filter.examId = examId;
    if (section) filter.section = section;
    if (status) {
      filter.status = status;
    } else if (examId) {
      filter.status = 'active'; // Default to active for exam prep views
    }
    
    if (isPYQ === 'true') filter.isPYQ = true;
    if (isPYQ === 'false') filter.isPYQ = false;

    if (difficulty) {
      const val = String(difficulty).toLowerCase();
      const equivalents = [val];
      if (val === 'easy' || val === 'beginner') {
        equivalents.push('easy', 'beginner');
      } else if (val === 'medium' || val === 'intermediate') {
        equivalents.push('medium', 'intermediate');
      } else if (val === 'hard' || val === 'advanced') {
        equivalents.push('hard', 'advanced');
      }
      filter.difficulty = { $in: equivalents };
    }

    if (audioStatus === 'withAudio') {
      filter.audioUrl = { $exists: true, $ne: null, $ne: '' };
    } else if (audioStatus === 'missingAudio') {
      filter.$or = [
        { audioUrl: { $exists: false } },
        { audioUrl: null },
        { audioUrl: '' }
      ];
    }

    if (search) {
      filter.$or = [
        { id: { $regex: search, $options: 'i' } },
        { questionText: { $regex: search, $options: 'i' } },
        { 'options.label': { $regex: search, $options: 'i' } }
      ];
    }

    const totalQuestions = await collection.countDocuments(filter);
    const questions = await collection
      .find(filter)
      .sort({ updatedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    return NextResponse.json({
      success: true,
      questions,
      pagination: {
        total: totalQuestions,
        page,
        limit,
        pages: Math.ceil(totalQuestions / limit)
      }
    });
  } catch (error) {
    console.error('List questions API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST: Save or update question (with dynamic R2 upload)
export async function POST(request) {
  try {
    const body = await request.json();
    const payload = body?.question || body;

    // Check if it's a competitive exam question (like JNVST)
    if (payload.examId) {
      const db = await getMongoDb();
      if (!db) {
        return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
      }
      const collectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
      const collection = db.collection(collectionName);
      
      const doc = {
        examId: payload.examId,
        section: payload.section,
        topic: payload.topic || '',
        difficulty: Number(payload.difficulty) || 0.5,
        questionText: payload.questionText,
        options: payload.options,
        correctOption: payload.correctOption,
        explanationText: payload.explanationText || '',
        isPYQ: Boolean(payload.isPYQ),
        pyqYear: payload.pyqYear ? Number(payload.pyqYear) : null,
        tags: payload.tags || [],
        status: payload.status || 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const result = await collection.insertOne(doc);
      return NextResponse.json({ success: true, id: String(result.insertedId) });
    }

    const mode = body?.mode === 'insert' ? 'insert' : 'upsert';

    // Validate fields
    if (!payload.subject || !payload.topic || !payload.skillId || !payload.type) {
      return NextResponse.json({ success: false, error: 'Missing required question fields (subject, topic, skillId, type)' }, { status: 400 });
    }

    const voice = payload.voice || 'Puck';
    const generateAudioMode = payload.generateAudio; // 'all', 'questionOnly', 'none', true, or false
    const shouldGenerateQuestionAudio = generateAudioMode === 'all' || generateAudioMode === 'questionOnly' || generateAudioMode === true || generateAudioMode === undefined;
    const shouldGenerateOptionsAudio = generateAudioMode === 'all' || generateAudioMode === true || generateAudioMode === undefined;

    if (shouldGenerateQuestionAudio) {
      // 1. Process question text audio
      if (payload.questionText && !payload.audioUrl) {
        const audioUrl = await getOrGenerateR2Audio(payload.questionText, voice);
        if (audioUrl) {
          payload.audioUrl = audioUrl;
        }
      }
    }

    if (shouldGenerateOptionsAudio) {
      // 2. Process options audio (if MCQ or dynamic_pool)
      if (payload.type === 'dynamic_pool' && payload.pools) {
        const correctPool = payload.pools.correctPool || [];
        const distractorPool = payload.pools.distractorPool || [];

        for (let i = 0; i < correctPool.length; i++) {
          const item = correctPool[i];
          if (item.label && !item.audioUrl) {
            const optionAudioUrl = await getOrGenerateR2Audio(item.label, voice);
            if (optionAudioUrl) {
              item.audioUrl = optionAudioUrl;
            }
          }
        }

        for (let i = 0; i < distractorPool.length; i++) {
          const item = distractorPool[i];
          if (item.label && !item.audioUrl) {
            const optionAudioUrl = await getOrGenerateR2Audio(item.label, voice);
            if (optionAudioUrl) {
              item.audioUrl = optionAudioUrl;
            }
          }
        }
      } else if ((payload.type === 'mcq' || payload.type === 'multiplechoice' || payload.type === 'multipleChoice' || payload.type === 'dynamic_pool') && Array.isArray(payload.options)) {
        const optionsWithAudio = [];
        for (let i = 0; i < payload.options.length; i++) {
          const option = payload.options[i];
          let optionText = '';
          let optionObj = {};

          if (typeof option === 'string' || typeof option === 'number') {
            optionText = String(option);
            optionObj = { label: optionText };
          } else if (option && typeof option === 'object') {
            optionText = option.label || option.text || option.value || option.content || '';
            optionObj = { ...option };
          }

          if (optionText && !optionObj.audioUrl) {
            const optionAudioUrl = await getOrGenerateR2Audio(optionText, voice);
            if (optionAudioUrl) {
              optionObj.audioUrl = optionAudioUrl;
            }
          }
          optionsWithAudio.push(optionObj);
        }
        payload.options = optionsWithAudio;
      }
    }

    // Set standard properties
    if (!payload.parts || !Array.isArray(payload.parts) || payload.parts.length === 0) {
      payload.parts = [
        { type: 'text', content: payload.questionText }
      ];
    }

    payload.metaConfig = {
      readable: true,
      readOptions: payload.type === 'mcq' || payload.type === 'multiplechoice' || payload.type === 'multipleChoice',
      ...payload.metaConfig
    };

    const result = await saveStoredPracticeQuestion(payload, { mode });

    return NextResponse.json({
      success: true,
      result,
    });
  } catch (error) {
    console.error('Save question API error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Unable to save question.' }, { status: 500 });
  }
}

// DELETE: Delete a question by ID
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'Missing question ID' }, { status: 400 });
    }

    const db = await getMongoDb();
    if (!db) {
      return NextResponse.json({ success: false, error: 'Database connection failed' }, { status: 500 });
    }

    const collectionName = process.env.MONGODB_QUESTIONS_COLLECTION || 'questions';
    const collection = db.collection(collectionName);

    const result = await collection.deleteOne({ id });

    if (result.deletedCount === 0) {
      return NextResponse.json({ success: false, error: 'Question not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Question deleted successfully'
    });
  } catch (error) {
    console.error('Delete question API error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
