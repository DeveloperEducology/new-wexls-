/**
 * Dynamic client-side wrapper for `@mintplex-labs/piper-tts-web`.
 * Loads dependencies dynamically to prevent Next.js server-side rendering (SSR) crashes.
 */

let ttsModule = null;

// Lazy import of `@mintplex-labs/piper-tts-web`
async function getTtsModule() {
  if (typeof window === 'undefined') {
    throw new Error('TTS Browser Engine can only be loaded in a browser environment.');
  }
  if (!ttsModule) {
    ttsModule = await import('@mintplex-labs/piper-tts-web');
  }
  return ttsModule;
}

/**
 * Normalizes voice IDs by removing the provider prefix (e.g. "piper:en_US-ryan-medium" -> "en_US-ryan-medium")
 */
export function normalizeVoiceId(voiceId) {
  if (!voiceId) return 'en_US-ryan-medium';
  if (voiceId.startsWith('piper:')) {
    return voiceId.substring(6);
  }
  if (voiceId.startsWith('gemini:')) {
    // If a gemini voice is passed, map it to a local equivalent or return default
    const geminiToPiper = {
      Puck: 'en_US-ryan-medium',
      Charon: 'en_US-joe-medium',
      Kore: 'en_US-amy-medium',
      Fenrir: 'en_US-lessac-medium'
    };
    const innerName = voiceId.substring(7);
    return geminiToPiper[innerName] || 'en_US-ryan-medium';
  }
  
  // Also map legacy Gemini voice names
  const legacyGeminiToPiper = {
    Puck: 'en_US-ryan-medium',
    Charon: 'en_US-joe-medium',
    Kore: 'en_US-amy-medium',
    Fenrir: 'en_US-lessac-medium'
  };
  if (legacyGeminiToPiper[voiceId]) {
    return legacyGeminiToPiper[voiceId];
  }

  return voiceId;
}

/**
 * Checks if the current browser environment supports the features required for client-side TTS
 */
export function isClientTtsSupported() {
  if (typeof window === 'undefined') return false;
  
  const hasWasm = typeof WebAssembly === 'object' && typeof WebAssembly.instantiate === 'function';
  const hasStorage = typeof navigator !== 'undefined' && 'storage' in navigator && typeof navigator.storage.getDirectory === 'function';
  
  return hasWasm && hasStorage;
}

/**
 * Fetches the list of all voice models downloaded in the browser's OPFS
 */
export async function getStoredVoiceModels() {
  if (!isClientTtsSupported()) return [];
  try {
    const tts = await getTtsModule();
    return await tts.stored();
  } catch (err) {
    console.error('Failed to query stored voice models:', err);
    return [];
  }
}

/**
 * Pre-downloads a Piper voice model and config file into browser's OPFS
 * @param {string} voiceId The voice identifier (e.g. 'en_US-ryan-medium')
 * @param {Function} onProgress Progress callback, receives { url, total, loaded }
 */
export async function preloadVoiceModel(voiceId, onProgress) {
  const normVoiceId = normalizeVoiceId(voiceId);
  const tts = await getTtsModule();
  
  console.log(`Preloading voice model: ${normVoiceId}`);
  await tts.download(normVoiceId, (progress) => {
    if (onProgress) {
      onProgress(progress);
    }
  });
  console.log(`Voice model ${normVoiceId} successfully loaded and cached in OPFS.`);
}

/**
 * Checks if a specific voice model is cached in OPFS
 */
export async function isVoiceModelLoaded(voiceId) {
  const normVoiceId = normalizeVoiceId(voiceId);
  const stored = await getStoredVoiceModels();
  return stored.includes(normVoiceId);
}

/**
 * Deletes a voice model from OPFS
 */
export async function removeVoiceModel(voiceId) {
  const normVoiceId = normalizeVoiceId(voiceId);
  const tts = await getTtsModule();
  await tts.remove(normVoiceId);
  console.log(`Voice model ${normVoiceId} removed from OPFS.`);
}

/**
 * Synthesizes text locally inside the browser using WebAssembly & ONNX Runtime
 * @param {string} text Plain text to synthesize
 * @param {string} voiceId Voice to use
 * @param {Function} onProgress Callback for loading progress if not cached
 * @returns {Promise<Blob>} The generated WAV Audio Blob
 */
export async function synthesizeClientSide(text, voiceId, onProgress) {
  const normVoiceId = normalizeVoiceId(voiceId);
  const tts = await getTtsModule();
  
  console.log(`Synthesizing text locally with voice ${normVoiceId}: "${text.substring(0, 40)}..."`);
  
  // synthesize via predict
  const wavBlob = await tts.predict({
    text: text,
    voiceId: normVoiceId
  }, onProgress);
  
  return wavBlob;
}
