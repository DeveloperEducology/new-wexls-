let audioContext = null;
let muted = false;

function getAudioContext() {
  if (typeof window === 'undefined' || muted) return null;
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  return audioContext;
}

export function setPizzaAppletMuted(nextMuted) {
  muted = Boolean(nextMuted);
  if (muted && typeof window !== 'undefined') {
    window.speechSynthesis?.cancel?.();
  }
}

export function playTone(type = 'pop') {
  const ctx = getAudioContext();
  if (!ctx) return;
  const presets = {
    pop: [520, 0.08, 'sine'],
    success: [740, 0.14, 'triangle'],
    munch: [180, 0.06, 'square'],
    fail: [120, 0.18, 'sawtooth']
  };
  const [frequency, duration, wave] = presets[type] || presets.pop;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, ctx.currentTime);
  gain.gain.setValueAtTime(0.0001, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration);
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration + 0.02);
}

export function speakLine(text, voice = 'teacher') {
  if (muted || typeof window === 'undefined' || !window.speechSynthesis || !text) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = voice === 'monster' ? 0.86 : 0.95;
  utterance.pitch = voice === 'monster' ? 0.72 : 1.18;
  utterance.volume = 0.88;
  window.speechSynthesis.speak(utterance);
}
