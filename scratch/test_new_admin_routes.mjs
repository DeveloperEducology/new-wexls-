// Using native global fetch available in modern Node.js

async function testEndpoints() {
  const baseUrl = 'http://localhost:3000';
  console.log('=== Testing New Admin API Endpoints ===');
  console.log(`Target base URL: ${baseUrl}\n`);

  // Test 1: GET /api/admin/stats
  try {
    console.log('Testing: GET /api/admin/stats ...');
    const res = await fetch(`${baseUrl}/api/admin/stats`);
    console.log('Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Stats fetched successfully:');
      console.log(' - DB Connected:', data.dbConnected);
      console.log(' - R2 Configured:', data.r2Configured);
      console.log(' - Total Questions:', data.totalQuestions);
      console.log(' - Questions With Audio:', data.questionsWithAudio);
      console.log(' - Missing Audio Count:', data.missingAudio);
      console.log(' - MCQ Questions:', data.mcqQuestions);
      console.log(' - FIB Questions:', data.fibQuestions);
      console.log(' - TTS Cache Items:', data.ttsCacheItems);
      console.log(' - Subjects found:', data.subjects);
      console.log(' - Topics found:', data.topics);
    } else {
      console.log('❌ Failed to fetch stats. Server responded with:', await res.text());
    }
  } catch (err) {
    console.log('❌ Stats API check failed. Is the Next.js dev server running on port 3000?', err.message);
  }

  // Test 2: GET /api/admin/tts-cache
  try {
    console.log('\nTesting: GET /api/admin/tts-cache ...');
    const res = await fetch(`${baseUrl}/api/admin/tts-cache?page=1&limit=5`);
    console.log('Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Cache fetched successfully:');
      console.log(' - Success:', data.success);
      console.log(' - Cache Items Count in Batch:', data.items?.length);
      console.log(' - Total Cached Count:', data.pagination?.total);
      if (data.items && data.items.length > 0) {
        console.log(' - First Cache Item Text Preview:', `"${data.items[0].text}" (${data.items[0].voice})`);
      }
    } else {
      console.log('❌ Failed to fetch cache. Server responded with:', await res.text());
    }
  } catch (err) {
    console.log('❌ Cache API check failed:', err.message);
  }

  // Test 3: POST /api/admin/generate-audio-bulk
  try {
    console.log('\nTesting: POST /api/admin/generate-audio-bulk ...');
    const res = await fetch(`${baseUrl}/api/admin/generate-audio-bulk`, { method: 'POST' });
    console.log('Response status:', res.status);
    
    if (res.ok) {
      const data = await res.json();
      console.log('✅ Bulk audio generate call processed:');
      console.log(' - Success:', data.success);
      console.log(' - Processed Questions in batch:', data.processedCount);
      console.log(' - Remaining Questions needing audio:', data.remainingCount);
      console.log(' - Message:', data.message);
    } else {
      console.log('❌ Failed to process bulk audio. Server responded with:', await res.text());
    }
  } catch (err) {
    console.log('❌ Bulk Audio API check failed:', err.message);
  }

  console.log('\n=== Finished Endpoints Verification ===');
}

testEndpoints();
