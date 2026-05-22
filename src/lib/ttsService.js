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
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-tts-preview:generateContent?key=${apiKey}`;
  const cleanText = cleanTextForSpeech(text);

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
            voiceName: voice
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
