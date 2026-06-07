import crypto from 'crypto';

export function cleanTextForSpeech(text) {
  if (!text) return '';
  return text
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1 over $2') // natural speech for fractions
    .replace(/\\sqrt{([^}]+)}/g, 'square root of $1')
    .replace(/\$([^$]+)\$/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/\[blank\]/g, 'blank')
    .replace(/\[blank:[^\]]+\]/g, 'blank')
    .replace(/\[\[[^\]]+\]\]/g, 'blank')
    .replace(/#{1,4}\s+/g, '')
    .replace(/\\(approx|times|div|pm|leq|geq|ne|pm)/g, (match, op) => {
      const ops = {
        approx: 'approximately equal to',
        times: 'times',
        div: 'divided by',
        pm: 'plus or minus',
        leq: 'less than or equal to',
        geq: 'greater than or equal to',
        ne: 'not equal to',
      };
      return ops[op] || match;
    });
}

export function getWavHeader(pcmLength, sampleRate = 24000) {
  const header = Buffer.alloc(44);
  
  // ChunkID: "RIFF"
  header.write('RIFF', 0);
  // ChunkSize: 36 + pcmLength
  header.writeUInt32LE(36 + pcmLength, 4);
  // Format: "WAVE"
  header.write('WAVE', 8);
  
  // Subchunk1ID: "fmt "
  header.write('fmt ', 12);
  // Subchunk1Size: 16
  header.writeUInt32LE(16, 16);
  // AudioFormat: 1 (PCM)
  header.writeUInt16LE(1, 20);
  // NumChannels: 1 (Mono)
  header.writeUInt16LE(1, 22);
  // SampleRate: 24000
  header.writeUInt32LE(sampleRate, 24);
  // ByteRate: SampleRate * NumChannels * BitsPerSample / 8 = 24000 * 1 * 16 / 8 = 48000
  header.writeUInt32LE(sampleRate * 2, 28);
  // BlockAlign: NumChannels * BitsPerSample / 8 = 2
  header.writeUInt16LE(2, 32);
  // BitsPerSample: 16
  header.writeUInt16LE(16, 34);
  
  // Subchunk2ID: "data"
  header.write('data', 36);
  // Subchunk2Size: pcmLength
  header.writeUInt32LE(pcmLength, 40);
  
  return header;
}

export async function generateTtsBuffer(text, voice = 'Puck') {
  let provider = process.env.TTS_PROVIDER || (process.env.PIPER_TTS_URL ? 'piper' : 'gemini');
  let targetVoice = voice;

  if (voice.startsWith('gemini:')) {
    provider = 'gemini';
    targetVoice = voice.substring(7);
  } else if (voice.startsWith('piper:')) {
    provider = 'piper';
    targetVoice = voice.substring(6);
  } else if (voice.startsWith('en_US-')) {
    provider = 'piper';
    targetVoice = voice;
  }

  const cleanText = cleanTextForSpeech(text);
  console.log(`[TTS] Generating audio using provider: ${provider.toUpperCase()} (voice: ${targetVoice})`);

  if (provider === 'piper') {
    const piperUrlStr = process.env.PIPER_TTS_URL || 'http://localhost:5000/api/tts';
    let piperVoice = 'en_US-amy-medium';
    try {
      const url = new URL(piperUrlStr);
      url.searchParams.append('text', cleanText);
      url.searchParams.append('voice', piperVoice);

      console.log(`Calling Piper TTS at: ${url.toString()}`);
      const response = await fetch(url.toString(), {
        method: 'GET',
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }
      
      const errText = await response.text();
      console.warn(`Piper TTS failed (status ${response.status}: ${errText}). Falling back to Gemini.`);
    } catch (err) {
      console.warn(`Piper TTS connection failed: ${err.message}. Falling back to Gemini.`);
    }

    // Fallback mapping: if Piper is down, map the Piper voice back to its Gemini equivalent
    const PIPER_TO_GEMINI_FALLBACK = {
      'en_US-ryan-medium': 'Puck',
      'en_US-ryan-high': 'Puck',
      'en_US-joe-medium': 'Charon',
      'en_US-amy-medium': 'Kore',
      'en_US-lessac-medium': 'Fenrir'
    };
    targetVoice = PIPER_TO_GEMINI_FALLBACK[piperVoice] || targetVoice;
    console.log(`[TTS] Falling back to provider: GEMINI (voice: ${targetVoice})`);
  }


  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: `Read this math question or instruction out loud clearly, slowly, and in a friendly voice suitable for elementary school kids: "${cleanText}"` }
        ]
      }
    ],
    generationConfig: {
      responseModalities: ['AUDIO'],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: targetVoice
          }
        }
      }
    }
  };

  let apiResponse = null;
  let attempts = 0;
  const maxAttempts = 4;
  let delay = 1000;

  while (attempts < maxAttempts) {
    attempts++;
    apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (apiResponse.ok) {
      break;
    }

    if (apiResponse.status === 429 && attempts < maxAttempts) {
      console.warn(`Gemini API 429 Too Many Requests (Service). Retrying attempt ${attempts}/${maxAttempts} in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    } else {
      break;
    }
  }

  if (!apiResponse.ok) {
    const errText = await apiResponse.text();
    // Embed a recognisable tag so route.js can return 503 instead of 500 for quota errors
    if (apiResponse.status === 429) {
      throw new Error(`RESOURCE_EXHAUSTED: Gemini TTS quota exceeded. ${errText}`);
    }
    throw new Error(`Gemini API failed with status ${apiResponse.status}: ${errText}`);
  }

  const data = await apiResponse.json();
  const candidate = data.candidates?.[0];
  const audioPart = candidate?.content?.parts?.find(part => part.inlineData);

  if (!audioPart || !audioPart.inlineData?.data) {
    throw new Error('Invalid Gemini API response (missing audio)');
  }

  const base64Pcm = audioPart.inlineData.data;
  const pcmBuffer = Buffer.from(base64Pcm, 'base64');
  
  // Prepend WAV header (24kHz, 16-bit, mono)
  const wavHeader = getWavHeader(pcmBuffer.length, 24000);
  return Buffer.concat([wavHeader, pcmBuffer]);
}
