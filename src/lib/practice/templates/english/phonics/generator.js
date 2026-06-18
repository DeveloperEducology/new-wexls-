import phonicsPool from './pool.json' with { type: 'json' };
import { generateVariant, createSeededRandom } from '../../../engine/VariantGenerator.js';

// Coordinates configurations matching WEXLS canvas structure
const ROW_COORDINATES = [
  { pctX: 10, pctY: 58, pctW: 16.25, pctH: 25, x: 80, y: 270, width: 130, height: 115 },
  { pctX: 31.25, pctY: 58, pctW: 16.25, pctH: 25, x: 250, y: 270, width: 130, height: 115 },
  { pctX: 52.5, pctY: 58, pctW: 16.25, pctH: 25, x: 420, y: 270, width: 130, height: 115 },
  { pctX: 73.75, pctY: 58, pctW: 16.25, pctH: 25, x: 590, y: 270, width: 130, height: 115 }
];

function getRowCoordinates(numOptions, baseCoords) {
  const base = baseCoords[0];
  const width = base.width;
  const pctW = base.pctW;
  const height = base.height;
  const pctH = base.pctH;
  const y = base.y;
  const pctY = base.pctY;

  const gap = 40;
  const totalWidth = numOptions * width + (numOptions - 1) * gap;
  const startX = (800 - totalWidth) / 2;

  const coords = [];
  for (let i = 0; i < numOptions; i++) {
    const x = startX + i * (width + gap);
    const pctX = (x / 800) * 100;
    coords.push({
      pctX,
      pctY,
      pctW,
      pctH,
      x,
      y,
      width,
      height
    });
  }
  return coords;
}

/**
 * Generates visual SVG letter option content.
 */
function getStyledLetterSvg(letter, styleIndex, hasHint = false) {
  const normalizedIndex = styleIndex % 3;
  let hintOverlay = '';
  
  if (hasHint) {
    hintOverlay = `
      <circle cx="50" cy="50" r="44" fill="none" stroke="#fbbf24" stroke-width="4" stroke-dasharray="6,4">
        <animate attributeName="stroke-dashoffset" values="0;20" dur="2s" repeatCount="indefinite" />
      </circle>
      <circle cx="50" cy="50" r="44" fill="#fbbf24" opacity="0.08" />
    `;
  }

  if (normalizedIndex === 0) {
    // Red 3D glossy letter style
    return `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="redGrad_${letter}_${styleIndex}" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stop-color="#ef4444" />
          <stop offset="100%" stop-color="#b91c1c" />
        </linearGradient>
        <filter id="shadow_${letter}_${styleIndex}" x="-20%" y="-20%" width="150%" height="150%">
          <feDropShadow dx="0" dy="4" stdDeviation="1.5" flood-color="#7f1d1d" flood-opacity="0.5"/>
        </filter>
      </defs>
      ${hintOverlay}
      <text x="50" y="70" font-size="65" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="url(#redGrad_${letter}_${styleIndex})" filter="url(#shadow_${letter}_${styleIndex})">${letter}</text>
      <text x="50" y="70" font-size="65" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="none" stroke="#fecaca" stroke-width="1.5" stroke-dasharray="8 4" opacity="0.5">${letter}</text>
    </svg>`;
  } else if (normalizedIndex === 1) {
    // Sunset gradient style
    return `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="sunsetGrad_${letter}_${styleIndex}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#a855f7" />
          <stop offset="50%" stop-color="#ec4899" />
          <stop offset="100%" stop-color="#f59e0b" />
        </linearGradient>
        <filter id="softGlow_${letter}_${styleIndex}" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="#db2777" flood-opacity="0.35"/>
        </filter>
      </defs>
      ${hintOverlay}
      <text x="50" y="72" font-size="65" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="url(#sunsetGrad_${letter}_${styleIndex})" filter="url(#softGlow_${letter}_${styleIndex})">${letter}</text>
    </svg>`;
  } else {
    // Neo-Brutalism Outline style
    return `<svg viewBox="0 0 100 100" width="100" height="100" xmlns="http://www.w3.org/2000/svg">
      ${hintOverlay}
      <text x="52" y="72" font-size="65" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="#0f172a">${letter}</text>
      <text x="50" y="70" font-size="65" font-family="'Outfit', 'Fredoka', 'Arial Rounded MT Bold', sans-serif" font-weight="900" text-anchor="middle" fill="#38bdf8" stroke="#0f172a" stroke-width="4.5" stroke-linejoin="round">${letter}</text>
    </svg>`;
  }
}

/**
 * Main procedural builder for lkg-english-assoc-lower-word-begins.
 */
export function generate(variables = {}, config = {}) {
  const seed = variables.seed || Date.now();
  const prng = createSeededRandom(seed);
  
  // 1. Pick a random target letter and word from the pool
  const pool = phonicsPool.options;
  if (!pool || pool.length === 0) {
    throw new Error("Phonics options pool is empty or invalid.");
  }
  
  const targetCandidates = pool.filter(o => o.isTarget !== false);
  const targetLetterObj = targetCandidates[Math.floor(prng() * targetCandidates.length)];
  const targetWords = targetLetterObj.words;
  const targetWordObj = targetWords[Math.floor(prng() * targetWords.length)];

  // 2. Delegate distractor selection and options preparation to the core generator
  const history = config.history || { correctStreak: 0, practiceLevel: 1 };
  const { difficultyParams, activeOptions } = generateVariant({
    pool,
    correctAnswer: targetLetterObj,
    seed,
    history,
    explicitDifficulty: variables.difficulty || config.difficulty,
    grade: 'lkg',
    telemetry: config.telemetry || {}
  });

  const correctAnswerIndex = activeOptions.findIndex(o => o.id === targetLetterObj.id);

  // 3. Assemble prompting based on wording complexity
  let questionText = `Which letter begins the word **${targetWordObj.word}**?`;
  if (difficultyParams.wordingComplexity === 'simple') {
    questionText = `Find the starting letter for **${targetWordObj.word}**.`;
  } else if (difficultyParams.wordingComplexity === 'advanced') {
    questionText = `Tap the letter that makes the starting sound of the word **${targetWordObj.word}**.`;
  }

  const explanation = `The word **${targetWordObj.word}** starts with the letter **${targetLetterObj.label}**.`;
  const soundText = targetLetterObj.phonicsSound;

  // 4. Calculate dynamic layout coordinates & generate hotspots
  const coordsForOptions = getRowCoordinates(activeOptions.length, ROW_COORDINATES);
  
  const hotspots = activeOptions.map((opt, idx) => {
    const coords = coordsForOptions[idx];
    const isCorrect = idx === correctAnswerIndex;
    const hasHint = isCorrect && difficultyParams.visualHintsEnabled;
    
    return {
      id: `hs_${opt.id}_${idx}`,
      label: opt.label,
      x: coords.pctX,
      y: coords.pctY,
      width: coords.pctW,
      height: coords.pctH,
      isCircle: false,
      isCorrect,
      svgContent: getStyledLetterSvg(opt.label, idx, hasHint)
    };
  });

  const partHotspots = activeOptions.map((opt, idx) => {
    const coords = coordsForOptions[idx];
    const isCorrect = idx === correctAnswerIndex;
    const hasHint = isCorrect && difficultyParams.visualHintsEnabled;

    return {
      optionIndex: idx,
      x: coords.x,
      y: coords.y,
      width: coords.width,
      height: coords.height,
      label: opt.label,
      isCircle: false,
      id: `hs_${opt.id}_${idx}`,
      svgContent: getStyledLetterSvg(opt.label, idx, hasHint)
    };
  });

  // 5. Generate beautiful canvas background with room illustration
  const backgroundSvg = `<svg viewBox="0 0 800 465" width="800" height="465" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="canvasBg" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#f0f9ff" />
        <stop offset="100%" stop-color="#e0f2fe" />
      </linearGradient>
      <filter id="cardShadow" x="-10%" y="-10%" width="120%" height="120%">
        <feDropShadow dx="0" dy="6" stdDeviation="4" flood-color="#0284c7" flood-opacity="0.1" />
      </filter>
    </defs>
    
    {/* Base Canvas */}
    <rect width="800" height="465" fill="url(#canvasBg)" rx="28" />

    {/* Asset Card Holder */}
    <rect x="290" y="25" width="220" height="205" fill="#ffffff" rx="20" filter="url(#cardShadow)" />
    <rect x="290" y="25" width="220" height="205" fill="none" stroke="#bae6fd" stroke-width="2" rx="20" />

    {/* Clipart Image */}
    <image href="${targetWordObj.imageUrl}" x="320" y="45" width="160" height="165" preserveAspectRatio="xMidYMid meet" />
  </svg>`;

  return {
    id: `english_lkg_assoc_lower_word_begins_${seed}`,
    type: 'mcq',
    interaction: 'hotspot_select',
    layoutMode: 'mcq_hotspot',
    questionText,
    explanation,
    voice: 'Puck',
    generateAudio: 'all',
    soundText, // triggers autoplay letter sound triggers in Pre-K view
    soundUrl: targetWordObj.phonicSoundUrl || targetWordObj.audioUrl, // fallbacks to pre-recorded phonics WAV audio
    options: activeOptions.map((opt, idx) => ({
      id: `opt_${idx}`,
      label: opt.label,
      isCorrect: idx === correctAnswerIndex
    })),
    correctAnswerIndex,
    answer: correctAnswerIndex,
    hotspots,
    parts: [
      {
        type: 'text',
        content: questionText
      },
      {
        type: 'hotspot_canvas',
        canvasWidth: 800,
        canvasHeight: 465,
        hotspots: partHotspots,
        backgroundSvg,
        transparent: true
      }
    ]
  };
}
