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
  console.log('[TTS] Browser Web Speech fallback (speechSynthesis) is disabled completely.');
  if (activeText === originalText) {
    activeText = null;
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

  // Extract embedded audio URL from text string if present
  let targetAudioUrl = audioUrl;
  let cleanTextStr = String(text);

  const urlMatch = cleanTextStr.match(/(https?:\/\/[^\s]+(?:\.mp3|\.wav|\.ogg|\.m4a)|\/api\/tts\?[^\s]+)/i);
  if (urlMatch) {
    if (!targetAudioUrl) {
      targetAudioUrl = urlMatch[0];
    }
    cleanTextStr = cleanTextStr.replace(urlMatch[0], '').replace(/\\n/g, ' ').replace(/\/n/g, ' ').trim();
  }
  
  // Clean text from structural symbols to prevent weird speaking patterns
  const plainText = cleanTextStr
    .replace(/\$\$/g, '')
    .replace(/\$/g, '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/__/g, '')
    .replace(/\\frac{([^}]+)}{([^}]+)}/g, '$1 over $2')
    .replace(/\\approx/g, 'approx')
    .trim();

  // --- Direct audio URL path (pre-baked R2 assets) ---
  // NEVER toggle: always stop whatever is playing and restart.
  // This ensures a single tap always produces audio — no double-click needed.
  if (targetAudioUrl) {
    // Tear down any existing playback cleanly
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (activeAudio) {
      activeAudio.pause();
      activeAudio.src = '';   // release the media resource immediately
      activeAudio = null;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    activeText = plainText || text;

    // Check blob cache first for instant playback
    if (blobCache.has(targetAudioUrl)) {
      const cachedBlob = blobCache.get(targetAudioUrl);
      playBlob(cachedBlob, text, plainText);
      return;
    }

    // Fetch Blob cross-origin to ensure 100% browser audio compatibility for .wav / .mp3 on R2
    fetch(targetAudioUrl)
      .then(res => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.blob();
      })
      .then(blob => {
        blobCache.set(targetAudioUrl, blob);
        playBlob(blob, text, plainText);
      })
      .catch(err => {
        console.warn('[TTS] R2 blob fetch error, attempting direct HTML5 audio play:', err, targetAudioUrl);
        
        try {
          const audio = new Audio();
          audio.crossOrigin = 'anonymous';
          activeAudio = audio;

          audio.addEventListener('ended', () => {
            if (activeText === (plainText || text)) {
              activeText = null;
              activeAudio = null;
            }
          });

          audio.addEventListener('error', (e) => {
            console.warn('[TTS] Direct audio play error, falling back to dynamic TTS:', e);
            if (plainText) {
              const fallbackTtsUrl = `/api/tts?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(plainText)}`;
              new Audio(fallbackTtsUrl).play().catch(er => console.warn(er));
            }
          });

          audio.src = targetAudioUrl;
          audio.load();
          audio.play().catch(err2 => {
            console.warn('[TTS] Direct audio play rejected, falling back to dynamic TTS:', err2);
            if (plainText) {
              const fallbackTtsUrl = `/api/tts?voice=${encodeURIComponent(voice)}&text=${encodeURIComponent(plainText)}`;
              new Audio(fallbackTtsUrl).play().catch(er => console.warn(er));
            }
          });
        } catch (e) {
          console.warn('[TTS] Audio init exception:', e);
        }
      });

    return;
  }

  // --- TTS text path ---
  // Toggle: clicking the same text while it is actively playing stops it.
  // (Useful for long question read-alouds.)
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
  const normalizedVoice = normalizeVoiceId(activeVoice);
  const isPiperVoice = normalizedVoice.startsWith('en_US-') || activeVoice.startsWith('piper:');
  
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

  // Detect phonics page — no Web Speech fallback allowed there
  const isPhonicsPage = typeof window !== 'undefined' && window.location.href.includes('phonics');

  // Construct TTS endpoint
  const url = `/api/tts?text=${encodeURIComponent(text)}&voice=${voice}`;
  
  try {
    abortController = new AbortController();
    const signal = abortController.signal;

    fetch(url, { signal })
      .then((res) => {
        if (!res.ok) {
          // 429 / 503 = quota or rate-limit — only activate Web Speech on non-phonics pages
          if ((res.status === 429 || res.status === 500 || res.status === 503) && !isPhonicsPage) {
            activateWebSpeechFallback();
          }
          if (res.status === 429 || res.status === 503) {
            console.warn(`[TTS] Quota/rate-limit (${res.status}). ${isPhonicsPage ? 'Phonics page — silent fail.' : 'Activating Web Speech fallback.'}`);
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
