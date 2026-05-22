import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { generateTtsBuffer, cleanTextForSpeech } from '../src/lib/ttsService.js';
import { uploadAudioToR2, isR2Configured } from '../src/lib/r2Service.js';
import { getMongoDb } from '../src/lib/db/mongo.js';

async function runTests() {
  console.log('=== Starting TTS & R2 Backend Pipeline Tests ===');
  console.log('GEMINI_API_KEY configured:', !!process.env.GEMINI_API_KEY);
  console.log('R2 Configured (standard check):', isR2Configured());
  console.log('R2 Env Check:');
  console.log(' - ACCOUNT_ID:', !!(process.env.R2_ACCOUNT_ID || process.env.VITE_R2_ACCOUNT_ID));
  console.log(' - ACCESS_KEY_ID:', !!(process.env.R2_ACCESS_KEY_ID || process.env.VITE_R2_ACCESS_KEY_ID));
  console.log(' - SECRET_ACCESS_KEY:', !!(process.env.R2_SECRET_ACCESS_KEY || process.env.VITE_R2_SECRET_ACCESS_KEY));
  console.log(' - BUCKET_NAME:', !!(process.env.R2_BUCKET_NAME || process.env.VITE_R2_BUCKET_NAME));
  console.log(' - PUBLIC_URL:', !!(process.env.R2_PUBLIC_URL || process.env.VITE_R2_PUBLIC_URL));

  // Test 1: cleanTextForSpeech
  console.log('\n--- Test 1: cleanTextForSpeech ---');
  const rawText = 'Find \\frac{3}{4} of the **frog** in $5$ seconds.';
  const cleaned = cleanTextForSpeech(rawText);
  console.log('Raw text:', rawText);
  console.log('Cleaned text:', cleaned);
  if (cleaned === 'Find 3 over 4 of the frog in 5 seconds.') {
    console.log('✅ Test 1 Passed!');
  } else {
    console.log('❌ Test 1 Failed.');
  }

  // Test 2: generateTtsBuffer
  console.log('\n--- Test 2: generateTtsBuffer (Gemini API) ---');
  try {
    const testText = 'Is the word frog a person, place, animal, or thing?';
    console.log(`Generating TTS for text: "${testText}" with voice: "Puck"...`);
    const buffer = await generateTtsBuffer(testText, 'Puck');
    console.log(`✅ Success! Generated WAV buffer of size: ${buffer.length} bytes.`);
    
    // Check for WAV header
    const chunkId = buffer.toString('ascii', 0, 4);
    const format = buffer.toString('ascii', 8, 12);
    console.log(`WAV Chunk ID: "${chunkId}", Format: "${format}"`);
    if (chunkId === 'RIFF' && format === 'WAVE') {
      console.log('✅ Test 2 (WAV Format) Passed!');
    } else {
      console.log('❌ Test 2 (WAV Format) Failed. Invalid header.');
    }
  } catch (err) {
    console.error('❌ Test 2 Failed:', err);
  }

  // Test 3: R2 Upload
  console.log('\n--- Test 3: uploadAudioToR2 ---');
  try {
    const testBuffer = Buffer.from('RIFF....WAVEfmt ....data....test-pcm-contents', 'utf-8');
    const testKey = `audio/test/test_upload_${Date.now()}.wav`;
    console.log(`Uploading test buffer to R2 at key: ${testKey}...`);
    const r2Url = await uploadAudioToR2(testBuffer, testKey);
    console.log('Returned R2 URL:', r2Url);
    if (r2Url) {
      console.log('✅ Test 3 Passed!');
    } else {
      console.log('❌ Test 3 Failed (returned null, check env config).');
    }
  } catch (err) {
    console.error('❌ Test 3 Failed with error:', err);
  }

  // Test 4: Save Question POST to local API
  console.log('\n--- Test 4: POST /api/admin/questions ---');
  try {
    const payload = {
      subject: 'english',
      topic: 'grammar',
      skillId: 'nouns-test-r2',
      difficulty: 'beginner',
      type: 'mcq',
      questionText: 'Which is a describing word for sizes?',
      voice: 'Puck',
      generateAudio: true,
      options: [
        { label: 'softly', isCorrect: false },
        { label: 'teacher', isCorrect: false },
        { label: 'tiny', isCorrect: true },
        { label: 'run', isCorrect: false }
      ],
      correctAnswerIndex: 2
    };

    console.log('POSTing sample question to localhost:3000/api/admin/questions...');
    const response = await fetch('http://localhost:3000/api/admin/questions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ question: payload, mode: 'upsert' })
    });

    const rawText = await response.text();
    console.log('Response Status:', response.status);
    console.log('Raw Response length:', rawText.length);
    if (!response.ok || rawText.trim().startsWith('<')) {
      console.log('--- Raw Response ---');
      console.log(rawText);
      console.log('--------------------');
    }
    const data = JSON.parse(rawText);

    if (data.success) {
      console.log('✅ Test 4 Passed!');
      console.log('Question audioUrl:', data.result?.question?.audioUrl);
      console.log('Option audioUrls:', data.result?.question?.options?.map(o => `${o.label}: ${o.audioUrl}`));
      
      // Let's verify MongoDB contents
      console.log('\n--- Test 5: Verify MongoDB Collections ---');
      const db = await getMongoDb();
      if (db) {
        const questionId = data.result?.question?.id;
        const qDoc = await db.collection('questions').findOne({ id: questionId });
        console.log('Questions Collection Doc found:', !!qDoc);
        if (qDoc) {
          console.log('Stored Question ID:', qDoc.id);
          console.log('Stored Question audioUrl:', qDoc.audioUrl);
          console.log('Stored Options:', JSON.stringify(qDoc.options, null, 2));
        }

        // Check cache
        const ttsCacheCount = await db.collection('tts_cache').countDocuments();
        console.log(`Total items in tts_cache collection: ${ttsCacheCount}`);
        
        console.log('✅ Test 5 Passed!');
      } else {
        console.log('❌ Test 5 Failed (Cannot connect to MongoDB).');
      }
    } else {
      console.log('❌ Test 4 Failed:', data.error);
    }
  } catch (err) {
    console.error('❌ Test 4 Failed with error:', err);
  }

  process.exit(0);
}

runTests();
