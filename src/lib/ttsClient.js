import { isClientTtsSupported, isVoiceModelLoaded, synthesizeClientSide, normalizeVoiceId } from './ttsBrowserEngine';

// Module-level variables to track active audio
let activeAudio = null;
let activeText = null;
let abortController = null;

// In-memory cache for fetched audio Blobs
const blobCache = new Map(); // key: `${voice}:${text}` -> Blob

// Active fallback state for 429s/failures
let useWebSpeechFallback = false;
let fallbackTimeoutId = null;

function activateWebSpeechFallback() {
  if (useWebSpeechFallback) return;
  useWebSpeechFallback = true;
  if (fallbackTimeoutId) {
    clearTimeout(fallbackTimeoutId);
  }
  fallbackTimeoutId = setTimeout(() => {
    useWebSpeechFallback = false;
    fallbackTimeoutId = null;
  }, 60000); // 60-second cooldown
}

export function stopAllSpeech() {
  if (abortController) {
    abortController.abort();
    abortController = null;
  }
  if (activeAudio) {
    activeAudio.pause();
    activeAudio = null;
  }
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
  activeText = null;
}

function fallbackToWebSpeech(plainText, originalText) {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    const utterance = new SpeechSynthesisUtterance(plainText);
    utterance.rate = 0.85; // kid-friendly slightly slower speech rate
    utterance.onend = () => {
      if (activeText === originalText) {
        activeText = null;
      }
    };
    utterance.onerror = () => {
      if (activeText === originalText) {
        activeText = null;
      }
    };
    window.speechSynthesis.speak(utterance);
  }
}

function playBlob(blob, text, plainText) {
  const blobUrl = URL.createObjectURL(blob);
  const audio = new Audio(blobUrl);
  activeAudio = audio;

  audio.addEventListener('ended', () => {
    if (activeText === text) {
      activeText = null;
      activeAudio = null;
    }
    URL.revokeObjectURL(blobUrl);
  });

  audio.addEventListener('error', (e) => {
    console.warn('Audio playback error, falling back to Web Speech API:', e);
    URL.revokeObjectURL(blobUrl);
    if (activeText === text) {
      activateWebSpeechFallback();
      fallbackToWebSpeech(plainText, text);
    }
  });

  audio.play().catch((err) => {
    console.warn('Audio playback play() interrupted or failed, falling back to Web Speech API:', err);
    URL.revokeObjectURL(blobUrl);
    if (activeText === text) {
      activateWebSpeechFallback();
      fallbackToWebSpeech(plainText, text);
    }
  });
}

export function speakText(text, voice = 'Puck', audioUrl = null) {
  if (!text) return;
  
  // Clean text from structural symbols to prevent weird speaking patterns
  const plainText = String(text)
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1 over $2')
    .replace(/\\approx/g, 'approx')
    .trim();

  // If clicking the same text that is currently active, toggle it off
  if (activeText === text) {
    stopAllSpeech();
    return;
  }

  // Stop any active speech first
  stopAllSpeech();
  activeText = text;

  // If fallback mode is active, play native Web Speech synchronously to bypass user-gesture constraints
  if (useWebSpeechFallback) {
    fallbackToWebSpeech(plainText, text);
    return;
  }

  // If pre-baked R2 URL is provided, play it directly
  if (audioUrl) {
    try {
      const audio = new Audio(audioUrl);
      activeAudio = audio;

      audio.addEventListener('ended', () => {
        if (activeText === text) {
          activeText = null;
          activeAudio = null;
        }
      });

      audio.addEventListener('error', (e) => {
        console.warn('Pre-baked audio URL playback error, falling back to dynamic API:', e, audioUrl);
        activeAudio = null;
        if (activeText === text) {
          // Re-trigger speakText without pre-baked URL to fallback to dynamic TTS route
          activeText = null;
          speakText(text, voice, null);
        }
      });

      audio.play().catch((err) => {
        console.warn('Pre-baked audio play() interrupted/failed, falling back to dynamic API:', err, audioUrl);
        activeAudio = null;
        if (activeText === text) {
          activeText = null;
          speakText(text, voice, null);
        }
      });
      return;
    } catch (err) {
      console.warn('Exception during pre-baked Audio initialization:', err);
      activeAudio = null;
      activeText = null;
      speakText(text, voice, null);
      return;
    }
  }

  const cacheKey = `${voice}:${text}`;
  
  // Check if we have the audio blob cached in memory
  if (blobCache.has(cacheKey)) {
    const cachedBlob = blobCache.get(cacheKey);
    playBlob(cachedBlob, text, plainText);
    return;
  }

  // Check if client-side on-device synthesis should be used
  const isSupported = typeof window !== 'undefined' && isClientTtsSupported();
  const storedVal = typeof window !== 'undefined' ? window.localStorage.getItem('useClientTts') : null;
  const useClientTts = storedVal === 'true';
  const localVoiceOverride = typeof window !== 'undefined' && window.localStorage.getItem('localVoiceOverride');
  const activeVoice = (useClientTts && localVoiceOverride && localVoiceOverride !== 'none') ? localVoiceOverride : voice;
  const isPiperVoice = activeVoice.startsWith('piper:') || activeVoice.startsWith('en_US-');
  
  if (typeof window !== 'undefined' && isClientTtsSupported() && useClientTts && isPiperVoice) {
    handleClientSideTts(plainText, text, activeVoice, cacheKey);
    return;
  }

  runServerSideTts(plainText, text, voice, cacheKey);
}

async function handleClientSideTts(plainText, originalText, voice, cacheKey) {
  try {
    const voiceId = normalizeVoiceId(voice);
    const isLoaded = await isVoiceModelLoaded(voiceId);
    
    if (!isLoaded) {
      console.log(`Voice model ${voiceId} not cached locally in OPFS. Falling back to server-side TTS.`);
      runServerSideTts(plainText, originalText, voice, cacheKey);
      return;
    }
    
    // Synthesize locally using WASM/ONNX
    const wavBlob = await synthesizeClientSide(plainText, voiceId);
    
    // Double check we haven't switched to another text in the meantime
    if (activeText !== originalText) return;
    
    // Cache the synthesized blob in memory
    blobCache.set(cacheKey, wavBlob);
    
    playBlob(wavBlob, originalText, plainText);
  } catch (err) {
    console.warn('Client-side local TTS synthesis failed, falling back to server-side TTS:', err);
    if (activeText === originalText) {
      runServerSideTts(plainText, originalText, voice, cacheKey);
    }
  }
}

function runServerSideTts(plainText, text, voice, cacheKey) {
  // If no support or user is offline, run Web Speech immediately
  if (typeof window === 'undefined' || !navigator.onLine) {
    fallbackToWebSpeech(plainText, text);
    return;
  }

  // Construct TTS endpoint
  const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
  
  try {
    abortController = new AbortController();
    const signal = abortController.signal;

    fetch(url, { signal })
      .then((res) => {
        if (!res.ok) {
          if (res.status === 429 || res.status === 500) {
            activateWebSpeechFallback();
          }
          throw new Error(`TTS server returned status ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        // Cache the fetched blob in memory
        blobCache.set(cacheKey, blob);

        // Double check we haven't switched to another text in the meantime
        if (activeText !== text) return;

        playBlob(blob, text, plainText);
      })
      .catch((err) => {
        if (err.name === 'AbortError') {
          // Normal abort, do not trigger fallback
          return;
        }
        console.warn('Gemini TTS fetch failed, falling back to Web Speech API:', err);
        activateWebSpeechFallback();
        if (activeText === text) {
          fallbackToWebSpeech(plainText, text);
        }
      });
  } catch (err) {
    console.warn('Failed to fetch/initialize TTS audio, falling back to Web Speech API:', err);
    activateWebSpeechFallback();
    if (activeText === text) {
      fallbackToWebSpeech(plainText, text);
    }
  }
}

export function getQuestionSpeechText(question) {
  if (!question) return '';
  const qText = (question.questionText || '').trim();
  
  // Find first text part
  const firstPart = question.parts?.[0];
  const firstPartText = firstPart && (firstPart.type === 'text' || !firstPart.type)
    ? (firstPart.content || firstPart.text || '').trim()
    : '';

  if (!qText) return firstPartText;
  if (!firstPartText) return qText;

  // Compare using a Jaccard similarity index to prevent duplicate reading
  const getWords = (str) => {
    return new Set(
      str
        .toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
    );
  };

  const setA = getWords(qText);
  const setB = getWords(firstPartText);
  
  if (setA.size === 0 || setB.size === 0) {
    return qText.length >= firstPartText.length ? qText : firstPartText;
  }

  const intersection = new Set([...setA].filter(x => setB.has(x)));
  const union = new Set([...setA, ...setB]);
  const jaccard = intersection.size / union.size;

  if (jaccard > 0.5) {
    // Highly similar/redundant, choose the longer/more specific one
    return qText.length >= firstPartText.length ? qText : firstPartText;
  } else {
    // Different prompt text and question content, combine them
    return `${qText} ${firstPartText}`;
  }
}
